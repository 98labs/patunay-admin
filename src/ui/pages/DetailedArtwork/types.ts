export interface ArtworkType {
    id: string;
    id_number: string;
    title: string;
    artist: string;
    size_unit: string;
    height: number;
    width: number;
    medium: string;
    description: string;
    tag_id: string;
    provenance: string;
    bibliography: string[];
    collectors: string[];
    tag_issued_at: string;
    assets: { filename: string; url: string }[];
    active?: boolean;
    artwork_appraisals?: Appraisal[];
  }

export interface Appraisal {
    id?: string;
    condition: string;
    acquisitionCost: number;
    appraisedValue: number;
    artistInfo: string;
    recentAuctionReferences: string[];
    notes: string;
    recommendation: string;
    appraisalDate: string;
    appraisedBy: { name: string }[];
    recent_auction_references?: string[];
    artist_info?: string;
  }
