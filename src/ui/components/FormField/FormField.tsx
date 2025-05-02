import { InputType } from "@typings";
import { Button, RadioButton } from "@components";
import { ChangeEvent } from "react";
import { Plus } from "lucide-react";

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
  onListItemClick?: () => void;
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
  isListItem = false,
  onListItemClick,
  value,
  error,
  onInputChange,
}: Props) => {
  return (
    <div className="flex flex-col gap-1">
      {isLabelVisible && (
        <label className="fieldset-label gap-0.5 font-medium text-base text-neutral-black-01">
          {label}
          {required && <span className="text-tertiary-red-200">*</span>}
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
            className={`${isListItem && "flex-5/6"} input w-full transition-all focus:outline-none focus:input-primary `}
            value={value}
            placeholder={isHintVisible ? hint : ""}
            onChange={onInputChange}
          />
          {isListItem && (
            <Button
              className="w-10 h-10 rounded-full text-lg"
              onClick={onListItemClick!}
              buttonLabel=""
              buttonIcon={Plus}
            />
          )}
        </div>
      )}

      {error && <span className="text-semantic-error text-sm">{error}</span>}
    </div>
  );
};

export default FormField;
