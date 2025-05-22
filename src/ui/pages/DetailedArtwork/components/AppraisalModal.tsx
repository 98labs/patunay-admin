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
        if (initialData) {
            setForm(initialData);
        }
    }, [initialData]);

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
    setForm(initialFormState);
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Add Appraisal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <div>
                <label className="label text-sm font-semibold">Condition</label>
                <input
                type="text"
                name="condition"
                value={form.condition}
                onChange={handleChange}
                className="input input-sm input-bordered w-full"
                />
            </div>
            <div>
                <label className="label text-sm font-semibold">Acquisition Cost</label>
                <input
                type="number"
                name="acquisitionCost"
                value={form.acquisitionCost}
                onChange={handleChange}
                className="input input-sm input-bordered w-full"
                />
            </div>
            <div>
                <label className="label text-sm font-semibold">Appraised Value</label>
                <input
                type="number"
                name="appraisedValue"
                value={form.appraisedValue}
                onChange={handleChange}
                className="input input-sm input-bordered w-full"
                />
            </div>
            <div>
                <label className="label text-sm font-semibold">Appraisal Date</label>
                <input
                type="date"
                name="appraisalDate"
                value={form.appraisalDate.split("T")[0]}
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
                value={form.artistInfo}
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
                value={form.recommendation}
                onChange={handleChange}
                className="input input-bordered w-full mb-2"
                />
            </>
            <>
                <label className="label">Notes</label>
                <textarea
                name="notes"
                placeholder="Notes"
                value={form.notes}
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
                <input
                    key={idx}
                    type="text"
                    value={ref}
                    onChange={(e) =>
                    handleArrayChange(idx, "recentAuctionReferences", e.target.value)
                    }
                    className="input input-bordered w-full"
                />
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
                <input
                    key={idx}
                    type="text"
                    value={a.name}
                    onChange={(e) =>
                    handleArrayChange(idx, "appraisedBy", e.target.value)
                    }
                    className="input input-bordered w-full"
                />
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
            {initialData ? "Save Changes" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
