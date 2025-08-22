import React from 'react';
import { TableSkeleton, SkeletonColumnConfig } from '../../../components/TableSkeleton';

const UserTableSkeleton: React.FC = () => {
  const columns: SkeletonColumnConfig[] = [
    {
      key: 'user',
      header: 'User',
      align: 'left',
      cellRenderer: () => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2 w-32" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-40" />
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      align: 'center',
      cellRenderer: () => (
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse w-20" />
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
      key: 'lastLogin',
      header: 'Last Login',
      align: 'left',
      width: 'w-28',
    },
  ];

  return <TableSkeleton columns={columns} rows={10} showPagination={true} />;
};

export default UserTableSkeleton;