import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Appraisal } from "../types";
import { useAppraisalColumns } from "../hooks/useAppraisalColumns";

interface AppraisalTableProps {
  appraisals: Appraisal[];
  onAddAppraisal: () => void;
  onSelectAppraisal?: (appraisal: Appraisal) => void;
  canManageAppraisals?: boolean;
  isLoading?: boolean;
}

export default function AppraisalTable({
  appraisals,
  onAddAppraisal,
  onSelectAppraisal,
  canManageAppraisals = false,
  isLoading = false,
}: AppraisalTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'appraisalDate',
      desc: true, // Sort by most recent first
    }
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useAppraisalColumns();

  const table = useReactTable({
    data: appraisals,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 3, // Show only 3 records per page
      },
      sorting: [
        {
          id: 'appraisalDate',
          desc: true,
        }
      ],
    },
  });

  return (
    <div className="space-y-4">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Search appraisals..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="input input-bordered input-sm w-full"
          />
        </div>
        {canManageAppraisals && (
          <button 
            className="btn btn-primary btn-sm" 
            onClick={onAddAppraisal}
          >
            Add Appraisal
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-base-300 rounded-lg relative">
        {isLoading && (
          <div className="absolute inset-0 bg-base-100/50 flex items-center justify-center z-10">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        )}
        <table className="table table-zebra w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`${
                      header.column.getCanSort() 
                        ? "cursor-pointer select-none hover:bg-base-200" 
                        : ""
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {header.column.getCanSort() && (
                        <span className="text-xs">
                          {{
                            asc: "↑",
                            desc: "↓",
                          }[header.column.getIsSorted() as string] ?? (
                            <span className="opacity-30">↕</span>
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length} 
                  className="text-center py-8 text-base-content/60"
                >
                  No appraisals found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={`${
                    onSelectAppraisal 
                      ? "cursor-pointer hover:bg-base-200 active:bg-base-300 transition-colors" 
                      : ""
                  }`}
                  onClick={() => {
                    if (onSelectAppraisal) {
                      onSelectAppraisal(row.original);
                    }
                  }}
                  title={onSelectAppraisal ? "Click to view appraisal details" : undefined}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - Always show if there are any records */}
      {appraisals.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-base-300">
          <div className="flex items-center gap-4">
            <div className="text-sm text-base-content/70">
              Showing{" "}
              {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}-
              {Math.min(
                (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                table.getFilteredRowModel().rows.length
              )}{" "}
              of {table.getFilteredRowModel().rows.length} appraisal(s)
            </div>
            {/* Page size selector */}
            <select
              className="select select-bordered select-sm"
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              <option value={3}>3 per page</option>
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
            </select>
          </div>
          <div className="join">
            <button
              className="join-item btn btn-sm"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              title="First page"
            >
              «
            </button>
            <button
              className="join-item btn btn-sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              title="Previous page"
            >
              ‹
            </button>
            <button className="join-item btn btn-sm btn-active">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </button>
            <button
              className="join-item btn btn-sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              title="Next page"
            >
              ›
            </button>
            <button
              className="join-item btn btn-sm"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              title="Last page"
            >
              »
            </button>
          </div>
        </div>
      )}
    </div>
  );
}