import { configureStore } from "@reduxjs/toolkit"
import profileReducer from "./slices/profileSlice"
import menuReducer from "./slices/menuSlice"
import ordersReducer from "./slices/ordersSlice"
import dashboardReducer from "./slices/dashboardSlice"

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    menu: menuReducer,
    orders: ordersReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Recommended when working with Firebase Timestamps/Dates
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
