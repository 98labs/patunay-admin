import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { showNotification } from '../NotificationMessage/slice'
import { deleteArtwork } from "../../supabase/rpc/deleteArtwork";
import { useNavigate } from 'react-router-dom';

type DeleteArtworkProps = {
    artworkId: string;
    onClose: () => void;
  };

const DeleteArtworkModal = ({ artworkId, onClose }: DeleteArtworkProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleDetach = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await deleteArtwork(artworkId as string);

      if (result) {
        dispatch(
          showNotification({
            title: 'ArtList',
            message: 'Artwork successfull deleted.',
            status: 'success'
          })
        );
        onClose();
        navigate(`/dashboard/artworks/`);
      }
    } catch (error) {
      dispatch(
        showNotification({
          message: 'Failed to delete artwork.',
          status: 'error'
        })
      );
      console.error("Failed to delete artwork:", error);
    }
    setLoading(false);
  };

  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
        <h2 className="text-lg font-semibold mb-4">Are you sure you want to delete Artwork?</h2>
        <div className="modal-action">
          <button className="bg-gray-300 px-4 py-2 rounded-md" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="bg-red-500 px-4 py-2 rounded-md text-white" onClick={handleDetach} disabled={loading}>Delete</button>
        </div>
      </div>
    </dialog>
  );
};

export default DeleteArtworkModal;