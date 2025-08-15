
import React, { Suspense } from "react";
import { Provider } from 'react-redux'
import { createRoot } from "react-dom/client";
import "./index.css";

import router from "./router";
import { RouterProvider } from "react-router-dom";
import SuspenseContent from './layouts/SuspenseContent.tsx';
import store from './store/store.ts'
import { runInitializationDiagnostic } from './utils/initializationDiagnostic';

// Run diagnostic check in development mode

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


console.log('Main.tsx: Script loaded');

const rootElement = document.getElementById("root");
console.log('Main.tsx: Root element:', rootElement);

if (!rootElement) {
  console.error('Root element not found!');
  document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: Root element not found</div>';
} else {
  try {
    console.log('Starting app render...');
    
    // Temporarily render debug app to test if React is working
    const DEBUG_MODE = false;
    
    if (DEBUG_MODE) {
      console.log('Debug mode enabled - this should not happen in production');
      rootElement.innerHTML = '<div style="padding: 20px;">Debug mode is on but DebugApp is not imported</div>';
    } else {
      createRoot(rootElement).render(
        <ErrorBoundary>
          <Suspense fallback={<SuspenseContent />}>
            <Provider store={store}>
              <RouterProvider router={router} />
            </Provider>
          </Suspense>
        </ErrorBoundary>
      );
    }
  } catch (error) {
    console.error('Failed to render application:', error);
    rootElement.innerHTML = `<div style="color: red; padding: 20px;">Error rendering app: ${error}</div>`;
  }
}
