import { FormField, PageHeader } from "@components";
import { Nfc } from "lucide-react";
import { useEffect, useState } from "react";
import { getArtwork } from "../../supabase/rpc/getArtwork";
import { ArtworkEntity } from "@typings";
import { useNavigate } from "react-router-dom";

const SearchArtwork = () => {
  const [artwork, setArtwork] = useState<ArtworkEntity>({});
  const navigate = useNavigate();

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
    // Check if electron API is available
    if (!window.electron?.subscribeNfcCardDetection) {
      console.warn('Electron API not available - NFC functionality will be disabled');
      return;
    }

    window.electron.subscribeNfcCardDetection(
      (data: { uid: string; data: any }) => {
        handleGetArtwork((data.data as string).substring(0, 36));
      }
    );

    return () => {};
  }, []);

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
              Please connect the NFC Reader device and scan the NFC Tag to check
              its attached artwork
            </p>
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
