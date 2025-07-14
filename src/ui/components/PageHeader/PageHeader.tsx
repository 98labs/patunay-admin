interface Props {
  name?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}
const PageHeader = ({ name, title, subtitle, action, className = "" }: Props) => {
  const displayTitle = title || name;
  
  return (
    <div className={`mb-6 ${className}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-base-content dark:text-base-content">
            {displayTitle}
          </h2>
          {subtitle && (
            <p className="text-base-content/60 mt-1">{subtitle}</p>
          )}
        </div>
        {action && (
          <div className="ml-4">
            {action}
          </div>
        )}
      </div>
      <div className="border-b border-base-300 dark:border-base-300 mt-3"></div>
    </div>
  );
};

export default PageHeader;
