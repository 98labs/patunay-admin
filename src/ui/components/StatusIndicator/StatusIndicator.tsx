import { classNames } from '../../utils/classNames';

interface StatusIndicatorProps {
  isActive: boolean;
  activeText?: string;
  inactiveText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  isActive,
  activeText = 'Active',
  inactiveText = 'Inactive',
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-0.5',
    lg: 'text-base px-3 py-1',
  };

  const dotSizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-2.5 w-2.5',
  };

  return (
    <div
      className={classNames(
        'inline-flex items-center gap-1 rounded-full border border-[var(--color-neutral-gray-03)]',
        sizeClasses[size],
        className
      )}
    >
      <div
        className={classNames(
          'rounded-full',
          dotSizeClasses[size],
          isActive
            ? 'bg-[var(--color-semantic-success)]'
            : 'bg-[var(--color-semantic-error)]'
        )}
      />
      <span>{isActive ? activeText : inactiveText}</span>
    </div>
  );
};

export default StatusIndicator;