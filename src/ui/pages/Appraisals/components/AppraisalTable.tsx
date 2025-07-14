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
import { Loading } from '@components';
import { Appraisal } from '../Appraisals';

interface AppraisalTableProps {
  appraisals: Appraisal[];
  isLoading?: boolean;
  onEditAppraisal: (appraisal: Appraisal) => void;
  onDeleteAppraisal: (appraisal: Appraisal) => void;
  onViewAppraisal: (appraisal: Appraisal) => void;
  className?: string;
}

const AppraisalTable: React.FC<AppraisalTableProps> = ({
  appraisals,
  isLoading = false,
  onEditAppraisal,
  onDeleteAppraisal,
  onViewAppraisal,
  className = '',
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = useMemo<ColumnDef<Appraisal>[]>(() => [
    {
      header: 'Artwork',
      accessorKey: 'artwork.title',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="font-medium text-base-content">
            {row.original.artwork?.title || 'Untitled'}
          </div>
          <div className="text-sm text-base-content/60">
            by {row.original.artwork?.artist || 'Unknown'}
          </div>
          <div className="text-xs text-base-content/50">
            ID: {row.original.artwork?.id_number || 'N/A'}
          </div>
        </div>
      ),
      enableSorting: true,
    },
    {
      header: 'Appraisal Date',
      accessorKey: 'appraisal_date',
      cell: ({ getValue }) => {
        const date = getValue() as string;
        return (
          <span className="text-sm">
            {date ? format(new Date(date), 'MMM dd, yyyy') : 'N/A'}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      header: 'Condition',
      accessorKey: 'condition',
      cell: ({ getValue }) => {
        const condition = getValue() as string;
        return (
          <span className={`badge badge-sm ${
            condition === 'Excellent' ? 'badge-success' :
            condition === 'Good' ? 'badge-info' :
            condition === 'Fair' ? 'badge-warning' :
            'badge-ghost'
          }`}>
            {condition || 'Unknown'}
          </span>
        );
      },
      enableSorting: true,
    },
    {
      header: 'Values',
      id: 'values',
      cell: ({ row }) => (
        <div className="space-y-1">
          <div className="text-sm">
            <span className="text-base-content/60">Acquisition:</span>{' '}
            <span className="font-medium">
              ${row.original.acquisition_cost?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-base-content/60">Appraised:</span>{' '}
            <span className="font-semibold text-success">
              ${row.original.appraised_value?.toLocaleString() || '0'}
            </span>
          </div>
        </div>
      ),
      enableSorting: false,
    },
    {
      header: 'Appraisers',
      accessorKey: 'appraisers',
      cell: ({ getValue }) => {
        const appraisers = getValue() as { name: string }[] | undefined;
        if (!appraisers || appraisers.length === 0) {
          return <span className="text-base-content/60 text-sm">No appraisers</span>;
        }
        return (
          <div className="text-sm">
            {appraisers.map(a => a.name).join(', ')}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      header: 'Recommendation',
      accessorKey: 'recommendation',
      cell: ({ getValue }) => {
        const recommendation = getValue() as string;
        if (!recommendation) {
          return <span className="text-base-content/60 text-sm">None</span>;
        }
        return (
          <div className="text-sm max-w-xs truncate" title={recommendation}>
            {recommendation}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onViewAppraisal(row.original)}
            className="btn btn-ghost btn-xs"
            title="View appraisal details"
            disabled={isLoading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          
          <button
            onClick={() => onEditAppraisal(row.original)}
            className="btn btn-ghost btn-xs"
            title="Edit appraisal"
            disabled={isLoading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          
          <button
            onClick={() => onDeleteAppraisal(row.original)}
            className="btn btn-ghost btn-xs text-error hover:text-error"
            title="Delete appraisal"
            disabled={isLoading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
      enableSorting: false,
    },
  ], [onEditAppraisal, onDeleteAppraisal, onViewAppraisal, isLoading]);

  const table = useReactTable({
    data: appraisals,
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
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase();
      const { artwork, condition, recommendation, appraisers } = row.original;
      
      return (
        artwork?.title?.toLowerCase().includes(searchValue) ||
        artwork?.artist?.toLowerCase().includes(searchValue) ||
        artwork?.id_number?.toLowerCase().includes(searchValue) ||
        condition?.toLowerCase().includes(searchValue) ||
        recommendation?.toLowerCase().includes(searchValue) ||
        appraisers?.some(a => a.name.toLowerCase().includes(searchValue)) ||
        false
      );
    },
  });

  if (isLoading && appraisals.length === 0) {
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
            placeholder="Search appraisals..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="input input-bordered w-full bg-base-100 text-base-content"
            aria-label="Search appraisals"
          />
        </div>

        {/* Condition Filter */}
        <div className="sm:w-48">
          <select
            value={(columnFilters.find((f) => f.id === 'condition')?.value as string) || 'all'}
            onChange={(e) => {
              const value = e.target.value;
              setColumnFilters((prev) => {
                const filtered = prev.filter((f) => f.id !== 'condition');
                if (value !== 'all') {
                  filtered.push({ id: 'condition', value });
                }
                return filtered;
              });
            }}
            className="select select-bordered w-full bg-base-100 text-base-content"
            aria-label="Filter by condition"
          >
            <option value="all">All Conditions</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Poor">Poor</option>
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
                ? 'No appraisals match your filters'
                : 'No appraisals found'}
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

export default AppraisalTable;