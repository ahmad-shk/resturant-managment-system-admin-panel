"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks"
import { updateProfile, clearProfileError } from "@/lib/store/slices/profileSlice"
import { Mail, Phone, Building2, User, Save, Edit2, RefreshCw } from "lucide-react"

interface AdminProfile {
  name: string
  email: string
  restaurantName: string
  restaurantPhone: string
  createdAt?: string
}

export default function AdminProfilePage() {
  const { user } = useAuth()
  const dispatch = useAppDispatch()
  const { data: profile, isLoading, error } = useAppSelector((state) => state.profile)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<AdminProfile>({
    name: "",
    email: "",
    restaurantName: "",
    restaurantPhone: "",
  })

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || user?.displayName || "Admin",
        email: profile.email || user?.email || "",
        restaurantName: profile.restaurantName || "",
        restaurantPhone: profile.restaurantPhone || "",
        createdAt: profile.createdAt,
      })
    } else if (user && !isLoading && !error) {
      setFormData({
        name: user.displayName || "Admin",
        email: user.email || "",
        restaurantName: "",
        restaurantPhone: "",
      })
    }
  }, [profile, user, isLoading, error])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    try {
      await dispatch(updateProfile({ userId: user.uid, data: formData })).unwrap()
      setIsEditing(false)
      alert("Profile updated successfully!")
    } catch (err) {
      console.error("Error updating profile:", err)
      alert("Error updating profile. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        restaurantName: profile.restaurantName || "",
        restaurantPhone: profile.restaurantPhone || "",
        createdAt: profile.createdAt,
      })
    }
    setIsEditing(false)
  }

  const handleRetry = () => {
    dispatch(clearProfileError())
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-400">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          Loading profile...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-400">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw size={32} className="text-red-400" />
          </div>
          <p className="text-red-400 mb-2 font-semibold">Connection Error</p>
          <p className="text-slate-400 mb-6 text-sm">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
          >
            <RefreshCw size={18} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Profile</h1>
        <p className="text-slate-400">Manage your restaurant information and credentials</p>
      </div>

      {/* Profile Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <User size={32} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{formData.name || "Admin"}</h2>
              <p className="text-orange-100">{formData.email}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!isEditing ? (
            <>
              {/* Display Mode */}
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <Mail className="text-orange-500 mt-1" size={20} />
                  <div>
                    <p className="text-slate-400 text-sm">Email Address</p>
                    <p className="text-white font-semibold">{formData.email}</p>
                  </div>
                </div>

                <div className="h-px bg-slate-700"></div>

                <div className="flex items-start gap-4">
                  <Building2 className="text-orange-500 mt-1" size={20} />
                  <div>
                    <p className="text-slate-400 text-sm">Restaurant Name</p>
                    <p className="text-white font-semibold">{formData.restaurantName || "Not provided"}</p>
                  </div>
                </div>

                <div className="h-px bg-slate-700"></div>

                <div className="flex items-start gap-4">
                  <Phone className="text-orange-500 mt-1" size={20} />
                  <div>
                    <p className="text-slate-400 text-sm">Restaurant Phone</p>
                    <p className="text-white font-semibold">{formData.restaurantPhone || "Not provided"}</p>
                  </div>
                </div>

                <div className="h-px bg-slate-700"></div>

                <div className="flex items-start gap-4">
                  <User className="text-orange-500 mt-1" size={20} />
                  <div>
                    <p className="text-slate-400 text-sm">Admin Name</p>
                    <p className="text-white font-semibold">{formData.name}</p>
                  </div>
                </div>

                {formData.createdAt && (
                  <>
                    <div className="h-px bg-slate-700"></div>
                    <div>
                      <p className="text-slate-400 text-sm">Member Since</p>
                      <p className="text-white font-semibold">{new Date(formData.createdAt).toLocaleDateString()}</p>
                    </div>
                  </>
                )}
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setIsEditing(true)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors mt-6"
              >
                <Edit2 size={20} />
                Edit Profile
              </button>
            </>
          ) : (
            <>
              {/* Edit Mode */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Admin Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    disabled
                  />
                  <p className="text-slate-400 text-xs mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Restaurant Name</label>
                  <input
                    type="text"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    placeholder="Your restaurant name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Restaurant Phone</label>
                  <input
                    type="tel"
                    name="restaurantPhone"
                    value={formData.restaurantPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Save size={20} />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Account Security</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-700 rounded">
            <div>
              <p className="text-white font-medium">Password</p>
              <p className="text-slate-400 text-sm">Last changed 30 days ago</p>
            </div>
            <button className="text-orange-500 hover:text-orange-400 font-semibold text-sm">Change</button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-700 rounded">
            <div>
              <p className="text-white font-medium">Two-Factor Authentication</p>
              <p className="text-slate-400 text-sm">Not enabled</p>
            </div>
            <button className="text-orange-500 hover:text-orange-400 font-semibold text-sm">Enable</button>
          </div>
        </div>
      </div>
    </div>
  )
}
