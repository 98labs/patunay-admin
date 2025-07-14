# Development Guide

## Table of Contents
- [Coding Standards](#coding-standards)
- [Component Architecture](#component-architecture)
- [TypeScript Guidelines](#typescript-guidelines)
- [Error Handling](#error-handling)
- [Testing Standards](#testing-standards)
- [Performance Guidelines](#performance-guidelines)

## Coding Standards

### File and Folder Structure

```
src/ui/components/ComponentName/
├── ComponentName.tsx          # Main component file
├── index.ts                   # Re-export only
├── types.ts                   # Complex types (optional)
├── ComponentName.test.tsx     # Unit tests
└── ComponentName.stories.tsx  # Storybook stories (future)
```

### Naming Conventions

```typescript
// ✅ Component Names (PascalCase)
const UserProfile = () => { ... }

// ✅ Props Interface (ComponentName + Props)
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

// ✅ Custom Hooks (use + PascalCase)
const useUserData = (userId: string) => { ... }

// ✅ Constants (SCREAMING_SNAKE_CASE)
const DEFAULT_PAGE_SIZE = 10;

// ✅ Functions and Variables (camelCase)
const handleUserUpdate = () => { ... }
const isLoading = true;
```

### Import/Export Patterns

```typescript
// ✅ Imports at top, grouped by source
import React, { useState, useEffect, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import { Button, Modal } from '@components';
import { useLogger } from '@hooks';
import { UserService } from '@services';
import { User } from '@typings';

// ✅ Default export for main component
export default memo(ComponentName);

// ✅ Named exports for utilities (when needed)
export { validateUserData, formatUserName };
```

## Component Architecture

### Base Component Template

```typescript
import React, { memo } from 'react';
import { useLogger } from '@hooks';

/**
 * Brief description of what this component does
 * 
 * @example
 * ```tsx
 * <ComponentName 
 *   title="Example" 
 *   onAction={handleAction}
 * />
 * ```
 */
interface ComponentNameProps {
  /** Primary title text */
  title: string;
  /** Optional subtitle */
  subtitle?: string;
  /** Callback fired when action is triggered */
  onAction?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Component children */
  children?: React.ReactNode;
}

const ComponentName = ({
  title,
  subtitle,
  onAction,
  className = '',
  children
}: ComponentNameProps) => {
  const logger = useLogger('ComponentName');

  // ✅ State declarations first
  const [isLoading, setIsLoading] = useState(false);
  
  // ✅ Hooks after state
  const dispatch = useDispatch();
  
  // ✅ Event handlers
  const handleAction = async () => {
    try {
      setIsLoading(true);
      logger.logUserAction('component_action_triggered', { title });
      
      await onAction?.();
      
      logger.info('Action completed successfully');
    } catch (error) {
      logger.error('Action failed', LogCategory.UI, { component: 'ComponentName' }, error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Effect hooks after handlers
  useEffect(() => {
    logger.info('Component mounted', LogCategory.UI, { title });
    
    return () => {
      logger.debug('Component unmounting', LogCategory.UI, { title });
    };
  }, [title, logger]);

  // ✅ Early returns for loading/error states
  if (isLoading) {
    return <Loading />;
  }

  // ✅ Main render
  return (
    <div className={`component-name ${className}`}>
      <h2>{title}</h2>
      {subtitle && <p className="subtitle">{subtitle}</p>}
      {children}
      <Button onClick={handleAction} disabled={isLoading}>
        Trigger Action
      </Button>
    </div>
  );
};

export default memo(ComponentName);
```

### State Management Patterns

```typescript
// ✅ Simple state (prefer individual useState for different concerns)
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<User[]>([]);

// ✅ Complex state (use object when fields are related)
const [formState, setFormState] = useState({
  email: '',
  password: '',
  rememberMe: false
});

// ✅ State updates
const updateFormField = (field: keyof typeof formState, value: any) => {
  setFormState(prev => ({ ...prev, [field]: value }));
};
```

### Error Handling Standard

```typescript
/**
 * Standard error handling pattern for user actions
 */
const handleAsyncAction = async () => {
  try {
    setError(null);
    setIsLoading(true);
    
    logger.logUserAction('action_started');
    
    const result = await performAction();
    
    // Success feedback
    dispatch(showNotification({
      message: 'Action completed successfully',
      status: 'success'
    }));
    
    logger.info('Action completed', LogCategory.BUSINESS, { result });
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Action failed';
    
    setError(errorMessage);
    
    dispatch(showNotification({
      message: errorMessage,
      status: 'error'
    }));
    
    logger.error('Action failed', LogCategory.BUSINESS, { action: 'action_name' }, error as Error);
    
    throw error; // Re-throw if parent needs to handle
  } finally {
    setIsLoading(false);
  }
};
```

## TypeScript Guidelines

### Props Interface Patterns

```typescript
// ✅ Base props interface
interface BaseComponentProps {
  className?: string;
  'data-testid'?: string;
}

// ✅ Extend base props
interface ButtonProps extends BaseComponentProps {
  /** Button text content */
  children: React.ReactNode;
  /** Button variant style */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void | Promise<void>;
}

// ✅ Generic props for reusable components
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  loading?: boolean;
}
```

### Type Definitions

```typescript
// ✅ Enum for constants
export enum NotificationStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// ✅ Union types for known values
export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ✅ Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
```

### Documentation Standards

```typescript
/**
 * Component description explaining purpose and usage
 * 
 * @example
 * Basic usage:
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 * 
 * @example
 * With loading state:
 * ```tsx
 * <Button variant="primary" loading={isSubmitting}>
 *   Submit Form
 * </Button>
 * ```
 */
interface ButtonProps {
  /** 
   * Button content - can be text or JSX elements
   * @example "Save Changes" | <><Icon /> Save</> 
   */
  children: React.ReactNode;
  
  /** 
   * Visual style variant
   * @default "primary"
   */
  variant?: ButtonVariant;
  
  /** 
   * Shows loading spinner and disables interaction
   * @default false
   */
  loading?: boolean;
  
  /** 
   * Click event handler - supports async functions
   * @param event - Click event
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}
```

## Testing Standards

### Component Testing Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import ComponentName from './ComponentName';
import { createMockStore } from '@/test/utils';

describe('ComponentName', () => {
  let mockStore: ReturnType<typeof createMockStore>;
  let mockOnAction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockStore = createMockStore();
    mockOnAction = vi.fn();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      title: 'Test Title',
      onAction: mockOnAction,
      ...props
    };

    return render(
      <Provider store={mockStore}>
        <ComponentName {...defaultProps} />
      </Provider>
    );
  };

  describe('Rendering', () => {
    it('renders with required props', () => {
      renderComponent();
      
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders subtitle when provided', () => {
      renderComponent({ subtitle: 'Test Subtitle' });
      
      expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('calls onAction when button is clicked', async () => {
      renderComponent();
      
      const button = screen.getByRole('button', { name: /trigger action/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockOnAction).toHaveBeenCalledTimes(1);
      });
    });

    it('handles async action errors gracefully', async () => {
      mockOnAction.mockRejectedValueOnce(new Error('Test error'));
      
      renderComponent();
      
      const button = screen.getByRole('button', { name: /trigger action/i });
      fireEvent.click(button);
      
      await waitFor(() => {
        expect(mockOnAction).toHaveBeenCalled();
      });
      
      // Verify error handling (notification, logging, etc.)
    });
  });

  describe('Loading States', () => {
    it('shows loading state during async operations', async () => {
      mockOnAction.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      
      renderComponent();
      
      const button = screen.getByRole('button', { name: /trigger action/i });
      fireEvent.click(button);
      
      expect(screen.getByRole('button')).toBeDisabled();
      
      await waitFor(() => {
        expect(mockOnAction).toHaveBeenCalled();
      });
    });
  });
});
```

## Performance Guidelines

### When to Use React.memo

```typescript
// ✅ Use memo for components that receive complex props or render frequently
const ExpensiveComponent = memo(({ data, onUpdate }: Props) => {
  // Complex rendering logic
}, (prevProps, nextProps) => {
  // Custom comparison if needed
  return prevProps.data.id === nextProps.data.id;
});

// ❌ Don't use memo for simple components that rarely re-render
const SimpleText = ({ text }: { text: string }) => <span>{text}</span>;
```

### Optimization Patterns

```typescript
// ✅ Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// ✅ Memoize event handlers to prevent unnecessary re-renders
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);

// ✅ Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

## API Documentation Standards

### Service Functions

```typescript
/**
 * Retrieves user data from the API
 * 
 * @param userId - Unique user identifier
 * @param options - Request configuration options
 * @returns Promise resolving to user data
 * 
 * @throws {UserNotFoundError} When user doesn't exist
 * @throws {NetworkError} When request fails
 * 
 * @example
 * ```typescript
 * try {
 *   const user = await getUserById('123');
 *   console.log(user.name);
 * } catch (error) {
 *   if (error instanceof UserNotFoundError) {
 *     // Handle user not found
 *   }
 * }
 * ```
 */
export async function getUserById(
  userId: string,
  options: RequestOptions = {}
): Promise<User> {
  // Implementation
}
```

### Hook Documentation

```typescript
/**
 * Custom hook for managing user authentication state
 * 
 * @returns Object containing auth state and methods
 * 
 * @example
 * ```typescript
 * const { user, login, logout, isLoading } = useAuth();
 * 
 * const handleLogin = async () => {
 *   try {
 *     await login(email, password);
 *     // Redirect to dashboard
 *   } catch (error) {
 *     // Handle login error
 *   }
 * };
 * ```
 */
export const useAuth = (): AuthState => {
  // Implementation
}
```

This development guide establishes consistent patterns for maintainable, well-documented React components.