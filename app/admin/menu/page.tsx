"use client"

import type React from "react"
import { useState } from "react"
import { useAppDispatch, useAppSelector, addMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/store"
import { Edit2, Trash2, Plus, X, Loader2 } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  description: string
  category: string
  price: number
  image: string
  isVeg: boolean
  rating?: number
  reviews?: number
}

export default function MenuPage() {
  const dispatch = useAppDispatch()
  const { items, isLoading, isAdding } = useAppSelector((state) => state.menu)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Appetizer",
    price: "",
    image: "",
    isVeg: true,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          image: event.target?.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Form submitted, formData:", formData)

    if (!formData.name || !formData.price) {
      alert("Please fill in name and price")
      return
    }

    try {
      const itemData = {
        ...formData,
        price: Number.parseFloat(formData.price),
        rating: 4.5,
        reviews: 0,
      }

      console.log("[v0] Dispatching addMenuItem with data:", itemData)

      if (editingId) {
        await dispatch(updateMenuItem({ id: editingId, data: itemData })).unwrap()
        setEditingId(null)
      } else {
        await dispatch(addMenuItem(itemData)).unwrap()
      }

      console.log("[v0] Item saved successfully")

      // Reset form
      setFormData({
        name: "",
        description: "",
        category: "Appetizer",
        price: "",
        image: "",
        isVeg: true,
      })
      setShowForm(false)
    } catch (error) {
      console.error("[v0] Error saving menu item:", error)
      alert("Error saving menu item: " + (error as any)?.message || "Please try again.")
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

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await dispatch(deleteMenuItem(id)).unwrap()
      } catch (error) {
        console.error("Error deleting menu item:", error)
        alert("Error deleting menu item. Please try again.")
      }
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({
      name: "",
      description: "",
      category: "Appetizer",
      price: "",
      image: "",
      isVeg: true,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Menu Items</h1>
          <p className="text-slate-400">Manage your restaurant menu items</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Add Item
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">{editingId ? "Edit Item" : "Add New Item"}</h2>
              <button onClick={handleCancel} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Item Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    placeholder="e.g., Biryani"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Price</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-orange-500"
                  >
                    <option>Appetizer</option>
                    <option>Main Course</option>
                    <option>Dessert</option>
                    <option>Beverage</option>
                    <option>Salad</option>
                    <option>Soup</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
                  placeholder="Item description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Item Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 focus:outline-none focus:border-orange-500"
                />
                {formData.image && (
                  <div className="mt-2">
                    <img
                      src={formData.image || "/placeholder.svg"}
                      alt="Preview"
                      className="h-24 w-24 object-cover rounded"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isVeg"
                  checked={formData.isVeg}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-orange-500 bg-slate-700 border-slate-600 rounded focus:outline-none"
                />
                <label className="ml-2 text-sm font-medium text-slate-300">Vegetarian</label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {editingId ? "Updating..." : "Adding..."}
                    </>
                  ) : editingId ? (
                    "Update Item"
                  ) : (
                    "Add Item"
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isAdding}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center h-64 text-slate-400">
            <Loader2 size={32} className="animate-spin mr-2" />
            Loading menu items...
          </div>
        ) : items.length === 0 ? (
          <div className="col-span-full flex items-center justify-center h-64 text-slate-400">
            No menu items yet. Create your first item!
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
              {item.image && (
                <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-full h-48 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                    <p className="text-slate-400 text-sm">{item.category}</p>
                  </div>
                  {item.isVeg && <span className="text-green-500 text-sm font-semibold">VEG</span>}
                </div>

                <p className="text-slate-300 text-sm mb-3 line-clamp-2">{item.description}</p>

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-orange-500 font-bold text-lg">${item.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
