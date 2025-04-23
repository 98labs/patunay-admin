import { LucideIcon } from "lucide-react";

interface Props {
  className?: string;
  buttonType?: "primary" | "secondary";
  buttonLabel?: string;
  buttonIcon?: LucideIcon;
  disabled?: boolean;
  onClick: () => void;
}

const Button = ({
  className,
  buttonType = "primary",
  buttonLabel = "Button",
  buttonIcon: Icon,
  disabled = false,
  onClick,
}: Props) => {
  const btnType =
    buttonType === "primary" ? "btn-primary" : "btn-outline btn-primary";
  const disabledBtn = disabled && "btn-disabled";

  return (
    <button
      className={`btn active:border-0 ${btnType} ${disabledBtn} ${className}`}
      onClick={onClick}
    >
      {buttonLabel}
      {Icon && <Icon className="text-xl w-6 h-6 shrink-0" />}
    </button>
  );
};

export default Button;
