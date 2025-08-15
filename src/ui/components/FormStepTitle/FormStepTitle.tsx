import { Check } from 'lucide-react';
import { clsx } from 'clsx';

interface FormStepTitleProps {
  className?: string;
  stepNumber: string;
  stepName: string;
  active?: boolean;
  complete?: boolean;
  skip?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

const FormStepTitle = ({
  className,
  stepNumber,
  stepName,
  active = false,
  complete = false,
  skip = false,
  disabled = false,
  onClick,
}: FormStepTitleProps) => {
  // Helper function to determine step icon content
  const getStepIcon = () => {
    if (complete && !skip) {
      return <Check className="h-4 w-4 text-white" />;
    }
    if (skip) {
      return <span className="text-xs font-bold">!</span>;
    }
    return <span className="text-xs font-bold">{stepNumber}</span>;
  };

  // Helper function to get step status styles
  const getStepStyles = () => {
    if (disabled) {
      return {
        container: 'border-[var(--color-page-header)]/30 text-[var(--color-page-header)]/30',
        text: 'text-base-content/30 dark:text-base-content/30',
      };
    }
    if (complete && !skip) {
      return {
        container: 'bg-success text-success-content border-success',
        text: 'text-base-content dark:text-base-content',
      };
    }
    if (skip) {
      return {
        container: 'bg-warning text-warning-content border-warning',
        text: 'text-base-content dark:text-base-content',
      };
    }
    if (active) {
      return {
        container: 'bg-primary text-primary-content border-primary',
        text: 'text-primary dark:text-primary',
      };
    }
    return {
      container: 'border-[var(--color-page-header)] text-[var(--color-page-header)]',
      text: 'text-base-content/60 dark:text-base-content/60',
    };
  };

  const stepStyles = getStepStyles();
  const isClickable = Boolean(onClick) && !disabled;

  return (
    <div
      className={clsx(
        'flex items-center justify-start gap-3 py-2 transition-all select-none',
        {
          'origin-left scale-105 font-medium': active && !disabled,
          'cursor-pointer': isClickable,
          'cursor-not-allowed opacity-50': disabled,
        },
        stepStyles.text,
        className
      )}
      onClick={disabled ? undefined : onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : -1}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
      aria-label={`Step ${stepNumber}: ${stepName}${active ? ' (current)' : ''}${complete ? ' (completed)' : ''}${skip ? ' (skipped)' : ''}${disabled ? ' (disabled)' : ''}`}
      aria-disabled={disabled}
    >
      <div
        className={clsx(
          'flex h-8 w-8 items-center justify-center rounded-full border-2 font-medium transition-colors',
          stepStyles.container
        )}
      >
        {getStepIcon()}
      </div>
      <div
        className={clsx('text-sm font-medium', {
          'text-primary dark:text-primary': active && !disabled,
        })}
      >
        {stepName}
      </div>
    </div>
  );
};

export default FormStepTitle;
