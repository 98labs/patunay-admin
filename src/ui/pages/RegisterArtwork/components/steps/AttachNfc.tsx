import { Button } from "@components";
import { ArtworkEntity } from "@typings";
import { Nfc } from "lucide-react";
import { useEffect, useState } from "react";

import { updateArtwork } from "../../../../supabase/rpc/updateArtwork";
import { safeJsonParse } from "../../../Artworks/components/utils";
import { useNotification } from "../../../../hooks/useNotification";
import { useNfc } from "../../../../hooks/useNfc";
import { useNfcStatus } from "../../../../context/NfcStatusContext";

interface Props {
  data: ArtworkEntity;
  onUpdateArtwork: (result: ArtworkEntity) => void;
  onPrev: () => Promise<void>;
  onNext: () => Promise<void>;
}

interface WriteResult {
  success: boolean;
  message: string;
  data?: string;
  error?: string;
}

const AttachNfc = ({ data, onUpdateArtwork, onPrev, onNext }: Props) => {
  const [isAttaching, setIsAttaching] = useState(false);
  const { showError, showSuccess } = useNotification();
  const { isNfcAvailable, nfcFeaturesEnabled, deviceStatus } = useNfcStatus();
  const {
    isReaderConnected,
    isOperationActive,
    isScanning,
    isWriting,
    detectedCard,
    currentOperation,
    hasError,
    lastError,
    startWriteOperation,
    startReadOperation,
    cancelOperation,
    clearError,
    getOperationStatusText
  } = useNfc();

  const handleStartScanning = async () => {
    if (!nfcFeaturesEnabled) {
      showError("NFC features are not available. Please ensure your NFC reader is connected.", "NFC Not Available");
      return;
    }
    clearError();
    startReadOperation();
  };

  const handleAttachArtwork = async (options: {
    attachLater: boolean;
    tagId?: string;
  }) => {
    if (isAttaching) return;
    setIsAttaching(true);

    try {
      const result = await updateArtwork({ ...data!, tag_id: options.tagId });

      if (!result) {
        showError("Failed to attach artwork. Please try again.", "Attachment Error");
        return;
      }

      onUpdateArtwork({
        ...result[0],
        tag_id: options.tagId,
        bibliography: safeJsonParse(result[0].bibliography),
        collectors: safeJsonParse(result[0].collectors),
      });

      // Only attempt to write to NFC if features are enabled
      if (nfcFeaturesEnabled && !options.attachLater) {
        const writeData = data.id ?? "No Data";
        startWriteOperation(writeData);
      }

      await onNext();
    } catch (err) {
      console.error("Attach artwork error:", err);
    } finally {
      setIsAttaching(false);
    }
  };

  const handleAttachArtworkLater = async () => {
    onNext();
  };

  const handleOnPrev = async () => {
    if (isAttaching) return;

    onPrev();
  };

  // Handle NFC events through the state management system
  useEffect(() => {
    if (hasError && lastError) {
      showError(lastError.message, "NFC Error");
    }
  }, [hasError, lastError, showError]);

  useEffect(() => {
    if (detectedCard && !isAttaching && isOperationActive) {
      setIsAttaching(true);
      handleAttachArtwork({ attachLater: false, tagId: detectedCard.uid })
        .finally(() => setIsAttaching(false));
    }
  }, [detectedCard, isAttaching, isOperationActive]);

  useEffect(() => {
    if (currentOperation?.status === 'success' && currentOperation.type === 'write') {
      showSuccess("NFC tag written successfully!", "Write Complete");
    }
  }, [currentOperation, showSuccess]);

  return (
    <div className="flex-2 h-fill flex flex-col justify-between gap-2">
      <div className="outline border border-base-300 rounded-2xl flex flex-col items-center gap-2 p-24">
        <div className="flex flex-col justify-center align-middle gap-2">
          <Nfc className="w-40 h-50 m-auto text-base-content/90" />
          <p className="font-semibold">
            {!isNfcAvailable
              ? "NFC device not available"
              : !nfcFeaturesEnabled
                ? "NFC device initializing..."
                : currentOperation?.status === 'success'
                  ? "Success!"
                  : isScanning || isWriting
                    ? getOperationStatusText()
                    : isReaderConnected
                      ? "Ready to scan NFC tag"
                      : "Please connect the NFC reader device to your computer"}
          </p>
          
          {/* NFC device status indicator */}
          <div className={`text-sm ${nfcFeaturesEnabled ? 'text-green-600' : 'text-red-600'}`}>
            {nfcFeaturesEnabled 
              ? `✓ NFC Ready (${deviceStatus.readers.join(', ')})` 
              : isNfcAvailable 
                ? '⚠ NFC Initializing...' 
                : '✗ NFC Device Not Found'}
          </div>

          <Button
            onClick={handleStartScanning}
            buttonLabel={
              !nfcFeaturesEnabled ? "NFC Not Available" :
              isScanning ? "Scanning..." : 
              isWriting ? "Writing..." : 
              "Start scanning"
            }
            className={`transition-all ease-out duration-200 w-full font-light`}
            disabled={isOperationActive || !nfcFeaturesEnabled}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          className="flex-1"
          buttonType="secondary"
          buttonLabel="Back"
          disabled={isAttaching}
          onClick={handleOnPrev}
        />
        <Button
          buttonType="secondary"
          buttonLabel="Attach artwork to NFC tag later"
          disabled={isAttaching}
          onClick={handleAttachArtworkLater}
        />
      </div>
    </div>
  );
};

export default AttachNfc;
