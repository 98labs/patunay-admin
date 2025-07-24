import { useState, useEffect } from "react";
import { ArtworkType } from "../types";
import { FormField, Button } from "@components";
import { InputType } from "@typings";

interface EditArtworkModalProps {
  isOpen: boolean;
  onClose: () => void;
  artwork: ArtworkType;
  onSave: (updatedArtwork: Partial<ArtworkType>) => Promise<void>;
}

export default function EditArtworkModal({ isOpen, onClose, artwork, onSave }: EditArtworkModalProps) {
  const [formData, setFormData] = useState<{
    title: string;
    artist: string;
    description: string;
    medium: string;
    id_number: string;
    provenance: string;
    height: number;
    width: number;
    year: string;
    bibliography: string[];
    collectors: string[];
  }>({
    title: "",
    artist: "",
    description: "",
    medium: "",
    id_number: "",
    provenance: "",
    height: 0,
    width: 0,
    year: "",
    bibliography: [""],
    collectors: [""],
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && artwork) {
      setFormData({
        title: artwork.title || "",
        artist: artwork.artist || "",
        description: artwork.description || "",
        medium: artwork.medium || "",
        id_number: artwork.id_number || "",
        provenance: artwork.provenance || "",
        height: artwork.height || 0,
        width: artwork.width || 0,
        year: artwork.year || "",
        bibliography: artwork.bibliography && artwork.bibliography.length > 0 ? artwork.bibliography : [""],
        collectors: artwork.collectors && artwork.collectors.length > 0 ? artwork.collectors : [""],
      });
      setFormErrors({});
    }
  }, [isOpen, artwork]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'height' || name === 'width' ? Number(value) : value
    }));
    setFormErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleArrayChange = (index: number, field: 'bibliography' | 'collectors', value: string) => {
    const updatedArray = [...formData[field]];
    updatedArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: updatedArray }));
  };

  const addToArray = (field: 'bibliography' | 'collectors') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const removeFromArray = (index: number, field: 'bibliography' | 'collectors') => {
    const updatedArray = [...formData[field]];
    updatedArray.splice(index, 1);
    
    // Ensure at least one empty item remains
    if (updatedArray.length === 0) {
      updatedArray.push("");
    }
    
    setFormData(prev => ({ ...prev, [field]: updatedArray }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.artist.trim()) errors.artist = "Artist is required";
    if (!formData.description.trim()) errors.description = "Description is required";
    if (!formData.id_number.trim()) errors.id_number = "ID Number is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      // Filter out empty items from arrays
      const dataToSave = {
        ...formData,
        bibliography: formData.bibliography.filter(item => item.trim() !== ""),
        collectors: formData.collectors.filter(item => item.trim() !== ""),
      };
      
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error("Failed to save artwork:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const artworkFormInputs = [
    {
      name: "title",
      label: "Title",
      hint: "Enter the title of the artwork",
      required: true,
    },
    {
      name: "artist",
      label: "Artist",
      hint: "Enter the artist's name",
      required: true,
    },
    {
      inputType: InputType.TextArea,
      name: "description",
      label: "Description",
      hint: "Enter the description of the artwork",
      required: true,
    },
    {
      name: "medium",
      label: "Medium",
      hint: "Enter the artwork's medium",
      required: false,
    },
    {
      name: "id_number",
      label: "ID Number",
      hint: "Enter the ID number",
      required: true,
    },
    {
      name: "provenance",
      label: "Provenance",
      hint: "Enter the artwork's provenance",
      required: false,
    },
    {
      name: "year",
      label: "Year",
      hint: "Enter the year created",
      required: false,
    },
  ];

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Artwork</h2>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {artworkFormInputs.map((input) => (
            <FormField
              key={input.name}
              name={input.name}
              value={formData[input.name as keyof typeof formData]}
              error={formErrors[input.name]}
              required={input.required}
              isLabelVisible
              label={input.label}
              hint={input.hint}
              inputType={input.inputType}
              onInputChange={handleChange}
            />
          ))}
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              name="height"
              value={formData.height}
              error={formErrors.height}
              isLabelVisible
              label="Height (cm)"
              hint="Enter the height in cm"
              inputType={InputType.Number}
              onInputChange={handleChange}
            />
            <FormField
              name="width"
              value={formData.width}
              error={formErrors.width}
              isLabelVisible
              label="Width (cm)"
              hint="Enter the width in cm"
              inputType={InputType.Number}
              onInputChange={handleChange}
            />
          </div>
          
          {/* Bibliography Section */}
          <div className="space-y-2">
            <label className="label">
              <span className="label-text font-semibold">Bibliography</span>
            </label>
            {formData.bibliography.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleArrayChange(idx, 'bibliography', e.target.value)}
                  className="input input-bordered flex-1"
                  placeholder="Enter bibliography reference"
                />
                {(formData.bibliography.length > 1 || item.trim() !== "") && (
                  <button
                    type="button"
                    className="btn btn-sm btn-error btn-outline"
                    onClick={() => removeFromArray(idx, 'bibliography')}
                    title="Remove this reference"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => addToArray('bibliography')}
            >
              + Add Bibliography Reference
            </button>
          </div>

          {/* Collectors Section */}
          <div className="space-y-2">
            <label className="label">
              <span className="label-text font-semibold">Collectors</span>
            </label>
            {formData.collectors.map((collector, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={collector}
                  onChange={(e) => handleArrayChange(idx, 'collectors', e.target.value)}
                  className="input input-bordered flex-1"
                  placeholder="Enter collector name"
                />
                {(formData.collectors.length > 1 || collector.trim() !== "") && (
                  <button
                    type="button"
                    className="btn btn-sm btn-error btn-outline"
                    onClick={() => removeFromArray(idx, 'collectors')}
                    title="Remove this collector"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-sm btn-outline"
              onClick={() => addToArray('collectors')}
            >
              + Add Collector
            </button>
          </div>
        </div>

        <div className="modal-action">
          <Button
            buttonType="secondary"
            buttonLabel="Cancel"
            onClick={onClose}
            disabled={isSubmitting}
          />
          <Button
            buttonType="primary"
            buttonLabel={isSubmitting ? "Saving..." : "Save Changes"}
            onClick={handleSubmit}
            disabled={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}