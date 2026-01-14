"use client"

import { useAuth } from "@/lib/auth-context"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { clearProfileError } from "@/lib/store/slices/profileSlice"
import { Mail, Phone, Building2, User, RefreshCw, Calendar } from "lucide-react"

export default function AdminProfilePage() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const { data: profile, isLoading, error } = useAppSelector((state) => state.profile)

  const handleRetry = () => {
    dispatch(clearProfileError())
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-400">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-slate-400">
        <div className="text-center max-w-md">
          <RefreshCw size={48} className="text-red-400 mx-auto mb-4 animate-reverse-spin" />
          <p className="text-red-400 mb-2 font-semibold">Connection Error</p>
          <p className="text-slate-400 mb-6 text-sm">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Fallback data if profile is not yet fully loaded or available
  const displayData = {
    name: profile?.name || user?.displayName || "Admin",
    email: profile?.email || user?.email || "Not available",
    restaurantName: profile?.restaurantName || "Not set",
    restaurantPhone: profile?.restaurantPhone || "Not set",
    createdAt: profile?.createdAt
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Profile</h1>
        <p className="text-slate-400">View your restaurant information and account details</p>
      </header>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl">
        {/* Header Profile Banner */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-2 border-white/30">
              <User size={40} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{displayData.name}</h2>
              <p className="text-orange-100 opacity-90">{displayData.email}</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            
            {/* Restaurant Section */}
            <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-xl border border-slate-700">
              <Building2 className="text-orange-500 mt-1" size={24} />
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Restaurant Name</p>
                <p className="text-white text-lg font-medium">{displayData.restaurantName}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-xl border border-slate-700">
              <Phone className="text-orange-500 mt-1" size={24} />
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Contact Phone</p>
                <p className="text-white text-lg font-medium">{displayData.restaurantPhone}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-xl border border-slate-700">
              <Mail className="text-orange-500 mt-1" size={24} />
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Account Email</p>
                <p className="text-white text-lg font-medium">{displayData.email}</p>
              </div>
            </div>

            {displayData.createdAt && (
              <div className="flex items-start gap-4 p-4 bg-slate-700/30 rounded-xl border border-slate-700">
                <Calendar className="text-orange-500 mt-1" size={24} />
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Member Since</p>
                  <p className="text-white text-lg font-medium">
                    {new Date(displayData.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>

      <div className="text-center p-4">
        <p className="text-slate-500 text-sm">
          To update your profile information, please contact the system administrator.
        </p>
      </div>
    </div>
  )
}
