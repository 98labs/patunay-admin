import { ReactElement, createContext } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

// Import your store configuration
import { store as defaultStore } from '../store';

// Mock SessionContext for testing
const MockSessionContext = createContext<{
  session: any | null;
}>({
  session: {
    user: { id: 'test-user', email: 'test@example.com' },
    access_token: 'test-token',
    refresh_token: 'test-refresh',
    expires_at: Date.now() + 3600000
  },
});

function MockSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MockSessionContext.Provider value={{
      session: {
        user: { id: 'test-user', email: 'test@example.com' },
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expires_at: Date.now() + 3600000
      }
    }}>
      {children}
    </MockSessionContext.Provider>
  );
}

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: any;
  store?: typeof defaultStore;
  withSession?: boolean;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = defaultStore,
    withSession = false,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    const content = withSession ? (
      <MockSessionProvider>{children}</MockSessionProvider>
    ) : children;

    return (
      <Provider store={store}>
        <BrowserRouter>
          {content}
        </BrowserRouter>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: defaultStore.getState(),
    preloadedState,
  });
}

// Re-export everything
export * from '@testing-library/react';
export { renderWithProviders as render };