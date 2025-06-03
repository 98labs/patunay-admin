import { useEffect, useState } from "react";
import { Modal } from "@components";

interface AttachNFCModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworkId: string;
  onSuccess: (tagId: string) => void;
}

type AttachStep = 
  | 'initializing'
  | 'waiting_for_tag'
  | 'reading_tag'
  | 'writing_tag'
  | 'saving_to_db'
  | 'verifying'
  | 'complete'
  | 'error';

interface StepInfo {
  label: string;
  description: string;
  icon: string;
}

const STEP_INFO: Record<AttachStep, StepInfo> = {
  initializing: {
    label: 'Initializing NFC Reader',
    description: 'Setting up NFC communication...',
    icon: '🔌'
  },
  waiting_for_tag: {
    label: 'Waiting for NFC Tag',
    description: 'Please tap an NFC tag on the reader',
    icon: '📡'
  },
  reading_tag: {
    label: 'Reading Tag',
    description: 'Reading tag information...',
    icon: '📖'
  },
  writing_tag: {
    label: 'Writing to Tag',
    description: 'Please tap the NFC tag again to write data',
    icon: '✍️'
  },
  saving_to_db: {
    label: 'Saving to Database',
    description: 'Linking tag to artwork...',
    icon: '💾'
  },
  verifying: {
    label: 'Verifying',
    description: 'Confirming tag attachment...',
    icon: '✅'
  },
  complete: {
    label: 'Complete',
    description: 'NFC tag successfully attached!',
    icon: '🎉'
  },
  error: {
    label: 'Error',
    description: 'An error occurred during the process',
    icon: '❌'
  }
};

