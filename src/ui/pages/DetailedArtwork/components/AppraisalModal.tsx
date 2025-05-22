import { useState } from "react";
import { Appraisal } from "../types";

interface AppraisalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Appraisal) => void;
}

export default function AppraisalModal({ isOpen, onClose, onSubmit }: AppraisalModalProps) {
  const [form, setForm] = useState<Appraisal>({
    id: Date.now().toString(),
    condition: "",
    acquisitionCost: 0,
    appraisedValue: 0,
    artistInfo: "",
    recentAuctionReferences: [],
    notes: "",
    recommendation: "",
    appraisalDate: new Date().toISOString(),
    appraisedBy: [],
  });

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

  const handleSubmit = () => {
    onSubmit({ ...form });
    onClose();
    setForm({
      id: Date.now().toString(),
      condition: "",
      acquisitionCost: 0,
      appraisedValue: 0,
      artistInfo: "",
      recentAuctionReferences: [],
      notes: "",
      recommendation: "",
      appraisalDate: new Date().toISOString(),
      appraisedBy: [],
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-5xl w-full">
        <h2 className="text-lg font-bold mb-4">Add Appraisal</h2>

        <input
          type="text"
          name="condition"
          placeholder="Condition"
          value={form.condition}
          onChange={handleChange}
          className="input input-bordered w-full mb-2"
        />
        <input
          type="number"
          name="acquisitionCost"
          placeholder="Acquisition Cost"
          value={form.acquisitionCost}
          onChange={handleChange}
          className="input input-bordered w-full mb-2"
        />
        <input
          type="number"
          name="appraisedValue"
          placeholder="Appraised Value"
          value={form.appraisedValue}
          onChange={handleChange}
          className="input input-bordered w-full mb-2"
        />
        <input
          type="text"
          name="artistInfo"
          placeholder="Artist Info"
          value={form.artistInfo}
          onChange={handleChange}
          className="input input-bordered w-full mb-2"
        />
        <input
          type="text"
          name="recommendation"
          placeholder="Recommendation"
          value={form.recommendation}
          onChange={handleChange}
          className="input input-bordered w-full mb-2"
        />
        <input
          type="date"
          name="appraisalDate"
          value={form.appraisalDate.split("T")[0]}
          onChange={(e) =>
            setForm({ ...form, appraisalDate: new Date(e.target.value).toISOString() })
          }
          className="input input-bordered w-full mb-2"
        />

        <label className="block font-semibold mt-4 mb-1">Recent Auction References</label>
        {form.recentAuctionReferences.map((ref, idx) => (
          <input
            key={idx}
            type="text"
            value={ref}
            onChange={(e) => handleArrayChange(idx, "recentAuctionReferences", e.target.value)}
            className="input input-bordered w-full mb-1"
          />
        ))}
        <button className="btn btn-sm btn-outline mb-2" onClick={() => addToArray("recentAuctionReferences")}>
          + Add Auction Reference
        </button>

        <label className="block font-semibold mt-4 mb-1">Appraised By</label>
        {form.appraisedBy.map((a, idx) => (
          <input
            key={idx}
            type="text"
            value={a.name}
            onChange={(e) => handleArrayChange(idx, "appraisedBy", e.target.value)}
            className="input input-bordered w-full mb-1"
          />
        ))}
        <button className="btn btn-sm btn-outline mb-4" onClick={() => addToArray("appraisedBy")}>
          + Add Appraiser
        </button>

        <textarea
          name="notes"
          placeholder="Notes"
          value={form.notes}
          onChange={handleChange}
          className="textarea textarea-bordered w-full mb-2"
        />

        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
