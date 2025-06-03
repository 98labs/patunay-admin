import { useEffect, useState, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { format } from "date-fns";
import { Button, Loading, PageHeader } from "@components";
import { showNotification } from "../../components/NotificationMessage/slice";
import { getTags, Tag } from "../../supabase/rpc/getTags";
import { registerTag } from "../../supabase/rpc/registerTag";
import { updateTagStatus } from "../../supabase/rpc/updateTagStatus";

const NfcTags = () => {
  const dispatch = useDispatch();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasProcessedCard = useRef(false);
  const [searchTerm, setSearchTerm] = useState("");

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
  }, [dispatch, handleStopScanning]);

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

  const filteredTags = tags.filter(tag => 
    tag.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tag.artwork_title && tag.artwork_title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <Loading fullScreen={false} />;

  return (
    <div className="p-6">
      <PageHeader title="NFC Tags Management" />
      
      <div className="mb-6 flex justify-between items-center">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search tags..."
            className="input input-bordered w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="ml-4">
          {isScanning ? (
            <Button
              buttonType="secondary"
              buttonLabel="Cancel Scanning"
              className="btn-sm rounded-lg animate-pulse"
              onClick={handleStopScanning}
            />
          ) : (
            <Button
              buttonType="primary"
              buttonLabel="Register New Tag"
              className="btn-sm rounded-lg"
              onClick={handleStartScanning}
            />
          )}
        </div>
      </div>

      <div className="bg-base-100 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Tag ID</th>
                <th>Status</th>
                <th>Attached To</th>
                <th>Read/Write Count</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTags.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-base-content/60">
                    {searchTerm ? 'No tags found matching your search' : 'No tags registered yet'}
                  </td>
                </tr>
              ) : (
                filteredTags.map((tag) => (
                  <tr key={tag.id}>
                    <td className="font-mono text-sm">{tag.id}</td>
                    <td>
                      <span className={`badge badge-sm ${tag.active ? 'badge-success' : 'badge-error'}`}>
                        {tag.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {tag.artwork_title ? (
                        <span className="text-sm">{tag.artwork_title}</span>
                      ) : (
                        <span className="text-base-content/60 text-sm">Not attached</span>
                      )}
                    </td>
                    <td className="text-center">{tag.read_write_count}</td>
                    <td className="text-sm">
                      {format(new Date(tag.created_at), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td>
                      <Button
                        buttonType={tag.active ? "secondary" : "primary"}
                        buttonLabel={tag.active ? "Deactivate" : "Activate"}
                        className="btn-xs rounded"
                        onClick={() => handleToggleStatus(tag)}
                        disabled={!!tag.artwork_id}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NFC Scanning Indicator */}
      {isScanning && (
        <div className="fixed bottom-4 right-4 bg-base-100 border border-primary rounded-lg shadow-lg p-4 flex items-center gap-3 animate-pulse">
          <div className="loading loading-spinner loading-sm text-primary"></div>
          <div>
            <p className="font-semibold text-sm">NFC Scanner Active</p>
            <p className="text-xs text-base-content/70">Tap an NFC tag to register</p>
          </div>
        </div>
      )}
      
      {/* Registration Loading */}
      {isRegistering && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-lg p-6 flex flex-col items-center gap-4">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="text-sm font-medium">Registering tag...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NfcTags;
