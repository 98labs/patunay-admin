import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-error/10">
            <AlertTriangle className="h-6 w-6 text-error" />
          </div>
          <h3 className="font-bold text-lg">{title}</h3>
        </div>
        
        <p className="py-4 text-base-content/80">
          {message}
          {itemName && (
            <>
              <br />
              <span className="font-semibold mt-2 block">"{itemName}"</span>
            </>
          )}
        </p>
        
        <p className="text-sm text-error mt-2">
          This action cannot be undone.
        </p>
        
        <div className="modal-action">
          <button
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className="btn btn-error"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <span className="loading loading-spinner loading-sm" />}
            {confirmText}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};