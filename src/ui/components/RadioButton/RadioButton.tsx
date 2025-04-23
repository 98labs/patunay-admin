import { ChangeEvent } from "react";

interface Props {
  name: string;
  items: [string, string][];
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

const RadioButton = ({ name, items, value, onChange }: Props) => {
  return items.map(([key, label], index) => (
    <span key={index} className="flex gap-2 items-center p-2">
      <input
        type="radio"
        name={name}
        value={key}
        checked={value === key}
        className="transition-all radio radio-sm shadow-none border-2 border-neutral-black-02 checked:radio-primary"
        onChange={onChange}
      />
      <p>{label}</p>
    </span>
  ));
};

export default RadioButton;
