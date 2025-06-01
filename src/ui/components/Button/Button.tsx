import React, { useState, memo, useCallback } from 'react';
import { LucideIcon } from 'lucide-react';

import { BaseComponentProps, ButtonVariant, ComponentSize } from '../types/common';
import { useLogger } from '../../hooks/useLogger';
import { LogCategory } from '../../../shared/logging/types';

/**
 * Reusable button component with loading states and icon support
 * 
 * @example
 * Basic button:
 * ```tsx
 * <Button onClick={handleClick}>
 *   Save Changes
 * </Button>
 * ```
 * 
 * @example
 * Button with icon and custom variant:
 * ```tsx
 * <Button 
 *   variant="danger"
 *   icon={TrashIcon}
 *   onClick={handleDelete}
 *   loading={isDeleting}
 * >
 *   Delete Item
 * </Button>
 * ```
 */
interface ButtonProps extends BaseComponentProps {
  /** 
   * Button content - can be text or JSX elements
   * @default "Button"
   */
  children?: React.ReactNode;
  
  /** 
   * Visual style variant
   * @default "primary"
   */
  variant?: ButtonVariant;
  
  /** 
   * Button size
   * @default "md"
   */
  size?: ComponentSize;
  
  /** 
   * Icon component to display
   */
  icon?: LucideIcon;
  
  /** 
   * Icon position relative to text
   * @default "left"
   */
  iconPosition?: 'left' | 'right';
  
  /** 
   * Whether button is disabled
   * @default false
   */
  disabled?: boolean;
  
  /** 
   * Shows loading spinner and disables interaction
   * @default false
   */
  loading?: boolean;
  
  /** 
   * Whether to show loading state during async operations
   * @default true
   */
  showLoadingState?: boolean;
  
  /** 
   * Click event handler - supports async functions
   */
  onClick?: () => void | Promise<void>;
  
  /** 
   * Button type for form submission
   * @default "button"
   */
  type?: 'button' | 'submit' | 'reset';
  
  /** 
   * Whether button should take full width
   * @default false
   */
  fullWidth?: boolean;
  
  // Legacy props for backward compatibility
  /** @deprecated Use 'variant' instead */
  buttonType?: 'primary' | 'secondary';
  /** @deprecated Use 'children' instead */
  buttonLabel?: string;
  /** @deprecated Use 'icon' instead */
  buttonIcon?: LucideIcon;
  /** @deprecated Use 'showLoadingState' instead */
  loadingIsEnabled?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn-primary dark:btn-primary',
  secondary: 'btn-outline btn-primary dark:btn-outline dark:btn-primary border-2 border-primary dark:border-primary text-primary dark:text-primary bg-transparent dark:bg-transparent hover:bg-primary dark:hover:bg-primary hover:text-primary-content dark:hover:text-primary-content',
  danger: 'btn-error dark:btn-error',
  outline: 'btn-outline dark:btn-outline border-2 border-base-content/30 dark:border-base-content/50 text-base-content dark:text-base-content hover:border-primary dark:hover:border-primary hover:bg-primary/10 dark:hover:bg-primary/20'
};

const sizeClasses: Record<ComponentSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
  xl: 'btn-lg text-lg'
};

/**
 * Button component for user interactions with consistent styling and behavior
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  showLoadingState = true,
  onClick,
  type = 'button',
  fullWidth = false,
  className = '',
  'data-testid': dataTestId,
  
  // Legacy props (deprecated)
  buttonType,
  buttonLabel,
  buttonIcon,
  loadingIsEnabled = true
}: ButtonProps) => {
  const logger = useLogger('Button');
  const [isLoading, setIsLoading] = useState(false);

  // Handle legacy props
  const finalVariant = buttonType === 'secondary' ? 'secondary' : variant;
  const finalChildren = children || buttonLabel || 'Button';
  const finalIcon = icon || buttonIcon;
  const finalShowLoading = showLoadingState && loadingIsEnabled;

  const handleClick = useCallback(async () => {
    if (!onClick || disabled || loading || isLoading) {
      return;
    }

    try {
      logger.logUserAction('button_clicked', { 
        variant: finalVariant,
        hasIcon: !!finalIcon,
        children: typeof finalChildren === 'string' ? finalChildren : 'complex'
      });

      if (finalShowLoading) {
        setIsLoading(true);
      }

      const result = onClick();
      
      // Handle both sync and async onClick handlers
      if (result instanceof Promise) {
        await result;
      }

      logger.info('Button action completed successfully', LogCategory.UI);
    } catch (error) {
      logger.error(
        'Button action failed', 
        LogCategory.UI, 
        { variant: finalVariant }, 
        error as Error
      );
      throw error; // Re-throw to allow parent components to handle
    } finally {
      if (finalShowLoading) {
        setIsLoading(false);
      }
    }
  }, [onClick, disabled, loading, isLoading, finalVariant, finalIcon, finalChildren, finalShowLoading, logger]);

  const isDisabled = disabled || loading || isLoading;
  const showSpinner = (loading || isLoading) && finalShowLoading;

  const buttonClasses = [
    'btn',
    'active:border-0',
    'transition-colors duration-200',
    'dark:border-base-300',
    variantClasses[finalVariant],
    sizeClasses[size],
    fullWidth ? 'w-full' : '',
    isDisabled ? 'opacity-50 cursor-not-allowed' : '',
    className
  ].filter(Boolean).join(' ');

  const IconComponent = finalIcon;
  const iconElement = IconComponent && (
    <IconComponent 
      className="w-5 h-5 shrink-0" 
      aria-hidden="true"
    />
  );

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={isDisabled}
      data-testid={dataTestId}
      aria-label={typeof finalChildren === 'string' ? finalChildren : undefined}
    >
      {showSpinner ? (
        <>
          <span className="loading loading-spinner loading-sm" aria-hidden="true" />
          {typeof finalChildren === 'string' && (
            <span className="sr-only">Loading...</span>
          )}
        </>
      ) : (
        <>
          {iconPosition === 'left' && iconElement}
          <span>{finalChildren}</span>
          {iconPosition === 'right' && iconElement}
        </>
      )}
    </button>
  );
};

export default memo(Button);