interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  className = '',
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'border-primary/20 bg-primary/5';
      case 'secondary':
        return 'border-secondary/20 bg-secondary/5';
      case 'accent':
        return 'border-accent/20 bg-accent/5';
      case 'success':
        return 'border-success/20 bg-success/5';
      case 'warning':
        return 'border-warning/20 bg-warning/5';
      case 'error':
        return 'border-error/20 bg-error/5';
      default:
        return 'border-base-300 bg-base-100';
    }
  };

  return (
    <div className={`card bg-base-100 border ${getVariantClasses()} shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="card-body p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-base-content/70 uppercase tracking-wide">
              {title}
            </h3>
            <div className="mt-2 flex items-baseline">
              <p className="text-2xl font-bold text-base-content">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              {trend && (
                <span className={`ml-2 text-sm font-medium ${
                  trend.isPositive ? 'text-success' : 'text-error'
                }`}>
                  {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-sm text-base-content/60">
                {subtitle}
              </p>
            )}
          </div>
          {icon && (
            <div className={`flex-shrink-0 ${
              variant === 'primary' ? 'text-primary' :
              variant === 'secondary' ? 'text-secondary' :
              variant === 'accent' ? 'text-accent' :
              variant === 'success' ? 'text-success' :
              variant === 'warning' ? 'text-warning' :
              variant === 'error' ? 'text-error' :
              'text-base-content/60'
            }`}>
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;