import { configureStore } from "@reduxjs/toolkit";
import notificationSlice from "../components/NotificationMessage/slice";
import authSlice from "../pages/Login/slice";
import artworkSlice from "../pages/DetailedArtwork/slice";
import { nfcReducer, nfcMiddleware } from "../store/nfc";

const combinedReducer = {
  auth: authSlice,
  notification: notificationSlice,
  artwork: artworkSlice,
  nfc: nfcReducer,
};

const store = configureStore({
  reducer: combinedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: ['nfc/cardDetected', 'nfc/readerConnected', 'nfc/readerDisconnected'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['nfc.operationHistory.timestamp'],
      },
    }).concat(nfcMiddleware),
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
