interface Props {
  className?: string;
  buttonType?: "primary" | "secondary";
  buttonLabel?: string;
  disabled?: boolean;
  onClick: () => void;
}

const Button = ({
  className,
  buttonType = "primary",
  buttonLabel = "Button",
  disabled = false,
  onClick,
}: Props) => {
  const btnType =
    buttonType === "primary" ? "btn-primary" : "btn-outline  btn-primary";
  const disabledBtn = disabled && "btn-disabled";

  return (
    <button
      className={`btn active:border-0 ${btnType} ${disabledBtn} ${className}`}
      onClick={onClick}
    >
      {buttonLabel}
    </button>
  );
};

export default Button;
