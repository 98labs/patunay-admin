import React from 'react';
import { TableSkeleton, SkeletonColumnConfig } from '../../../components/TableSkeleton';

const ArtworksSkeleton: React.FC = () => {
  const columns: SkeletonColumnConfig[] = [
    {
      key: 'id_number',
      header: 'No.',
      align: 'left',
      cellRenderer: () => (
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12" />
      ),
    },
    {
      key: 'image',
      header: 'Image',
      align: 'center',
      cellRenderer: () => (
        <div className="flex items-center justify-center">
          <div className="h-20 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
      ),
    },
    {
      key: 'title',
      header: 'Name',
      align: 'left',
      cellRenderer: () => (
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
      ),
    },
    {
      key: 'artist',
      header: 'Author',
      align: 'left',
      cellRenderer: () => (
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-28" />
      ),
    },
    {
      key: 'created_at',
      header: 'Date added',
      align: 'left',
      cellRenderer: () => (
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
      ),
    },
    {
      key: 'nfc_status',
      header: 'NFC Status',
      align: 'center',
      cellRenderer: () => (
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-24" />
      ),
    },
  ];

  return <TableSkeleton columns={columns} rows={10} showPagination={false} />;
};

export default ArtworksSkeleton;