import React from "react";
import { format } from "date-fns";
import { Appraisal } from "../types";

interface ViewAppraisalModalProps {
  isOpen: boolean;
  onClose: () => void;
  appraisal: Appraisal | null;
  onEdit?: () => void;
  canEdit?: boolean;
}

export default function ViewAppraisalModal({
  isOpen,
  onClose,
  appraisal,
  onEdit,
  canEdit = false,
}: ViewAppraisalModalProps) {
  if (!isOpen || !appraisal) return null;

  const formatCurrency = (value: number | undefined) => {
    if (!value && value !== 0) return "—";
    return `$${value.toLocaleString()}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "—";
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch {
      return "—";
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">View Appraisal</h2>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label text-sm font-semibold text-base-content/70">
                Condition
              </label>
              <p className="text-base">{appraisal.condition || "—"}</p>
            </div>
            <div>
              <label className="label text-sm font-semibold text-base-content/70">
                Appraisal Date
              </label>
              <p className="text-base">{formatDate(appraisal.appraisalDate)}</p>
            </div>
            <div>
              <label className="label text-sm font-semibold text-base-content/70">
                Acquisition Cost
              </label>
              <p className="text-base">{formatCurrency(appraisal.acquisitionCost)}</p>
            </div>
            <div>
              <label className="label text-sm font-semibold text-base-content/70">
                Appraised Value
              </label>
              <p className="text-base font-semibold">
                {formatCurrency(appraisal.appraisedValue)}
              </p>
            </div>
          </div>

          <div className="divider"></div>

          {/* Detailed Information */}
          <div className="space-y-4">
            {appraisal.artistInfo && (
              <div>
                <label className="label text-sm font-semibold text-base-content/70">
                  Artist Information
                </label>
                <p className="text-base whitespace-pre-wrap">{appraisal.artistInfo}</p>
              </div>
            )}

            {appraisal.recommendation && (
              <div>
                <label className="label text-sm font-semibold text-base-content/70">
                  Recommendation
                </label>
                <p className="text-base whitespace-pre-wrap">{appraisal.recommendation}</p>
              </div>
            )}

            {appraisal.notes && (
              <div>
                <label className="label text-sm font-semibold text-base-content/70">
                  Notes
                </label>
                <p className="text-base whitespace-pre-wrap">{appraisal.notes}</p>
              </div>
            )}

            {appraisal.recentAuctionReferences && appraisal.recentAuctionReferences.length > 0 && (
              <div>
                <label className="label text-sm font-semibold text-base-content/70">
                  Recent Auction References
                </label>
                <ul className="list-disc list-inside space-y-1">
                  {appraisal.recentAuctionReferences.map((ref, idx) => (
                    <li key={idx} className="text-base">
                      {ref}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {appraisal.appraisedBy && appraisal.appraisedBy.length > 0 && (
              <div>
                <label className="label text-sm font-semibold text-base-content/70">
                  Appraised By
                </label>
                <ul className="list-disc list-inside space-y-1">
                  {appraisal.appraisedBy.map((appraiser, idx) => (
                    <li key={idx} className="text-base">
                      {appraiser.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            Close
          </button>
          {canEdit && onEdit && (
            <button className="btn btn-primary" onClick={onEdit}>
              Edit Appraisal
            </button>
          )}
        </div>
      </div>
    </div>
  );
}