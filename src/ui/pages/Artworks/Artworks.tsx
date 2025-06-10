import { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
  PaginationState,
} from "@tanstack/react-table";

import { useGetArtworksQuery } from "../../store/api/artworkApi";

import UploadButton from "./components/UploadButton";
import { useArtworkColumns } from "./hooks/useArtworkColumns";
import { Loading, DetachNFCModal, DeleteArtworkModal } from "@components";

const Artworks = () => {
  const navigate = useNavigate();
  
  // Table state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  // Modal state
  const [showDetachModal, setShowDetachModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [selectedArtworkId, setSelectedArtworkId] = useState("");

  // Prepare API request parameters
  const requestParams = useMemo(() => {
    const sortBy = sorting[0]?.id || 'created_at';
    const sortOrder = sorting[0]?.desc ? 'desc' : 'asc';
    
    const filters: any = {};
    
    // Apply global search filter
    if (globalFilter) {
      filters.search = globalFilter;
    }
    
    // Apply column filters
    columnFilters.forEach((filter) => {
      if (filter.id === 'tag_id' && filter.value !== 'all') {
        if (filter.value === 'with') {
          filters.hasNfcTag = true;
        } else if (filter.value === 'none') {
          filters.hasNfcTag = false;
        }
      } else if (filter.value) {
        filters[filter.id] = filter.value;
      }
    });

    return {
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      filters,
      sortBy,
      sortOrder,
    };
  }, [pagination, sorting, columnFilters, globalFilter]);

  // Fetch data using RTK Query
  const {
    data: artworksResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetArtworksQuery(requestParams);

  const handleFile = useCallback((file: any) => {
    console.log("Selected file:", file);
    // Navigate to upload/register page
    navigate('/dashboard/artworks/register');
  }, [navigate]);

  // Close modal handlers
  const handleCloseDetachModal = useCallback(() => {
    setShowDetachModal(false);
    setSelectedTagId("");
    refetch(); // Refresh data after detaching
  }, [refetch]);

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedArtworkId("");
    refetch(); // Refresh data after deletion
  }, [refetch]);

  // Table columns
  const columns = useArtworkColumns();

  // Table data
  const data = useMemo(() => artworksResponse?.data || [], [artworksResponse]);
  const totalCount = artworksResponse?.count || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);

  // Table configuration
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
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  if (isError) {
    return (
      <div className="container text-base-content bg-base-100">
        <div className="alert alert-error">
          <span>Error loading artworks: {error?.toString()}</span>
          <button className="btn btn-sm" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="container text-base-content dark:text-base-content bg-base-100 dark:bg-base-100">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-base-content dark:text-base-content border-b border-base-300 dark:border-base-300 pb-3">
              Artworks
            </h2>
            <p className="text-sm text-base-content/70 dark:text-base-content/70 mt-2">
              {totalCount} artwork{totalCount !== 1 ? 's' : ''} total
            </p>
          </div>

          <div className="flex items-center mt-4 sm:mt-0 gap-x-3">
            <UploadButton onFileSelect={handleFile} />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Global Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search artworks..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="input input-bordered w-full"
            />
          </div>

          {/* NFC Filter */}
          <div className="sm:w-48">
            <select
              value={
                columnFilters.find((f) => f.id === "tag_id")?.value || "all"
              }
              onChange={(e) => {
                const value = e.target.value;
                setColumnFilters((prev) => {
                  const filtered = prev.filter((f) => f.id !== "tag_id");
                  if (value !== "all") {
                    filtered.push({ id: "tag_id", value });
                  }
                  return filtered;
                });
              }}
              className="select select-bordered w-full"
            >
              <option value="all">All NFCs</option>
              <option value="with">Attached</option>
              <option value="none">No NFC</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-base-300 dark:border-base-300 bg-base-100 dark:bg-base-100 rounded-lg shadow-sm">
          {isLoading ? (
            <Loading fullScreen={false} />
          ) : (
            <table className="table table-sm table-zebra w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className={`${
                          header.column.columnDef.meta?.className ?? ""
                        } ${
                          header.column.getCanSort()
                            ? "cursor-pointer select-none hover:bg-base-200"
                            : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-2">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <span className="text-xs">
                              {{
                                asc: "↑",
                                desc: "↓",
                              }[header.column.getIsSorted() as string] ?? "↕"}
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
                  <tr key={row.id} className="hover:bg-base-200/50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className={
                          cell.column.columnDef.meta?.className ?? ""
                        }
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Empty State */}
          {!isLoading && data.length === 0 && (
            <div className="text-center py-12">
              <div className="text-base-content/60">
                {globalFilter || columnFilters.length > 0
                  ? "No artworks match your filters"
                  : "No artworks found"}
              </div>
              {(globalFilter || columnFilters.length > 0) && (
                <button
                  className="btn btn-sm btn-ghost mt-2"
                  onClick={() => {
                    setGlobalFilter("");
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
        {data.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Page info */}
            <div className="text-sm text-base-content/70">
              Showing {pagination.pageIndex * pagination.pageSize + 1} to{" "}
              {Math.min(
                (pagination.pageIndex + 1) * pagination.pageSize,
                totalCount
              )}{" "}
              of {totalCount} results
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                className="btn btn-sm btn-ghost"
              >
                {"<<"}
              </button>
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="btn btn-sm btn-ghost"
              >
                {"<"}
              </button>

              <div className="flex items-center gap-1">
                <span className="text-sm">Page</span>
                <input
                  type="number"
                  value={pagination.pageIndex + 1}
                  onChange={(e) => {
                    const page = e.target.value ? Number(e.target.value) - 1 : 0;
                    table.setPageIndex(page);
                  }}
                  className="input input-sm input-bordered w-16 text-center"
                  min={1}
                  max={pageCount}
                />
                <span className="text-sm">of {pageCount}</span>
              </div>

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="btn btn-sm btn-ghost"
              >
                {">"}
              </button>
              <button
                onClick={() => table.setPageIndex(pageCount - 1)}
                disabled={!table.getCanNextPage()}
                className="btn btn-sm btn-ghost"
              >
                {">>"}
              </button>
            </div>

            {/* Page size selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm">Show</span>
              <select
                value={pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
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
        )}
      </div>

      {/* Modals */}
      {showDetachModal && (
        <DetachNFCModal
          tagId={selectedTagId}
          onClose={handleCloseDetachModal}
        />
      )}
      {showDeleteModal && (
        <DeleteArtworkModal
          artworkId={selectedArtworkId}
          onClose={handleCloseDeleteModal}
        />
      )}
    </section>
  );
};

export default Artworks;