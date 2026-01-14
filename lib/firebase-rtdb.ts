// Firebase Realtime Database utilities
import { getDatabase, ref, get, set, remove, onValue } from "firebase/database"
import app from "@/lib/firebase"
import { syncOrderStatusToAllDatabases, syncOrderUpdateToAllDatabases } from "@/lib/firebase-sync"

const database = getDatabase(app)

export interface RealtimeOrder {
  id: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  items: Array<{
    id: number | string
    name: string
    price: number
    quantity: number
    image?: string
  }>
  total: number
  status: "confirmed" | "preparing" | "ready" | "on-the-way" | "completed" | "canceled"
  orderDate: string
  deliveryAddress?: string
  delivery?: number
  notes?: string
  createdAt: number
  updatedAt: number
}

// Create a new order
export async function createOrder(order: Omit<RealtimeOrder, "id" | "createdAt" | "updatedAt">) {
  try {
    const timestamp = Date.now()
    const orderId = `order_${timestamp}_${Math.random().toString(36).substr(2, 9)}`
    const newOrder: RealtimeOrder = {
      ...order,
      id: orderId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }

    const orderRef = ref(database, `orders/${orderId}`)
    await set(orderRef, newOrder)
    console.log("[v0] Order created:", orderId)
    return orderId
  } catch (error) {
    console.error("[v0] Error creating order:", error)
    throw error
  }
}

// Get all orders
export async function getAllOrders(): Promise<RealtimeOrder[]> {
  try {
    const ordersRef = ref(database, "orders")
    const snapshot = await get(ordersRef)

    if (!snapshot.exists()) {
      console.log("[v0] No orders found")
      return []
    }

    const data = snapshot.val()
    const orders: RealtimeOrder[] = Object.values(data)
    console.log("[v0] Fetched orders:", orders.length)
    return orders
  } catch (error) {
    console.error("[v0] Error fetching orders:", error)
    throw error
  }
}

// Get single order
export async function getOrder(orderId: string): Promise<RealtimeOrder | null> {
  try {
    const orderRef = ref(database, `orders/${orderId}`)
    const snapshot = await get(orderRef)

    if (!snapshot.exists()) {
      return null
    }

    return snapshot.val()
  } catch (error) {
    console.error("[v0] Error fetching order:", error)
    throw error
  }
}

// Update order
export async function updateOrder(orderId: string, updates: Partial<Omit<RealtimeOrder, "id" | "createdAt">>) {
  try {
    const { id, createdAt, ...cleanUpdates } = updates as any
    await syncOrderUpdateToAllDatabases(orderId, cleanUpdates)
    console.log("[v0] Order updated in both databases:", orderId)
  } catch (error) {
    console.error("[v0] Error updating order:", error)
    throw error
  }
}

// Update order status
export async function updateOrderStatus(orderId: string, status: RealtimeOrder["status"]) {
  try {
    await syncOrderStatusToAllDatabases(orderId, status)
    console.log("[v0] Order status updated in both databases:", orderId, status)
  } catch (error) {
    console.error("[v0] Error updating order status:", error)
    throw error
  }
}

// Delete order
export async function deleteOrder(orderId: string) {
  try {
    const orderRef = ref(database, `orders/${orderId}`)
    await remove(orderRef)
    console.log("[v0] Order deleted:", orderId)
  } catch (error) {
    console.error("[v0] Error deleting order:", error)
    throw error
  }
}

// Real-time listener for all orders
export function subscribeToOrders(callback: (orders: RealtimeOrder[]) => void, onError?: (error: Error) => void) {
  try {
    const ordersRef = ref(database, "orders")

    const unsubscribe = onValue(
      ordersRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          callback([])
          return
        }

        const data = snapshot.val()
        const orders: RealtimeOrder[] = Object.values(data).sort((a: any, b: any) => b.createdAt - a.createdAt)
        console.log("[v0] Real-time orders update:", orders.length)
        callback(orders)
      },
      (error) => {
        console.error("[v0] Real-time listener error:", error)
        onError?.(error)
      },
    )

    return unsubscribe
  } catch (error) {
    console.error("[v0] Error setting up real-time listener:", error)
    throw error
  }
}

// Real-time listener for single order
export function subscribeToOrder(
  orderId: string,
  callback: (order: RealtimeOrder | null) => void,
  onError?: (error: Error) => void,
) {
  try {
    const orderRef = ref(database, `orders/${orderId}`)

    const unsubscribe = onValue(
      orderRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          callback(null)
          return
        }

        const order: RealtimeOrder = snapshot.val()
        console.log("[v0] Real-time order update:", orderId)
        callback(order)
      },
      (error) => {
        console.error("[v0] Real-time listener error for order:", error)
        onError?.(error)
      },
    )

    return unsubscribe
  } catch (error) {
    console.error("[v0] Error setting up order listener:", error)
    throw error
  }
}
