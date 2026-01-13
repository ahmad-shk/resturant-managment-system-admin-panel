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
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["profile/setProfile", "orders/setOrders"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["payload.createdAt", "payload.orderDate"],
        // Ignore these paths in the state
        ignoredPaths: ["profile.data.createdAt", "orders.items"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
