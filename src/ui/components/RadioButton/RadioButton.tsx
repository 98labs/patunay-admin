import { ChangeEvent } from "react";

interface Props {
  name: string;
  items: [string, string][];
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

const RadioButton = ({ name, items, value, onChange }: Props) => {
  return items.map(([key, label], index) => (
    <span key={index} className="flex gap-3 items-center p-3 hover:bg-base-200 dark:hover:bg-base-200 rounded-lg transition-colors border border-transparent hover:border-base-300 dark:hover:border-base-300">
      <input
        type="radio"
        name={name}
        value={key}
        checked={value === key}
        className="transition-all radio radio-md shadow-none border-2 border-base-content/30 dark:border-base-content/50 checked:border-primary dark:checked:border-primary checked:bg-primary dark:checked:bg-primary bg-base-100 dark:bg-base-200 focus:border-primary dark:focus:border-primary"
        onChange={onChange}
      />
      <p className="text-base-content dark:text-base-content font-medium">{label}</p>
    </span>
  ));
};

export default RadioButton;
