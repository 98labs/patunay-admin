import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { showNotification } from '../../../components/NotificationMessage/slice';
import AuctionRef from "./AuctionRef";
import { Appraisal } from "../types";
import AppraisalModal from "./AppraisalModal";
import { upsertAppraisal } from "../../../supabase/rpc/upsertAppraisal";

export default function AppraisalInfo(appraisals: { appraisals: Appraisal[], artwork_id: string }) {
  const dispatch = useDispatch();
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSave = async (data: Appraisal) => {
    const { success } = await upsertAppraisal(data, appraisals.artwork_id);
    if (success) {
          dispatch(
            showNotification({
              title: 'ArtList Details',
              message: 'Successfully added.',
              status: 'success'
            })
          );
        } else {
          dispatch(
            showNotification({
              message: 'Failed to save appraisal.',
              status: 'error'
            })
          );
          setModalOpen(false);
          setSelectedAppraisal(null);
        }
  };

  const addRow = () => {
    setModalOpen(true)
  };

  return (
    <div className="container mx-auto px-6 lg:px-8 text-base-content">
        <div className="max-w-2xl mx-auto lg:mx-0">
          <h3 className="text-2xl font-bold text-primary">Appraisal</h3>
        </div>
        
        <AuctionRef
          auctions={appraisals.appraisals}
          addRow={addRow}
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
    </div>
  );
}
