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

console.log('Store: Creating Redux store');

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
          'api/executeMutation/pending',
          'api/executeMutation/fulfilled',
          'api/executeMutation/rejected',
        ],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['payload.timestamp', 'meta.arg', 'meta.baseQueryMeta', 'payload.error', 'error'],
        // Ignore these paths in the state
        ignoredPaths: ['nfc.operationHistory.timestamp', 'api'],
      },
    })
    .concat(api.middleware)
    .concat(nfcMiddleware),
});

console.log('Store: Redux store created successfully');

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
