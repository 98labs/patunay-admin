import { useMemo } from 'react';
import { format } from 'date-fns';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';

import { Tag } from '../../supabase/rpc/getTags';
import { Loading, Button } from '@components';
import { DataTable } from '../DataTable';

interface NfcTagsTableProps {
  tags: Tag[];
  isLoading?: boolean;
  onToggleStatus: (tag: Tag) => void;
  className?: string;
}

const NfcTagsTable: React.FC<NfcTagsTableProps> = ({
  tags,
  isLoading = false,
  onToggleStatus,
  className = '',
}) => {
  const columnHelper = createColumnHelper<Tag>();

  const columns = useMemo<ColumnDef<Tag>[]>(
    () => [
      columnHelper.accessor('id', {
        id: 'id',
        header: 'Tag ID',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm" style={{ color: 'var(--color-neutral-black-01)' }}>
            {getValue()}
          </span>
        ),
        enableSorting: true,
        size: 200,
      }),
      columnHelper.accessor('active', {
        id: 'active',
        header: 'Status',
        cell: ({ getValue }) => {
          const isActive = getValue();
          return (
            <span className={`badge badge-sm ${isActive ? 'badge-success' : 'badge-error'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          );
        },
        enableSorting: true,
        size: 100,
      }),
      columnHelper.accessor('artwork_title', {
        id: 'artwork_title',
        header: 'Attached To',
        cell: ({ getValue }) => {
          const title = getValue();
          return title ? (
            <span className="text-sm" style={{ color: 'var(--color-neutral-black-01)' }}>
              {title}
            </span>
          ) : (
            <span
              className="text-sm italic"
              style={{ color: 'var(--color-neutral-black-02)', opacity: 0.6 }}
            >
              Not attached
            </span>
          );
        },
        enableSorting: true,
        size: 200,
      }),
      columnHelper.accessor('read_write_count', {
        id: 'read_write_count',
        header: 'Read/Write Count',
        cell: ({ getValue }) => (
          <span className="text-sm" style={{ color: 'var(--color-neutral-black-01)' }}>
            {getValue()}
          </span>
        ),
        enableSorting: true,
        size: 120,
      }),
      columnHelper.accessor('created_at', {
        id: 'created_at',
        header: 'Created',
        cell: ({ getValue }) => {
          const createdAt = getValue();
          if (!createdAt)
            return <span style={{ color: 'var(--color-neutral-black-02)', opacity: 0.6 }}>—</span>;

          const date = new Date(createdAt);
          return (
            <div className="text-sm">
              <div style={{ color: 'var(--color-neutral-black-01)' }}>
                {format(date, 'MMM dd, yyyy')}
              </div>
              <div
                className="text-xs"
                style={{ color: 'var(--color-neutral-black-02)', opacity: 0.6 }}
              >
                {format(date, 'HH:mm')}
              </div>
            </div>
          );
        },
        enableSorting: true,
        size: 140,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const tag = row.original;
          return (
            <Button
              buttonType={tag.active ? 'secondary' : 'primary'}
              buttonLabel={tag.active ? 'Deactivate' : 'Activate'}
              className="btn-xs rounded"
              onClick={() => onToggleStatus(tag)}
              disabled={!!tag.artwork_id || isLoading}
            />
          );
        },
        enableSorting: false,
        size: 120,
      }),
    ],
    [columnHelper, onToggleStatus, isLoading]
  );

  if (isLoading) {
    return <Loading fullScreen={false} />;
  }

  return (
    <div className={className}>
      <DataTable
        data={tags}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No tags registered yet"
        centerAlignColumns={['active', 'read_write_count', 'actions']}
        enablePagination={true}
        enableSorting={true}
        enableFiltering={true}
      />
    </div>
  );
};

export default NfcTagsTable;
