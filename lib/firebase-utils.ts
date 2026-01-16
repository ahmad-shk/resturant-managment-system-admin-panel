import { createUserWithEmailAndPassword, signInWithEmailAndPassword, type UserCredential } from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

export interface OrderData {
  id: string
  items: any[]
  subtotal: number
  tax: number
  delivery: number
  total: number
  customerName: string
  customerEmail: string
  deliveryAddress: string
  paymentMethod: string
  orderDate: number
  status: "confirmed" | "preparing" | "ready" | "on-the-way" | "delivered"
  currentStatusIndex: number
  createdAt: number
  userId: string
  deviceId: string
}

// Auth Functions
export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const q = query(collection(db, "users"), where("email", "==", email))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.length > 0
  } catch (error) {
    console.error("Error checking if user exists:", error)
    return false
  }
}

export const registerUser = async (email: string, password: string, name: string): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)

  // Store user profile in Firestore
  await setDoc(doc(db, "users", userCredential.user.uid), {
    email,
    name,
    createdAt: new Date(),
    uid: userCredential.user.uid,
  })

  return userCredential
}

export const loginUser = async (email: string, password: string): Promise<UserCredential> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password)

  const adminProfile = await getAdminProfile(userCredential.user.uid)
  if (!adminProfile || adminProfile.role !== "admin") {
    await auth.signOut()
    throw new Error("You are not registered. Please contact administrator")
  }

  return userCredential
}

// Order Functions
export const saveOrderToFirebase = async (order: OrderData): Promise<void> => {
  try {
    // Save to Firestore
    await setDoc(doc(db, "orders", order.id), {
      ...order,
      createdAt: new Date(order.createdAt),
      orderDate: new Date(order.orderDate),
    })

    // Link order to user
    if (order.userId) {
      await updateDoc(doc(db, "users", order.userId), {
        orders: [order.id],
      })
    }
  } catch (error) {
    console.error("Error saving order:", error)
    throw error
  }
}

export const getOrdersByUserId = async (userId: string): Promise<OrderData[]> => {
  try {
    const q = query(collection(db, "orders"), where("userId", "==", userId))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as OrderData[]
  } catch (error) {
    console.error("Error fetching orders:", error)
    return []
  }
}

export const getOrdersByDeviceId = async (deviceId: string): Promise<OrderData[]> => {
  try {
    const q = query(collection(db, "orders"), where("deviceId", "==", deviceId))
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as OrderData[]
  } catch (error) {
    console.error("Error fetching orders by device:", error)
    return []
  }
}

export const getOrderById = async (orderId: string): Promise<OrderData | null> => {
  try {
    const docSnap = await getDoc(doc(db, "orders", orderId))
    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        id: orderId,
      } as OrderData
    }
    return null
  } catch (error) {
    console.error("Error fetching order:", error)
    return null
  }
}

export const updateOrderStatus = async (orderId: string, statusIndex: number, status: string): Promise<void> => {
  try {
    // Update in Firestore
    await updateDoc(doc(db, "orders", orderId), {
      currentStatusIndex: statusIndex,
      status,
    })
  } catch (error) {
    console.error("Error updating order status:", error)
    throw error
  }
}

// Tarim Profile Functions
export interface AdminUser {
  uid: string
  email: string
  name: string
  restaurantName: string
  restaurantPhone: string
  role: "admin"
  createdAt: Date
}

export const createAdminProfile = async (userId: string, data: Omit<AdminUser, "uid" | "createdAt">) => {
  try {
    await setDoc(doc(db, "admins", userId), {
      ...data,
      role: "admin",
      uid: userId,
      createdAt: new Date(),
    })
  } catch (error) {
    console.error("Error creating admin profile:", error)
    throw error
  }
}

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
