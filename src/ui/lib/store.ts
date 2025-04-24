import { configureStore } from '@reduxjs/toolkit'
import notificationSlice from '../components/NotificationMessage/slice'
import authSlice from '../pages/Login/slice'

const combinedReducer = {
    auth: authSlice,
    notification: notificationSlice
}

const store = configureStore({
    reducer: combinedReducer
})
export default store;
export type RootState = ReturnType<typeof store.getState>;