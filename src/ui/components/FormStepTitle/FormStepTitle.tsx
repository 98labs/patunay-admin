import { Check } from "lucide-react";

interface Props {
  className?: string;
  stepNumber: string;
  stepName: string;
  active?: boolean;
  complete?: boolean;
  skip?: boolean;
  onClick?: () => void;
}

const FormStepTitle = ({
  className,
  stepNumber,
  stepName,
  active = false,
  complete = false,
  skip = false,
  onClick,
}: Props) => {
  return (
    <div
      className={`transition-all flex gap-3 p-3 justify-start items-center select-none ${className} ${
        active 
          ? "scale-105 origin-left font-medium bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border-l-4 border-primary" 
          : !complete 
            ? "text-base-content/60 dark:text-base-content/60" 
            : "text-base-content dark:text-base-content"
      }`}
      onClick={onClick}
    >
      <div
        className={`border-2 rounded-full w-8 h-8 flex justify-center items-center font-medium transition-colors ${
          complete && !skip 
            ? "bg-success dark:bg-success text-success-content dark:text-success-content border-success dark:border-success" 
            : !complete && skip 
              ? "bg-warning dark:bg-warning text-warning-content dark:text-warning-content border-warning dark:border-warning"
              : active
                ? "bg-primary dark:bg-primary text-primary-content dark:text-primary-content border-primary dark:border-primary"
                : "border-base-300 dark:border-base-300 text-base-content dark:text-base-content"
        }`}
      >
        {complete && !skip ? (
          <Check className="w-4 h-4" />
        ) : skip ? (
          <span className="text-xs font-bold">!</span>
        ) : (
          <span className="text-xs font-bold">{stepNumber}</span>
        )}
      </div>
      <div className={`text-sm font-medium ${active ? "text-primary dark:text-primary" : ""}`}>
        {stepName}
      </div>
    </div>
  );
};

export default FormStepTitle;
