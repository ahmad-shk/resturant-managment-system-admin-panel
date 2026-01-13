import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { collection, query, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

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

// Helper function to format date
const formatDate = (date: Date, range: string) => {
  if (range === "yearly") {
    return date.toLocaleDateString("en-US", { month: "short" })
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

// Helper function to generate chart data
const generateChartData = (orders: any[], range: string): ChartDataPoint[] => {
  const now = new Date()
  const data: { [key: string]: ChartDataPoint } = {}

  let daysToShow = 7
  if (range === "15days") daysToShow = 15
  if (range === "monthly") daysToShow = 30
  if (range === "3months") daysToShow = 90
  if (range === "6months") daysToShow = 180
  if (range === "yearly") daysToShow = 365

  // Initialize dates
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const key = date.toISOString().split("T")[0]
    data[key] = { date: formatDate(date, range), earnings: 0, orders: 0 }
  }

  // Fill in order data
  orders.forEach((order: any) => {
    const orderDate = new Date(order.orderDate || order.createdAt)
    const key = orderDate.toISOString().split("T")[0]
    if (data[key]) {
      data[key].earnings += order.total || 0
      data[key].orders += 1
    }
  })

  return Object.values(data)
}

// Async thunk to fetch dashboard data
export const fetchDashboardData = createAsyncThunk(
  "dashboard/fetchDashboardData",
  async (timeRange = "weekly", { rejectWithValue }) => {
    try {
      const q = query(collection(db, "orders"))
      const querySnapshot = await getDocs(q)
      const orders = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }))

      // Calculate dashboard metrics
      const totalOrders = orders.length
      const totalEarnings = orders.reduce((sum: number, order: any) => sum + (order.total || 0), 0)
      const completedOrders = orders.filter((o: any) => o.status === "delivered").length
      const pendingOrders = orders.filter((o: any) => o.status !== "delivered" && o.status !== "cancelled").length

      const chartData = generateChartData(orders, timeRange)

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
      return rejectWithValue(error.message || "Failed to fetch dashboard data")
    }
  },
)

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
        state.data = action.payload.data
        state.chartData = action.payload.chartData
        state.lastFetched = Date.now()
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { clearDashboard } = dashboardSlice.actions
export default dashboardSlice.reducer
