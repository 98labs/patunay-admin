import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@components";
import { Nfc } from "lucide-react";
import { useNfcStatus } from "../../context/NfcStatusContext";
import { useNotification } from "../../hooks/useNotification";
import { getArtworkDirect } from "../../supabase/rpc/getArtworkDirect";

/**
 * SearchArtwork Component
 * 
 * Listens for NFC tag scans and navigates to the corresponding artwork detail page.
 * Implements debouncing and proper cleanup to prevent navigation issues.
 */
const SearchArtwork = () => {
  const navigate = useNavigate();
  const { nfcFeaturesEnabled, isNfcAvailable, deviceStatus } = useNfcStatus();
  const { showSuccess, showError } = useNotification();
  
  // Use refs to track component state without causing re-renders
  const isProcessingRef = useRef(false);
  const lastProcessedUidRef = useRef<string | null>(null);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Process NFC tag data and navigate to artwork detail
   */
  const processNfcTag = useCallback(async (tagUid: string, artworkId: string) => {
    // Prevent processing if already handling a tag
    if (isProcessingRef.current) {
      console.log('[SearchArtwork] Already processing, skipping tag:', tagUid);
      return;
    }

    // Prevent processing the same tag twice in quick succession
    if (lastProcessedUidRef.current === tagUid) {
      console.log('[SearchArtwork] Same tag detected, skipping:', tagUid);
      return;
    }

    // Validate artwork ID
    if (!artworkId || !artworkId.trim()) {
      showError('This NFC tag does not contain artwork data');
      return;
    }

    try {
      // Set processing state
      isProcessingRef.current = true;
      lastProcessedUidRef.current = tagUid;

      console.log('[SearchArtwork] Processing NFC tag:', { tagUid, artworkId });

      // Fetch artwork to verify it exists
      const artworkData = await getArtworkDirect(artworkId.trim());
      
      if (!artworkData || artworkData.length === 0) {
        showError('No artwork found for this NFC tag');
        return;
      }

      const artwork = artworkData[0];
      showSuccess(`Found: ${artwork.title}`);

      // Navigate to artwork detail page
      console.log('[SearchArtwork] Navigating to artwork:', artworkId);
      navigate(`/dashboard/artworks/${artworkId.trim()}`);

    } catch (error) {
      console.error('[SearchArtwork] Error processing NFC tag:', error);
      showError('Failed to load artwork information');
    } finally {
      // Reset processing state after a delay to prevent rapid re-processing
      processingTimeoutRef.current = setTimeout(() => {
        isProcessingRef.current = false;
        lastProcessedUidRef.current = null;
      }, 2000); // 2 second cooldown
    }
  }, [navigate, showSuccess, showError]);

  /**
   * Set up NFC event listeners
   */
  useEffect(() => {
    // Check if NFC is available
    if (!nfcFeaturesEnabled || !window.electron) {
      console.log('[SearchArtwork] NFC not available');
      return;
    }

    console.log('[SearchArtwork] Initializing NFC listeners');

    // Set NFC mode to search
    if (window.electron.setMode) {
      window.electron.setMode('search', '');
    }

    // Handle NFC search events
    const handleNfcSearch = (data: { uid: string; data: string; timestamp?: string }) => {
      console.log('[SearchArtwork] NFC search event:', data);
      processNfcTag(data.uid, data.data);
    };

    // Handle NFC detection events (fallback)
    const handleNfcDetection = (data: { uid: string; data: string }) => {
      console.log('[SearchArtwork] NFC detection event:', data);
      processNfcTag(data.uid, data.data);
    };

    // Handle NFC errors
    const handleNfcError = (error: { uid?: string; message: string }) => {
      console.error('[SearchArtwork] NFC error:', error);
      showError('NFC read error. Please try again.');
    };

    // Subscribe to events
    if (window.electron.subscribeNfcCardSearch) {
      window.electron.subscribeNfcCardSearch(handleNfcSearch);
    }
    
    if (window.electron.subscribeNfcCardDetection) {
      window.electron.subscribeNfcCardDetection(handleNfcDetection);
    }
    
    if (window.electron.subscribeNfcSearchError) {
      window.electron.subscribeNfcSearchError(handleNfcError);
    }

    // Cleanup function
    return () => {
      console.log('[SearchArtwork] Cleaning up NFC listeners');
      
      // Clear any pending timeouts
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
      
      // Reset refs
      isProcessingRef.current = false;
      lastProcessedUidRef.current = null;
      
      // TODO: Add unsubscribe methods when available in electron API
    };
  }, [nfcFeaturesEnabled, processNfcTag, showError]);

  /**
   * Render UI
   */
  const renderStatus = () => {
    if (!isNfcAvailable) {
      return {
        icon: '✗',
        text: 'NFC Device Not Found',
        subtext: 'Please connect an NFC reader',
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      };
    }

    if (!nfcFeaturesEnabled) {
      return {
        icon: '⚠',
        text: 'NFC Initializing...',
        subtext: 'Please wait',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      };
    }

    return {
      icon: '✓',
      text: 'NFC Ready',
      subtext: deviceStatus.readers.join(', ') || 'Reader connected',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    };
  };

  const status = renderStatus();

  return (
    <div className="bg-base-100 dark:bg-base-100 text-base-content dark:text-base-content">
      <PageHeader name="Search Artwork" />
      
      <div className="border border-base-300 dark:border-base-300 rounded-lg p-8 bg-base-200 dark:bg-base-200">
        <div className="flex flex-col justify-center items-center gap-6">
          {/* NFC Icon */}
          <div className="p-6 rounded-full bg-primary/10 dark:bg-primary/20">
            <Nfc className="w-24 h-24 text-primary dark:text-primary" />
          </div>
          
          <div className="text-center space-y-4">
            {/* Title */}
            <h2 className="font-semibold text-xl text-base-content dark:text-base-content">
              NFC Artwork Search
            </h2>
            
            {/* Instructions */}
            <p className="font-medium text-lg text-base-content dark:text-base-content">
              {nfcFeaturesEnabled 
                ? "Scan an NFC tag to view its artwork"
                : status.text}
            </p>
            
            {/* Status Badge */}
            <div className={`text-sm px-4 py-2 rounded-full inline-block font-medium ${status.className}`}>
              {status.icon} {status.text}
              {status.subtext && (
                <span className="ml-2 text-xs opacity-75">({status.subtext})</span>
              )}
            </div>

            {/* Help Text */}
            {nfcFeaturesEnabled && (
              <div className="mt-6 p-4 bg-base-300 dark:bg-base-300 rounded-lg">
                <p className="text-sm text-base-content/70 dark:text-base-content/70">
                  Place an NFC tag near your reader to search for its associated artwork.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchArtwork;