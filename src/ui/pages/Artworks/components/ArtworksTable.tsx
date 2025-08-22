import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  PaginationState,
  OnChangeFn,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { ArtworkEntity } from '../../../typings';
import { ArtworkImageCell } from './ArtworkImageCell';
import ArtworksSkeleton from './ArtworksSkeleton';
import { Badge } from '@components';

interface ArtworksTableProps {
  data: ArtworkEntity[];
  isLoading: boolean;
  totalCount: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: OnChangeFn<ColumnFiltersState>;
  globalFilter: string;
  onGlobalFilterChange: (filter: string) => void;
}

export const ArtworksTable = ({
  data,
  isLoading,
  totalCount,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  globalFilter,
  onGlobalFilterChange,
}: ArtworksTableProps) => {
  const navigate = useNavigate();

  const columns = useMemo<ColumnDef<ArtworkEntity>[]>(
    () => [
      {
        id: 'id_number',
        header: 'No.',
        accessorKey: 'id_number',
        enableSorting: true,
        size: 80,
        maxSize: 100,
        cell: ({ row }) => (
          <div className="max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--color-neutral-black-01)' }}
            >
              {row.original.id_number || '01'}
            </span>
          </div>
        ),
      },
      {
        id: 'image',
        header: 'Image',
        accessorKey: 'assets',
        enableSorting: false,
        size: 150,
        maxSize: 200,
        cell: ({ row }) => {
          const assets = row.original.assets || [];
          // Filter out assets without URLs and map to expected format
          const validAssets = assets
            .filter((asset) => asset.url && asset.url.trim() !== '')
            .map((asset) => ({
              url: asset.url!,
              id: asset.fileName,
              name: asset.fileName,
            }));

          return (
            <ArtworkImageCell
              artworkId={row.original.id!}
              title={row.original.title}
              assets={validAssets}
            />
          );
        },
      },
      {
        id: 'title',
        header: 'Name',
        accessorKey: 'title',
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-sm font-medium" style={{ color: 'var(--color-neutral-black-01)' }}>
            {row.original.title || 'Untitled'}
          </span>
        ),
      },
      {
        id: 'artist',
        header: 'Author',
        accessorKey: 'artist',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-sm" style={{ color: 'var(--color-neutral-black-02)' }}>
            {(getValue() as string) || 'Unknown Artist'}
          </span>
        ),
      },
      {
        id: 'created_at',
        header: 'Date added',
        accessorKey: 'created_at',
        enableSorting: true,
        cell: ({ getValue }) => {
          const date = getValue() as string;
          if (!date) return <span style={{ color: 'var(--color-neutral-black-02)' }}>—</span>;

          try {
            return (
              <span className="text-sm" style={{ color: 'var(--color-neutral-black-02)' }}>
                {format(new Date(date), 'MMMM dd, yyyy')}
              </span>
            );
          } catch {
            return <span style={{ color: 'var(--color-neutral-black-02)' }}>Invalid date</span>;
          }
        },
      },
      {
        id: 'nfc_status',
        header: 'NFC Status',
        accessorKey: 'tag_id',
        enableSorting: false,
        cell: ({ row }) => {
          const tagId = row.original.tag_id;
          const hasNfc = tagId && tagId.trim() !== '';

          return (
            <div className="flex items-center justify-center">
              {hasNfc ? (
                <Badge className="rounded-lg bg-[var(--color-semantic-success)] text-[var(--color-neutral-white)]">
                  NFC Attached
                </Badge>
              ) : (
                <Badge className="rounded-lg bg-[var(--color-semantic-warning)] text-[var(--color-neutral-white)]">
                  No NFC Issued
                </Badge>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter,
    },
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  if (isLoading) {
    return <ArtworksSkeleton />;
  }

  if (data.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-base-content/60">
          {globalFilter || columnFilters.length > 0
            ? 'No artworks match your filters'
            : 'No artworks found'}
        </p>
        {(globalFilter || columnFilters.length > 0) && (
          <button
            className="btn btn-sm btn-ghost mt-4"
            onClick={() => {
              onGlobalFilterChange('');
              onColumnFiltersChange([]);
            }}
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{
        borderColor: 'var(--color-neutral-gray-01)',
        backgroundColor: 'var(--color-neutral-white)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full" style={{ borderColor: 'var(--color-neutral-gray-01)' }}>
          <thead style={{ backgroundColor: 'var(--color-neutral-gray-01)' }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-6 py-4 text-xs font-semibold tracking-wider uppercase ${
                      header.id === 'nfc_status' || header.id === 'image'
                        ? 'text-center'
                        : 'text-left'
                    } ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                    style={{
                      color: 'var(--color-neutral-black-02)',
                      width: header.getSize(),
                      maxWidth: header.getSize(),
                    }}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div
                      className={`flex items-center gap-2 ${
                        header.id === 'nfc_status' || header.id === 'image' ? 'justify-center' : ''
                      }`}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <span className="text-xs opacity-60">
                          {{
                            asc: '↑',
                            desc: '↓',
                          }[header.column.getIsSorted() as string] ?? '↕'}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody
            style={{
              backgroundColor: 'var(--color-neutral-white)',
            }}
          >
            {table.getRowModel().rows.map((row, index) => (
              <tr
                key={row.id}
                className={`cursor-pointer transition-colors duration-150 hover:!bg-[var(--color-primary-100)]/10 ${
                  index % 2 === 0
                    ? 'bg-[var(--color-neutral-white)]'
                    : 'bg-[var(--color-neutral-gray-01)]/20'
                }`}
                onClick={() => {
                  const artworkId = row.original.id;
                  if (artworkId) {
                    navigate(`/dashboard/artworks/${artworkId}`);
                  }
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-2 text-left whitespace-nowrap"
                    style={{
                      width: cell.column.getSize(),
                      maxWidth: cell.column.getSize(),
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
