import { Button, FormField } from "@components";
import {
  ArtworkEntity,
  FormErrorsEntity,
  FormInputEntity,
  InputType,
} from "@typings";
import { ChangeEvent, useEffect, useState } from "react";

interface Props {
  artwork: ArtworkEntity;
  onDataChange: (data: { [key: string]: string }) => void;
  onPrev: () => Promise<void>;
  onNext: () => Promise<void>;
}

const Info = ({ artwork, onDataChange, onPrev, onNext }: Props) => {
  const [formData, setFormData] = useState({
    title: "",
    artist: "",
    description: "",
    medium: "",
    idNumber: "",
    provenance: "",
  });

  type Step2Keys = keyof typeof formData;

  const [formErrors, setFormErrors] = useState<FormErrorsEntity<Step2Keys>>({});

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
      hint: "Enter the description of the artwork",
      required: true,
    },
    {
      artworkId: "medium",
      artworkLabel: "Medium",
      hint: "Enter the artwork's medium",
      required: true,
    },
    {
      artworkId: "idNumber",
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

  useEffect(() => {
    if (artwork) {
      setFormData({
        title: artwork.title || "",
        artist: artwork.artist || "",
        description: artwork.description || "",
        medium: artwork.medium || "",
        idNumber: artwork.idNumber || "",
        provenance: artwork.provenance || "",
      });
    }
  }, [artwork]);

  return (
    <div className="flex-2 h-fill flex flex-col justify-between gap-2">
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
                value={artwork[artworkId as Step2Keys]}
                error={formErrors[artworkId as Step2Keys]}
                required={required}
                isLabelVisible
                label={artworkLabel}
                hint={hint}
                inputType={inputType}
                onInputChange={handleOnChange}
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
          onClick={async () => {
            if (validateForm()) {
              onNext();
            }
          }}
        />
      </div>
    </div>
  );
};

export default Info;
