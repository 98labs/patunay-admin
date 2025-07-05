import { useEffect, useState } from "react";
import { Appraisal } from "../types";
import { AppraisalModalProps } from "./types";

const initialFormState = {
        condition: "",
        acquisitionCost: 0,
        appraisedValue: 0,
        artistInfo: "",
        recentAuctionReferences: [""],
        notes: "",
        recommendation: "",
        appraisalDate: new Date().toISOString(),
        appraisedBy: [{ name: "" }],
    }; 

export default function AppraisalModal({ isOpen, onClose, onSubmit, initialData }: AppraisalModalProps) {
  const [form, setForm] = useState<Appraisal>(initialData || initialFormState);

    useEffect(() => {
      if (isOpen) {
        if (initialData) {
          // Ensure all fields are properly loaded when editing
          const safeData = {
            ...initialData,
            condition: initialData.condition || "",
            acquisitionCost: initialData.acquisitionCost || 0,
            appraisedValue: initialData.appraisedValue || 0,
            artistInfo: initialData.artistInfo || initialData.artist_info || "",
            recentAuctionReferences: (initialData.recentAuctionReferences || initialData.recent_auction_references || []).length > 0 
              ? initialData.recentAuctionReferences || initialData.recent_auction_references 
              : [""],
            notes: initialData.notes || "",
            recommendation: initialData.recommendation || "",
            appraisalDate: initialData.appraisalDate || new Date().toISOString(),
            appraisedBy: initialData.appraisedBy && initialData.appraisedBy.length > 0 
              ? initialData.appraisedBy 
              : [{ name: "" }],
          };
          setForm(safeData);
        } else {
          // Reset to initial state when adding new
          setForm(initialFormState);
        }
      }
    }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleArrayChange = (
    index: number,
    field: "recentAuctionReferences" | "appraisedBy",
    value: string
  ) => {
    const updatedArray = [...form[field]];
    if (field === "appraisedBy") {
      (updatedArray as { name: string }[])[index] = { name: value };
    } else {
      (updatedArray as string[])[index] = value;
    }
    setForm({ ...form, [field]: updatedArray });
  };

  const addToArray = (field: "recentAuctionReferences" | "appraisedBy") => {
    const updatedArray =
      field === "appraisedBy"
        ? [...form.appraisedBy, { name: "" }]
        : [...form.recentAuctionReferences, ""];
    setForm({ ...form, [field]: updatedArray });
  };

  const removeFromArray = (index: number, field: "recentAuctionReferences" | "appraisedBy") => {
    const updatedArray = [...form[field]];
    updatedArray.splice(index, 1);
    
    // Ensure at least one empty item remains
    if (updatedArray.length === 0) {
      if (field === "appraisedBy") {
        updatedArray.push({ name: "" });
      } else {
        updatedArray.push("");
      }
    }
    
    setForm({ ...form, [field]: updatedArray });
  };

  const handleSubmit = () => {
    console.log('AppraisalModal: Submitting form data:', form);
    onSubmit({ ...form });
    // Don't close modal here - let the parent handle it after save
    // onClose();
    // setForm(initialFormState);
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">{initialData ? "Edit Appraisal" : "Add Appraisal"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <div>
                <label className="label text-sm font-semibold">Condition</label>
                <input
                type="text"
                name="condition"
                value={form.condition ?? ''}
                onChange={handleChange}
                className="input input-sm input-bordered w-full"
                />
            </div>
            <div>
                <label className="label text-sm font-semibold">Acquisition Cost</label>
                <input
                type="number"
                name="acquisitionCost"
                value={form.acquisitionCost ?? 0}
                onChange={handleChange}
                className="input input-sm input-bordered w-full"
                />
            </div>
            <div>
                <label className="label text-sm font-semibold">Appraised Value</label>
                <input
                type="number"
                name="appraisedValue"
                value={form.appraisedValue ?? 0}
                onChange={handleChange}
                className="input input-sm input-bordered w-full"
                />
            </div>
            <div>
                <label className="label text-sm font-semibold">Appraisal Date</label>
                <input
                type="date"
                name="appraisalDate"
                value={form.appraisalDate?.split("T")?.[0] || ""}
                onChange={(e) =>
                    setForm({ ...form, appraisalDate: new Date(e.target.value).toISOString() })
                }
                className="input input-sm input-bordered w-full"
                />
            </div>
        </div>

        <hr className="my-6" />
        <div className="space-y-4">
            <>
                <label className="label">Artist Info</label>
                <input
                type="text"
                name="artistInfo"
                placeholder="Artist Info"
                value={form.artistInfo ?? ''}
                onChange={handleChange}
                className="input input-bordered w-full mb-2"
                />
            </>
            <>
                <label className="label">Recommendation</label>
                <input
                type="text"
                name="recommendation"
                placeholder="Recommendation"
                value={form.recommendation ?? ''}
                onChange={handleChange}
                className="input input-bordered w-full mb-2"
                />
            </>
            <>
                <label className="label">Notes</label>
                <textarea
                name="notes"
                placeholder="Notes"
                value={form.notes ?? ''}
                onChange={handleChange}
                className="textarea textarea-bordered w-full mb-2"
                />
            </>
        </div>
        <hr className="my-6" />
        <div className="mb-6">
            <label className="label">Recent Auction References</label>
            <div className="space-y-2">
                {(form.recentAuctionReferences.length === 0 ? [""] : form.recentAuctionReferences).map((ref, idx) => (
                <div key={idx} className="flex gap-2">
                    <input
                        type="text"
                        value={ref}
                        onChange={(e) =>
                        handleArrayChange(idx, "recentAuctionReferences", e.target.value)
                        }
                        className="input input-bordered flex-1"
                        placeholder="Enter auction reference"
                    />
                    {(form.recentAuctionReferences.length > 1 || ref.trim() !== "") && (
                        <button
                            type="button"
                            className="btn btn-sm btn-error btn-outline"
                            onClick={() => removeFromArray(idx, "recentAuctionReferences")}
                            title="Remove this reference"
                        >
                            ✕
                        </button>
                    )}
                </div>
                ))}
            </div>
            <button
                type="button"
                className="btn btn-sm btn-outline mt-2"
                onClick={() => addToArray("recentAuctionReferences")}
            >
                + Add Auction Reference
            </button>
            </div>

            <div className="mb-6">
            <label className="label">Appraised By</label>
            <div className="space-y-2">
                {(form.appraisedBy.length === 0 ? [{ name: "" }] : form.appraisedBy).map((a, idx) => (
                <div key={idx} className="flex gap-2">
                    <input
                        type="text"
                        value={a.name}
                        onChange={(e) =>
                        handleArrayChange(idx, "appraisedBy", e.target.value)
                        }
                        className="input input-bordered flex-1"
                        placeholder="Enter appraiser name"
                    />
                    {(form.appraisedBy.length > 1 || a.name.trim() !== "") && (
                        <button
                            type="button"
                            className="btn btn-sm btn-error btn-outline"
                            onClick={() => removeFromArray(idx, "appraisedBy")}
                            title="Remove this appraiser"
                        >
                            ✕
                        </button>
                    )}
                </div>
                ))}
            </div>
            <button
                type="button"
                className="btn btn-sm btn-outline mt-2"
                onClick={() => addToArray("appraisedBy")}
            >
                + Add Appraiser
            </button>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-ghost"
            onClick={() => {
                setForm(initialFormState);
                onClose()
            }}>
                Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {initialData ? "Save Changes" : "Add Appraisal"}
          </button>
        </div>
      </div>
    </div>
  );
}
