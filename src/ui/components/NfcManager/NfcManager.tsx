import { useEffect, useState } from 'react';
import { useNfc } from '../../hooks/useNfc';
import { NfcModeEntity } from '../../typings/enums/nfcEnum';

interface NfcManagerProps {
  onCardDetected?: (cardData: { uid: string; data?: string }) => void;
  onWriteComplete?: (result: { success: boolean; message: string }) => void;
  onError?: (error: string) => void;
  className?: string;
}

const NfcManager = ({ 
  onCardDetected, 
  onWriteComplete, 
  onError, 
  className = '' 
}: NfcManagerProps) => {
  const {
    nfcStatus,
    currentOperation,
    detectedCard,
    isReaderConnected,
    isOperationActive,
    isScanning,
    isWriting,
    isCardPresent,
    hasError,
    lastError,
    startReadOperation,
    startWriteOperation,
    cancelOperation,
    clearError,
    getOperationStatusText
  } = useNfc();

  const [writeData, setWriteData] = useState('');
  const [showWriteInput, setShowWriteInput] = useState(false);

  // Handle external callbacks
  useEffect(() => {
    if (detectedCard && onCardDetected) {
      onCardDetected({
        uid: detectedCard.uid,
        data: detectedCard.data
      });
    }
  }, [detectedCard, onCardDetected]);

  useEffect(() => {
    if (currentOperation?.status === 'success' && currentOperation.type === 'write' && onWriteComplete) {
      onWriteComplete({
        success: true,
        message: 'Write operation completed successfully'
      });
    }
  }, [currentOperation, onWriteComplete]);

  useEffect(() => {
    if (hasError && onError) {
      onError(lastError?.message || 'Unknown NFC error');
    }
  }, [hasError, lastError, onError]);

  const handleStartRead = () => {
    clearError();
    startReadOperation();
  };

  const handleStartWrite = () => {
    if (!writeData.trim()) {
      return;
    }
    
    clearError();
    startWriteOperation(writeData.trim());
    setShowWriteInput(false);
    setWriteData('');
  };

  const handleCancelOperation = () => {
    cancelOperation();
    setShowWriteInput(false);
    setWriteData('');
  };

  const getStatusColor = () => {
    if (hasError) return 'text-error';
    if (isWriting || isScanning) return 'text-warning';
    if (isCardPresent) return 'text-success';
    if (isReaderConnected) return 'text-info';
    return 'text-base-content';
  };

  const getConnectionIndicator = () => {
    if (!isReaderConnected) {
      return (
        <div className="flex items-center gap-2 text-error">
          <div className="w-2 h-2 bg-error rounded-full"></div>
          <span className="text-sm">Reader Disconnected</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-success">
        <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
        <span className="text-sm">Reader Connected</span>
      </div>
    );
  };

  return (
    <div className={`card bg-base-100 shadow-xl ${className}`}>
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h2 className="card-title">NFC Manager</h2>
          {getConnectionIndicator()}
        </div>

        {/* Status Display */}
        <div className="alert alert-info">
          <div className="flex items-center gap-2">
            {(isScanning || isWriting) && (
              <span className="loading loading-spinner loading-sm"></span>
            )}
            <span className={getStatusColor()}>{getOperationStatusText()}</span>
          </div>
        </div>

        {/* Error Display */}
        {hasError && (
          <div className="alert alert-error">
            <div className="flex items-center justify-between w-full">
              <span>{lastError?.message}</span>
              <button className="btn btn-sm btn-ghost" onClick={clearError}>
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Card Information */}
        {isCardPresent && (
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <h3 className="text-sm font-semibold">Detected Card</h3>
              <div className="space-y-1 text-sm">
                <div><strong>UID:</strong> {detectedCard?.uid}</div>
                {detectedCard?.data && (
                  <div><strong>Data:</strong> {detectedCard.data}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Current Operation Info */}
        {currentOperation && (
          <div className="card bg-base-200">
            <div className="card-body p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {currentOperation.type === 'write' ? 'Writing' : 'Reading'}
                </h3>
                {currentOperation.progress !== undefined && (
                  <span className="text-xs">{currentOperation.progress}%</span>
                )}
              </div>
              {currentOperation.progress !== undefined && (
                <progress 
                  className="progress progress-primary w-full" 
                  value={currentOperation.progress} 
                  max="100"
                ></progress>
              )}
              {currentOperation.dataToWrite && (
                <div className="text-xs text-base-content/70">
                  Data: {currentOperation.dataToWrite}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Write Input */}
        {showWriteInput && (
          <div className="space-y-3">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Data to write:</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-20 resize-none"
                placeholder="Enter data to write to NFC card..."
                value={writeData}
                onChange={(e) => setWriteData(e.target.value)}
                maxLength={64} // NFC card limitation
              />
              <label className="label">
                <span className="label-text-alt">{writeData.length}/64 characters</span>
              </label>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="card-actions justify-end">
          {isOperationActive ? (
            <button 
              className="btn btn-error btn-sm" 
              onClick={handleCancelOperation}
            >
              Cancel
            </button>
          ) : (
            <>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={handleStartRead}
                disabled={!isReaderConnected}
              >
                Read Card
              </button>
              
              {showWriteInput ? (
                <>
                  <button 
                    className="btn btn-ghost btn-sm" 
                    onClick={() => {
                      setShowWriteInput(false);
                      setWriteData('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={handleStartWrite}
                    disabled={!writeData.trim() || !isReaderConnected}
                  >
                    Write to Card
                  </button>
                </>
              ) : (
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setShowWriteInput(true)}
                  disabled={!isReaderConnected}
                >
                  Write Card
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NfcManager;