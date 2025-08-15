import { InputType } from '@typings';
import { Button, RadioButton } from '@components';
import { ChangeEvent, forwardRef, memo, useState } from 'react';
import { LucideIcon, Plus, Eye, EyeOff } from 'lucide-react';

interface Props {
  name?: string;
  isLabelVisible?: boolean;
  label?: string;
  isHintVisible?: boolean;
  hint?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
  error?: string;
  type?: InputType | 'textarea';
  inputType?: InputType;
  items?: [string, string][];
  isListItem?: boolean;
  listButtonDisabled?: boolean;
  buttonIcon?: LucideIcon;
  disabled?: boolean;
  rows?: number;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onListItemClick?: () => Promise<void>;
  onInputChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

const FormField = forwardRef<HTMLInputElement, Props>(
  (
    {
      name,
      isLabelVisible = true,
      label = 'Label',
      isHintVisible = false,
      hint = 'Hint',
      placeholder,
      required = false,
      type,
      inputType = InputType.Text,
      items = [],
      buttonIcon = Plus,
      disabled = false,
      listButtonDisabled = false,
      isListItem = false,
      onChange,
      onListItemClick,
      value,
      error,
      onInputChange,
    },
    ref
  ) => {
    // Use type if provided, otherwise fall back to inputType
    const fieldType = type || inputType;
    const [showPassword, setShowPassword] = useState(false);

    // Handle change events for both onChange and onInputChange
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(e);
      } else if (onInputChange && e.target instanceof HTMLInputElement) {
        onInputChange(e as ChangeEvent<HTMLInputElement>);
      }
    };

    // Determine the actual input type for password fields
    const actualInputType =
      fieldType === InputType.Password && showPassword ? InputType.Text : fieldType;

    return (
      <div className="flex flex-col gap-2">
        {isLabelVisible && (
          <label className="fieldset-label text-base-content dark:text-base-content gap-0.5 text-base font-medium">
            {label}
            {required && <span className="text-error dark:text-error">*</span>}
          </label>
        )}
        {fieldType === InputType.Radio ? (
          <RadioButton name={name ?? ''} items={items} value={value} onChange={onInputChange} />
        ) : (
          <div className="flex gap-2">
            <div className={`${isListItem && 'flex-5/6'} relative w-full`}>
              <input
                ref={ref}
                name={name}
                type={actualInputType}
                className="custom-form-input focus:border-primary dark:focus:border-primary focus:ring-primary/20 dark:focus:ring-primary/30 bg-base-100 dark:bg-base-200 text-base-content dark:text-base-content hover:border-base-content/30 dark:hover:border-base-content/40 w-full rounded-lg border-2 px-4 py-4 pr-10 transition-all focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                value={value}
                placeholder={placeholder || ''}
                onChange={handleChange}
                disabled={disabled}
              />
              {fieldType === InputType.Password && (
                <button
                  type="button"
                  className="text-base-content/50 hover:text-base-content/70 dark:text-base-content/60 dark:hover:text-base-content/80 focus:text-base-content/80 absolute top-1/2 right-3 -translate-y-1/2 transition-colors focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              )}
            </div>
            {isListItem && (
              <Button
                className="h-10 w-10 rounded-full text-lg"
                onClick={onListItemClick!}
                disabled={listButtonDisabled}
              />
            )}
          </div>
        )}

        {/* Debug: Show hint conditions */}
        {isHintVisible && hint && (
          <span className="text-base-content/60 dark:text-base-content/70 mt-1 text-sm">
            {hint}
          </span>
        )}

        {error && (
          <span className="text-error dark:text-error mt-1 text-sm font-medium">{error}</span>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default memo(FormField);
