import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { showNotification } from '../../../components/NotificationMessage/slice';
import AppraisalTable from "./AppraisalTable";
import { Appraisal } from "../types";
import AppraisalModal from "./AppraisalModal";
import ViewAppraisalModal from "./ViewAppraisalModal";
import { upsertAppraisal } from "../../../supabase/rpc/upsertAppraisal";
import { getAppraisals } from "../../../supabase/rpc/getAppraisals";

interface AppraisalInfoProps {
  appraisals: Appraisal[];
  artwork_id: string;
  canManageAppraisals: boolean;
  canCreateAppraisals?: boolean;
}

export default function AppraisalInfo({ appraisals: initialAppraisals, artwork_id, canManageAppraisals, canCreateAppraisals }: AppraisalInfoProps) {
  const dispatch = useDispatch();
  const [appraisals, setAppraisals] = useState<Appraisal[]>(initialAppraisals);
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setAppraisals(initialAppraisals);
  }, [initialAppraisals]);

  const refreshAppraisals = async () => {
    setIsRefreshing(true);
    try {
      const freshAppraisals = await getAppraisals(artwork_id);
      setAppraisals(freshAppraisals);
    } catch (error) {
      console.error('Error refreshing appraisals:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSave = async (data: Appraisal) => {
    console.log('AppraisalInfo: Saving appraisal data:', data);
    console.log('AppraisalInfo: Artwork ID:', artwork_id);
    
    try {
      const { success } = await upsertAppraisal(data, artwork_id);
      console.log('AppraisalInfo: Save result:', { success });
      
      if (success) {
        dispatch(
          showNotification({
            title: 'Appraisal',
            message: data.id ? 'Successfully updated.' : 'Successfully added.',
            status: 'success'
          })
        );
        setModalOpen(false);
        setSelectedAppraisal(null);
        // Refresh only the appraisals table
        await refreshAppraisals();
      } else {
        console.error('AppraisalInfo: Save failed, success is false');
        dispatch(
          showNotification({
            message: 'Failed to save appraisal.',
            status: 'error'
          })
        );
        setModalOpen(false);
        setSelectedAppraisal(null);
      }
    } catch (error) {
      console.error('AppraisalInfo: Error saving appraisal:', error);
      dispatch(
        showNotification({
          message: 'Failed to save appraisal: ' + (error as Error).message,
          status: 'error'
        })
      );
      setModalOpen(false);
      setSelectedAppraisal(null);
    }
  };

  const handleSelectedAppraisal = (appraisal: Appraisal) => {
    setSelectedAppraisal(appraisal);
    setViewModalOpen(true);
  };

  const handleAddAppraisal = () => {
    setSelectedAppraisal(null);
    setModalOpen(true);
  };

  const handleEditAppraisal = () => {
    setViewModalOpen(false);
    setModalOpen(true);
  };

  return (
    <div className="container mx-auto px-6 lg:px-8 text-base-content">
      <div className="space-y-6">
        <div className="max-w-2xl mx-auto lg:mx-0">
          <h3 className="text-2xl font-bold text-primary">Appraisals</h3>
        </div>
        
        <AppraisalTable
          appraisals={appraisals}
          onAddAppraisal={handleAddAppraisal}
          onSelectAppraisal={handleSelectedAppraisal}
          canManageAppraisals={canManageAppraisals || canCreateAppraisals || false}
          isLoading={isRefreshing}
        />

        <AppraisalModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedAppraisal(null);
          }}
          initialData={selectedAppraisal}
          onSubmit={handleSave}
        />

        <ViewAppraisalModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedAppraisal(null);
          }}
          appraisal={selectedAppraisal}
          onEdit={handleEditAppraisal}
          canEdit={canManageAppraisals}
        />
      </div>
    </div>
  );
}
