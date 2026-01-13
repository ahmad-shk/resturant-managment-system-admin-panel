import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit"
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface AdminProfile {
  name: string
  email: string
  restaurantName: string
  restaurantPhone: string
  createdAt?: string
  uid?: string
}

interface ProfileState {
  data: AdminProfile | null
  isLoading: boolean
  error: string | null
  lastFetched: number | null
}

const initialState: ProfileState = {
  data: null,
  isLoading: false,
  error: null,
  lastFetched: null,
}

// Async thunk to fetch profile
export const fetchProfile = createAsyncThunk("profile/fetchProfile", async (userId: string, { rejectWithValue }) => {
  try {
    const docSnap = await getDoc(doc(db, "admins", userId))
    if (docSnap.exists()) {
      const data = docSnap.data()
      return {
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      } as AdminProfile
    }
    return null
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch profile")
  }
})

// Async thunk to update profile
export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async ({ userId, data }: { userId: string; data: Partial<AdminProfile> }, { rejectWithValue }) => {
    try {
      const docRef = doc(db, "admins", userId)
      await updateDoc(docRef, { ...data, uid: userId })
      return data as AdminProfile
    } catch (error: any) {
      // If document doesn't exist, create it
      if (error.code === "not-found") {
        const docRef = doc(db, "admins", userId)
        await setDoc(docRef, { ...data, uid: userId })
        return data as AdminProfile
      }
      return rejectWithValue(error.message || "Failed to update profile")
    }
  },
)

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<AdminProfile | null>) => {
      state.data = action.payload
      state.lastFetched = Date.now()
    },
    clearProfile: (state) => {
      state.data = null
      state.lastFetched = null
      state.error = null
    },
    clearProfileError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false
        state.data = action.payload
        state.lastFetched = Date.now()
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false
        if (state.data) {
          state.data = { ...state.data, ...action.payload }
        } else {
          state.data = action.payload
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })
  },
})

export const { setProfile, clearProfile, clearProfileError } = profileSlice.actions
export default profileSlice.reducer
