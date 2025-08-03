import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { showNotification } from '../NotificationMessage/slice'
import { deleteArtwork } from "../../supabase/rpc/deleteArtwork";
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../store/api';

type DeleteArtworkProps = {
    artworkId: string;
    onClose: () => void;
  };

const DeleteArtworkModal = ({ artworkId, onClose }: DeleteArtworkProps) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const handleDetach = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const result = await deleteArtwork(artworkId as string);

      if (result) {
        // Invalidate the artwork list cache to refresh the table
        dispatch(api.util.invalidateTags([{ type: 'Artwork', id: 'LIST' }]));
        
        dispatch(
          showNotification({
            title: 'ArtList',
            message: 'Artwork successfully deleted.',
            status: 'success'
          })
        );
        onClose();
        
        // Check if we're in the artworks list page or detail page
        if (location.pathname.includes('/dashboard/artworks/')) {
          // We're in detail page, navigate back to list
          const savedPage = sessionStorage.getItem('artworksTablePage');
          const pageQuery = savedPage && savedPage !== '0' ? `?page=${savedPage}` : '';
          navigate(`/dashboard/artworks${pageQuery}`);
        } else {
          // We're already in the list page, just refresh
          // The cache invalidation will trigger a refetch
        }
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