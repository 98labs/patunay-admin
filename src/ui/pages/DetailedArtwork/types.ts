export interface ArtworkType {
    idnumber: string;
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
  }