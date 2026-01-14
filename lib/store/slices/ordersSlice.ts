import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { collection, query, getDocs, updateDoc, doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface OrderItem {
  id: number | string
  name: string
  price: number
  quantity: number
  image?: string
}

export interface Order {
  id: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  items: OrderItem[]
  total: number
  status: "confirmed" | "preparing" | "ready" | "on-the-way" | "completed" | "canceled"
  orderDate: string
  deliveryAddress?: string
  delivery?: number
}

interface OrdersState {
  items: Order[]
  isLoading: boolean
  error: string | null
  lastFetched: number | null
}

const initialState: OrdersState = {
  items: [],
  isLoading: false,
  error: null,
  lastFetched: null,
}

const STATUS_MAP: Record<number, Order["status"]> = {
  0: "confirmed",
  1: "preparing",
  2: "ready",
  3: "on-the-way",
  4: "completed",
  5: "canceled",
}

// Async thunk to fetch orders
export const fetchOrders = createAsyncThunk("orders/fetchOrders", async (_, { rejectWithValue }) => {
  try {
    console.log("[v0] Fetching orders from Firebase...")
    const q = query(collection(db, "orders"))
    const querySnapshot = await getDocs(q)
    console.log("[v0] Orders fetched:", querySnapshot.docs.length)

    const orders = querySnapshot.docs.map((docSnap) => {
      const data = docSnap.data()

      let orderDate = new Date().toISOString()
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === "function") {
          orderDate = data.createdAt.toDate().toISOString()
        } else if (data.createdAt.seconds) {
          orderDate = new Date(data.createdAt.seconds * 1000).toISOString()
        }
      }

      const status = STATUS_MAP[data.currentStatusIndex ?? 0] || "confirmed"

      let total = data.total || 0
      if (!total && data.items && Array.isArray(data.items)) {
        total = data.items.reduce((sum: number, item: any) => {
          return sum + (item.price || 0) * (item.quantity || 1)
        }, 0)
        // Add delivery charge if exists
        if (data.delivery) {
          total += data.delivery
        }
      }

      return {
        id: docSnap.id,
        customerName: data.customerName || "Unknown",
        customerEmail: data.customerEmail || "",
        customerPhone: data.customerPhone || "",
        items: data.items || [],
        total,
        status,
        orderDate,
        deliveryAddress: data.deliveryAddress || "",
        delivery: data.delivery || 0,
      } as Order
    })

    const sortedOrders = orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())

    console.log("[v0] Processed orders:", sortedOrders)
    return sortedOrders
  } catch (error: any) {
    console.error("[v0] Error fetching orders:", error)
    return rejectWithValue(error.message || "Failed to fetch orders")
  }
})

// Async thunk to update order status
export const updateOrderStatus = createAsyncThunk(
  "orders/updateOrderStatus",
  async ({ id, status }: { id: string; status: Order["status"] }, { rejectWithValue }) => {
    try {
      const statusIndex = STATUS_INDEX_MAP[status]
      await updateDoc(doc(db, "orders", id), { currentStatusIndex: statusIndex })
      return { id, status }
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update order status")
    }
  },
)

// Async thunk that sets up real-time listener
export const setupOrdersListener = createAsyncThunk(
  "orders/setupListener",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      console.log("[v0] Setting up real-time orders listener...")
      const q = query(collection(db, "orders"))

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          console.log("[v0] Real-time update: orders changed")
          const orders = querySnapshot.docs.map((docSnap) => {
            const data = docSnap.data()

            let orderDate = new Date().toISOString()
            if (data.createdAt) {
              if (typeof data.createdAt.toDate === "function") {
                orderDate = data.createdAt.toDate().toISOString()
              } else if (data.createdAt.seconds) {
                orderDate = new Date(data.createdAt.seconds * 1000).toISOString()
              }
            }

            const status = STATUS_MAP[data.currentStatusIndex ?? 0] || "confirmed"

            let total = data.total || 0
            if (!total && data.items && Array.isArray(data.items)) {
              total = data.items.reduce((sum: number, item: any) => {
                return sum + (item.price || 0) * (item.quantity || 1)
              }, 0)
              if (data.delivery) {
                total += data.delivery
              }
            }

            return {
              id: docSnap.id,
              customerName: data.customerName || "Unknown",
              customerEmail: data.customerEmail || "",
              customerPhone: data.customerPhone || "",
              items: data.items || [],
              total,
              status,
              orderDate,
              deliveryAddress: data.deliveryAddress || "",
              delivery: data.delivery || 0,
            } as Order
          })

          const sortedOrders = orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
          console.log("[v0] Real-time orders update:", sortedOrders.length)

          dispatch(ordersSlice.actions.setOrders(sortedOrders))
        },
        (error) => {
          console.error("[v0] Real-time listener error:", error)
          dispatch(ordersSlice.actions.setError(error.message))
        },
      )

      return unsubscribe
    } catch (error: any) {
      console.error("[v0] Error setting up listener:", error)
      return rejectWithValue(error.message || "Failed to setup orders listener")
    }
  },
)

const STATUS_INDEX_MAP: Record<Order["status"], number> = {
  confirmed: 0,
  preparing: 1,
  ready: 2,
  "on-the-way": 3,
  completed: 4,
  canceled: 5,
}

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearOrders: (state) => {
      state.items = []
      state.lastFetched = null
      state.error = null
    },
    // Action to update orders from real-time listener
    setOrders: (state, action) => {
      state.items = action.payload
      state.isLoading = false
      state.error = null
    },
    // Action to set error
    setError: (state, action) => {
      state.error = action.payload
      state.isLoading = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload
        state.lastFetched = Date.now()
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(setupOrdersListener.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(setupOrdersListener.fulfilled, (state) => {
        state.isLoading = false
      })
      .addCase(setupOrdersListener.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex((order) => order.id === action.payload.id)
        if (index !== -1) {
          state.items[index].status = action.payload.status
        }
      })
  },
})

export const { clearOrders, setOrders, setError } = ordersSlice.actions
export default ordersSlice.reducer
