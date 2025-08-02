console.log('main.tsx loaded - very first line');

import React, { Suspense } from "react";
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
  runInitializationDiagnostic().catch(console.error);
}

// Error boundary to catch rendering errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h1>Application Error</h1>
          <pre>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()}>Reload</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Add debug logging
console.log('Main.tsx: Starting app initialization');
console.log('Environment:', {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Not set',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
});

const rootElement = document.getElementById("root");
console.log('Root element:', rootElement);

if (!rootElement) {
  console.error('Root element not found!');
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found</div>';
} else {
  try {
    createRoot(rootElement).render(
      <ErrorBoundary>
        <Suspense fallback={<SuspenseContent />}>
          <Provider store={store}>
            <RouterProvider router={router} />
          </Provider>
        </Suspense>
      </ErrorBoundary>
    );
    console.log('App rendered successfully');
  } catch (error) {
    console.error('Error rendering app:', error);
    rootElement.innerHTML = `<div style="color: red; padding: 20px;">Error rendering app: ${error}</div>`;
  }
}
