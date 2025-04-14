import { Button, FormField } from "@components";
import { FormErrorsEntity, FormInputEntity, InputType } from "@typings";
import { Nfc, Smartphone } from "lucide-react";
import { ChangeEvent, useState } from "react";

interface Props {
  onDataChange: (data: { [key: string]: string }) => void;
  onPrev: () => void;
  onNext: () => void;
}

const Step6 = ({ onDataChange, onPrev, onNext }: Props) => {
  //   const [formData, setFormData] = useState({
  //     title: "",
  //     artist: "",
  //     description: "",
  //     medium: "",
  //     identifier: "",
  //     provenance: "",
  //   });
  //   type Step6Keys = keyof typeof formData;

  //   const [formErrors, setFormErrors] = useState<FormErrorsEntity<Step6Keys>>({});

  //   const artworkFormInputs: FormInputEntity[] = [
  //     {
  //       artworkId: "title",
  //       artworkLabel: "Title",
  //       hint: "Enter the title of the artwork",
  //       required: true,
  //     },
  //     {
  //       artworkId: "artist",
  //       artworkLabel: "Artist",
  //       hint: "Enter the artist's name",
  //       required: true,
  //     },
  //     {
  //       inputType: InputType.TextArea,
  //       artworkId: "description",
  //       artworkLabel: "Description",
  //       hint: "Enter the description of the artwork (optional)",
  //       required: false,
  //     },
  //     {
  //       artworkId: "medium",
  //       artworkLabel: "Medium",
  //       hint: "Enter the artwork's medium",
  //       required: true,
  //     },
  //     {
  //       artworkId: "identifier",
  //       artworkLabel: "Identifier",
  //       hint: "Enter its identifier",
  //       required: true,
  //     },
  //     {
  //       artworkId: "provenance",
  //       artworkLabel: "Provenance",
  //       hint: "Enter the artwork's provenance",
  //       required: true,
  //     },
  //   ];

  //   const validateForm = () => {
  //     const errors: { [key: string]: string } = {};

  //     artworkFormInputs.forEach(({ artworkId, required }) => {
  //       if (required && !formData[artworkId as keyof typeof formData].trim()) {
  //         errors[artworkId] = "This field is required.";
  //       }
  //     });

  //     setFormErrors(errors);
  //     return Object.keys(errors).length === 0;
  //   };

  //   const handleOnChange = (
  //     e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  //   ) => {
  //     const { name, value } = e.target;
  //     setFormData({ ...formData, [name]: value });
  //     setFormErrors((prev) => ({ ...prev, [name]: "" }));
  //     onDataChange({ [name]: value });
  //   };

  return (
    <div className="flex-2 h-fill flex flex-col justify-between">
      <div className="outline outline-neutral-gray-01 rounded-2xl flex flex-col items-center gap-2 p-24">
        <div className="flex">
          <Smartphone className="h-40 w-40 text-neutral-black-01" />
          <Nfc className="h-40 w-40 text-neutral-black-01" />
        </div>
        <div>
          <p className="font-medium">
            Please connect your NFC Reader device to your desktop.
          </p>
        </div>
        <div>
          <Button buttonLabel="Start scanning" onClick={() => {}} />
        </div>
      </div>
      <Button
        buttonType="secondary"
        buttonLabel="Add image later"
        onClick={onNext}
      />
    </div>
  );
};

export default Step6;
