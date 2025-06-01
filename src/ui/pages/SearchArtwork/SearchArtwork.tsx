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
    <>
      <PageHeader name="Search Artwork" />
      <div className="border border-neutral-gray-01 rounded-lg p-4">
        <div className=" flex flex-col justify-between items-center gap-2">
          <Nfc className="w-40 h-50 m-auto text-neutral-black-02" />
          <p className="font-semibold text-center">
            Please connect the NFC Reader device and scan the NFC Tag to check
            its attached artwork
          </p>
          <span>or</span>
          <p className="font-semibold">
            You may search for an artwork using its name or artist. (WIP)
          </p>
          <FormField hint="Search..." disabled />
        </div>
      </div>
    </>
  );
};

export default SearchArtwork;
