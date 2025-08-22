import React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
  OnChangeFn,
  Row,
} from '@tanstack/react-table';
import { NfcTagsPagination } from './NfcTagsPagination';

interface NfcTagsDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enablePagination?: boolean;
  enableSorting?: boolean;
  enableFiltering?: boolean;
  pageSize?: number;
  onRowClick?: (row: Row<TData>) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  centerAlignColumns?: string[];
  totalCount?: number;
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;
  globalFilter?: string;
  onGlobalFilterChange?: (filter: string) => void;
  manualPagination?: boolean;
  manualSorting?: boolean;
  manualFiltering?: boolean;
}

export function NfcTagsDataTable<TData, TValue>({
  columns,
  data,
  enablePagination = true,
  enableSorting = true,
  enableFiltering = false,
  pageSize = 10,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available',
  className = '',
  centerAlignColumns = [],
  totalCount,
  pagination: controlledPagination,
  onPaginationChange,
  sorting: controlledSorting,
  onSortingChange,
  columnFilters: controlledColumnFilters,
  onColumnFiltersChange,
  globalFilter: controlledGlobalFilter,
  onGlobalFilterChange,
  manualPagination = false,
  manualSorting = false,
  manualFiltering = false,
}: NfcTagsDataTableProps<TData, TValue>) {
  const [localSorting, setLocalSorting] = React.useState<SortingState>([]);
  const [localColumnFilters, setLocalColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [localPagination, setLocalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [localGlobalFilter, setLocalGlobalFilter] = React.useState('');

  const sorting = controlledSorting ?? localSorting;
  const setSorting = onSortingChange ?? setLocalSorting;
  const columnFilters = controlledColumnFilters ?? localColumnFilters;
  const setColumnFilters = onColumnFiltersChange ?? setLocalColumnFilters;
  const pagination = controlledPagination ?? localPagination;
  const setPagination = onPaginationChange ?? setLocalPagination;
  const globalFilter = controlledGlobalFilter ?? localGlobalFilter;
  const setGlobalFilter = onGlobalFilterChange ?? setLocalGlobalFilter;

  const pageCount = totalCount ? Math.ceil(totalCount / pagination.pageSize) : undefined;

  const table = useReactTable({
    data,
    columns,
    pageCount,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: enableSorting ? getSortedRowModel() : undefined,
    getFilteredRowModel: enableFiltering ? getFilteredRowModel() : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    manualPagination,
    manualSorting,
    manualFiltering,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
      globalFilter,
    },
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
      <div className="py-16 text-center">
        <p className="text-base-content/60">
          {globalFilter || columnFilters.length > 0 ? `No data matches your filters` : emptyMessage}
        </p>
        {(globalFilter || columnFilters.length > 0) && (
          <button
            className="btn btn-sm btn-ghost mt-4"
            onClick={() => {
              setGlobalFilter('');
              setColumnFilters([]);
            }}
          >
            Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
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
                        centerAlignColumns.includes(header.id) ? 'text-center' : 'text-left'
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
                          centerAlignColumns.includes(header.id) ? 'justify-center' : ''
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
                  className={`transition-colors duration-150 hover:!bg-[var(--color-primary-100)]/10 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${
                    index % 2 === 0
                      ? 'bg-[var(--color-neutral-white)]'
                      : 'bg-[var(--color-neutral-gray-01)]/20'
                  }`}
                  onClick={() => onRowClick?.(row)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-6 py-2 whitespace-nowrap ${
                        centerAlignColumns.includes(cell.column.id) ? 'text-center' : 'text-left'
                      }`}
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

      {enablePagination && <NfcTagsPagination table={table} totalCount={totalCount} />}
    </div>
  );
}