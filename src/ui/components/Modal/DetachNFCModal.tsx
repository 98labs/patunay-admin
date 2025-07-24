import { useDispatch, useSelector } from 'react-redux';
import { showNotification } from '../NotificationMessage/slice'
import { selectUser } from '../../store/features/auth';
import { useDetachNfcFromArtworkMutation } from '../../store/api/nfcApi';

type DetachNFCProps = {
    tagId: string;
    onClose: () => void;
  };

const DetachNFCModal = ({ tagId, onClose }: DetachNFCProps) => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [detachNfc, { isLoading }] = useDetachNfcFromArtworkMutation();

  const handleDetach = async () => {
    try {
      await detachNfc({ tag_id: tagId }).unwrap();
      
      dispatch(
        showNotification({
          title: 'ArtList',
          message: 'NFC tag detached successfully.',
          status: 'success'
        })
      );
      onClose();
    } catch (error: any) {
      dispatch(
        showNotification({
          message: error.message || 'Failed to detach NFC tag.',
          status: 'error'
        })
      );
    }
  };

  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box">
        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" onClick={onClose}>✕</button>
        <h2 className="text-lg font-semibold mb-4">Are you sure you want to detach the NFC tag?</h2>
        <div className="modal-action">
          <button className="bg-gray-300 px-4 py-2 rounded-md" onClick={onClose} disabled={isLoading}>Cancel</button>
          <button className="bg-red-500 px-4 py-2 rounded-md text-white" onClick={handleDetach} disabled={isLoading}>
            {isLoading ? 'Detaching...' : 'Detach'}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default DetachNFCModal;