import { createSlice } from '@reduxjs/toolkit'

export const notificationSlice = createSlice({
    name: 'notification',
    initialState: {
        pageTitle: "Home",  // current page title state management
        noOfNotifications : 15,  // no of unread notifications
        message : "",  // message of notification to be shown
        status : null,   // to check the notification type -  success/ error/ info
    },
    reducers: {
        setPageTitle: (state, action) => {
            state.pageTitle = action.payload.title
        },


        removeNotificationMessage: (state) => {
            state.message = ""
            state.status = null
        },

        showNotification: (state, action) => {
            state.message = action.payload.message
            state.status = action.payload.status
        },
    }
})

export const { setPageTitle, removeNotificationMessage, showNotification } = notificationSlice.actions

export default notificationSlice.reducer