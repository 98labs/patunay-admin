import { Table } from "@tanstack/react-table";
import { Dispatch, SetStateAction } from 'react';

interface CSVItem {
    id_number: string;
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
  
  export type TableProps<T> = {
    table: Table<T>;
  };
  
  export type TableFilterProp<T> = {
    table: Table<T>;
    globalFilter: string;
    setGlobalFilter: Dispatch<SetStateAction<string>>;
    nfcFilter: 'all' | 'with' | 'detach' | 'none';
    setNfcFilter: Dispatch<SetStateAction<'all' | 'with' | 'detach' | 'none'>>;
  };