import { configureStore } from "@reduxjs/toolkit";
import notificationSlice from "../components/NotificationMessage/slice";
import artworkSlice from "../pages/DetailedArtwork/slice";
import { nfcReducer, nfcMiddleware } from "./nfc";
import { authReducer } from "./features/auth";
import { api } from "./api";

const combinedReducer = {
  auth: authReducer,
  notification: notificationSlice,
  artwork: artworkSlice,
  nfc: nfcReducer,
  [api.reducerPath]: api.reducer,
};

const store = configureStore({
  reducer: combinedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization checks
        ignoredActions: [
          'nfc/cardDetected',
          'nfc/readerConnected', 
          'nfc/readerDisconnected',
          'api/executeQuery/pending',
          'api/executeQuery/fulfilled',
          'api/executeQuery/rejected',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.timestamp', 'meta.arg', 'meta.baseQueryMeta'],
        // Ignore these paths in the state
        ignoredPaths: ['nfc.operationHistory.timestamp', 'api'],
      },
    })
    .concat(api.middleware)
    .concat(nfcMiddleware),
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
