import { ChangeEvent } from "react";

interface Props {
  name: string;
  items: [string, string][];
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

const RadioButton = ({ name, items, value, onChange }: Props) => {
  return items.map(([key, label], index) => (
    <span key={index} className="flex gap-3 items-center p-3 rounded-lg">
      <input
        type="radio"
        name={name}
        value={key}
        checked={value === key}
        className="custom-radio"
        onChange={onChange}
      />
      <p className="text-base-content dark:text-base-content font-medium">{label}</p>
    </span>
  ));
};

export default RadioButton;
