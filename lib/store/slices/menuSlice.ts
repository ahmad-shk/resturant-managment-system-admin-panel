import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit"
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "@/lib/firebase"

// --- Interfaces ---

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
  isAdding: boolean 
  error: string | null
  lastFetched: number | null
}

const initialState: MenuState = {
  items: [],
  isLoading: false,
  isAdding: false,
  error: null,
  lastFetched: null,
}

// --- Async Thunks with explicit Generics ---

// 1. Fetch Menu Items
export const fetchMenuItems = createAsyncThunk<
  MenuItem[],           // Return type
  void,                 // No arguments
  { rejectValue: string }
>("menu/fetchMenuItems", async (_, { rejectWithValue }) => {
  try {
    const q = query(collection(db, "menus"))
    const querySnapshot = await getDocs(q)
    const items = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as MenuItem[]
    return items
  } catch (error: any) {
    console.error("[v0] Error fetching menu:", error)
    return rejectWithValue(error.message || "Failed to fetch menu items")
  }
})

// 2. Add Menu Item
// Generics: <ReturnType, ArgumentType, ThunkApiConfig>
export const addMenuItem = createAsyncThunk<
  MenuItem,
  Omit<MenuItem, "id">,
  { rejectValue: string }
>(
  "menu/addMenuItem",
  async (itemData: Omit<MenuItem, "id">, { rejectWithValue }) => {
    try {
      console.log("[v0] Adding menu item:", itemData.name)
      const docRef = await addDoc(collection(db, "menus"), itemData)
      console.log("[v0] Menu item added with ID:", docRef.id)
      
      // Return the full item including the new Firestore ID
      return { ...itemData, id: docRef.id } as MenuItem
    } catch (error: any) {
      console.error("[v0] Error adding menu item:", error)
      // FIX: Ensure error.message exists or provide fallback to avoid 'undefined' alert
      return rejectWithValue(error.message || "Failed to add menu item. Check permissions.")
    }
  },
)

// 3. Update Menu Item
export const updateMenuItem = createAsyncThunk<
  { id: string; data: Partial<MenuItem> },
  { id: string; data: Partial<MenuItem> },
  { rejectValue: string }
>(
  "menu/updateMenuItem",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      await updateDoc(doc(db, "menus", id), data)
      return { id, data }
    } catch (error: any) {
      console.error("[v0] Error updating menu item:", error)
      return rejectWithValue(error.message || "Failed to update menu item")
    }
  },
)

// 4. Delete Menu Item
export const deleteMenuItem = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("menu/deleteMenuItem", async (id: string, { rejectWithValue }) => {
  try {
    await deleteDoc(doc(db, "menus", id))
    return id
  } catch (error: any) {
    console.error("[v0] Error deleting menu item:", error)
    return rejectWithValue(error.message || "Failed to delete menu item")
  }
})

// --- Slice ---

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
      // Fetch Handlers
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
        state.error = action.payload ?? "Failed to fetch menu"
      })

      // Add Handlers
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
        // action.payload is now strictly typed as a string
        state.error = action.payload ?? "Error saving item"
      })

      // Update Handler
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id)
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...action.payload.data }
        }
      })

      // Delete Handler
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        state.items = state.items.filter((item) => item.id !== action.payload)
      })
  },
})

export const { clearMenu } = menuSlice.actions
export default menuSlice.reducer
