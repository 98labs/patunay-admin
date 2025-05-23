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
      className={`transition-all flex gap-2 p-2 justify-start items-center select-none ${className} ${active ? "scale-105 origin-left font-medium" : !complete ? "text-inactive-gray outline-inactive-gray" : ""}`}
      onClick={onClick}
    >
      <div
        className={`outline rounded-full w-6 h-6 flex justify-center items-center ${complete && !skip && "bg-semantic-success"} ${!complete && skip && "bg-semantic-warning"} ${(complete || skip) && "text-white"}`}
      >
        {complete ? (
          <span>
            <Check className="w-3" />
          </span>
        ) : (
          <span className={`text-xs m-auto`}>{stepNumber}</span>
        )}
      </div>
      <div className="text-xs my-auto">{stepName}</div>
    </div>
  );
};

export default FormStepTitle;
