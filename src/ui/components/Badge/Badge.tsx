import React from 'react';
import { classNames } from '../../utils/classNames';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary:
    'bg-[var(--color-primary-400)] text-[var(--color-neutral-white)] dark:bg-[var(--color-primary-400)] dark:text-[var(--color-neutral-white)]',
  secondary:
    'bg-[var(--color-neutral-gray-01)] text-[var(--color-neutral-black-02)] dark:bg-[var(--color-neutral-gray-01)] dark:text-[var(--color-neutral-black-02)]',
  success:
    'bg-[var(--color-success-100)] text-[var(--color-success-800)] dark:bg-[var(--color-success-900)] dark:text-[var(--color-success-200)]',
  danger:
    'bg-[var(--color-danger-100)] text-[var(--color-danger-800)] dark:bg-[var(--color-danger-900)] dark:text-[var(--color-danger-200)]',
  warning:
    'bg-[var(--color-warning-100)] text-[var(--color-warning-800)] dark:bg-[var(--color-warning-900)] dark:text-[var(--color-warning-200)]',
  info: 'bg-[var(--color-info-100)] text-[var(--color-info-800)] dark:bg-[var(--color-info-900)] dark:text-[var(--color-info-200)]',
};

const Badge: React.FC<BadgeProps> = ({
  variant = 'secondary',
  children,
  className = '',
  onClick,
}) => {
  return (
    <span
      onClick={onClick}
      className={classNames(
        'inline-flex items-center rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 ease-out',
        onClick != null && 'cursor-pointer',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
