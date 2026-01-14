import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { collection, query, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

// --- Interfaces ---

interface DashboardData {
  totalOrders: number
  totalEarnings: number
  completedOrders: number
  pendingOrders: number
}

interface ChartDataPoint {
  date: string
  earnings: number
  orders: number
}

interface DashboardState {
  data: DashboardData
  chartData: ChartDataPoint[]
  isLoading: boolean
  error: string | null
  lastFetched: number | null
}

// The shape of what the Thunk returns on success
interface FetchDashboardResponse {
  data: DashboardData
  chartData: ChartDataPoint[]
}

// --- Initial State ---

const initialState: DashboardState = {
  data: {
    totalOrders: 0,
    totalEarnings: 0,
    completedOrders: 0,
    pendingOrders: 0,
  },
  chartData: [],
  isLoading: false,
  error: null,
  lastFetched: null,
}

// --- Helper Functions ---

const formatDate = (date: Date, range: string) => {
  if (range === "yearly") {
    return date.toLocaleDateString("en-US", { month: "short" })
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const generateChartData = (orders: any[], range: string): ChartDataPoint[] => {
  const now = new Date()
  const data: { [key: string]: ChartDataPoint } = {}

  let daysToShow = 7
  if (range === "15days") daysToShow = 15
  if (range === "monthly") daysToShow = 30
  if (range === "3months") daysToShow = 90
  if (range === "6months") daysToShow = 180
  if (range === "yearly") daysToShow = 365

  // Initialize empty date buckets
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split("T")[0]
    data[key] = { date: formatDate(date, range), earnings: 0, orders: 0 }
  }

  // Fill in order data
  orders.forEach((order: any) => {
    const rawDate = order.orderDate?.toDate ? order.orderDate.toDate() : order.orderDate || order.createdAt
    if (!rawDate) return

    const orderDate = new Date(rawDate)
    const key = orderDate.toISOString().split("T")[0]

    if (data[key]) {
      data[key].earnings += order.total || 0
      data[key].orders += 1
    }
  })

  return Object.values(data)
}

// --- Async Thunk ---

/**
 * createAsyncThunk Generics:
 * 1. ReturnType: FetchDashboardResponse
 * 2. ArgType: string (the timeRange)
 * 3. ThunkApiConfig: { rejectValue: string } (for custom error messages)
 */

export const fetchDashboardData = createAsyncThunk<FetchDashboardResponse, string | undefined, { rejectValue: string }>(
  "dashboard/fetchDashboardData",
  async (timeRange = "weekly", { rejectWithValue }) => {
    try {
      const q = query(collection(db, "orders"))
      const querySnapshot = await getDocs(q)

      const orders = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        const STATUS_MAP: Record<number, string> = {
          0: "confirmed",
          1: "preparing",
          2: "ready",
          3: "on-the-way",
          4: "completed",
        }

        const status = STATUS_MAP[data.currentStatusIndex ?? 0] || "confirmed"

        return {
          ...data,
          status,
          id: doc.id,
        }
      })

      // Calculate metrics using the mapped status
      const totalOrders = orders.length
      const totalEarnings = orders.reduce((sum: number, order: any) => sum + (Number(order.total) || 0), 0)
      const completedOrders = orders.filter((o: any) => o.status === "completed").length
      const pendingOrders = orders.filter((o: any) => o.status !== "completed" && o.status !== "cancelled").length

      console.log(
        "[v0] Dashboard calculation - Total:",
        totalOrders,
        "Completed:",
        completedOrders,
        "Pending:",
        pendingOrders,
      )

      const chartData = generateChartData(orders, timeRange || "weekly")

      return {
        data: {
          totalOrders,
          totalEarnings,
          completedOrders,
          pendingOrders,
        },
        chartData,
      }
    } catch (error: any) {
      // Returns the error message as the payload for 'rejected' case
      return rejectWithValue(error.message || "Failed to fetch dashboard data")
    }
  },
)

// --- Slice ---

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboard: (state) => {
      state.data = initialState.data
      state.chartData = []
      state.lastFetched = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false
        // action.payload is strictly typed to FetchDashboardResponse
        state.data = action.payload.data
        state.chartData = action.payload.chartData
        state.lastFetched = Date.now()
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false
        // action.payload is strictly typed to string via rejectWithValue
        state.error = action.payload ?? "An unknown error occurred"
      })
  },
})

export const { clearDashboard } = dashboardSlice.actions
export default dashboardSlice.reducer
