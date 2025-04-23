import { configureStore } from '@reduxjs/toolkit'
import notificationSlice from '../components/NotificationMessage/slice'

const combinedReducer = {
    notification: notificationSlice
}

export default configureStore({
    reducer: combinedReducer
})