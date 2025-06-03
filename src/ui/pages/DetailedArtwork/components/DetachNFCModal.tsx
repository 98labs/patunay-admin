import { useState } from 'react';
import { Button } from '@components';

interface DetachNFCModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworkId: string;
  tagId: string;
  onDetachSuccess: () => void;
}

export default function DetachNFCModal({ 
  isOpen, 
  onClose, 
  artworkId, 
  tagId,
  onDetachSuccess 
}: DetachNFCModalProps) {
  const [isDetaching, setIsDetaching] = useState(false);

  const handleDetach = async () => {
    setIsDetaching(true);
    onDetachSuccess();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <button 
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" 
          onClick={onClose}
          disabled={isDetaching}
        >
          ✕
        </button>
        
        <h3 className="font-bold text-lg mb-4">Detach NFC Tag</h3>
        
        <p className="text-gray-600 mb-2">
          Are you sure you want to detach the NFC tag from this artwork?
        </p>
        
        <div className="bg-gray-100 p-3 rounded-md mb-4">
          <p className="text-sm">
            <strong>NFC Tag ID:</strong> {tagId}
          </p>
        </div>
        
        <p className="text-sm text-warning mb-6">
          This action will remove the association between this artwork and the NFC tag. 
          The tag can be reattached to this or another artwork later.
        </p>

        <div className="modal-action">
          <Button
            buttonType="secondary"
            buttonLabel="Cancel"
            onClick={onClose}
            disabled={isDetaching}
          />
          <Button
            buttonType="primary"
            buttonLabel={isDetaching ? "Detaching..." : "Detach NFC Tag"}
            onClick={handleDetach}
            disabled={isDetaching}
            className="btn-error"
          />
        </div>
      </div>
    </div>
  );
}