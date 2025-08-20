import { Button } from '@components';

interface Props {
  title: string;
  description: string;
  buttonText?: string;
  textColor?: string;
  onButtonClick?: () => void;
  boxBgClass?: string;
  borderColorClass?: string;
  buttonBgClass?: string;
  buttonHoverBgClass?: string;
}

const ActionBox = ({
  title,
  description,
  buttonText,
  textColor = 'text-[var(--color-neutral-black-02)]',
  boxBgClass = 'bg-[var(--color-neutral-gray-01)]/50',
  borderColorClass = 'border-[var(--color-neutral-gray-02)]',
  buttonBgClass = 'bg-[var(--color-neutral-gray-02)]/80',
  buttonHoverBgClass = 'hover:bg-[var(--color-neutral-black-02)]/20',
  onButtonClick,
}: Props) => {
  return (
    <div
      className={`flex items-center justify-between gap-8 rounded-lg border-2 p-2 ${boxBgClass} ${borderColorClass}`}
    >
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p>{description}</p>
      </div>

      {buttonText && (
        <Button
          className={`border-none ${textColor} shadow-none ${buttonBgClass} ${buttonHoverBgClass}`}
          onClick={onButtonClick}
        >
          {buttonText}
        </Button>
      )}
    </div>
  );
};

export default ActionBox;
