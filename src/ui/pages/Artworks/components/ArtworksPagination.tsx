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

  const currentStart = pagination.pageIndex * pagination.pageSize + 1;
  const currentEnd = Math.min(
    (pagination.pageIndex + 1) * pagination.pageSize,
    totalCount
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-base-content/70">
        Showing {currentStart} to {currentEnd} of {totalCount} results
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => handlePageChange(0)}
          disabled={!canPreviousPage}
          className="btn btn-sm btn-ghost"
          aria-label="First page"
        >
          {'<<'}
        </button>
        <button
          onClick={() => handlePageChange(pagination.pageIndex - 1)}
          disabled={!canPreviousPage}
          className="btn btn-sm btn-ghost"
          aria-label="Previous page"
        >
          {'<'}
        </button>

        <div className="flex items-center gap-1">
          <span className="text-sm">Page</span>
          <input
            type="number"
            value={pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              if (page >= 0 && page < pageCount) {
                handlePageChange(page);
              }
            }}
            className="input input-sm input-bordered w-16 text-center"
            min={1}
            max={pageCount}
          />
          <span className="text-sm">of {pageCount}</span>
        </div>

        <button
          onClick={() => handlePageChange(pagination.pageIndex + 1)}
          disabled={!canNextPage}
          className="btn btn-sm btn-ghost"
          aria-label="Next page"
        >
          {'>'}
        </button>
        <button
          onClick={() => handlePageChange(pageCount - 1)}
          disabled={!canNextPage}
          className="btn btn-sm btn-ghost"
          aria-label="Last page"
        >
          {'>>'}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm">Show</span>
        <select
          value={pagination.pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className="select select-sm select-bordered"
        >
          {[10, 20, 30, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};