import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SortingState, ColumnFiltersState, PaginationState } from '@tanstack/react-table';

import { useGetArtworksQuery, ArtworkFilters } from '../../store/api/artworkApi';
import { ImagePreloader } from '../../utils/imagePreloader';

import { ArtworksTable } from './components/ArtworksTable';
import { ArtworksFilters } from './components/ArtworksFilters';
import { ArtworksPagination } from './components/ArtworksPagination';
import { DetachNFCModal, DeleteArtworkModal, PageHeader } from '@components';

const Artworks = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'created_at', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Modal state
  const [showDetachModal, setShowDetachModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState('');
  const [selectedArtworkId, setSelectedArtworkId] = useState('');

  // Prepare API request parameters
  const requestParams = useMemo(() => {
    const sortBy =
      (sorting[0]?.id as 'created_at' | 'title' | 'artist' | 'updated_at') || 'created_at';
    const sortOrder = (sorting[0]?.desc ? 'desc' : 'asc') as 'asc' | 'desc';

    const filters: ArtworkFilters = {};

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
        // Handle other filter types based on the ArtworkFilters interface
        if (filter.id === 'artist' && typeof filter.value === 'string') {
          filters.artist = filter.value;
        } else if (filter.id === 'status' && typeof filter.value === 'string') {
          filters.status = filter.value;
        } else if (filter.id === 'dateFrom' && typeof filter.value === 'string') {
          filters.dateFrom = filter.value;
        } else if (filter.id === 'dateTo' && typeof filter.value === 'string') {
          filters.dateTo = filter.value;
        }
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

  // Close modal handlers
  const handleCloseDetachModal = useCallback(() => {
    setShowDetachModal(false);
    setSelectedTagId('');
    refetch();
  }, [refetch]);

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setSelectedArtworkId('');
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
  }, [location.pathname, location.search, navigate]);

  // Preload images when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      const imageUrls = data.map((artwork) => artwork.assets?.[0]?.url).filter(Boolean);

      // Preload images in the background
      ImagePreloader.preloadImages(imageUrls);
    }
  }, [data]);

  // Handle empty page after deletion
  useEffect(() => {
    if (!isLoading && data.length === 0 && pagination.pageIndex > 0 && totalCount > 0) {
      // Current page is empty but there are records, go back one page
      setPagination((prev) => ({ ...prev, pageIndex: prev.pageIndex - 1 }));
    }
  }, [data.length, pagination.pageIndex, totalCount, isLoading]);

  if (isError) {
    return (
      <div className="text-base-content bg-base-100 container">
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
    <section className="text-base-content bg-base-100 container">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <PageHeader name="Artworks" />

        {/* Filters */}
        <ArtworksFilters
          globalFilter={globalFilter}
          onGlobalFilterChange={setGlobalFilter}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          onDataRefresh={refetch}
        />

        {/* Table */}
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

        {/* Pagination */}
        <ArtworksPagination
          pagination={pagination}
          onPaginationChange={setPagination}
          totalCount={totalCount}
          pageCount={pageCount}
          canPreviousPage={pagination.pageIndex > 0}
          canNextPage={pagination.pageIndex < pageCount - 1}
        />
      </div>

      {/* Modals */}
      {showDetachModal && <DetachNFCModal tagId={selectedTagId} onClose={handleCloseDetachModal} />}
      {showDeleteModal && (
        <DeleteArtworkModal artworkId={selectedArtworkId} onClose={handleCloseDeleteModal} />
      )}
    </section>
  );
};

export default Artworks;
