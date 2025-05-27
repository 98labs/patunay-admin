import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import moment from "moment";
import { Button, Loading, DetachNFCModal, DeleteArtworkModal } from "@components";
import ArtworkImageModal from "./components/ArtworkImageModal";
import { Appraisal, ArtworkType } from "./types";
import { selectNotif } from "../../components/NotificationMessage/selector";
import { useSelector } from "react-redux";
import AppraisalInfo from "./components/AppraisalInfo";

import supabase from "../../supabase";
import { updateArtwork } from "../../supabase/rpc/updateArtwork";

import { safeJsonParse } from "../Artworks/components/utils";

const DetailArtwork = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState<ArtworkType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  const [appraisals, setAppraisals] =  useState<Appraisal[]>([]);
  const [showDetachModal, setShowDetachModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tagId, setTagId] = useState("");
  const { status } = useSelector(selectNotif);

  const handleStartScanning = async () => {
    setIsScanning(true);
  };

  const handleDetach = async () => {
    if (artwork?.tag_id) {
        setTagId(artwork?.tag_id);
      setShowDetachModal(true);
    }
  };
  
  const handleDelete = async () => {
    if (artwork?.id) {
      setShowDeleteModal(true);
    }
  };
  
  const handleAttachArtwork = async (tagId: string) => {
    try {
      const result = await updateArtwork({ ...artwork!, tag_id: tagId });

      if (result) {
        setArtwork({
          ...result[0],
          tag_id: tagId,
          bibliography: safeJsonParse(result[0].bibliography),
          collectors: safeJsonParse(result[0].collectors),
        });
        setIsScanning(false);
      }
    } catch (error) {
      console.error("Failed to detach NFC tag from artwork:", error);
    }
  };

  // const handleDetachArtwork = async () => {
  //   try {
  //     const result = await updateArtwork({ ...artwork!, tag_id: null });

  //     if (result)
  //       setArtwork({
  //         ...result[0],
  //         bibliography: safeJsonParse(result[0].bibliography),
  //         collectors: safeJsonParse(result[0].collectors),
  //       });
  //   } catch (error) {
  //     console.error("Failed to detach NFC tag from artwork:", error);
  //   }
  // };

  // const handleOnDelete = async () => {
  //   try {
  //     const result = await deleteArtwork(artwork!.id as string);

  //     if (result) {
  //       navigate(`/dashboard/artworks/`);
  //     }
  //   } catch (error) {
  //     console.error("Failed to delete artwork:", error);
  //   }
  // };

  useEffect(() => {
    if (!isScanning) return;

    window.electron.subscribeNfcCardDetection(
      (card: { uid: string; data: any }) => {
        handleAttachArtwork(card.uid);
      }
    );
  }, [isScanning, handleAttachArtwork]);

  useEffect(() => {
    const fetchArtwork = async () => {
      const { data, error } = await supabase.rpc("get_artwork", {
        p_artwork_id: id,
      });

      if (error) {
        console.error("Error fetching artwork:", error.message);
        navigate("/dashboard/artworks");
      } else {
        setArtwork({
          ...data[0],
          bibliography: safeJsonParse(data[0].bibliography),
          collectors: safeJsonParse(data[0].collectors),
        });
      }
      setLoading(false);
    };
    fetchArtwork();
  }, [id, navigate, status]);

  useEffect(() => {
    if (artwork?.artwork_appraisals) {
      setAppraisals(artwork?.artwork_appraisals);
    }
    
  }, [artwork])
  
  if (loading) return <Loading fullScreen={false} />;
  if (!artwork) return <div className="p-6">Artwork not found.</div>;
  return (
    <div className="text-base-content">
      <div className="flex justify-between items-center">
        <div className="breadcrumbs text-sm">
          <ul className="font-semibold">
            <li>
              <Link to="/dashboard/artworks">
                Artworks
              </Link>
            </li>
            <li>{artwork.title}</li>
          </ul>
        </div>
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            {artwork.tag_id ? (
              <Button
                buttonType="secondary"
                buttonLabel="Detach NFC Tag"
                className="btn-sm rounded-lg"
                onClick={handleDetach}
              />
            ) : (
              <Button
                buttonType="secondary"
                buttonLabel={isScanning ? "Attaching..." : "Attach NFC Tag"}
                className="btn-sm rounded-lg"
                onClick={handleStartScanning}
              />
            )}
            <Button
              className="transition-all bg-tertiary-red-400 border-none shadow-none btn-sm rounded-lg text-white hover:opacity-95"
              buttonLabel="Delete artwork"
              onClick={handleDelete}
            />
          </div>
        </div>
      </div>

      <section className="hero text-base-content">
        <div className="hero-content flex-col lg:flex-row">
          <div className="lg:w-1/3">
            {!artwork.assets ? (
              <div className="bg-neutral-gray-01 border border-dashed border-neutral-gray-02 rounded-2xl text-neutral-black-02 text-center p-4 flex flex-col gap-2">
                <p className="text-sm font-semibold">
                  Drag and drop the images here (WIP),
                </p>
                <span className="text-sm">or</span>
                <Button
                  buttonLabel="Upload an artwork"
                  className="rounded-lg"
                  onClick={async () => {}}
                />
              </div>
            ) : (
              <ArtworkImageModal
                images={artwork.assets?.map((asset) => asset.url) || []}
                title={artwork.title ?? ""}
              />
            )}
          </div>
          <div className="flex-1">
            <ul>
              <h2 className="text-2xl font-bold">{artwork.title}</h2>
              <p className="text-gray-500 text-xs">
                {artwork.artist}{" "}
                <span className="italic">
                  ({moment(artwork.tag_issued_at).format("YYYY")})
                </span>
              </p>
            </ul>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div><strong>Size:</strong> {artwork.height}cm by {artwork.width}cm</div>
                <div><strong>Medium:</strong> {artwork.medium}</div>
                <div className="col-span-2">
                  <strong>Description:</strong>
                  <p>{artwork.description}</p>
                </div>
                <div><strong>Identifier:</strong> {artwork.idnumber}</div>
                <div><strong>Provenance:</strong> {artwork.provenance}</div>
                <div><strong>Bibliography:</strong>
                  {typeof artwork.bibliography === 'string' ? <p>No bibliography available</p> : 
                    <ul>
                      {artwork.bibliography.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  }
                </div>
                <div><strong>Collector:</strong>
                  {typeof artwork.collectors === 'string' ? <p>No collectors available</p> :
                    <ul>
                      {artwork.collectors.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  }
                </div>
                <div><strong>Artwork ID:</strong> {artwork.tag_id}</div>
                <div><strong>NFC Tag ID:</strong> 00:00:00:00:00:00</div> 
              </div>
          </div>
        </div>
          {showDetachModal && (
              <DetachNFCModal
                tagId={tagId}
                onClose={() => {
                  setShowDetachModal(false);
                }}
              />
            )}
          {showDeleteModal && (
              <DeleteArtworkModal
                artworkId={artwork.id as string}
                onClose={() => {
                  setShowDeleteModal(false);
                }}
              />
            )}
        </section>
        {artwork.artwork_appraisals && (
          <>
            <div className="divider"></div>
            <AppraisalInfo appraisals={appraisals} artwork_id={artwork.id} />
          </>
        )}
    </div>
  );
};

export default DetailArtwork;
