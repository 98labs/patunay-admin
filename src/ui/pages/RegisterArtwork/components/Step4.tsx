import { Button, FormField } from "@components";
import { FormErrorsEntity, FormInputEntity, InputType } from "../../../typings";
import { ChangeEvent, useState } from "react";

interface Props {
  onDataChange: (data: { [key: string]: string }) => void;
  onPrev: () => void;
  onNext: () => void;
}

const Step4 = ({ onDataChange, onPrev, onNext }: Props) => {
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    description: "",
    medium: "",
    identifier: "",
    provenance: "",
  });
  type Step4Keys = keyof typeof formData;

  const [formErrors, setFormErrors] = useState<FormErrorsEntity<Step4Keys>>({});

  const artworkFormInputs: FormInputEntity[] = [
    {
      artworkId: "title",
      artworkLabel: "Title",
      hint: "Enter the title of the artwork",
      required: true,
    },
    {
      artworkId: "artist",
      artworkLabel: "Artist",
      hint: "Enter the artist's name",
      required: true,
    },
    {
      inputType: InputType.TextArea,
      artworkId: "description",
      artworkLabel: "Description",
      hint: "Enter the description of the artwork (optional)",
      required: false,
    },
    {
      artworkId: "medium",
      artworkLabel: "Medium",
      hint: "Enter the artwork's medium",
      required: true,
    },
    {
      artworkId: "identifier",
      artworkLabel: "Identifier",
      hint: "Enter its identifier",
      required: true,
    },
    {
      artworkId: "provenance",
      artworkLabel: "Provenance",
      hint: "Enter the artwork's provenance",
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
        <h2 className="text-xl font-semibold">
          Enter the artwork's bibliography
        </h2>
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
                onInputChange={handleOnChange}
                error={formErrors[artworkId as Step4Keys]}
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

export default Step4;
