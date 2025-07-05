interface Props {
  name: string;
  className?: string;
}
const PageHeader = ({ name, className = "" }: Props) => {
  return (
    <div className={`mb-6 ${className}`}>
      <h2 className="text-2xl font-semibold text-base-content dark:text-base-content border-b border-base-300 dark:border-base-300 pb-3">
        {name}
      </h2>
    </div>
  );
};

export default PageHeader;
