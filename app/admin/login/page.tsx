"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { loginUser, registerUser, createAdminProfile } from "@/lib/firebase-utils"
import { LogIn } from "lucide-react"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [restaurantName, setRestaurantName] = useState("")
  const [restaurantPhone, setRestaurantPhone] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/admin/dashboard")
    }
  }, [user, authLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await loginUser(email, password)
    } catch (err: any) {
      setError(err.message || "Login failed")
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const userCredential = await registerUser(email, password, restaurantName)

      // Create admin profile
      await createAdminProfile(userCredential.user.uid, {
        email,
        name: restaurantName,
        restaurantName,
        restaurantPhone,
        role: "admin",
      })
    } catch (err: any) {
      setError(err.message || "Sign up failed")
      setIsLoading(false)
    }
  }

  if (authLoading || (user && !error)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-orange-500 rounded-full">
              <LogIn className="text-white" size={32} />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white text-center mb-2">Admin Panel</h1>
          <p className="text-slate-400 text-center mb-8">{isSignUp ? "Create your account" : "Welcome back"}</p>

          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Restaurant Name</label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    placeholder="Your restaurant name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Restaurant Phone</label>
                  <input
                    type="tel"
                    value={restaurantPhone}
                    onChange={(e) => setRestaurantPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    placeholder="Your phone number"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {isLoading ? "Processing..." : isSignUp ? "Create Account" : "Login"}
            </button>
          </form>

          {/* <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError("")
              }}
              className="text-slate-400 hover:text-white text-sm"
            >
              {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign up"}
            </button>
          </div> */}
        </div>
      </div>
    </div>
  )
}
