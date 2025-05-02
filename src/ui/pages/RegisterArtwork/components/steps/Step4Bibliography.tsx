import { Button, FormField } from "@components";
import { ArtworkEntity, FormErrorsEntity } from "@typings";
import { ChangeEvent, useState } from "react";

interface Props {
  artwork: ArtworkEntity;
  onDataChange: (data: { [key: string]: string[] }) => void;
  onPrev: () => void;
  onNext: () => void;
}

const Step4 = ({ onDataChange, onPrev, onNext }: Props) => {
  const [formData, setFormData] = useState<string[]>([""]);
  const [formErrors, setFormErrors] = useState<FormErrorsEntity<string>>({});

  const handleOnChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    index: number
  ) => {
    const { value } = e.target;

    setFormData((prev) => {
      const updated = [...prev];
      updated[index] = value;

      onDataChange({ bibliography: updated });

      return updated;
    });

    // Clear error on change
    const errorKey = `bibliography-${index}`;
    setFormErrors((prev) => ({
      ...prev,
      [errorKey]: "",
    }));
  };

  const handleOnListItemClick = () => {
    setFormData([...formData, ""]);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    formData.forEach((item, index) => {
      if (!item.trim()) {
        errors[`bibliography-${index}`] = "This field is required.";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <div className="flex-2 h-fill flex flex-col justify-between">
      <div className="outline outline-neutral-gray-01 rounded-2xl flex flex-col gap-2 p-4">
        <h2 className="text-xl font-semibold">
          Enter the artwork's bibliography
        </h2>
        {formData.map((item, index) => (
          <FormField
            key={index}
            isListItem={true}
            hint="Add the artwork's bibliography"
            onListItemClick={handleOnListItemClick}
            value={item}
            error={formErrors[`bibliography-${index}`]}
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
            if (validateForm()) {
              onNext();
            }
          }}
        />
      </div>
    </div>
  );
};

export default Step4;
