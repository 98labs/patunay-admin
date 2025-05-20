import { Button, FormField } from "@components";
import { ArtworkEntity, FormErrorsEntity } from "@typings";
import { Minus, Plus } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";

interface Props {
  artwork: ArtworkEntity;
  onDataChange: (data: { [key: string]: string[] }) => void;
  onPrev: () => Promise<void>;
  onNext: () => Promise<void>;
}

const Collector = ({ artwork, onDataChange, onPrev, onNext }: Props) => {
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

      onDataChange({ collectors: updated });

      return updated;
    });

    // Clear error on change
    const errorKey = `collectors-${index}`;
    setFormErrors((prev) => ({
      ...prev,
      [errorKey]: "",
    }));
  };

  const handleOnListItemClick = async (index: number) => {
    if (!formData[index].trim()) return;

    const isLastItem = index === formData.length - 1;

    if (isLastItem) setFormData([...formData, ""]);
    else if (formData.length > 1)
      setFormData(formData.filter((_, itemIndex) => itemIndex !== index));
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    formData.forEach((item, index) => {
      if (!item.trim()) {
        errors[`collectors-${index}`] = "This field is required.";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (artwork?.collectors && artwork.collectors.length > 0) {
      setFormData(artwork.collectors);
    }
  }, [artwork]);

  return (
    <div className="flex-2 h-fill flex flex-col justify-between gap-2">
      <div className="outline outline-neutral-gray-01 rounded-2xl flex flex-col gap-2 p-4">
        <h2 className="text-xl font-semibold">
          Enter the artwork's collectors
        </h2>
        {formData.map((item, index) => (
          <FormField
            key={index}
            isListItem={true}
            onListItemClick={() => handleOnListItemClick(index)}
            buttonIcon={index + 1 !== formData.length ? Minus : Plus}
            hint="Add the artwork's collector"
            value={item}
            error={formErrors[`collectors-${index}`]}
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

export default Collector;
