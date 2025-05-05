import { createSlice } from "@reduxjs/toolkit";

interface NotifState {
  title: string | null;
  message: string | null;
  status: "success" | "error" | "info" | null;
}

export const initialState: NotifState = {
  title: "", // current page title state management
  message: "", // message of notification to be shown
  status: null, // to check the notification type -  success/ error/ info
};
export const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setTitle: (state, action) => {
      state.title = action.payload.title;
    },

    removeNotificationMessage: (state) => {
      state.message = "";
      state.title = "";
      state.status = null;
    },

    showNotification: (state, action) => {
      state.title = action.payload.title;
      state.message = action.payload.message;
      state.status = action.payload.status;
    },
  },
});

export const { setTitle, removeNotificationMessage, showNotification } =
  notificationSlice.actions;

export default notificationSlice.reducer;
