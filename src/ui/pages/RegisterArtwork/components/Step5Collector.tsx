import { Button, FormField } from "@components";
import { ChangeEvent, useState } from "react";

interface Props {
  onDataChange: (data: { [key: string]: string[] }) => void;
  onPrev: () => void;
  onNext: () => void;
}

const Step5 = ({ onDataChange, onPrev, onNext }: Props) => {
  const [formData, setFormData] = useState<string[]>([""]);

  const handleOnChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => {
    const { value } = e.target;

    setFormData((prev) => {
      const updated = [...prev];
      updated[index] = value;

      onDataChange({ collectors: updated });

      return updated;
    });
  };

  const handleOnListItemClick = () => {
    setFormData([...formData, ""]);
  };

  return (
    <div className="flex-2 h-fill flex flex-col justify-between">
      <div className="outline outline-neutral-gray-01 rounded-2xl flex flex-col gap-2 p-4">
        <h2 className="text-xl font-semibold">Enter the artwork's collector</h2>
        {formData.map((item, index) => (
          <FormField
            key={index}
            isListItem={true}
            hint="Add the artwork's collector"
            onListItemClick={handleOnListItemClick}
            value={item}
            onInputChange={(e) => handleOnChange(e, index)}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          buttonType="secondary"
          buttonLabel="Back"
          onClick={onPrev}
        />
        <Button
          className="flex-1"
          buttonType="primary"
          buttonLabel="Continue"
          onClick={() => {
            // if (validateForm()) {
            onNext();
            // }
          }}
        />
      </div>
    </div>
  );
};

export default Step5;
