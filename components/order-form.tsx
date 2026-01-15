"use client"

import type React from "react"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import type { RealtimeOrder } from "@/lib/firebase-rtdb"

interface OrderFormProps {
  onSubmit: (order: Omit<RealtimeOrder, "id" | "createdAt" | "updatedAt">) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function OrderForm({ onSubmit, onCancel, isLoading = false }: OrderFormProps) {
  const [customerName, setCustomerName] = useState("")
  const [customerEmail, setCustomerEmail] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [items, setItems] = useState<RealtimeOrder["items"]>([])
  const [newItem, setNewItem] = useState({ name: "", price: 0, quantity: 1 })
  const [notes, setNotes] = useState("")
  const [delivery, setDelivery] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleAddItem = () => {
    if (!newItem.name.trim() || newItem.price <= 0) {
      setError("Please enter valid item name and price")
      return
    }

    setItems([
      ...items,
      {
        id: `item_${Date.now()}`,
        name: newItem.name,
        price: newItem.price,
        quantity: newItem.quantity,
      },
    ])

    setNewItem({ name: "", price: 0, quantity: 1 })
    setError(null)
  }

  const handleRemoveItem = (itemId: string | number) => {
    setItems(items.filter((item) => item.id !== itemId))
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0) + delivery
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!customerName.trim()) {
      setError("Customer name is required")
      return
    }

    if (items.length === 0) {
      setError("Please add at least one item")
      return
    }

    try {
      const order: Omit<RealtimeOrder, "id" | "createdAt" | "updatedAt"> = {
        customerName,
        customerEmail,
        customerPhone,
        deliveryAddress,
        items,
        total: calculateTotal(),
        status: "confirmed",
        orderDate: new Date().toISOString(),
        delivery,
        notes,
      }

      await onSubmit(order)

      // Reset form
      setCustomerName("")
      setCustomerEmail("")
      setCustomerPhone("")
      setDeliveryAddress("")
      setItems([])
      setNotes("")
      setDelivery(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating order")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Create New Order</h2>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {error && <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-200 text-sm">{error}</div>}

      {/* Customer Information */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Customer Name *"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            disabled={isLoading}
          />
          <input
            type="email"
            placeholder="Email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            disabled={isLoading}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="tel"
            placeholder="Phone"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            disabled={isLoading}
          />
          <input
            type="text"
            placeholder="Delivery Address"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4">
        <h3 className="text-white font-semibold">Items</h3>

        {items.length > 0 && (
          <div className="space-y-2 bg-slate-700/50 rounded-lg p-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-slate-700 rounded p-3">
                <div className="flex-1">
                  <p className="text-white">{item.name}</p>
                  <p className="text-slate-400 text-sm">
                    € {item.price} x {item.quantity} = € {item.price * item.quantity}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-400 hover:text-red-300 ml-4"
                  disabled={isLoading}
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Item name"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            disabled={isLoading}
          />
          <input
            type="number"
            placeholder="Price"
            value={newItem.price || ""}
            onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            disabled={isLoading}
          />
          <input
            type="number"
            placeholder="Qty"
            min="1"
            value={newItem.quantity}
            onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
            className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleAddItem}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-4 py-2 flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={isLoading}
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>

      {/* Delivery & Notes */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">Delivery Charge (€)</label>
            <input
              type="number"
              value={delivery}
              onChange={(e) => setDelivery(Number(e.target.value))}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Total: € {calculateTotal().toFixed(0)}
            </label>
            <div className="bg-slate-700 rounded-lg px-4 py-2 text-orange-400 font-semibold">
              € {calculateTotal().toFixed(0)}
            </div>
          </div>
        </div>

        <textarea
          placeholder="Order Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
          rows={3}
          disabled={isLoading}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-4 pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {isLoading ? "Creating..." : "Create Order"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
