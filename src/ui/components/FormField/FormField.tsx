import { InputType } from "../../typings"
import { RadioButton } from "@components";
import { ChangeEvent } from "react";

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
        <input
          name={name}
          type={inputType}
          className="input w-full transition-all focus:outline-none focus:input-primary"
          placeholder={isHintVisible ? hint : ""}
          onChange={onInputChange}
        />
      )}

      {error && <span className="text-semantic-error text-sm">{error}</span>}
    </div>
  );
};

export default FormField;
