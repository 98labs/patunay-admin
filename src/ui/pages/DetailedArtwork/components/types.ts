import { Appraisal } from "../types";

export interface ArtworkImageModalProps {
    images: string[]; // Array of image URLs
    title: string;
    modalId?: string; // Optional ID for the modal
    onClose?: () => void; // Optional close handler
  }

export interface AuctionRefProps {
  id: number;
  condition: string;
  acquisitionCost: number;
  appraisedValue: number;
  artistInfo: string;
  recentAuctionReferences: string[];
  notes: string;
  recommendation: string;
  appraisalDate: string; // or Date if you normalize it
  appraisedBy: { name: string }[];
}
export interface AuctionProps {
  auctions: Appraisal[];
  addRow: () => void;
  selectedAppraisal?: (data: Appraisal) => void;
  canManageAppraisals?: boolean;
}

export interface AppraisalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Appraisal) => void;
  initialData?: Appraisal;
}