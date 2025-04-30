import { Button, FormField } from "@components";
import { ChangeEvent, useEffect, useState } from "react";
import {
  FormErrorsEntity,
  FormInputEntity,
  InputType,
  SizeUnit,
} from "@typings";

interface Props {
  onDataChange: (data: { [key: string]: string }) => void;
  onPrev: () => void;
  onNext: () => void;
}

const Step3 = ({ onDataChange, onPrev, onNext }: Props) => {
  const [formData, setFormData] = useState({
    sizeUnit: "",
    height: "",
    width: "",
  });
  type Step3Keys = keyof typeof formData;
  const [formErrors, setFormErrors] = useState<FormErrorsEntity<Step3Keys>>({});

  const artworkFormInputs: FormInputEntity[] = [
    {
      inputType: InputType.Radio,
      artworkId: "sizeUnit",
      artworkLabel: "Unit",
      hint: "Enter the size unit for the artwork",
      required: true,
    },
    {
      artworkId: "height",
      artworkLabel: "Height",
      hint: "Enter the artwork's height",
      required: true,
    },
    {
      artworkId: "width",
      artworkLabel: "Width",
      hint: "Enter the artwork's width",
      required: true,
    },
  ];

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    artworkFormInputs.forEach(({ artworkId, required }) => {
      if (required && !formData[artworkId as keyof typeof formData].trim()) {
        errors[artworkId] = "This field is required.";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOnChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
    onDataChange({ [name]: value });
  };

  return (
    <div className="flex-2 h-fill flex flex-col justify-between">
      <div className="outline outline-neutral-gray-01 rounded-2xl flex flex-col gap-2 p-4">
        <h2 className="text-xl font-semibold">Enter the artwork details</h2>
        <ul className="flex flex-col gap-2">
          {artworkFormInputs.map(
            ({
              inputType,
              artworkId,
              artworkLabel,
              hint,
              required,
            }: FormInputEntity) => (
              <FormField
                key={artworkId}
                name={artworkId}
                required={required}
                isLabelVisible={true}
                label={artworkLabel}
                hint={hint}
                inputType={inputType}
                value={formData[artworkId as Step3Keys]}
                items={artworkId === "sizeUnit" ? Object.entries(SizeUnit) : []}
                onInputChange={handleOnChange}
                error={formErrors[artworkId as Step3Keys]}
              />
            )
          )}
        </ul>
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

export default Step3;
