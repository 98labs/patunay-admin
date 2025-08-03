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
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { ArtworkEntity } from '../../../typings';
import { ArtworkImageCell } from './ArtworkImageCell';

interface ArtworksTableProps {
  data: ArtworkEntity[];
  isLoading: boolean;
  totalCount: number;
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  columnFilters: ColumnFiltersState;
  onColumnFiltersChange: (filters: ColumnFiltersState) => void;
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
  const columns = useMemo<ColumnDef<ArtworkEntity>[]>(
    () => [
      {
        id: 'id_number',
        header: 'ID Number',
        accessorKey: 'id_number',
        enableSorting: true,
        cell: ({ row }) => (
          <Link
            to={`/dashboard/artworks/${row.original.id}`}
            className="font-mono text-sm link link-primary hover:link-secondary"
            onClick={() => {
              // Page is already saved in session storage by the parent component
            }}
          >
            #{row.original.id_number || 'N/A'}
          </Link>
        ),
      },
      {
        id: 'image',
        header: 'Image',
        accessorKey: 'assets',
        enableSorting: false,
        cell: ({ row }) => {
          const firstAsset = row.original.assets?.[0];
          const imageUrl = firstAsset?.url;

          return (
            <ArtworkImageCell
              artworkId={row.original.id!}
              title={row.original.title}
              imageUrl={imageUrl}
            />
          );
        },
      },
      {
        id: 'title',
        header: 'Title',
        accessorKey: 'title',
        enableSorting: true,
        cell: ({ row }) => (
          <Link
            to={`/dashboard/artworks/${row.original.id}`}
            className="font-medium link link-primary hover:link-secondary"
            onClick={() => {
              // Page is already saved in session storage by the parent component
            }}
          >
            {row.original.title || 'Untitled'}
          </Link>
        ),
      },
      {
        id: 'artist',
        header: 'Artist',
        accessorKey: 'artist',
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="text-sm">{(getValue() as string) || 'Unknown Artist'}</span>
        ),
      },
      {
        id: 'created_at',
        header: 'Date Added',
        accessorKey: 'created_at',
        enableSorting: true,
        cell: ({ getValue }) => {
          const date = getValue() as string;
          if (!date) return <span className="text-base-content/60">—</span>;

          try {
            return (
              <span className="text-sm text-base-content/70">
                {format(new Date(date), 'MMM dd, yyyy')}
              </span>
            );
          } catch {
            return <span className="text-base-content/60">Invalid date</span>;
          }
        },
      },
      {
        id: 'nfc_status',
        header: 'NFC Status',
        accessorKey: 'tag_id',
        enableSorting: false,
        cell: ({ row }) => {
          const hasNfc = row.original.tag_id && row.original.tag_id.trim() !== '';

          return (
            <span
              className={`badge badge-sm ${
                hasNfc ? 'badge-success' : 'badge-error'
              }`}
            >
              {hasNfc ? 'Attached' : 'No NFC'}
            </span>
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
    return (
      <div className="flex items-center justify-center py-16">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16">
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
    <div className="overflow-x-auto">
      <table className="table table-zebra w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={
                    header.column.getCanSort()
                      ? 'cursor-pointer select-none hover:bg-base-200'
                      : ''
                  }
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-2">
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
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
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};