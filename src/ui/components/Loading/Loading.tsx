import React, { memo } from 'react';
import { BaseComponentProps, ComponentSize } from '../types/common';

/**
 * Loading spinner component with customizable display modes
 * 
 * @example
 * Basic usage:
 * ```tsx
 * <Loading />
 * ```
 * 
 * @example
 * Inline loading with custom text:
 * ```tsx
 * <Loading 
 *   fullScreen={false} 
 *   text="Saving changes..." 
 *   size="md"
 * />
 * ```
 */
interface LoadingProps extends BaseComponentProps {
  /** 
   * Whether to display as full screen overlay
   * @default true
   */
  fullScreen?: boolean;
  
  /** 
   * Custom loading text
   * @default "Loading"
   */
  text?: string;
  
  /** 
   * Size of the loading spinner
   * @default "lg"
   */
  size?: ComponentSize;
  
  /** 
   * Whether to show the loading text
   * @default true
   */
  showText?: boolean;
  
  /** 
   * Whether to show animated dots after text
   * @default true
   */
  showDots?: boolean;
}

const sizeClasses: Record<ComponentSize, string> = {
  xs: 'loading-xs',
  sm: 'loading-sm',
  md: 'loading-md',
  lg: 'loading-lg',
  xl: 'loading-xl'
};

/**
 * Loading component for displaying loading states throughout the application
 */
const Loading = ({
  fullScreen = true,
  text = 'Loading',
  size = 'lg',
  showText = true,
  showDots = true,
  className = '',
  'data-testid': dataTestId
}: LoadingProps) => {
  const spinnerClass = `loading loading-spinner ${sizeClasses[size]}`;
  const dotsClass = `loading loading-dots ${sizeClasses[size]}`;

  const LoadingContent = () => (
    <div className="text-center" data-testid={dataTestId}>
      <span className={spinnerClass} aria-label="Loading spinner" />
      {showText && (
        <p className="mt-4 text-lg font-semibold">
          {text}
          {showDots && <span className={dotsClass} aria-hidden="true" />}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className={`h-screen flex items-center justify-center bg-base-100 text-base-content ${className}`}
        role="status"
        aria-live="polite"
        aria-label={`${text}${showDots ? '...' : ''}`}
      >
        <LoadingContent />
      </div>
    );
  }

  return (
    <div 
      className={`card bg-base-100 shadow p-6 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`${text}${showDots ? '...' : ''}`}
    >
      <div className="flex items-center justify-center gap-3">
        <LoadingContent />
      </div>
    </div>
  );
};

export default memo(Loading);