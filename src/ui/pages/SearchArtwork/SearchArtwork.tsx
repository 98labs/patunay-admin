import { PageHeader } from "@components";
import { Nfc } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNfcStatus } from "../../context/NfcStatusContext";
import { useNotification } from "../../hooks/useNotification";
import { getArtwork } from "../../supabase/rpc/getArtwork";

const SearchArtwork = () => {
  const navigate = useNavigate();
  const { nfcFeaturesEnabled, isNfcAvailable, deviceStatus } = useNfcStatus();
  const { showSuccess, showError } = useNotification();
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Only set up NFC listeners if features are enabled and API is available
    if (!nfcFeaturesEnabled || !window.electron) {
      return;
    }

    console.log('🔍 SearchArtwork: Setting up NFC listeners');
    
    // Set NFC to search mode when on this page
    if (window.electron.setMode) {
      window.electron.setMode('search', '');
      console.log('🔍 SearchArtwork: Set NFC mode to search');
    }

    // Handle NFC card search events (for search mode)
    const handleNfcCardSearch = async (data: { uid: string; data: string; timestamp: string }) => {
      console.log('🔍 SearchArtwork: NFC search event received:', data);
      
      if (isSearching) {
        console.log('🔍 SearchArtwork: Already searching, ignoring duplicate event');
        return;
      }

      const artworkId = data.data?.trim();
      
      if (!artworkId) {
        console.log('🔍 SearchArtwork: No artwork ID found in NFC data');
        showError('NFC tag does not contain artwork data', 'Search Error');
        return;
      }

      console.log('🔍 SearchArtwork: Found artwork ID in NFC data:', artworkId);
      
      try {
        setIsSearching(true);
        console.log('🔍 SearchArtwork: Calling get_artwork RPC with ID:', artworkId);
        
        const artworkData = await getArtwork(artworkId);
        
        if (artworkData && artworkData.length > 0) {
          const artwork = artworkData[0];
          console.log('🔍 SearchArtwork: Artwork found:', artwork);
          
          showSuccess(`Found artwork: ${artwork.title}`, 'Artwork Found');
          
          // Navigate to DetailedArtwork page
          navigate(`/dashboard/artworks/${artwork.id}`);
        } else {
          console.log('🔍 SearchArtwork: No artwork found for ID:', artworkId);
          showError('No artwork found for this NFC tag', 'Not Found');
        }
      } catch (error) {
        console.error('🔍 SearchArtwork: Error fetching artwork:', error);
        showError('Failed to fetch artwork data', 'Search Error');
      } finally {
        setIsSearching(false);
      }
    };

    // Handle regular NFC card detection events (for read mode fallback)
    const handleNfcCardDetection = async (data: { uid: string; data: string }) => {
      console.log('🔍 SearchArtwork: NFC detection event received:', data);
      
      // Convert to search event format and handle
      handleNfcCardSearch({
        uid: data.uid,
        data: data.data,
        timestamp: new Date().toISOString()
      });
    };

    // Subscribe to NFC events
    if (window.electron.subscribeNfcCardSearch) {
      window.electron.subscribeNfcCardSearch(handleNfcCardSearch);
      console.log('🔍 SearchArtwork: Subscribed to NFC card search events');
    }

    if (window.electron.subscribeNfcCardDetection) {
      window.electron.subscribeNfcCardDetection(handleNfcCardDetection);
      console.log('🔍 SearchArtwork: Subscribed to NFC card detection events');
    }

    // Handle NFC search errors
    const handleNfcSearchError = (error: { uid: string; message: string }) => {
      console.error('🔍 SearchArtwork: NFC search error:', error);
      showError(`NFC search failed: ${error.message}`, 'NFC Error');
      setIsSearching(false);
    };

    if (window.electron.subscribeNfcSearchError) {
      window.electron.subscribeNfcSearchError(handleNfcSearchError);
      console.log('🔍 SearchArtwork: Subscribed to NFC search error events');
    }

    return () => {
      console.log('🔍 SearchArtwork: Cleaning up NFC listeners');
      // Note: Current implementation doesn't provide unsubscribe methods
    };
  }, [nfcFeaturesEnabled, isSearching, navigate, showSuccess, showError]);

  return (
    <div className="bg-base-100 dark:bg-base-100 text-base-content dark:text-base-content">
      <PageHeader name="Search Artwork" />
      <div className="border border-base-300 dark:border-base-300 rounded-lg p-8 bg-base-200 dark:bg-base-200">
        <div className="flex flex-col justify-center items-center gap-6">
          <div className="p-6 rounded-full bg-primary/10 dark:bg-primary/20">
            <Nfc className="w-24 h-24 text-primary dark:text-primary" />
          </div>
          
          <div className="text-center space-y-4">
            <h2 className="font-semibold text-xl text-base-content dark:text-base-content">
              NFC Artwork Search
            </h2>
            
            <p className="font-medium text-lg text-base-content dark:text-base-content">
              {isSearching
                ? "Searching for artwork..."
                : !isNfcAvailable
                  ? "NFC device not available - Please connect an NFC reader"
                  : !nfcFeaturesEnabled
                    ? "NFC device initializing..."
                    : "Please scan an NFC tag to find its artwork"}
            </p>
            
            {/* NFC Status Indicator */}
            <div className={`text-sm px-4 py-2 rounded-full inline-block font-medium ${
              isSearching
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : nfcFeaturesEnabled 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : isNfcAvailable 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {isSearching
                ? '🔍 Searching...'
                : nfcFeaturesEnabled 
                  ? `✓ NFC Ready (${deviceStatus.readers.join(', ')})` 
                  : isNfcAvailable 
                    ? '⚠ NFC Initializing...' 
                    : '✗ NFC Device Not Found'}
            </div>

            {nfcFeaturesEnabled && !isSearching && (
              <div className="mt-6 p-4 bg-base-300 dark:bg-base-300 rounded-lg">
                <p className="text-sm text-base-content/70 dark:text-base-content/70">
                  Place an NFC tag near your reader. The tag should contain an artwork ID.
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