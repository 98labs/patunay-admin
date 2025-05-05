import { LucideIcon } from "lucide-react";
import { useState } from "react";

interface Props {
  className?: string;
  buttonType?: "primary" | "secondary";
  buttonLabel?: string;
  buttonIcon?: LucideIcon;
  disabled?: boolean;
  loadingIsEnabled?: boolean;
  onClick: () => Promise<void>;
}

const Button = ({
  className,
  buttonType = "primary",
  buttonLabel = "Button",
  buttonIcon: Icon,
  disabled = false,
  loadingIsEnabled = true,
  onClick,
}: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const btnType =
    buttonType === "primary" ? "btn-primary" : "btn-outline btn-primary";
  const disabledBtn = disabled && "opacity-50 cursor-not-allowed";

  const handleOnClick = async () => {
    setIsLoading(true);
    try {
      onClick();
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`btn active:border-0 ${btnType} ${disabledBtn} ${className}`}
      onClick={handleOnClick}
    >
      {loadingIsEnabled && isLoading ? (
        <span className="loading loading-spinner" />
      ) : (
        buttonLabel
      )}
      {Icon && <Icon className="text-xl w-6 h-6 shrink-0" />}
    </button>
  );
};

export default Button;
