import { InputType } from "@typings";
import { Button, RadioButton } from "@components";
import { ChangeEvent, memo } from "react";
import { LucideIcon, Plus } from "lucide-react";

interface Props {
  name?: string;
  isLabelVisible?: boolean;
  label?: string;
  isHintVisible?: boolean;
  hint?: string;
  value?: string;
  required?: boolean;
  error?: string;
  inputType?: InputType;
  items?: [string, string][];
  isListItem?: boolean;
  listButtonDisabled?: boolean;
  buttonIcon?: LucideIcon;
  disabled?: boolean;
  onListItemClick?: () => Promise<void>;
  onInputChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

const FormField = ({
  name,
  isLabelVisible = false,
  label = "Label",
  isHintVisible = true,
  hint = "Hint",
  required = false,
  inputType = InputType.Text,
  items = [],
  buttonIcon = Plus,
  disabled = false,
  listButtonDisabled = false,
  isListItem = false,
  onListItemClick,
  value,
  error,
  onInputChange,
}: Props) => {
  return (
    <div className="flex flex-col gap-2">
      {isLabelVisible && (
        <label className="fieldset-label gap-0.5 font-medium text-base text-base-content dark:text-base-content">
          {label}
          {required && <span className="text-error dark:text-error">*</span>}
        </label>
      )}
      {inputType === InputType.Radio ? (
        <RadioButton
          name={name ?? ""}
          items={items}
          value={value}
          onChange={onInputChange}
        />
      ) : (
        <div className="flex gap-2">
          <input
            name={name}
            type={inputType}
            className={`${isListItem && "flex-5/6"} input input-bordered w-full transition-all focus:outline-none focus:border-primary dark:focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:ring-primary/30 bg-base-100 dark:bg-base-200 text-base-content dark:text-base-content border-2 border-base-content/20 dark:border-base-content/30 hover:border-base-content/30 dark:hover:border-base-content/40 placeholder:text-base-content/50 dark:placeholder:text-base-content/60 disabled:opacity-50 disabled:cursor-not-allowed`}
            value={value}
            placeholder={isHintVisible ? hint : ""}
            onChange={onInputChange}
            disabled={disabled}
          />
          {isListItem && (
            <Button
              className="w-10 h-10 rounded-full text-lg"
              onClick={onListItemClick!}
              buttonLabel=""
              buttonIcon={buttonIcon}
              disabled={listButtonDisabled}
            />
          )}
        </div>
      )}

      {error && <span className="text-error dark:text-error text-sm font-medium">{error}</span>}
    </div>
  );
};

export default memo(FormField);
