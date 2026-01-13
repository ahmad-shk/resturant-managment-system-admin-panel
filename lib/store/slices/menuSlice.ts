import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface MenuItem {
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

interface MenuState {
  items: MenuItem[]
  isLoading: boolean
  isAdding: boolean // Added loading state for add operation
  error: string | null
  lastFetched: number | null
}

const initialState: MenuState = {
  items: [],
  isLoading: false,
  isAdding: false, // Initial state for add operation
  error: null,
  lastFetched: null,
}

// Async thunk to fetch menu items
export const fetchMenuItems = createAsyncThunk("menu/fetchMenuItems", async (_, { rejectWithValue }) => {
  try {
    console.log("[v0] Fetching menu items...")
    const q = query(collection(db, "menus"))
    const querySnapshot = await getDocs(q)
    const items = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as MenuItem[]
    console.log("[v0] Menu items fetched:", items.length)
    return items
  } catch (error: any) {
    console.error("[v0] Error fetching menu:", error)
    return rejectWithValue(error.message || "Failed to fetch menu items")
  }
})

// Async thunk to add menu item
export const addMenuItem = createAsyncThunk(
  "menu/addMenuItem",
  async (itemData: Omit<MenuItem, "id">, { rejectWithValue }) => {
    try {
      console.log("[v0] Adding menu item:", itemData.name)
      const docRef = await addDoc(collection(db, "menus"), itemData)
      console.log("[v0] Menu item added with ID:", docRef.id)
      return { ...itemData, id: docRef.id } as MenuItem
    } catch (error: any) {
      console.error("[v0] Error adding menu item:", error)
      return rejectWithValue(error.message || "Failed to add menu item")
    }
  },
)

// Async thunk to update menu item
export const updateMenuItem = createAsyncThunk(
  "menu/updateMenuItem",
  async ({ id, data }: { id: string; data: Partial<MenuItem> }, { rejectWithValue }) => {
    try {
      console.log("[v0] Updating menu item:", id)
      await updateDoc(doc(db, "menus", id), data)
      console.log("[v0] Menu item updated")
      return { id, data }
    } catch (error: any) {
      console.error("[v0] Error updating menu item:", error)
      return rejectWithValue(error.message || "Failed to update menu item")
    }
  },
)

// Async thunk to delete menu item
export const deleteMenuItem = createAsyncThunk("menu/deleteMenuItem", async (id: string, { rejectWithValue }) => {
  try {
    console.log("[v0] Deleting menu item:", id)
    await deleteDoc(doc(db, "menus", id))
    console.log("[v0] Menu item deleted")
    return id
  } catch (error: any) {
    console.error("[v0] Error deleting menu item:", error)
    return rejectWithValue(error.message || "Failed to delete menu item")
  }
})

const menuSlice = createSlice({
  name: "menu",
  initialState,
  reducers: {
    clearMenu: (state) => {
      state.items = []
      state.lastFetched = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenuItems.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchMenuItems.fulfilled, (state, action) => {
        state.isLoading = false
        state.items = action.payload
        state.lastFetched = Date.now()
      })
      .addCase(fetchMenuItems.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(addMenuItem.pending, (state) => {
        state.isAdding = true
        state.error = null
      })
      .addCase(addMenuItem.fulfilled, (state, action) => {
        state.isAdding = false
        state.items.push(action.payload)
      })
      .addCase(addMenuItem.rejected, (state, action) => {
        state.isAdding = false
        state.error = action.payload as string
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload.data }
        }
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload)
      })
  },
})

export const { clearMenu } = menuSlice.actions
export default menuSlice.reducer
