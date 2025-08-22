import React from 'react';
import { TableSkeleton, SkeletonColumnConfig } from '../../../components/TableSkeleton';

const NfcTagsSkeleton: React.FC = () => {
  const columns: SkeletonColumnConfig[] = [
    {
      key: 'tagId',
      header: 'Tag ID',
      align: 'left',
      cellRenderer: () => (
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40 font-mono" />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      cellRenderer: () => (
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-16" />
      ),
    },
    {
      key: 'attachedTo',
      header: 'Attached To',
      align: 'left',
      cellRenderer: () => (
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-32" />
      ),
    },
    {
      key: 'readWriteCount',
      header: 'Read/Write Count',
      align: 'center',
      cellRenderer: () => (
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-12" />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created At',
      align: 'left',
      cellRenderer: () => (
        <div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 w-24" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
        </div>
      ),
    },
    {
      key: 'lastUpdated',
      header: 'Last Updated',
      align: 'left',
      cellRenderer: () => (
        <div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1 w-24" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16" />
        </div>
      ),
    },
  ];

  return <TableSkeleton columns={columns} rows={10} showPagination={true} />;
};

export default NfcTagsSkeleton;