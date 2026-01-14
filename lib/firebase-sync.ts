// Utility to sync order updates to both Firestore and Realtime Database
import { update, ref } from "firebase/database"
import { updateDoc, doc } from "firebase/firestore"
import { rtdb, db } from "@/lib/firebase"

export async function syncOrderStatusToAllDatabases(
  orderId: string,
  status: "confirmed" | "preparing" | "ready" | "on-the-way" | "completed" | "canceled",
) {
  try {
    const timestamp = Date.now()
    console.log("[v0] Syncing status update to both databases:", orderId, status)

    const updatePromises = [
      // Update Realtime Database
      update(ref(rtdb, `orders/${orderId}`), {
        status,
        updatedAt: timestamp,
      }),
      // Update Firestore
      updateDoc(doc(db, "orders", orderId), {
        status,
        updatedAt: timestamp,
      }),
    ]

    await Promise.all(updatePromises)
    console.log("[v0] Successfully synced status to both databases:", orderId, status)
  } catch (error) {
    console.error("[v0] Error syncing status to databases:", error)
    throw error
  }
}

export async function syncOrderUpdateToAllDatabases(orderId: string, updates: Record<string, any>) {
  try {
    const timestamp = Date.now()
    console.log("[v0] Syncing order update to both databases:", orderId, updates)

    const updateData = {
      ...updates,
      updatedAt: timestamp,
    }

    const updatePromises = [
      // Update Realtime Database
      update(ref(rtdb, `orders/${orderId}`), updateData),
      // Update Firestore
      updateDoc(doc(db, "orders", orderId), updateData),
    ]

    await Promise.all(updatePromises)
    console.log("[v0] Successfully synced order update to both databases:", orderId)
  } catch (error) {
    console.error("[v0] Error syncing order update to databases:", error)
    throw error
  }
}
