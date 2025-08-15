import { PaginationState } from '@tanstack/react-table';

interface ArtworksPaginationProps {
  pagination: PaginationState;
  onPaginationChange: (pagination: PaginationState) => void;
  totalCount: number;
  pageCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
}

export const ArtworksPagination = ({
  pagination,
  onPaginationChange,
  totalCount,
  pageCount,
  canPreviousPage,
  canNextPage,
}: ArtworksPaginationProps) => {
  const handlePageChange = (pageIndex: number) => {
    onPaginationChange({ ...pagination, pageIndex });
  };

  const handlePageSizeChange = (pageSize: number) => {
    onPaginationChange({ pageIndex: 0, pageSize });
  };

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
            value={pagination.pageSize}
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
            Current Page: {pagination.pageIndex + 1}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.pageIndex - 1)}
              disabled={!canPreviousPage}
              className="flex h-8 w-8 items-center justify-center bg-white hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Previous page"
            >
              {'<'}
            </button>
            <button
              onClick={() => handlePageChange(pagination.pageIndex + 1)}
              disabled={!canNextPage}
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
};
