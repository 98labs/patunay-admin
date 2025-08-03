import { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { SortingState, ColumnFiltersState, PaginationState } from "@tanstack/react-table";

import { useGetArtworksQuery } from "../../store/api/artworkApi";
import { useAuth } from '../../hooks/useAuth';
import { ImagePreloader } from '../../utils/imagePreloader';

import UploadButton from "./components/UploadButton";
import { ArtworksTable } from "./components/ArtworksTable";
import { ArtworksFilters } from "./components/ArtworksFilters";
import { ArtworksPagination } from "./components/ArtworksPagination";
import { DetachNFCModal, DeleteArtworkModal } from "@components";

const Artworks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get initial page from session storage or URL query params
  const getInitialPage = () => {
    const urlParams = new URLSearchParams(location.search);
    const urlPage = urlParams.get('page');
    if (urlPage) {
      return parseInt(urlPage, 10) - 1; // Convert to 0-based index
    }
    
    const savedPage = sessionStorage.getItem('artworksTablePage');
    return savedPage ? parseInt(savedPage, 10) : 0;
  };
  
  // Table state
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: getInitialPage(),
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
    navigate('/dashboard/artworks/register');
  }, [navigate]);

  // Close modal handlers
  const handleCloseDetachModal = useCallback(() => {
    setShowDetachModal(false);
    setSelectedTagId("");
    refetch();
  }, [refetch]);

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedArtworkId("");
    refetch();
  }, [refetch]);

  // Table data
  const data = useMemo(() => artworksResponse?.data || [], [artworksResponse]);
  const totalCount = artworksResponse?.count || 0;
  const pageCount = Math.ceil(totalCount / pagination.pageSize);
  
  // Save page number to session storage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('artworksTablePage', pagination.pageIndex.toString());
  }, [pagination.pageIndex]);
  
  // Clear URL params after loading
  useEffect(() => {
    if (location.search) {
      navigate(location.pathname, { replace: true });
    }
  }, []);
  
  // Preload images when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      const imageUrls = data
        .map(artwork => artwork.assets?.[0]?.url)
        .filter(Boolean);
      
      // Preload images in the background
      ImagePreloader.preloadImages(imageUrls);
    }
  }, [data]);
  
  // Handle empty page after deletion
  useEffect(() => {
    if (!isLoading && data.length === 0 && pagination.pageIndex > 0 && totalCount > 0) {
      // Current page is empty but there are records, go back one page
      setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
    }
  }, [data.length, pagination.pageIndex, totalCount, isLoading]);

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
    <section className="container text-base-content bg-base-100">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-base-content">
              Artworks
            </h2>
            <p className="text-sm text-base-content/70 mt-1">
              {totalCount} artwork{totalCount !== 1 ? 's' : ''} total
            </p>
          </div>

          <div className="flex items-center mt-4 sm:mt-0">
            <UploadButton onFileSelect={handleFile} />
          </div>
        </div>

        {/* Filters */}
        <ArtworksFilters
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
        />

        {/* Table */}
        <div className="border border-base-300 bg-base-100 rounded-lg shadow-sm">
          <ArtworksTable
            data={data}
            isLoading={isLoading}
            totalCount={totalCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            sorting={sorting}
            onSortingChange={setSorting}
            columnFilters={columnFilters}
            onColumnFiltersChange={setColumnFilters}
            globalFilter={globalFilter}
            onGlobalFilterChange={setGlobalFilter}
          />
        </div>

        {/* Pagination */}
        {data.length > 0 && (
          <ArtworksPagination
            pagination={pagination}
            onPaginationChange={setPagination}
            totalCount={totalCount}
            pageCount={pageCount}
            canPreviousPage={pagination.pageIndex > 0}
            canNextPage={pagination.pageIndex < pageCount - 1}
          />
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