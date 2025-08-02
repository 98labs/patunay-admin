import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  duration = 3000,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Allow time for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const alertClass = {
    success: 'alert-success',
    error: 'alert-error',
    info: 'alert-info',
    warning: 'alert-warning'
  }[type];

  return ReactDOM.createPortal(
    <div className={`toast toast-top toast-end transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`alert ${alertClass}`}>
        <span>{message}</span>
      </div>
    </div>,
    document.body
  );
};

// Toast hook for easy usage
export const useToast = () => {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const showToast = (props: ToastProps) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { ...props, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast
  };
};

// ToastContainer to render all toasts
export const ToastContainer: React.FC<{ toasts: Array<ToastProps & { id: string }>, removeToast: (id: string) => void }> = ({ toasts, removeToast }) => {
  return (
    <>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
};