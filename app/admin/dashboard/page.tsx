"use client"

import { useState, useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector, fetchDashboardData, fetchOrders } from "@/lib/store"
import { TrendingUp, ShoppingCart, CheckCircle, Clock } from "lucide-react"
import * as echarts from "echarts"

export default function AdminDashboard() {
  const dispatch = useAppDispatch()
  const { data: dashboardData, chartData, isLoading } = useAppSelector((state) => state.dashboard)
  const { items: orders } = useAppSelector((state) => state.orders)
  const [timeRange, setTimeRange] = useState<
    "daily" | "weekly" | "15days" | "monthly" | "3months" | "6months" | "yearly"
  >("weekly")

  const earningsChartRef = useRef<HTMLDivElement>(null)
  const ordersChartRef = useRef<HTMLDivElement>(null)
  const pieChartRef = useRef<HTMLDivElement>(null)
  const earningsChartInstance = useRef<echarts.ECharts | null>(null)
  const ordersChartInstance = useRef<echarts.ECharts | null>(null)
  const pieChartInstance = useRef<echarts.ECharts | null>(null)
  const isMounted = useRef(true)

  const handleTimeRangeChange = (newRange: typeof timeRange) => {
    setTimeRange(newRange)
    dispatch(fetchDashboardData(newRange))
  }

  useEffect(() => {
    if (isMounted.current) {
      dispatch(fetchOrders())
      dispatch(fetchDashboardData(timeRange))
    }
  }, [dispatch, timeRange])

  // Initialize and update Earnings Line Chart
  useEffect(() => {
    if (!earningsChartRef.current || chartData.length === 0) return

    if (!earningsChartInstance.current) {
      earningsChartInstance.current = echarts.init(earningsChartRef.current)
    }

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "#1e293b",
        borderColor: "#475569",
        textStyle: { color: "#fff" },
        axisPointer: {
          type: "line",
          lineStyle: { color: "#f59e0b" },
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: chartData.map((item) => item.date),
        axisLine: { lineStyle: { color: "#475569" } },
        axisLabel: { color: "#94a3b8" },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "#475569" } },
        axisLabel: { color: "#94a3b8", formatter: "€{value}" },
        splitLine: { lineStyle: { color: "#334155" } },
      },
      series: [
        {
          name: "Earnings",
          type: "line",
          smooth: true,
          data: chartData.map((item) => item.earnings),
          itemStyle: { color: "#f59e0b" },
          lineStyle: { width: 3, color: "#f59e0b" },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(245, 158, 11, 0.4)" },
              { offset: 1, color: "rgba(245, 158, 11, 0.05)" },
            ]),
          },
        },
      ],
    }

    if (isMounted.current && earningsChartInstance.current) {
      earningsChartInstance.current.setOption(option)
    }
  }, [chartData])

  // Initialize and update Orders Bar Chart
  useEffect(() => {
    if (!ordersChartRef.current || chartData.length === 0) return

    if (!ordersChartInstance.current) {
      ordersChartInstance.current = echarts.init(ordersChartRef.current)
    }

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "#1e293b",
        borderColor: "#475569",
        textStyle: { color: "#fff" },
        axisPointer: {
          type: "shadow",
        },
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        top: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: chartData.map((item) => item.date),
        axisLine: { lineStyle: { color: "#475569" } },
        axisLabel: { color: "#94a3b8" },
      },
      yAxis: {
        type: "value",
        axisLine: { lineStyle: { color: "#475569" } },
        axisLabel: { color: "#94a3b8" },
        splitLine: { lineStyle: { color: "#334155" } },
      },
      series: [
        {
          name: "Orders",
          type: "bar",
          data: chartData.map((item) => item.orders),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "#3b82f6" },
              { offset: 1, color: "#1d4ed8" },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
          barWidth: "60%",
        },
      ],
    }

    if (isMounted.current && ordersChartInstance.current) {
      ordersChartInstance.current.setOption(option)
    }
  }, [chartData])

  // Initialize and update Pie Chart for Order Status
  useEffect(() => {
    if (!pieChartRef.current) return

    if (!pieChartInstance.current) {
      pieChartInstance.current = echarts.init(pieChartRef.current)
    }

    const option: echarts.EChartsOption = {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "item",
        backgroundColor: "#1e293b",
        borderColor: "#475569",
        textStyle: { color: "#fff" },
        formatter: "{a} <br/>{b}: {c} ({d}%)",
      },
      legend: {
        orient: "vertical",
        right: "5%",
        top: "center",
        textStyle: { color: "#94a3b8" },
      },
      series: [
        {
          name: "Order Status",
          type: "pie",
          radius: ["40%", "70%"],
          center: ["35%", "50%"],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 8,
            borderColor: "#1e293b",
            borderWidth: 2,
          },
          label: {
            show: false,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: "bold",
              color: "#fff",
            },
          },
          labelLine: {
            show: false,
          },
          data: [
            { value: dashboardData.completedOrders, name: "Completed", itemStyle: { color: "#10b981" } },
            { value: dashboardData.pendingOrders, name: "Pending", itemStyle: { color: "#f59e0b" } },
            {
              value: Math.max(
                0,
                dashboardData.totalOrders - dashboardData.completedOrders - dashboardData.pendingOrders,
              ),
              name: "Cancelled",
              itemStyle: { color: "#ef4444" },
            },
          ],
        },
      ],
    }

    if (isMounted.current && pieChartInstance.current) {
      pieChartInstance.current.setOption(option)
    }
  }, [dashboardData])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isMounted.current) {
        earningsChartInstance.current?.resize()
        ordersChartInstance.current?.resize()
        pieChartInstance.current?.resize()
      }
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  useEffect(() => {
    return () => {
      isMounted.current = false
      earningsChartInstance.current?.dispose()
      ordersChartInstance.current?.dispose()
      pieChartInstance.current?.dispose()
      earningsChartInstance.current = null
      ordersChartInstance.current = null
      pieChartInstance.current = null
    }
  }, [])

  const getTopSellingItems = () => {
    const itemMap = new Map<string, { name: string; quantity: number; total: number; image?: string }>()

    orders.forEach((order) => {
      order.items?.forEach((item) => {
        const key = item.name
        if (itemMap.has(key)) {
          const existing = itemMap.get(key)!
          existing.quantity += item.quantity
          existing.total += item.quantity * (item.price || 0)
        } else {
          itemMap.set(key, {
            name: item.name,
            quantity: item.quantity,
            total: item.quantity * (item.price || 0),
            image: item.image,
          })
        }
      })
    })

    return Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
  }

  const topItems = getTopSellingItems()

  const stats = [
    {
      icon: ShoppingCart,
      label: "Total Orders",
      value: dashboardData.totalOrders,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: TrendingUp,
      label: "Total Earnings",
      value: `€${dashboardData.totalEarnings.toFixed(2)}`,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: CheckCircle,
      label: "Completed",
      value: dashboardData.completedOrders,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Clock,
      label: "Pending",
      value: dashboardData.pendingOrders,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
  ]

console.log("Dashboard Data:", dashboardData)


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Restaurant analytics and performance overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-slate-800 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`${stat.color}`} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Time Range Selector */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <p className="text-white font-semibold mb-4">Select Time Range:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Daily", value: "daily" },
            { label: "Weekly", value: "weekly" },
            { label: "15 Days", value: "15days" },
            { label: "Monthly", value: "monthly" },
            { label: "3 Months", value: "3months" },
            { label: "6 Months", value: "6months" },
            { label: "Yearly", value: "yearly" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleTimeRangeChange(option.value as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === option.value
                  ? "bg-orange-500 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-white font-semibold mb-4">Earnings Trend</h2>
          {!isLoading && chartData.length > 0 ? (
            <div ref={earningsChartRef} className="h-[300px] w-full" />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-2"></div>
                Loading...
              </div>
            </div>
          )}
        </div>

        {/* Orders Chart */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-white font-semibold mb-4">Orders Trend</h2>
          {!isLoading && chartData.length > 0 ? (
            <div ref={ordersChartRef} className="h-[300px] w-full" />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-2"></div>
                Loading...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 - Order Status Pie Chart */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-white font-semibold mb-4">Order Status Distribution</h2>
        <div ref={pieChartRef} className="h-[300px] w-full" />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h2 className="text-white font-semibold mb-4">Top Selling Items</h2>
        {topItems.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            <p>No item sales data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-semibold">Item Name</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-semibold">Quantity Sold</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-semibold">Total Revenue</th>
                  <th className="text-right py-3 px-4 text-slate-400 font-semibold">Rank</th>
                </tr>
              </thead>
              <tbody>
                {topItems.map((item, index) => (
                  <tr key={item.name} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 text-white font-medium">{item.name}</td>
                    <td className="text-right py-3 px-4 text-slate-300">{item.quantity}</td>
                    <td className="text-right py-3 px-4 text-emerald-400 font-semibold">€ {item.total.toFixed(0)}</td>
                    <td className="text-right py-3 px-4">
                      <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-semibold">
                        #{index + 1}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
