import { Table } from '@tanstack/react-table';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalCount?: number;
}

export function DataTablePagination<TData>({ table, totalCount }: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pageCount = table.getPageCount();

  const handlePageSizeChange = (newPageSize: number) => {
    table.setPageSize(newPageSize);
  };

  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-end">
      {/* Results per page and Current page navigation */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span
            className="text-sm whitespace-nowrap"
            style={{ color: 'var(--color-neutral-black-02)' }}
          >
            Results per page
          </span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="select select-sm border border-gray-300 bg-white text-sm"
            style={{
              minWidth: '60px',
              color: 'var(--color-neutral-black-01)',
            }}
          >
            {[10, 20, 30, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4">
          <span
            className="text-sm whitespace-nowrap"
            style={{ color: 'var(--color-neutral-black-02)' }}
          >
            Current Page: {pageIndex + 1}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="flex h-8 w-8 items-center justify-center bg-white hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous page"
            >
              {'<'}
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="flex h-8 w-8 items-center justify-center bg-white hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Next page"
            >
              {'>'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
