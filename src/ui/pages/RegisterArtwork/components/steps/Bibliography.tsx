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

const Bibliography = ({ artwork, onDataChange, onPrev, onNext }: Props) => {
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
        errors[`bibliography-${index}`] = "This field is required.";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (artwork?.bibliography && artwork.bibliography.length > 0) {
      setFormData(artwork.bibliography);
    }
  }, [artwork]);

  return (
    <div className="flex-2 h-fill flex flex-col justify-between gap-6 p-6 bg-base-100 dark:bg-base-100">
      <div className="border border-base-300 dark:border-base-300 rounded-xl flex flex-col gap-4 p-6 bg-base-200 dark:bg-base-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <span className="text-primary dark:text-primary font-bold text-sm">3</span>
          </div>
          <h2 className="text-xl font-semibold text-base-content dark:text-base-content">
            Enter the artwork's bibliography
          </h2>
        </div>
        
        <div className="space-y-3">
          {formData.map((item, index) => {
            const isLastItem = index + 1 === formData.length;
            const canRemove = formData.length > 1;
            
            return (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <FormField
                    hint={`Bibliography entry ${index + 1}`}
                    value={item}
                    error={formErrors[`bibliography-${index}`]}
                    onInputChange={(e) => handleOnChange(e, index)}
                  />
                </div>
                
                <div className="flex gap-2 mt-0">
                  {isLastItem ? (
                    // Add button for the last item
                    <button
                      type="button"
                      onClick={() => handleOnListItemClick(index)}
                      disabled={!formData[index]?.trim()}
                      className="btn btn-circle btn-sm btn-primary dark:btn-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                      title="Add new bibliography entry"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  ) : (
                    // Remove button for existing items
                    <button
                      type="button"
                      onClick={() => handleOnListItemClick(index)}
                      disabled={!canRemove}
                      className="btn btn-circle btn-sm btn-error dark:btn-error disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105"
                      title="Remove this bibliography entry"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="text-sm text-base-content/60 dark:text-base-content/60 mt-2">
          <p>💡 Add multiple bibliography entries for this artwork. Click the + button to add more entries.</p>
        </div>
      </div>
      
      <div className="flex gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={onPrev}
        >
          Back
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={async () => {
            if (validateForm()) {
              onNext();
            }
          }}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default Bibliography;
