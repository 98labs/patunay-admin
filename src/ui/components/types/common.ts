/**
 * Common types and interfaces shared across all components
 */

import React from 'react';

/**
 * Base props that all components should extend
 */
export interface BaseComponentProps {
  /** Additional CSS classes */
  className?: string;
  /** Test identifier for testing */
  'data-testid'?: string;
}

/**
 * Props for components that can contain children
 */
export interface ComponentWithChildrenProps extends BaseComponentProps {
  /** Component children */
  children?: React.ReactNode;
}

/**
 * Standard loading state type
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Common button variants used across the application
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';

/**
 * Standard component sizes
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Notification status types
 */
export enum NotificationStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

/**
 * Common async handler function type
 */
export type AsyncHandler = () => Promise<void> | void;

/**
 * Generic event handler with optional parameter
 */
export type EventHandler<T = void> = (data?: T) => void | Promise<void>;

/**
 * Form field validation state
 */
export interface ValidationState {
  isValid: boolean;
  error?: string;
  touched?: boolean;
}

/**
 * Generic API response structure
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
  message?: string;
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Filter options for data tables
 */
export interface FilterOption<T = string> {
  label: string;
  value: T;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Modal component base props
 */
export interface ModalBaseProps extends BaseComponentProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether clicking overlay closes modal */
  closeOnOverlayClick?: boolean;
}

/**
 * Form component base props
 */
export interface FormBaseProps extends BaseComponentProps {
  /** Whether form is in loading state */
  loading?: boolean;
  /** Whether form is disabled */
  disabled?: boolean;
  /** Form submission handler */
  onSubmit?: (data: any) => void | Promise<void>;
}

/**
 * Data table column definition
 */
export interface TableColumn<T = any> {
  /** Column header text */
  header: string;
  /** Field accessor key */
  accessor: keyof T | string;
  /** Custom cell renderer */
  cell?: (value: any, row: T) => React.ReactNode;
  /** Whether column is sortable */
  sortable?: boolean;
  /** Column width */
  width?: string | number;
  /** Column alignment */
  align?: 'left' | 'center' | 'right';
}

/**
 * Common error boundary props
 */
export interface ErrorBoundaryProps extends ComponentWithChildrenProps {
  /** Fallback component to render on error */
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  /** Error handler callback */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Utility type to make specific fields required
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Utility type to make specific fields optional
 */
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract props type from a React component
 */
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never;