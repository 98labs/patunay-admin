import { useEffect, useId, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import { Button, Loading, DeleteArtworkModal } from "@components";
import ArtworkImageModal from "./components/ArtworkImageModal";
import EditArtworkModal from "./components/EditArtworkModal";
import DetachNFCModal from "./components/DetachNFCModal";
import { AttachNFCModal } from "./components/AttachNFCModal";
import { Appraisal, ArtworkType } from "./types";
import { selectNotif } from "../../components/NotificationMessage/selector";
import { useSelector, useDispatch } from "react-redux";
import AppraisalInfo from "./components/AppraisalInfo";
import { showNotification } from "../../components/NotificationMessage/slice";
import { useCanPerform } from "../../hooks/useAuth";
import { usePermissions } from "../../hooks/usePermissions";

import { updateArtworkDirect } from "../../supabase/rpc/updateArtworkDirect";
import { detachNfcTag } from "../../supabase/rpc/detachNfcTag";
import { getArtworkDirect } from "../../supabase/rpc/getArtworkDirect";
import { getAppraisals } from "../../supabase/rpc/getAppraisals";

import { safeJsonParse } from "../Artworks/components/utils";

const DetailArtwork = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { canManageAppraisals } = useCanPerform();
  const { canViewAppraisalDetails, canCreateAppraisals } = usePermissions();
  const [artwork, setArtwork] = useState<ArtworkType | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const modalId = useId();

  const [appraisals, setAppraisals] =  useState<Appraisal[]>([]);
  const [showDetachModal, setShowDetachModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [tagId, setTagId] = useState("");
  const { status } = useSelector(selectNotif);

  const handleStartAttaching = useCallback(() => {
    setShowAttachModal(true);
  }, []);
  
  const handleAttachSuccess = useCallback(async (tagId: string) => {
    console.log('✅ NFC tag attached successfully:', tagId);
    
    // Refresh the artwork data to show the attached tag
    try {
      const freshData = await getArtworkDirect(artwork!.id);
      if (freshData && freshData.length > 0) {
        setArtwork({
          ...freshData[0],
          bibliography: safeJsonParse(freshData[0].bibliography),
          collectors: safeJsonParse(freshData[0].collectors),
        });
      }
    } catch (error) {
      console.error('Failed to refresh artwork data:', error);
    }
    
    setShowAttachModal(false);
  }, [artwork]);

  const handleDetach = () => {
    if (artwork?.tag_id) {
      setTagId(artwork?.tag_id);
      setShowDetachModal(true);
    }
  };

  const handleDetachConfirm = async () => {
    if (!artwork?.id) return;

    try {
      console.log('🏷️ Detaching NFC tag from artwork:', artwork.id);
      
      const result = await detachNfcTag(artwork.id);
      
      if (result && result.length > 0) {
        console.log('🏷️ Successfully detached NFC tag');
        
        // Update local state
        setArtwork({
          ...artwork,
          tag_id: null,
          tag_issued_at: null,
        });
        
        dispatch(showNotification({
          title: 'Success',
          message: 'NFC tag detached successfully',
          status: 'success'
        }));
        
        setShowDetachModal(false);
      } else {
        throw new Error('No result returned from detach operation');
      }
    } catch (error) {
      console.error('Failed to detach NFC tag:', error);
      dispatch(showNotification({
        message: `Failed to detach NFC tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error'
      }));
    }
  };
  
  const handleDelete = async () => {
    if (artwork?.id) {
      setShowDeleteModal(true);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updatedData: Partial<ArtworkType>) => {
    if (!artwork?.id || isUpdating) return;

    setIsUpdating(true);
    
    try {
      console.log('📝 Updating artwork:', updatedData);
      console.log('📝 Bibliography:', updatedData.bibliography);
      console.log('📝 Collectors:', updatedData.collectors);
      
      // Merge with existing artwork data to ensure all fields are present
      // Only include fields that were actually updated and essential fields
      const fullArtworkData = {
        id: artwork.id,
        title: updatedData.title ?? artwork.title,
        artist: updatedData.artist ?? artwork.artist,
        description: updatedData.description ?? artwork.description,
        medium: updatedData.medium ?? artwork.medium,
        id_number: updatedData.id_number ?? artwork.id_number,
        provenance: updatedData.provenance ?? artwork.provenance,
        height: updatedData.height ?? artwork.height,
        width: updatedData.width ?? artwork.width,
        year: updatedData.year ?? artwork.year,
        bibliography: updatedData.bibliography ?? artwork.bibliography,
        collectors: updatedData.collectors ?? artwork.collectors,
        size_unit: artwork.size_unit,  // Keep existing size_unit
        tag_id: artwork.tag_id,         // Keep existing tag_id
      };
      
      console.log('📝 Full artwork data to update:', fullArtworkData);
      console.log('📝 Full data bibliography:', fullArtworkData.bibliography);
      console.log('📝 Full data collectors:', fullArtworkData.collectors);
      
      // Use the direct update function for better control over JSONB fields
      const result = await updateArtworkDirect(fullArtworkData);
      
      if (result && result.length > 0) {
        console.log('📝 Successfully updated artwork:', result[0]);
        
        // Fetch fresh data from the database to ensure all fields are up to date
        const freshData = await getArtworkDirect(artwork.id);
        
        if (freshData && freshData.length > 0) {
          setArtwork({
            ...freshData[0],
            bibliography: safeJsonParse(freshData[0].bibliography),
            collectors: safeJsonParse(freshData[0].collectors),
          });
        } else {
          // Fallback to using the result from update
          setArtwork({
            ...result[0],
            bibliography: safeJsonParse(result[0].bibliography),
            collectors: safeJsonParse(result[0].collectors),
          });
        }
        
        dispatch(showNotification({
          title: 'Success',
          message: 'Artwork updated successfully',
          status: 'success'
        }));
        
        setShowEditModal(false);
      } else {
        throw new Error('No result returned from update');
      }
    } catch (error) {
      console.error('Failed to update artwork:', error);
      dispatch(showNotification({
        message: `Failed to update artwork: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'error'
      }));
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const fetchArtwork = async () => {
      try {
        const data = await getArtworkDirect(id);
        
        if (!data || data.length === 0) {
          console.error("Artwork not found");
          navigate("/dashboard/artworks");
          return;
        }
        
        setArtwork({
          ...data[0],
          bibliography: safeJsonParse(data[0].bibliography),
          collectors: safeJsonParse(data[0].collectors),
        });

        // Fetch appraisals only if user has permission
        if (canViewAppraisalDetails) {
          const appraisalData = await getAppraisals(id!);
          setAppraisals(appraisalData);
        }
      } catch (error) {
        console.error("Error fetching artwork:", error);
        navigate("/dashboard/artworks");
      } finally {
        setLoading(false);
      }
    };
    fetchArtwork();
  }, [id, navigate, status, canViewAppraisalDetails]);

  if (loading) return <Loading fullScreen={false} />;
  if (!artwork) return <div className="p-6">Artwork not found.</div>;
  const image = artwork.assets?.map((asset) => asset.url) || []
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
            <Button
              buttonType="primary"
              buttonLabel="Edit Artwork"
              className="btn-sm rounded-lg"
              onClick={handleEdit}
            />
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
                buttonLabel="Attach NFC Tag"
                className="btn-sm rounded-lg"
                onClick={handleStartAttaching}
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
              <div className="bg-base-200 border border-dashed border-base-300 rounded-2xl text-base-content/90 text-center p-4 flex flex-col gap-2">
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
              <>
                <label htmlFor={modalId} className="cursor-pointer">
                  <img
                    src={image[0]}
                    alt={artwork.title ?? ""}
                    className="rounded-lg object-cover w-full max-h-[500px]"
                    onClick={() => setShowImageModal(true)}
                  />
                </label>
              </>
            )}
          </div>
          <div className="flex-1">
            <ul>
              <h2 className="text-2xl font-bold">{artwork.title}</h2>
              <p className="text-gray-500 text-xs">
                {artwork.artist}{" "}
                <span className="italic">
                  ({format(new Date(artwork.tag_issued_at || artwork.created_at), "yyyy")})
                </span>
              </p>
            </ul>
            <div className="grid grid-cols-2 gap-4 mt-4">
                <div><strong>Height:</strong> {artwork.height || 'none'}</div>
                <div><strong>Width:</strong> {artwork.width || 'none'}</div>
                <div><strong>Unit of Measure:</strong> {artwork.size_unit || 'none'}</div>
                <div><strong>Medium:</strong> {artwork.medium || 'none'}</div>
                <div className="col-span-2">
                  <strong>Description:</strong>
                  <p>{artwork.description || 'none'}</p>
                </div>
                <div><strong>ID Number:</strong> {artwork.id_number || 'none'}</div>
                <div><strong>Provenance:</strong> {artwork.provenance || 'none'}</div>
                <div className="col-span-2">
                  <strong>Bibliography:</strong>
                  {!artwork.bibliography || artwork.bibliography.length === 0 ? (
                    <p className="text-gray-500">No bibliography available</p>
                  ) : (
                    <ul className="list-disc list-inside mt-1 ml-4">
                      {artwork.bibliography.map((item, i) => (
                        <li key={i} className="text-gray-700">{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="col-span-2">
                  <strong>Collectors:</strong>
                  {!artwork.collectors || artwork.collectors.length === 0 ? (
                    <p className="text-gray-500">No collectors available</p>
                  ) : (
                    <ul className="list-disc list-inside mt-1 ml-4">
                      {artwork.collectors.map((item, i) => (
                        <li key={i} className="text-gray-700">{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div><strong>NFC Tag:</strong> {artwork.tag_id || 'No NFC tag attached'}</div> 
              </div>
          </div>
        </div>
          {showDetachModal && artwork && (
              <DetachNFCModal
                isOpen={showDetachModal}
                onClose={() => setShowDetachModal(false)}
                artworkId={artwork.id}
                tagId={tagId}
                onDetachSuccess={handleDetachConfirm}
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
        {canViewAppraisalDetails && (
          <>
            <div className="divider"></div>
            <AppraisalInfo 
              appraisals={appraisals} 
              artwork_id={artwork.id} 
              canManageAppraisals={canManageAppraisals}
              canCreateAppraisals={canCreateAppraisals}
            />
          </>
        )}
        {showImageModal && (
          <ArtworkImageModal
            images={artwork.assets?.map((asset) => asset.url) || []}
            title={artwork.title ?? ""}
            modalId={modalId}
            onClose={() => setShowImageModal(false)}
          />
        )}
        
        {/* Edit Artwork Modal */}
        {showEditModal && artwork && (
          <EditArtworkModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            artwork={artwork}
            onSave={handleSaveEdit}
          />
        )}

        {/* Attach NFC Modal */}
        {showAttachModal && artwork && (
          <AttachNFCModal
            isOpen={showAttachModal}
            onClose={() => setShowAttachModal(false)}
            artworkId={artwork.id}
            onSuccess={handleAttachSuccess}
          />
        )}
        
        {/* Update Loading Overlay */}
        {isUpdating && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-base-100 rounded-lg p-6 flex flex-col items-center gap-4">
              <div className="loading loading-spinner loading-lg text-primary"></div>
              <p className="text-sm font-medium">Updating artwork...</p>
            </div>
          </div>
        )}
    </div>
  );
};

export default DetailArtwork;