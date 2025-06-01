import { memo, useMemo } from "react";
import { TableProps } from "./types";

const TablePagination = <T,>({ table }: TableProps<T>) => {
  const pageSizeOptions = useMemo(() => [10, 20, 30, 40, 50], []);
  
  return (
    <div className="flex items-center justify-between mt-6">
      <button
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
        className="btn btn-soft btn-primary"
      >
        ⬅ Prev
      </button>

      <div className="items-center hidden md:flex gap-x-3 join">
        <div className="join-item btn btn-disabled">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
      </div>

      <select
        className="select select-primary"
        value={table.getState().pagination.pageSize}
        onChange={e => table.setPageSize(Number(e.target.value))}
      >
        {pageSizeOptions.map(size => (
          <option key={size} value={size}>
            Show {size}
          </option>
        ))}
      </select>

      <button
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
        className="btn btn-soft btn-primary"
      >
        Next ➡
      </button>
    </div>
  );
};

export default memo(TablePagination) as typeof TablePagination;
