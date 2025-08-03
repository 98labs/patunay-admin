import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  Info,
  XCircle 
} from 'lucide-react';
import { classNames } from '../../utils/classNames';

type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  info: {
    container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    icon: 'text-blue-400',
    text: 'text-blue-800 dark:text-blue-200',
    Icon: Info
  },
  success: {
    container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    icon: 'text-green-400',
    text: 'text-green-800 dark:text-green-200',
    Icon: CheckCircle
  },
  warning: {
    container: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    icon: 'text-yellow-400',
    text: 'text-yellow-800 dark:text-yellow-200',
    Icon: AlertTriangle
  },
  danger: {
    container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    icon: 'text-red-400',
    text: 'text-red-800 dark:text-red-200',
    Icon: XCircle
  }
};

const Alert: React.FC<AlertProps> = ({ 
  variant = 'info', 
  children, 
  className = '' 
}) => {
  const styles = variantStyles[variant];
  const Icon = styles.Icon;

  return (
    <div className={classNames(
      'rounded-md border p-4',
      styles.container,
      className
    )}>
      <div className="flex">
        <div className="flex-shrink-0">
          <Icon className={classNames('h-5 w-5', styles.icon)} aria-hidden="true" />
        </div>
        <div className="ml-3">
          <div className={classNames('text-sm', styles.text)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alert;