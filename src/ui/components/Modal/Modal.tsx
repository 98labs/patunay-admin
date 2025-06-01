import React, { memo, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

import { ModalBaseProps } from '../types/common';
import { useLogger } from '../../hooks/useLogger';
import { LogCategory } from '../../../shared/logging/types';
import Button from '../Button';

/**
 * Base modal component with consistent styling and behavior
 * 
 * @example
 * Basic modal:
 * ```tsx
 * <Modal 
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 * >
 *   <p>Are you sure you want to continue?</p>
 * </Modal>
 * ```
 * 
 * @example
 * Modal with custom size and no close button:
 * ```tsx
 * <Modal 
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Large Modal"
 *   size="lg"
 *   showCloseButton={false}
 *   closeOnOverlayClick={false}
 * >
 *   <ComplexFormComponent />
 * </Modal>
 * ```
 */
interface ModalProps extends ModalBaseProps {
  /** Modal content */
  children: React.ReactNode;
  
  /** 
   * Modal size
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /** 
   * Whether modal can be closed with Escape key
   * @default true
   */
  closeOnEscape?: boolean;
  
  /** 
   * Custom header content (overrides title)
   */
  header?: React.ReactNode;
  
  /** 
   * Footer content
   */
  footer?: React.ReactNode;
  
  /** 
   * Whether to show backdrop blur effect
   * @default true
   */
  showBackdrop?: boolean;
  
  /** 
   * Z-index for the modal
   * @default 50
   */
  zIndex?: number;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-screen-lg w-full mx-4'
};

/**
 * Modal component for displaying overlay content
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  header,
  footer,
  showBackdrop = true,
  zIndex = 50,
  className = '',
  'data-testid': dataTestId
}: ModalProps) => {
  const logger = useLogger('Modal');

  // Handle escape key
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      logger.logUserAction('modal_closed_via_escape', { title });
      onClose();
    }
  }, [closeOnEscape, onClose, title, logger]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      logger.logUserAction('modal_closed_via_overlay', { title });
      onClose();
    }
  }, [closeOnOverlayClick, onClose, title, logger]);

  // Handle close button click
  const handleCloseClick = useCallback(() => {
    logger.logUserAction('modal_closed_via_button', { title });
    onClose();
  }, [onClose, title, logger]);

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
      
      logger.info('Modal opened', LogCategory.UI, { title, size });
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        
        logger.info('Modal closed', LogCategory.UI, { title });
      };
    }
    
    return undefined;
  }, [isOpen, handleKeyDown, title, size, logger]);

  if (!isOpen) return null;

  const modalClasses = [
    'bg-base-100 dark:bg-base-100',
    'rounded-xl',
    'shadow-xl',
    'border border-base-300 dark:border-base-300',
    'p-0',
    'relative',
    'w-full',
    'max-h-[90vh] overflow-auto',
    sizeClasses[size],
    className
  ].filter(Boolean).join(' ');

  const backdropClasses = [
    'fixed inset-0',
    `z-${zIndex}`,
    'flex items-center justify-center',
    'p-4',
    showBackdrop ? 'bg-black/60 dark:bg-black/80 backdrop-blur-sm' : 'bg-black/30 dark:bg-black/50'
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={backdropClasses}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      data-testid={dataTestId}
    >
      <div className={modalClasses}>
        {/* Header */}
        {(title || header || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-base-300 dark:border-base-300">
            <div className="flex-1">
              {header || (
                title && (
                  <h2 
                    id="modal-title"
                    className="text-xl font-semibold text-base-content dark:text-base-content"
                  >
                    {title}
                  </h2>
                )
              )}
            </div>
            
            {showCloseButton && (
              <Button
                variant="outline"
                size="sm"
                icon={X}
                onClick={handleCloseClick}
                className="ml-4 !p-2"
                data-testid="modal-close-button"
                aria-label="Close modal"
              />
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6 text-base-content dark:text-base-content">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-base-300 dark:border-base-300">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(Modal);