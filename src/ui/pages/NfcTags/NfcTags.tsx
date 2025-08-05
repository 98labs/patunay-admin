import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { Button, Loading, PageHeader, NfcTagsTable } from "@components";
import { showNotification } from "../../components/NotificationMessage/slice";
import { getTags, Tag } from "../../supabase/rpc/getTags";
import { registerTag } from "../../supabase/rpc/registerTag";
import { updateTagStatus } from "../../supabase/rpc/updateTagStatus";
import { useNfcStatus } from "../../context/NfcStatusContext";

const NfcTags = () => {
  const dispatch = useDispatch();
  const { isNfcAvailable, nfcFeaturesEnabled } = useNfcStatus();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasProcessedCard = useRef(false);

  const fetchTags = useCallback(async () => {
    try {
      const data = await getTags();
      setTags(data);
    } catch (error) {
      console.error("Error fetching tags:", error);
      dispatch(showNotification({
        message: "Failed to load tags",
        status: "error"
      }));
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleStopScanning = useCallback(() => {
    console.log('📟 Stopping NFC scanning...');
    setIsScanning(false);
    hasProcessedCard.current = false;
    
    // Clear the timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    
    // Unsubscribe from NFC events
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  const handleStartScanning = useCallback(() => {
    // Check if NFC is available before starting scan
    if (!isNfcAvailable || !nfcFeaturesEnabled) {
      dispatch(showNotification({
        title: 'NFC Not Available',
        message: 'NFC service is not available. Please check your NFC reader connection.',
        status: 'warning'
      }));
      return;
    }

    console.log('📟 Starting NFC scanning for tag registration...');
    setIsScanning(true);
    hasProcessedCard.current = false;
    
    // Set NFC to read mode
    if (window.electron?.setMode) {
      console.log('📟 Setting NFC to Read mode');
      window.electron.setMode('Read');
    }
    
    dispatch(showNotification({
      title: 'NFC Scanner',
      message: 'Please tap an NFC tag to register it',
      status: 'info'
    }));
    
    // Set a timeout to automatically stop scanning after 30 seconds
    scanTimeoutRef.current = setTimeout(() => {
      console.log('📟 Scanning timeout reached');
      dispatch(showNotification({
        message: 'NFC scanning timed out. Please try again.',
        status: 'warning'
      }));
      handleStopScanning();
    }, 30000); // 30 seconds timeout
  }, [dispatch, handleStopScanning, isNfcAvailable, nfcFeaturesEnabled]);

  const handleRegisterTag = useCallback(async (tagId: string) => {
    // Prevent duplicate registrations
    if (isRegistering || hasProcessedCard.current) {
      console.log('📟 Already processing a card, ignoring duplicate event');
      return;
    }
    
    console.log('📟 NFC tag detected for registration:', tagId);
    
    if (!tagId || tagId.trim() === '') {
      console.error('Invalid NFC tag ID received');
      dispatch(showNotification({
        message: 'Failed to register tag: Invalid tag ID',
        status: 'error'
      }));
      handleStopScanning();
      return;
    }

    setIsRegistering(true);
    hasProcessedCard.current = true;
    handleStopScanning();

    try {
      await registerTag(tagId);
      
      dispatch(showNotification({
        title: 'Success',
        message: `NFC tag ${tagId} registered successfully`,
        status: 'success'
      }));
      
      // Refresh the tags list
      await fetchTags();
    } catch (error) {
      console.error("Failed to register tag:", error);
      dispatch(showNotification({
        message: `Failed to register tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error'
      }));
    } finally {
      setIsRegistering(false);
    }
  }, [dispatch, fetchTags, handleStopScanning, isRegistering]);

  const handleToggleStatus = async (tag: Tag) => {
    try {
      await updateTagStatus(tag.id, !tag.active);
      
      dispatch(showNotification({
        message: `Tag ${tag.active ? 'deactivated' : 'activated'} successfully`,
        status: 'success'
      }));
      
      // Refresh the tags list
      await fetchTags();
    } catch (error) {
      console.error("Failed to update tag status:", error);
      dispatch(showNotification({
        message: `Failed to update tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error'
      }));
    }
  };


  // NFC scanning effect
  useEffect(() => {
    console.log('📟 NFC scanning effect triggered, isScanning:', isScanning);
    
    if (!isScanning) {
      // Clean up when not scanning
      if (unsubscribeRef.current) {
        console.log('📟 Cleaning up existing subscription');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    // Check if electron API is available
    if (!window.electron?.subscribeNfcCardDetection) {
      console.error('📟 Electron API not available');
      dispatch(showNotification({
        message: 'NFC functionality is not available. Please ensure you are running the desktop application.',
        status: 'warning'
      }));
      setIsScanning(false);
      return;
    }

    // Clean up any existing subscription before creating a new one
    if (unsubscribeRef.current) {
      console.log('📟 Cleaning up existing subscription before creating new one');
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    console.log('📟 Setting up NFC card detection subscription...');
    
    try {
      // Subscribe to NFC card detection
      const unsubscribe = window.electron.subscribeNfcCardDetection(
        (card: { uid: string; data: any }) => {
          console.log('📟 NFC card detected in registration mode:', card);
          // Only handle if we're still scanning and haven't processed a card yet
          if (isScanning && !hasProcessedCard.current) {
            handleRegisterTag(card.uid);
          }
        }
      );
      
      console.log('📟 Subscription created, unsubscribe function:', typeof unsubscribe);
      
      // Store the unsubscribe function if it exists
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribeRef.current = unsubscribe;
      } else {
        console.warn('📟 No unsubscribe function returned from subscribeNfcCardDetection');
      }
    } catch (error) {
      console.error('📟 Error setting up NFC subscription:', error);
      dispatch(showNotification({
        message: 'Failed to start NFC scanning. Please try again.',
        status: 'error'
      }));
      setIsScanning(false);
    }

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        console.log('📟 Cleaning up NFC subscription from effect cleanup...');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isScanning, handleRegisterTag, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('📟 Component unmounting - cleaning up...');
      
      // Stop scanning if active
      if (isScanning) {
        setIsScanning(false);
      }
      
      // Clear any timeouts
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }
      
      // Unsubscribe from NFC events
      if (unsubscribeRef.current) {
        console.log('📟 Cleaning up NFC subscription...');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);

  if (loading) return <Loading fullScreen={false} />;

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader name="NFC Tags Management" />
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-base-content/70">
            {tags.length} tags
          </div>
          {isScanning ? (
            <Button
              buttonType="secondary"
              buttonLabel="Cancel Scanning"
              className="btn animate-pulse"
              onClick={handleStopScanning}
            />
          ) : (
            <Button
              buttonType="primary"
              buttonLabel={!isNfcAvailable || !nfcFeaturesEnabled ? "NFC Not Available" : "Register New Tag"}
              className="btn"
              onClick={handleStartScanning}
              disabled={!isNfcAvailable || !nfcFeaturesEnabled}
            />
          )}
        </div>
      </div>

      {/* NFC Tags Table */}
      <NfcTagsTable
        tags={tags}
        isLoading={loading}
        onToggleStatus={handleToggleStatus}
      />

      {/* NFC Scanning Indicator */}
      {isScanning && (
        <div className="fixed bottom-4 right-4 bg-base-100 border border-primary rounded-lg shadow-lg p-4 flex items-center gap-3 animate-pulse">
          <div className="loading loading-spinner loading-sm text-primary"></div>
          <div>
            <p className="font-semibold text-sm text-base-content">NFC Scanner Active</p>
            <p className="text-xs text-base-content/70">Tap an NFC tag to register</p>
          </div>
        </div>
      )}
      
      {/* Registration Loading */}
      {isRegistering && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 border border-base-300 rounded-lg p-6 flex flex-col items-center gap-4">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="text-sm font-medium text-base-content">Registering tag...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NfcTags;
