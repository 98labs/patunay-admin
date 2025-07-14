import { useState, useMemo } from 'react';
import { format } from 'date-fns';
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

import { Tag } from '../../supabase/rpc/getTags';
import { Loading, Button } from '@components';

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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = useMemo<ColumnDef<Tag>[]>(() => [
    {
      header: 'Tag ID',
      accessorKey: 'id',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm text-base-content">{getValue<string>()}</span>
      ),
      enableSorting: true,
    },
    {
      header: 'Status',
      accessorKey: 'active',
      cell: ({ getValue }) => {
        const isActive = getValue() as boolean;
        return (
          <span className={`badge badge-sm ${isActive ? 'badge-success' : 'badge-error'}`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
      enableSorting: true,
      filterFn: (row, columnId, filterValue) => {
        if (filterValue === 'all') return true;
        if (filterValue === 'active') return row.original.active;
        if (filterValue === 'inactive') return !row.original.active;
        return true;
      },
    },
    {
      header: 'Attached To',
      accessorKey: 'artwork_title',
      cell: ({ getValue }) => {
        const title = getValue() as string | null;
        return title ? (
          <span className="text-sm text-base-content">{title}</span>
        ) : (
          <span className="text-base-content/60 text-sm italic">Not attached</span>
        );
      },
      enableSorting: true,
      filterFn: (row, columnId, filterValue) => {
        if (filterValue === 'all') return true;
        if (filterValue === 'attached') return !!row.original.artwork_id;
        if (filterValue === 'unattached') return !row.original.artwork_id;
        return true;
      },
    },
    {
      header: 'Read/Write Count',
      accessorKey: 'read_write_count',
      cell: ({ getValue }) => (
        <span className="text-center text-base-content">{getValue<number>()}</span>
      ),
      enableSorting: true,
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: ({ getValue }) => {
        const createdAt = getValue() as string;
        if (!createdAt) return <span className="text-base-content/60">—</span>;
        
        const date = new Date(createdAt);
        return (
          <div className="text-sm">
            <div className="text-base-content">
              {format(date, 'MMM dd, yyyy')}
            </div>
            <div className="text-xs text-base-content/60">
              {format(date, 'HH:mm')}
            </div>
          </div>
        );
      },
      enableSorting: true,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => {
        const tag = row.original;
        return (
          <Button
            buttonType={tag.active ? "secondary" : "primary"}
            buttonLabel={tag.active ? "Deactivate" : "Activate"}
            className="btn-xs rounded"
            onClick={() => onToggleStatus(tag)}
            disabled={!!tag.artwork_id || isLoading}
          />
        );
      },
      enableSorting: false,
    },
  ], [onToggleStatus, isLoading]);

  const table = useReactTable({
    data: tags,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (isLoading) {
    return <Loading fullScreen={false} />;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Global Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tags..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="input input-bordered w-full bg-base-100 text-base-content"
            aria-label="Search tags"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:w-48">
          <select
            value={columnFilters.find((f) => f.id === 'active')?.value || 'all'}
            onChange={(e) => {
              const value = e.target.value;
              setColumnFilters((prev) => {
                const filtered = prev.filter((f) => f.id !== 'active');
                if (value !== 'all') {
                  filtered.push({ id: 'active', value });
                }
                return filtered;
              });
            }}
            className="select select-bordered w-full bg-base-100 text-base-content"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Attachment Filter */}
        <div className="sm:w-48">
          <select
            value={columnFilters.find((f) => f.id === 'artwork_title')?.value || 'all'}
            onChange={(e) => {
              const value = e.target.value;
              setColumnFilters((prev) => {
                const filtered = prev.filter((f) => f.id !== 'artwork_title');
                if (value !== 'all') {
                  filtered.push({ id: 'artwork_title', value });
                }
                return filtered;
              });
            }}
            className="select select-bordered w-full bg-base-100 text-base-content"
            aria-label="Filter by attachment"
          >
            <option value="all">All Tags</option>
            <option value="attached">Attached</option>
            <option value="unattached">Unattached</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-lg shadow-sm">
        <table className="table table-sm w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-base-200 text-base-content">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`${
                      header.column.getCanSort()
                        ? 'cursor-pointer select-none hover:bg-base-300'
                        : ''
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-2">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <span className="text-xs text-base-content/70">
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
              <tr key={row.id} className="hover:bg-base-200/50 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="text-base-content">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {table.getRowModel().rows.length === 0 && (
          <div className="text-center py-12 bg-base-100">
            <div className="text-base-content/60">
              {globalFilter || columnFilters.length > 0
                ? 'No tags match your filters'
                : 'No tags registered yet'}
            </div>
            {(globalFilter || columnFilters.length > 0) && (
              <button
                className="btn btn-sm btn-ghost mt-2"
                onClick={() => {
                  setGlobalFilter('');
                  setColumnFilters([]);
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {table.getRowModel().rows.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Page info */}
          <div className="text-sm text-base-content/70">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{' '}
            of {table.getFilteredRowModel().rows.length} results
          </div>

          {/* Pagination controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="btn btn-sm btn-ghost"
            >
              {'<<'}
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="btn btn-sm btn-ghost"
            >
              {'<'}
            </button>

            <div className="flex items-center gap-1">
              <span className="text-sm text-base-content">Page</span>
              <input
                type="number"
                value={table.getState().pagination.pageIndex + 1}
                onChange={(e) => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  table.setPageIndex(page);
                }}
                className="input input-sm input-bordered w-16 text-center bg-base-100 text-base-content"
                min={1}
                max={table.getPageCount()}
              />
              <span className="text-sm text-base-content">of {table.getPageCount()}</span>
            </div>

            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="btn btn-sm btn-ghost"
            >
              {'>'}
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="btn btn-sm btn-ghost"
            >
              {'>>'}
            </button>
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content">Show</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              className="select select-sm select-bordered bg-base-100 text-base-content"
              aria-label="Number of rows per page"
            >
              {[10, 20, 30, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default NfcTagsTable;