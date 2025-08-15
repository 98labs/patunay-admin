interface Props {
  name?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}
const PageHeader = ({ name, title, subtitle, action, className = '' }: Props) => {
  const displayTitle = title || name;

  return (
    <div className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-semibold text-[var(--color-page-header)] dark:text-[var(--color-page-header)]">
            {displayTitle}
          </h2>
          {subtitle && <p className="mt-1 text-[var(--color-page-header)]/60">{subtitle}</p>}
        </div>
        {action && <div className="ml-4">{action}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