export const AttachNFCModal: React.FC<AttachNFCModalProps> = ({
  isOpen,
  onClose,
  artworkId,
  onSuccess
}) => {
  const [currentStep, setCurrentStep] = useState<AttachStep>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [tagId, setTagId] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<AttachStep>>(new Set());

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('initializing');
      setError(null);
      setTagId(null);
      setIsRetrying(false);
      setCompletedSteps(new Set());
      
      // Start the NFC process
      startNFCProcess();
    }
  }, [isOpen]);

  const markStepComplete = (step: AttachStep) => {
    setCompletedSteps(prev => new Set(prev).add(step));
  };

  const startNFCProcess = async () => {
    try {
      // Step 1: Initialize NFC
      setCurrentStep('initializing');
      await initializeNFC();
      markStepComplete('initializing');

      // Step 2: Wait for tag
      setCurrentStep('waiting_for_tag');
      const detectedTag = await waitForTag();
      setTagId(detectedTag);
      markStepComplete('waiting_for_tag');

      // Step 3: Read tag
      setCurrentStep('reading_tag');
      await readTag(detectedTag);
      markStepComplete('reading_tag');

      // Step 4: Save to database first (creates tag entry if needed)
      setCurrentStep('saving_to_db');
      await saveToDatabase(detectedTag, artworkId);
      markStepComplete('saving_to_db');

      // Step 5: Write to tag
      setCurrentStep('writing_tag');
      
      // Add a small delay to ensure the tag is ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await writeToTag(detectedTag, artworkId);
      markStepComplete('writing_tag');


      // Step 6: Verify
      setCurrentStep('verifying');
      await verifyAttachment(detectedTag, artworkId);
      markStepComplete('verifying');

      // Complete!
      setCurrentStep('complete');
      setTimeout(() => {
        onSuccess(detectedTag);
        handleClose();
      }, 2000);

    } catch (err) {
      console.error('NFC attach process error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setCurrentStep('error');
    }
  };

  const initializeNFC = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!window.electron?.setMode) {
        reject(new Error('NFC functionality not available'));
        return;
      }

      console.log('📡 Initializing NFC in read mode');
      window.electron.setMode('read');
      
      // Give it a moment to initialize
      setTimeout(resolve, 500);
    });
  };

  const waitForTag = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout waiting for NFC tag (30 seconds)'));
      }, 30000);

      if (!window.electron?.subscribeNfcCardDetection) {
        clearTimeout(timeout);
        reject(new Error('NFC detection not available'));
        return;
      }

      console.log('🔍 Waiting for NFC tag tap...');
      const unsubscribe = window.electron.subscribeNfcCardDetection((card: { uid: string }) => {
        console.log('📡 NFC tag detected:', card.uid);
        clearTimeout(timeout);
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
        resolve(card.uid);
      });
    });
  };

  const readTag = async (tagId: string): Promise<void> => {
    // Simulate reading tag data
    return new Promise((resolve) => {
      console.log('📖 Reading tag:', tagId);
      setTimeout(resolve, 1000);
    });
  };

  const writeToTag = async (tagId: string, artworkId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!window.electron?.setMode || !window.electron?.subscribeNfcWriteResult) {
        reject(new Error('NFC write functionality not available'));
        return;
      }

      console.log('✍️ Writing artwork ID to tag:', { tagId, artworkId });
      
      let writeResultUnsubscribe: (() => void) | null = null;
      let operationErrorUnsubscribe: (() => void) | null = null;
      
      const cleanup = () => {
        if (writeResultUnsubscribe && typeof writeResultUnsubscribe === 'function') {
          writeResultUnsubscribe();
        }
        if (operationErrorUnsubscribe && typeof operationErrorUnsubscribe === 'function') {
          operationErrorUnsubscribe();
        }
      };
      
      const timeout = setTimeout(() => {
        console.error('⏰ Write timeout - no tag tapped within 15 seconds');
        cleanup();
        // Set back to read mode on timeout
        window.electron.setMode('read');
        reject(new Error('Timeout writing to NFC tag - Please tap the tag'));
      }, 15000); // 15 second timeout

      // Subscribe to write results BEFORE setting write mode
      console.log('🔔 Subscribing to write results...');
      writeResultUnsubscribe = window.electron.subscribeNfcWriteResult((result: any) => {
        clearTimeout(timeout);
        console.log('✍️ NFC write result received:', result);
        
        // Cleanup subscriptions
        cleanup();
        
        if (result.success) {
          console.log('✅ Successfully wrote to NFC tag');
          // Set back to read mode after successful write
          window.electron.setMode('read');
          resolve();
        } else {
          console.error('❌ Write failed:', result);
          // Set back to read mode on failure
          window.electron.setMode('read');
          reject(new Error(result.error || result.message || 'Failed to write to NFC tag'));
        }
      });
      
      // Subscribe to operation errors
      if (window.electron.subscribeNfcOperationError) {
        console.log('🔔 Subscribing to operation errors...');
        operationErrorUnsubscribe = window.electron.subscribeNfcOperationError((error: any) => {
          console.error('❌ NFC operation error:', error);
          clearTimeout(timeout);
          cleanup();
          window.electron.setMode('read');
          reject(new Error(error.message || 'NFC operation failed'));
        });
      }
      
      // Set to write mode with the data
      console.log('📝 Setting NFC to write mode with data:', artworkId);
      window.electron.setMode('write', artworkId);
      
      // Log that we're now waiting for the tag
      console.log('🕑 Waiting for tag tap to write data...');
    });
  };

  const saveToDatabase = async (tagId: string, artworkId: string): Promise<void> => {
    console.log('💾 Saving to database:', { tagId, artworkId });
    
    try {
      const { attachNfcTag } = await import('../../../supabase/rpc/attachNfcTag');
      const result = await attachNfcTag(artworkId, tagId);
      
      if (!result || result.length === 0) {
        throw new Error('No result returned from database update');
      }
      
      console.log('✅ Successfully saved to database:', result[0]);
    } catch (error) {
      console.error('❌ Database save error:', error);
      throw error;
    }
  };

  const verifyAttachment = async (tagId: string, artworkId: string): Promise<void> => {
    // Add verification logic here if needed
    console.log('✅ Verifying attachment:', { tagId, artworkId });
    return new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
  };

  const handleRetry = () => {
    setIsRetrying(true);
    setError(null);
    startNFCProcess();
  };

  const handleClose = () => {
    // Set back to read mode
    if (window.electron?.setMode) {
      window.electron.setMode('read');
    }
    onClose();
  };

  const getStepStatus = (step: AttachStep) => {
    if (completedSteps.has(step)) return 'complete';
    if (currentStep === step) return 'active';
    if (currentStep === 'error') return 'error';
    return 'pending';
  };

  const renderStep = (step: AttachStep) => {
    const info = STEP_INFO[step];
    const status = getStepStatus(step);
    
    return (
      <div key={step} className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
        status === 'active' ? 'bg-primary/10 border border-primary' :
        status === 'complete' ? 'bg-success/10' :
        status === 'error' ? 'bg-error/10' :
        'opacity-50'
      }`}>
        <div className="text-2xl">
          {status === 'complete' ? '✅' : 
           status === 'active' ? (
            <span className="inline-block animate-pulse">{info.icon}</span>
           ) : info.icon}
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold ${
            status === 'active' ? 'text-primary' :
            status === 'complete' ? 'text-success' :
            status === 'error' ? 'text-error' :
            'text-base-content/60'
          }`}>
            {info.label}
          </h4>
          <p className="text-sm text-base-content/70">
            {status === 'active' && currentStep === step ? info.description : 
             status === 'complete' ? 'Completed successfully' :
             status === 'error' && currentStep === step ? error || info.description :
             'Waiting...'}
          </p>
        </div>
        {status === 'active' && (
          <div className="loading loading-spinner loading-sm text-primary"></div>
        )}
      </div>
    );
  };

  const steps: AttachStep[] = [
    'initializing',
    'waiting_for_tag',
    'reading_tag',
    'saving_to_db',
    'writing_tag',
    'verifying'
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Attach NFC Tag</h2>
        
        <div className="space-y-3 mb-6">
          {steps.map(renderStep)}
        </div>

        {/* Special prompt for writing step */}
        {currentStep === 'writing_tag' && (
          <div className="alert alert-warning mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-semibold">Action Required</h4>
              <p className="text-sm">Please tap the same NFC tag on the reader again to write the artwork ID to it.</p>
            </div>
          </div>
        )}

        {currentStep === 'complete' && (
          <div className="alert alert-success">
            <span>NFC tag successfully attached to artwork!</span>
          </div>
        )}

        {currentStep === 'error' && (
          <div className="alert alert-error">
            <div>
              <h4 className="font-semibold">Error occurred</h4>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-6">
          {currentStep === 'error' && (
            <button
              onClick={handleRetry}
              className="btn btn-primary"
              disabled={isRetrying}
            >
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          )}
          <button
            onClick={handleClose}
            className="btn btn-ghost"
            disabled={currentStep === 'waiting_for_tag' || currentStep === 'writing_tag'}
          >
            {currentStep === 'complete' ? 'Close' : 'Cancel'}
          </button>
        </div>
      </div>
    </Modal>
  );
};