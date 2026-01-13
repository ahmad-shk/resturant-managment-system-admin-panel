import { doc, getDoc, setDoc, collection, query, getDocs, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { MenuItem } from "@/lib/firebase-menu"

export interface AdminUser {
  uid: string
  email: string
  name: string
  restaurantName: string
  restaurantPhone: string
  createdAt: Date
}

export interface AdminDashboardData {
  totalEarnings: number
  totalOrders: number
  pendingOrders: number
  completedOrders: number
}

// Get admin profile
export const getAdminProfile = async (userId: string): Promise<AdminUser | null> => {
  try {
    const docSnap = await getDoc(doc(db, "admins", userId))
    if (docSnap.exists()) {
      return docSnap.data() as AdminUser
    }
    return null
  } catch (error) {
    console.error("Error fetching admin profile:", error)
    return null
  }
}

// Create/Update admin profile
export const createAdminProfile = async (userId: string, data: Omit<AdminUser, "uid" | "createdAt">) => {
  try {
    await setDoc(doc(db, "admins", userId), {
      ...data,
      uid: userId,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Error creating admin profile:", error)
    throw error
  }
}

// Get all orders for admin
export const getAdminOrders = async () => {
  try {
    const q = query(collection(db, "orders"))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }))
  } catch (error) {
    console.error("Error fetching orders:", error)
    return []
  }
}

// Update order status
export const updateAdminOrderStatus = async (orderId: string, status: string) => {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      status: status,
      currentStatusIndex: ["confirmed", "preparing", "ready", "on-the-way", "delivered"].indexOf(status),
    })
  } catch (error) {
    console.error("Error updating order:", error)
    throw error
  }
}

// Delete order
export const deleteAdminOrder = async (orderId: string) => {
  try {
    await deleteDoc(doc(db, "orders", orderId))
  } catch (error) {
    console.error("Error deleting order:", error)
    throw error
  }
}

// Menu item operations
export const createMenuItem = async (item: Omit<MenuItem, "id">): Promise<string> => {
  try {
    const docRef = await setDoc(doc(collection(db, "menus")), item)
    return docRef.id
  } catch (error) {
    console.error("Error creating menu item:", error)
    throw error
  }
}

export const updateMenuItem = async (itemId: string, item: Partial<MenuItem>) => {
  try {
    await updateDoc(doc(db, "menus", itemId), item)
  } catch (error) {
    console.error("Error updating menu item:", error)
    throw error
  }
}

export const deleteMenuItem = async (itemId: string) => {
  try {
    await deleteDoc(doc(db, "menus", itemId))
  } catch (error) {
    console.error("Error deleting menu item:", error)
    throw error
  }
}
