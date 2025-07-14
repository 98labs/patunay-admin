import { Suspense } from "react";
import { Provider } from 'react-redux'
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";

import router from "./router";
import { RouterProvider } from "react-router-dom";
import SuspenseContent from './layouts/SuspenseContent.tsx';
import store from './store/store.ts'
import { runInitializationDiagnostic } from './utils/initializationDiagnostic';

// Run diagnostic check in development mode
if (import.meta.env.DEV) {
  runInitializationDiagnostic();
}

createRoot(document.getElementById("root")!).render(
  <Suspense fallback={<SuspenseContent />}>
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>
    </Suspense>
);
