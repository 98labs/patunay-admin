import { Suspense } from "react";
import { Provider } from 'react-redux'
import { createRoot } from "react-dom/client";
import "./index.css";
import "./App.css";

import router from "./router";
import { RouterProvider } from "react-router-dom";
import SuspenseContent from './layouts/SuspenseContent.tsx';
import store from './store/store.ts'

createRoot(document.getElementById("root")!).render(
  <Suspense fallback={<SuspenseContent />}>
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>
    </Suspense>
);
