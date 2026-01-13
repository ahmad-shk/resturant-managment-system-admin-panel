"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAppDispatch } from "@/lib/store/hooks"
import { fetchProfile } from "@/lib/store/slices/profileSlice"
import { fetchMenuItems } from "@/lib/store/slices/menuSlice"
import { fetchOrders } from "@/lib/store/slices/ordersSlice"
import { fetchDashboardData } from "@/lib/store/slices/dashboardSlice"
import { clearProfile } from "@/lib/store/slices/profileSlice"
import { clearMenu } from "@/lib/store/slices/menuSlice"
import { clearOrders } from "@/lib/store/slices/ordersSlice"
import { clearDashboard } from "@/lib/store/slices/dashboardSlice"

interface AuthContextType {
  user: User | null
  loading: boolean
  dataLoaded: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthProviderInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const dispatch = useAppDispatch()

  useEffect(() => {
    console.log("[v0] Auth context initializing...")
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("[v0] Auth state changed:", currentUser?.email || "not logged in")
      setUser(currentUser)
      setLoading(false)

      if (currentUser) {
        console.log("[v0] Loading all data for user...")
        setDataLoaded(false)
        try {
          // Fetch all data in parallel
          await Promise.all([
            dispatch(fetchProfile(currentUser.uid)),
            dispatch(fetchMenuItems()),
            dispatch(fetchOrders()),
            dispatch(fetchDashboardData()),
          ])
          console.log("[v0] All data loaded successfully")
          setDataLoaded(true)
        } catch (error) {
          console.error("[v0] Error loading data:", error)
          setDataLoaded(true) // Set to true even on error to prevent infinite loading
        }
      } else {
        // Clear all data on logout
        dispatch(clearProfile())
        dispatch(clearMenu())
        dispatch(clearOrders())
        dispatch(clearDashboard())
        setDataLoaded(false)
      }
    })

    return () => unsubscribe()
  }, [dispatch])

  const handleSignOut = async () => {
    await firebaseSignOut(auth)
    setUser(null)
    // Clear all Redux data on sign out
    dispatch(clearProfile())
    dispatch(clearMenu())
    dispatch(clearOrders())
    dispatch(clearDashboard())
    setDataLoaded(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, dataLoaded, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthProviderInner>{children}</AuthProviderInner>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
