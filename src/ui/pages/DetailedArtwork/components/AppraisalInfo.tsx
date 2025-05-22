import React, { useState } from "react";
import AuctionRef from "./AuctionRef";
import { Appraisal } from "../types";
import AppraisalModal from "./AppraisalModal";

export default function AppraisalInfo(appraisals: { appraisals: Appraisal[] }) {
  
  const [data, setData] = useState<Appraisal[]>(appraisals.appraisals)
  const [modalOpen, setModalOpen] = useState(false);

  const addRow = () => {
    setModalOpen(true)
  };

  return (
    <div className="container mx-auto px-6 lg:px-8 text-base-content">
        <div className="max-w-2xl mx-auto lg:mx-0">
          <h3 className="text-2xl font-bold text-primary">Appraisal</h3>
        </div>
        {data.length && (
          <AuctionRef
            auctions={data}
            addRow={addRow}
          />
        )}
        <AppraisalModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={addRow}
      />
    </div>
  );
}
