"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LayoutDashboard, ShoppingCart, Utensils, User, LogOut, Menu, X } from "lucide-react"

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isLoginPage = pathname === "/admin/login"

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (isLoginPage) {
    return <>{children}</>
  }

  // Check if user is authenticated as admin
  if (!user) {
    router.push("/admin/login")
    return null
  }

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
    { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
    { icon: Utensils, label: "Menu Items", href: "/admin/menu" },
    { icon: User, label: "Profile", href: "/admin/profile" },
  ]

  const isActiveRoute = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/")
  }

  return (
    <div className="flex h-screen bg-slate-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:relative z-40 w-64 h-screen bg-slate-800 border-r border-slate-700 transition-transform duration-300 md:translate-x-0`}
      >
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-orange-500">Tarim Admin Panel</h1>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-orange-500 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between md:justify-end">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden text-slate-300 hover:text-white">
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="text-slate-300">{user.email}</div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-slate-900 p-6">{children}</main>
      </div>
    </div>
  )
}

export default AdminLayout
