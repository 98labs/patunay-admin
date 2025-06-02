import { FormField, PageHeader } from "@components";
import { Nfc } from "lucide-react";
import { useEffect, useState } from "react";
import { getArtwork } from "../../supabase/rpc/getArtwork";
import { ArtworkEntity } from "@typings";
import { useNavigate } from "react-router-dom";
import { useNfcStatus } from "../../context/NfcStatusContext";
import { useNotification } from "../../hooks/useNotification";

const SearchArtwork = () => {
  const [artwork, setArtwork] = useState<ArtworkEntity>({});
  const navigate = useNavigate();
  const { nfcFeaturesEnabled, isNfcAvailable, deviceStatus } = useNfcStatus();
  const { showError } = useNotification();

  const handleGetArtwork = async (uuid: string) => {
    try {
      const result = await getArtwork(uuid);
      const artworkData = result[0];

      if (artworkData?.id) {
        setArtwork(artworkData);
        window.location.href = `/dashboard/artworks/${artworkData.id}`;
      }
    } catch (error) {
      console.error("Failed to fetch artwork:", error);
    }
  };

  useEffect(() => {
    // Only set up NFC subscription if features are enabled
    if (!nfcFeaturesEnabled) {
      return;
    }

    // Check if electron API is available
    if (!window.electron?.subscribeNfcCardDetection) {
      console.warn('Electron API not available - NFC functionality will be disabled');
      showError('NFC functionality is not available in this environment.', 'API Error');
      return;
    }

    window.electron.subscribeNfcCardDetection(
      (data: { uid: string; data: any }) => {
        handleGetArtwork((data.data as string).substring(0, 36));
      }
    );

    return () => {};
  }, [nfcFeaturesEnabled, showError]);

  return (
    <div className="bg-base-100 dark:bg-base-100 text-base-content dark:text-base-content">
      <PageHeader name="Search Artwork" />
      <div className="border border-base-300 dark:border-base-300 rounded-lg p-8 bg-base-200 dark:bg-base-200">
        <div className="flex flex-col justify-between items-center gap-6">
          <div className="p-6 rounded-full bg-primary/10 dark:bg-primary/20">
            <Nfc className="w-24 h-24 text-primary dark:text-primary" />
          </div>
          <div className="text-center space-y-4">
            <p className="font-semibold text-lg text-base-content dark:text-base-content">
              {!isNfcAvailable
                ? "NFC device not available - Please connect an NFC reader"
                : !nfcFeaturesEnabled
                  ? "NFC device initializing..."
                  : "Please scan an NFC tag to check its attached artwork"}
            </p>
            
            {/* NFC Status Indicator */}
            <div className={`text-sm px-3 py-1 rounded-full inline-block ${
              nfcFeaturesEnabled 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : isNfcAvailable 
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}>
              {nfcFeaturesEnabled 
                ? `✓ NFC Ready (${deviceStatus.readers.join(', ')})` 
                : isNfcAvailable 
                  ? '⚠ NFC Initializing...' 
                  : '✗ NFC Device Not Found'}
            </div>
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-base-300 dark:bg-base-300"></div>
              <span className="text-base-content/60 dark:text-base-content/60 font-medium">or</span>
              <div className="flex-1 h-px bg-base-300 dark:bg-base-300"></div>
            </div>
            <p className="font-semibold text-base-content dark:text-base-content">
              You may search for an artwork using its name or artist. (WIP)
            </p>
          </div>
          <div className="w-full max-w-md">
            <FormField 
              hint="Search by title, artist, or description..." 
              disabled 
              name="search"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchArtwork;
