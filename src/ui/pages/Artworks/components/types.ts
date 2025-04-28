interface CSVItem {
    idnumber: string;
    title: string;
    description: string;
    height: string;
    width: string;
    size_unit: string;
    artist: string;
    year: string;
    medium: string;
    tag_id: string;
    expiration_date: string;
    read_write_count: string;
    filename: string;
    url: string;
    provenance: string;
    bibliography: string;
    collectors: string;
    assets?: { filename: string; url: string }[];
  }
  
  export interface UploadButtonProps {
    onFileSelect: (data: CSVItem[]) => void;
  }
  