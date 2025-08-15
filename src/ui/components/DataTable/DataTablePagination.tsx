import { Table } from '@tanstack/react-table';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalCount?: number;
}

export function DataTablePagination<TData>({ table, totalCount }: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();

  // Calculate showing range
  const startItem = pageIndex * pageSize + 1;
  const endItem = Math.min(
    (pageIndex + 1) * pageSize,
    totalCount || table.getFilteredRowModel().rows.length
  );
  const total = totalCount || table.getFilteredRowModel().rows.length;

  const handlePageSizeChange = (newPageSize: number) => {
    table.setPageSize(newPageSize);
  };

  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between">
      {/* Results per page */}
      <div className="flex items-center gap-2">
        <span className="text-sm" style={{ color: 'var(--color-neutral-black-02)' }}>
          Results per page:
        </span>
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className="select select-sm border-0 bg-transparent focus:outline-none"
          style={{ color: 'var(--color-neutral-black-02)' }}
        >
          {[10, 20, 30, 40, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-4">
        {/* Showing info */}
        <span className="text-sm" style={{ color: 'var(--color-neutral-black-02)' }}>
          Showing {startItem}-{endItem} of {total}
        </span>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: 'var(--color-neutral-black-02)' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15,18 9,12 15,6"></polyline>
            </svg>
          </button>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded p-2 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: 'var(--color-neutral-black-02)' }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
