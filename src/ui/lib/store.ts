import { configureStore } from "@reduxjs/toolkit";
import notificationSlice from "../components/NotificationMessage/slice";
import authSlice from "../pages/Login/slice";
import artworkSlice from "../pages/DetailedArtwork/slice";

const combinedReducer = {
  auth: authSlice,
  notification: notificationSlice,
  artwork: artworkSlice,
};

const store = configureStore({
  reducer: combinedReducer,
});
export default store;
export type RootState = ReturnType<typeof store.getState>;
