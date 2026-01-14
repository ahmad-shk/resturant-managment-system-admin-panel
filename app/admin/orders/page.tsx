"use client"

import { useState, useEffect, useRef } from "react"
import { useToast } from "@/components/toast-provider"
import { Trash2, RefreshCw, Plus } from "lucide-react"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { OrderForm } from "@/components/order-form"
import {
  subscribeToOrders,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  type RealtimeOrder,
  updateOrder,
} from "@/lib/firebase-rtdb"

export default function OrdersPage() {
  const { addToast } = useToast()
  const [orders, setOrders] = useState<RealtimeOrder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filteredOrders, setFilteredOrders] = useState<RealtimeOrder[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    orderId: string | null
  }>({
    isOpen: false,
    orderId: null,
  })
  const [editingOrder, setEditingOrder] = useState<RealtimeOrder | null>(null)
  const [editingStatus, setEditingStatus] = useState<string>("")
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    console.log("[v0] Setting up real-time listener for orders")
    setIsLoading(true)
    setError(null)

    try {
      unsubscribeRef.current = subscribeToOrders(
        (data) => {
          console.log("[v0] Orders updated:", data.length)
          setOrders(data)
          setIsLoading(false)
        },
        (err) => {
          console.error("[v0] Error in real-time listener:", err)
          setError(err.message)
          setIsLoading(false)
        },
      )
    } catch (err) {
      console.error("[v0] Error setting up listener:", err)
      setError(err instanceof Error ? err.message : "Failed to setup real-time listener")
      setIsLoading(false)
    }

    return () => {
      if (unsubscribeRef.current) {
        console.log("[v0] Cleaning up real-time listener")
        unsubscribeRef.current()
      }
    }
  }, [])

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredOrders(orders)
    } else {
      setFilteredOrders(orders.filter((order) => order.status === statusFilter))
    }
  }, [orders, statusFilter])

  const handleCreateOrder = async (orderData: Omit<RealtimeOrder, "id" | "createdAt" | "updatedAt">) => {
    try {
      setIsLoading(true)
      await createOrder(orderData)
      addToast("Order created successfully!", "success")
      setShowCreateForm(false)
    } catch (err) {
      console.error("[v0] Error creating order:", err)
      addToast(err instanceof Error ? err.message : "Error creating order. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (orderId: string, newStatus: RealtimeOrder["status"]) => {
    try {
      setIsLoading(true)
      await updateOrderStatus(orderId, newStatus)
      addToast("Order status updated in both databases!", "success")
      console.log("[v0] Status update completed for:", orderId)
      setEditingOrder(null)
      setEditingStatus("")
    } catch (err) {
      console.error("[v0] Error updating status:", err)
      addToast("Error updating order status. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateOrder = async (orderId: string, updates: Partial<RealtimeOrder>) => {
    try {
      setIsLoading(true)
      const { id, createdAt, ...updateData } = updates as any
      await updateOrder(orderId, updateData)
      addToast("Order updated successfully!", "success")
      setEditingOrder(null)
    } catch (err) {
      console.error("[v0] Error updating order:", err)
      addToast("Error updating order. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteOrderHandler = async () => {
    if (!deleteConfirmation.orderId) return

    try {
      setIsLoading(true)
      await deleteOrder(deleteConfirmation.orderId)
      addToast("Order deleted successfully!", "success")
      setDeleteConfirmation({ isOpen: false, orderId: null })
    } catch (err) {
      console.error("[v0] Error deleting order:", err)
      addToast("Error deleting order. Please try again.", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsLoading(true)
    setError(null)
    // The real-time listener will automatically fetch the latest data
    setTimeout(() => setIsLoading(false), 1000)
  }

  const getStatusBadgeColor = (status: string) => {
    const colors: { [key: string]: string } = {
      confirmed: "bg-blue-900 text-blue-200",
      preparing: "bg-yellow-900 text-yellow-200",
      ready: "bg-purple-900 text-purple-200",
      "on-the-way": "bg-indigo-900 text-indigo-200",
      completed: "bg-green-900 text-green-200",
      canceled: "bg-red-900 text-red-200",
    }
    return colors[status] || "bg-slate-700 text-slate-300"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleString()
  }

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <OrderForm onSubmit={handleCreateOrder} onCancel={() => setShowCreateForm(false)} isLoading={isLoading} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Orders Management</h1>
          <p className="text-slate-400">Real-time order management with CRUD operations</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <Plus size={18} />
            New Order
          </button>
        </div>
      </div>

      {/* Status Filter */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <p className="text-white font-semibold mb-4">Filter by Status:</p>
        <div className="flex flex-wrap gap-2">
          {["all", "confirmed", "preparing", "ready", "on-the-way", "completed", "canceled"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
                statusFilter === status ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {status === "all" ? "All" : status.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-red-200">
          <p>Error: {error}</p>
          <button onClick={handleRefresh} className="mt-2 text-orange-400 hover:text-orange-300 underline">
            Try again
          </button>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {isLoading && filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
              Loading orders...
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <div className="text-center">
              <p>No orders found</p>
              <p className="text-sm mt-2">Total orders in database: {orders.length}</p>
            </div>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              {/* Order Header */}
              <div
                className="p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-slate-400 text-sm">Order ID</p>
                    <p className="text-white font-semibold truncate">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Customer</p>
                    <p className="text-white font-semibold">{order.customerName || "Guest"}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total</p>
                    <p className="text-white font-semibold">Rs. {order.total.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Date</p>
                    <p className="text-white font-semibold text-xs">{formatDate(order.orderDate)}</p>
                  </div>
                  <div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusBadgeColor(
                        order.status,
                      )}`}
                    >
                      {order.status?.replace("-", " ")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              {expandedOrderId === order.id && (
                <div className="border-t border-slate-700 p-4 bg-slate-750 space-y-4">
                  {/* Customer Info */}
                  <div>
                    <h3 className="text-white font-semibold mb-2">Customer Information</h3>
                    <div className="bg-slate-700 rounded p-3 text-slate-300 text-sm space-y-1">
                      <p>Name: {order.customerName || "Guest"}</p>
                      <p>Email: {order.customerEmail || "N/A"}</p>
                      <p>Phone: {order.customerPhone || "N/A"}</p>
                      <p>Address: {order.deliveryAddress || "N/A"}</p>
                      <p>Order Date: {formatDate(order.orderDate)}</p>
                      {order.notes && <p>Notes: {order.notes}</p>}
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="text-white font-semibold mb-2">Items ({order.items?.length || 0})</h3>
                    <div className="space-y-2">
                      {order.items?.map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-700 rounded p-3 text-slate-300 text-sm flex justify-between items-center"
                        >
                          <div>
                            <span className="text-white font-medium">{item.name}</span>
                            <p className="text-xs text-slate-400">
                              Rs. {item.price} x {item.quantity}
                            </p>
                          </div>
                          <div className="text-right text-white font-medium">
                            Rs. {(item.price * item.quantity).toFixed(0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Update */}
                  {order.status !== "completed" && order.status !== "canceled" && (
                    <div>
                      <h3 className="text-white font-semibold mb-2">Update Status</h3>
                      <div className="flex flex-wrap gap-2">
                        {(["confirmed", "preparing", "ready", "on-the-way", "completed", "canceled"] as const).map(
                          (status) => (
                            <button
                              key={status}
                              onClick={() => handleUpdateStatus(order.id, status)}
                              disabled={isLoading}
                              className={`px-3 py-2 rounded text-sm font-medium transition-colors capitalize disabled:opacity-50 ${
                                order.status === status
                                  ? "bg-orange-500 text-white"
                                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                              }`}
                            >
                              {status.replace("-", " ")}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delete Button */}
                  <div>
                    <button
                      onClick={() => setDeleteConfirmation({ isOpen: true, orderId: order.id })}
                      disabled={isLoading}
                      className="w-full bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-100 py-2 px-4 rounded font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={18} />
                      Delete Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        title="Delete Order"
        description="Are you sure you want to delete this order? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isOpen={deleteConfirmation.isOpen}
        onConfirm={deleteOrderHandler}
        onCancel={() => setDeleteConfirmation({ isOpen: false, orderId: null })}
      />
    </div>
  )
}
