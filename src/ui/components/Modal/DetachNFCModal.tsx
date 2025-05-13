import { useState } from 'react';
import { useDispatch } from 'react-redux';
import supabase from "../../supabase";
import { showNotification } from '../NotificationMessage/slice'

type DetachNFCProps = {
    artworkId: string;
    onClose: () => void;
  };

const DetachNFCModal = ({ artworkId, onClose }: DetachNFCProps) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const handleDetach = async () => {
    if (loading) return;
    setLoading(true);
    const { error } = await supabase
      .from('artworks')
      .update({ tag_id: null })
      .eq('id', artworkId);

    setLoading(false);

    if (error) {
      dispatch(
        showNotification({
          message: 'Failed to detach NFC tag.',
          status: 'error'
        })
      );
    } else {
      dispatch(
        showNotification({
          title: 'ArtList',
          message: 'NFC tag detached successfully.',
          status: 'success'
        })
      );
      onClose();
    }
  };

  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
        <h2 className="text-lg font-semibold mb-4">Are you sure you want to detach the NFC tag?</h2>
        <div className="modal-action">
          <button className="bg-gray-300 px-4 py-2 rounded-md" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="bg-red-500 px-4 py-2 rounded-md text-white" onClick={handleDetach} disabled={loading}>Detach</button>
        </div>
      </div>
    </dialog>
  );
};

export default DetachNFCModal;