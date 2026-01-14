"use client"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useAppDispatch } from "@/lib/store/hooks"
import { fetchProfile, clearProfile } from "@/lib/store/slices/profileSlice"
import { fetchMenuItems, clearMenu } from "@/lib/store/slices/menuSlice"
import { fetchOrders, clearOrders } from "@/lib/store/slices/ordersSlice"
import { fetchDashboardData, clearDashboard } from "@/lib/store/slices/dashboardSlice"

interface AuthContextType {
  user: User | null
  loading: boolean
  dataLoaded: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [dataLoaded, setDataLoaded] = useState(false)
  const dispatch = useAppDispatch()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Prevent re-fetching if the user hasn't actually changed
      if (currentUser?.uid === user?.uid && dataLoaded) return;

      setUser(currentUser)
      setLoading(false)

      if (currentUser) {
        setDataLoaded(false)
        try {
          // Promise.allSettled is safer than Promise.all
          // It prevents one failed fetch from crashing the entire load process
          await Promise.allSettled([
            dispatch(fetchProfile(currentUser.uid)),
            dispatch(fetchMenuItems()),
            dispatch(fetchOrders()),
            dispatch(fetchDashboardData()),
          ])
          setDataLoaded(true)
        } catch (error: any) {
          // Gracefully handle AbortError (often named 'ConditionError' in RTK)
          if (error.name !== 'AbortError') {
            console.error("Data Load Error:", error)
          }
          setDataLoaded(true) 
        }
      } else {
        dispatch(clearProfile()); dispatch(clearMenu());
        dispatch(clearOrders()); dispatch(clearDashboard());
        setDataLoaded(false)
      }
    })

    return () => unsubscribe()
  }, [dispatch, user?.uid, dataLoaded])

  const handleSignOut = async () => {
    await firebaseSignOut(auth)
    setUser(null)
    setDataLoaded(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, dataLoaded, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}
