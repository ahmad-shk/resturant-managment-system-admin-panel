"use client"

import type React from "react"
import { useState } from "react"
import { useAppDispatch, useAppSelector, addMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/store"
import { Edit2, Trash2, Plus, X, Loader2, ImageIcon, UtensilsCrossed, Check } from "lucide-react"
import axios from "axios"

// --- Cloudinary Config ---
const CLOUD_NAME = "do3hn35qi"
const UPLOAD_PRESET = "menu_items"

interface MenuItem {
  id: string
  name: string
  description: string
  category: string
  price: number
  image: string
  isVeg: boolean
}

export default function MenuPage() {
  const dispatch = useAppDispatch()
  const { items, isLoading, isAdding } = useAppSelector((state) => state.menu)
  
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Main Course",
    price: "",
    image: "",
    isVeg: true,
  })

  const CATEGORIES = ["Appetizer", "Main Course", "Dessert", "Beverage", "Salad", "Soup"]

  // --- Input Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  // --- Image Upload with Loader Control ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingImage(true)
    const data = new FormData()
    data.append("file", file)
    data.append("upload_preset", UPLOAD_PRESET)

    try {
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, 
        data
      )
      if (res.data.secure_url) {
        setFormData((prev) => ({ ...prev, image: res.data.secure_url }))
      }
    } catch (err) {
      alert("Image upload failed! Please try again.")
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = () => setFormData((prev) => ({ ...prev, image: "" }))

  // --- Final Submit with Strict Validation ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Mandatory Fields Validation
    const { name, price, description, category, image } = formData
    if (!name.trim() || !price || !description.trim() || !category || !image) {
      alert("Please fill all fields and upload an image!")
      return
    }

    // 2. Prevent submit while uploading
    if (uploadingImage) {
      alert("Please wait for the image to finish uploading!")
      return
    }

    try {
      const itemData = {
        ...formData,
        price: Number.parseFloat(price),
        rating: 4.5,
        reviews: 0,
      }

      let resultAction;
      if (editingId) {
        resultAction = await dispatch(updateMenuItem({ id: editingId, data: itemData }))
      } else {
        resultAction = await dispatch(addMenuItem(itemData))
      }

      if (addMenuItem.fulfilled.match(resultAction) || updateMenuItem.fulfilled.match(resultAction)) {
        handleCancel()
      } else {
        alert("Action failed: " + (resultAction.payload || "Unknown error"))
      }
    } catch (error) {
      alert("An unexpected error occurred.")
    }
  }

  // --- Actions ---
  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await dispatch(deleteMenuItem(id))
    }
  }

  const handleEdit = (item: MenuItem) => {
    setFormData({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price.toString(),
      image: item.image,
      isVeg: item.isVeg,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: "", description: "", category: "Main Course",
      price: "", image: "", isVeg: true,
    })
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-slate-950 min-h-screen text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent uppercase tracking-tighter">Kitchen Admin</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-8 rounded-2xl flex items-center gap-2 transition-all shadow-xl shadow-orange-900/20 active:scale-95"
        >
          <Plus size={22} /> Add New Dish
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-[2.5rem] p-8 shadow-3xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-white">{editingId ? "Edit Dish" : "Create New Dish"}</h2>
              <button onClick={handleCancel} className="p-2 hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Name</label>
                  <input name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. Sushi" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Price (€)</label>
                  <input name="price" type="number" step="0.01" value={formData.price} onChange={handleInputChange} className="w-full bg-slate-800 border-none rounded-xl p-4 focus:ring-2 focus:ring-orange-500 outline-none" placeholder="10.00" required />
                </div>
              </div>

              {/* Image Upload Area */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Image Upload</label>
                <div className={`relative border-2 border-dashed rounded-2xl h-48 flex items-center justify-center transition-all ${formData.image ? 'border-green-500 bg-green-500/5' : 'border-slate-700 bg-slate-800/50'}`}>
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="animate-spin text-orange-500" size={32} />
                      <p className="text-xs font-bold text-orange-500">Uploading to Cloudinary...</p>
                    </div>
                  ) : formData.image ? (
                    <div className="relative w-full h-full p-2">
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                      <button type="button" onClick={removeImage} className="absolute top-4 right-4 bg-red-600 hover:bg-red-500 p-2 rounded-lg text-white shadow-lg transition-transform hover:scale-110">
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center group">
                      <ImageIcon className="text-slate-400 group-hover:text-orange-500 mb-2" size={36} />
                      <span className="text-sm font-bold text-slate-400">Click to upload photo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Category</label>
                <select name="category" value={formData.category} onChange={handleInputChange} className="w-full bg-slate-800 border-none rounded-xl p-4 outline-none">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <textarea name="description" value={formData.description} onChange={handleInputChange} className="w-full bg-slate-800 border-none rounded-xl p-4 h-24 outline-none resize-none" placeholder="Description of the dish..." required />

              {/* Submit Control */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={uploadingImage || isAdding}
                  className={`flex-[2] py-4 rounded-2xl font-black text-white shadow-xl transition-all ${
                    uploadingImage || isAdding ? 'bg-slate-700 cursor-not-allowed opacity-50' : 'bg-orange-600 hover:bg-orange-500 active:scale-95'
                  }`}
                >
                  {isAdding ? "Saving..." : editingId ? "Save Changes" : "Publish Dish"}
                </button>
                <button type="button" onClick={handleCancel} className="flex-1 bg-slate-700 rounded-2xl font-bold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoading ? (
          <div className="col-span-full py-20 text-center flex flex-col items-center">
            <Loader2 className="animate-spin text-orange-500 mb-4" size={48} />
            <p className="text-slate-400">Fetching Menu Items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
             <UtensilsCrossed className="mx-auto text-slate-700 mb-4" size={48} />
             <p className="text-slate-500">No items found. Start by adding a new dish!</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl group hover:border-orange-500/30 transition-all">
              <div className="h-56 relative overflow-hidden">
                <img src={item.image || "/placeholder.svg"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase text-orange-400 border border-white/10">{item.category}</div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white line-clamp-1">{item.name}</h3>
                  <span className="text-2xl font-black text-orange-500">€{item.price.toFixed(2)}</span>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => handleEdit(item)} className="flex-1 bg-slate-800 hover:bg-blue-600 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"><Edit2 size={16}/> Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="flex-1 bg-slate-800 hover:bg-red-600 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all"><Trash2 size={16}/> Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}