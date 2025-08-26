import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button, PageHeader, SideDrawer, StatusIndicator, ActionBox, Badge } from '@components';
import { showNotification } from '../../components/NotificationMessage/slice';
import { getTags, Tag } from '../../supabase/rpc/getTags';
import { registerTag } from '../../supabase/rpc/registerTag';
import { updateTagStatus } from '../../supabase/rpc/updateTagStatus';
import { useNfcStatus } from '../../context/NfcStatusContext';
import { NfcModeEntity } from '../../typings/enums/nfcEnum';
import { Row, createColumnHelper, ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { NfcTagsDataTable } from './components/NfcTagsDataTable';
import NfcTagsSkeleton from './components/NfcTagsSkeleton';
import { ArtworkInfoSkeleton, UserInfoSkeleton } from './components/SideDrawerSkeletons';
import { useGetUserQuery } from '../../store/api/userManagementApiV2';
import { getArtwork } from '../../supabase/rpc/getArtwork';

const NfcTags = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isNfcAvailable, nfcFeaturesEnabled } = useNfcStatus();
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasProcessedCard = useRef(false);

  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDrawerOpened, setIsDrawerOpened] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<any>(null);
  const [loadingArtwork, setLoadingArtwork] = useState(false);

  const fetchTags = useCallback(async () => {
    try {
      const data = await getTags();

      // Sort tags: attached artworks first (descending date), then unattached
      const sortedData = [...data].sort((a, b) => {
        // First, separate by attachment status
        const aHasArtwork = !!a.artwork_id;
        const bHasArtwork = !!b.artwork_id;

        if (aHasArtwork && !bHasArtwork) return -1;
        if (!aHasArtwork && bHasArtwork) return 1;

        // If both have artworks or both don't, sort by created_at descending
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      });

      setTags(sortedData);
    } catch (error) {
      console.error('Error fetching tags:', error);
      dispatch(
        showNotification({
          message: 'Failed to load tags',
          status: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Debug effect to monitor artwork state changes
  useEffect(() => {
    console.log('Selected artwork state updated:', selectedArtwork);
  }, [selectedArtwork]);

  const handleStopScanning = useCallback(() => {
    console.log('📟 Stopping NFC scanning...');
    setIsScanning(false);
    hasProcessedCard.current = false;

    // Clear the timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }

    // Unsubscribe from NFC events
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, []);

  const handleStartScanning = useCallback(() => {
    // Check if NFC is available before starting scan
    if (!isNfcAvailable || !nfcFeaturesEnabled) {
      dispatch(
        showNotification({
          title: 'NFC Not Available',
          message: 'NFC service is not available. Please check your NFC reader connection.',
          status: 'warning',
        })
      );
      return;
    }

    console.log('📟 Starting NFC scanning for tag registration...');
    setIsScanning(true);
    hasProcessedCard.current = false;

    // Set NFC to read mode
    if (window.electron?.setMode) {
      console.log('📟 Setting NFC to Read mode');
      window.electron.setMode(NfcModeEntity.Read);
    }

    dispatch(
      showNotification({
        title: 'NFC Scanner',
        message: 'Please tap an NFC tag to register it',
        status: 'info',
      })
    );

    // Set a timeout to automatically stop scanning after 30 seconds
    scanTimeoutRef.current = setTimeout(() => {
      console.log('📟 Scanning timeout reached');
      dispatch(
        showNotification({
          message: 'NFC scanning timed out. Please try again.',
          status: 'warning',
        })
      );
      handleStopScanning();
    }, 30000); // 30 seconds timeout
  }, [dispatch, handleStopScanning, isNfcAvailable, nfcFeaturesEnabled]);

  const handleRegisterTag = useCallback(
    async (tagId: string) => {
      // Prevent duplicate registrations
      if (isRegistering || hasProcessedCard.current) {
        console.log('📟 Already processing a card, ignoring duplicate event');
        return;
      }

      console.log('📟 NFC tag detected for registration:', tagId);

      if (!tagId || tagId.trim() === '') {
        console.error('Invalid NFC tag ID received');
        dispatch(
          showNotification({
            message: 'Failed to register tag: Invalid tag ID',
            status: 'error',
          })
        );
        handleStopScanning();
        return;
      }

      setIsRegistering(true);
      hasProcessedCard.current = true;
      handleStopScanning();

      try {
        await registerTag(tagId);

        dispatch(
          showNotification({
            title: 'Success',
            message: `NFC tag ${tagId} registered successfully`,
            status: 'success',
          })
        );

        // Refresh the tags list
        await fetchTags();
      } catch (error) {
        console.error('Failed to register tag:', error);
        dispatch(
          showNotification({
            message: `Failed to register tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
            status: 'error',
          })
        );
      } finally {
        setIsRegistering(false);
      }
    },
    [dispatch, fetchTags, handleStopScanning, isRegistering]
  );

  const handleToggleStatus = useCallback(
    async (tag: Tag) => {
      try {
        await updateTagStatus(tag.id, !tag.active);

        dispatch(
          showNotification({
            message: `Tag ${tag.active ? 'deactivated' : 'activated'} successfully`,
            status: 'success',
          })
        );

        // Refresh the tags list
        await fetchTags();
      } catch (error) {
        console.error('Failed to update tag status:', error);
        dispatch(
          showNotification({
            message: `Failed to update tag: ${error instanceof Error ? error.message : 'Unknown error'}`,
            status: 'error',
          })
        );
      }
    },
    [dispatch, fetchTags]
  );

  const handleCloseDrawer = () => {
    setIsDrawerOpened(false);
    setIsEditMode(false);
    setSelectedTag(null);
    setSelectedArtwork(null);
    setLoadingArtwork(false);
  };

  const handleOpenDrawer = useCallback(
    async (row: Row<Tag>) => {
      console.log('Opening drawer for tag:', row.original);

      // Reset states first
      setSelectedArtwork(null);
      setLoadingArtwork(false);

      // Set the selected tag and open drawer
      setSelectedTag(row.original);
      setIsDrawerOpened(true);
      setIsEditMode(false);

      // Fetch artwork details if tag is attached
      if (row.original.artwork_id) {
        console.log('Fetching artwork with ID:', row.original.artwork_id);
        setLoadingArtwork(true);
        try {
          const artworkData = await getArtwork(row.original.artwork_id);
          console.log('Fetched artwork data:', artworkData);
          // Ensure we're getting the first element if it's an array
          const artwork = Array.isArray(artworkData) ? artworkData[0] : artworkData;
          console.log('Processed artwork object:', artwork);
          console.log('Artwork assets:', artwork?.assets);
          setSelectedArtwork(artwork);
        } catch (error) {
          console.error('Failed to fetch artwork details:', error);
          dispatch(
            showNotification({
              message: 'Failed to load artwork details',
              status: 'error',
            })
          );
          setSelectedArtwork(null);
        } finally {
          setLoadingArtwork(false);
        }
      } else {
        console.log('No artwork_id found on tag:', row.original);
        setSelectedArtwork(null);
      }
    },
    [dispatch]
  );

  // Fetch user data for created_by and updated_by
  const { data: createdByUser, isLoading: isLoadingCreatedBy } = useGetUserQuery(
    selectedTag?.created_by || '',
    {
      skip: !selectedTag?.created_by,
    }
  );

  const { data: updatedByUser, isLoading: isLoadingUpdatedBy } = useGetUserQuery(
    selectedTag?.updated_by || '',
    {
      skip: !selectedTag?.updated_by,
    }
  );

  // Fetch tag issuer info if artwork is loaded
  const { data: tagIssuerUser, isLoading: isLoadingTagIssuer } = useGetUserQuery(
    selectedArtwork?.tag_issued_by || '',
    {
      skip: !selectedArtwork?.tag_issued_by,
    }
  );

  // Column helper for type safety
  const columnHelper = createColumnHelper<Tag>();

  // Table columns
  const columns = useMemo<ColumnDef<Tag, any>[]>(
    () => [
      columnHelper.accessor('id', {
        id: 'id',
        header: 'Tag ID',
        cell: ({ getValue }) => (
          <span className="font-mono text-sm" style={{ color: 'var(--color-neutral-black-01)' }}>
            {getValue()}
          </span>
        ),
        enableSorting: true,
        size: 200,
      }),
      columnHelper.accessor('active', {
        id: 'active',
        header: 'Status',
        cell: ({ getValue }) => {
          const isActive = getValue();
          return (
            <Badge
              className={`rounded-lg ${
                isActive
                  ? 'bg-[var(--color-semantic-success)] text-[var(--color-neutral-white)]'
                  : 'bg-[var(--color-semantic-error)] text-[var(--color-neutral-white)]'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          );
        },
        enableSorting: true,
        size: 100,
      }),
      columnHelper.accessor('artwork_title', {
        id: 'artwork_title',
        header: 'Attached To',
        cell: ({ getValue }) => {
          const title = getValue();
          return title ? (
            <span className="text-sm" style={{ color: 'var(--color-neutral-black-01)' }}>
              {title}
            </span>
          ) : (
            <span
              className="text-sm italic"
              style={{ color: 'var(--color-neutral-black-02)', opacity: 0.6 }}
            >
              Not attached
            </span>
          );
        },
        enableSorting: true,
        size: 200,
      }),
      columnHelper.accessor('read_write_count', {
        id: 'read_write_count',
        header: 'Read/Write Count',
        cell: ({ getValue }) => (
          <span className="text-sm" style={{ color: 'var(--color-neutral-black-01)' }}>
            {getValue()}
          </span>
        ),
        enableSorting: true,
        size: 120,
      }),
      columnHelper.accessor('created_at', {
        id: 'created_at',
        header: 'Created At',
        cell: ({ getValue }) => {
          const createdAt = getValue();
          if (!createdAt)
            return <span style={{ color: 'var(--color-neutral-black-02)', opacity: 0.6 }}>—</span>;

          const date = new Date(createdAt);
          return (
            <div className="text-sm">
              <div style={{ color: 'var(--color-neutral-black-01)' }}>
                {format(date, 'MMM dd, yyyy')}
              </div>
              <div
                className="text-xs"
                style={{ color: 'var(--color-neutral-black-02)', opacity: 0.6 }}
              >
                {format(date, 'HH:mm')}
              </div>
            </div>
          );
        },
        enableSorting: true,
        size: 140,
      }),
      columnHelper.accessor('updated_at', {
        id: 'updated_at',
        header: 'Last Updated',
        cell: ({ getValue }) => {
          const updatedAt = getValue();
          if (!updatedAt)
            return <span style={{ color: 'var(--color-neutral-black-02)', opacity: 0.6 }}>—</span>;

          const date = new Date(updatedAt);
          return (
            <div className="text-sm">
              <div style={{ color: 'var(--color-neutral-black-01)' }}>
                {format(date, 'MMM dd, yyyy')}
              </div>
              <div
                className="text-xs"
                style={{ color: 'var(--color-neutral-black-02)', opacity: 0.6 }}
              >
                {format(date, 'HH:mm')}
              </div>
            </div>
          );
        },
        enableSorting: true,
        size: 140,
      }),
    ],
    [columnHelper]
  );

  // NFC scanning effect
  useEffect(() => {
    console.log('📟 NFC scanning effect triggered, isScanning:', isScanning);

    if (!isScanning) {
      // Clean up when not scanning
      if (unsubscribeRef.current) {
        console.log('📟 Cleaning up existing subscription');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    // Check if electron API is available
    if (!window.electron?.subscribeNfcCardDetection) {
      console.error('📟 Electron API not available');
      dispatch(
        showNotification({
          message:
            'NFC functionality is not available. Please ensure you are running the desktop application.',
          status: 'warning',
        })
      );
      setIsScanning(false);
      return;
    }

    // Clean up any existing subscription before creating a new one
    if (unsubscribeRef.current) {
      console.log('📟 Cleaning up existing subscription before creating new one');
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    console.log('📟 Setting up NFC card detection subscription...');

    try {
      // Subscribe to NFC card detection
      const unsubscribe = window.electron.subscribeNfcCardDetection(
        (card: { uid: string; data?: string }) => {
          console.log('📟 NFC card detected in registration mode:', card);
          // Only handle if we're still scanning and haven't processed a card yet
          if (isScanning && !hasProcessedCard.current) {
            handleRegisterTag(card.uid);
          }
        }
      );

      console.log('📟 Subscription created, unsubscribe function:', typeof unsubscribe);

      // Store the unsubscribe function if it exists
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribeRef.current = unsubscribe;
      } else {
        console.warn('📟 No unsubscribe function returned from subscribeNfcCardDetection');
      }
    } catch (error) {
      console.error('📟 Error setting up NFC subscription:', error);
      dispatch(
        showNotification({
          message: 'Failed to start NFC scanning. Please try again.',
          status: 'error',
        })
      );
      setIsScanning(false);
    }

    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        console.log('📟 Cleaning up NFC subscription from effect cleanup...');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isScanning, handleRegisterTag, dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('📟 Component unmounting - cleaning up...');

      // Stop scanning if active
      if (isScanning) {
        setIsScanning(false);
      }

      // Clear any timeouts
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
        scanTimeoutRef.current = null;
      }

      // Unsubscribe from NFC events
      if (unsubscribeRef.current) {
        console.log('📟 Cleaning up NFC subscription...');
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [isScanning]);

  return (
    <div className="container mx-auto space-y-6 px-4">
      <div className="flex items-center justify-between">
        <PageHeader name="NFC Tags Management" />

        <div className="flex items-center gap-3">
          <div className="text-base-content/70 text-sm">{tags.length} tags</div>
          {isScanning ? (
            <Button
              buttonType="secondary"
              buttonLabel="Cancel Scanning"
              className="btn animate-pulse"
              onClick={handleStopScanning}
            />
          ) : (
            <Button
              buttonType="primary"
              buttonLabel={
                !isNfcAvailable || !nfcFeaturesEnabled ? 'NFC Not Available' : 'Register New Tag'
              }
              className="btn"
              onClick={handleStartScanning}
              disabled={!isNfcAvailable || !nfcFeaturesEnabled}
            />
          )}
        </div>
      </div>

      {/* NFC Tags Table */}
      {loading ? (
        <NfcTagsSkeleton />
      ) : (
        <NfcTagsDataTable
          data={tags}
          columns={columns}
          isLoading={false}
          emptyMessage="No tags registered yet"
          centerAlignColumns={['active', 'read_write_count']}
          enablePagination={true}
          enableSorting={true}
          enableFiltering={true}
          onRowClick={handleOpenDrawer}
        />
      )}

      {/* NFC Scanning Indicator */}
      {isScanning && (
        <div className="bg-base-100 border-primary fixed right-4 bottom-4 flex animate-pulse items-center gap-3 rounded-lg border p-4 shadow-lg">
          <div className="loading loading-spinner loading-sm text-primary"></div>
          <div>
            <p className="text-base-content text-sm font-semibold">NFC Scanner Active</p>
            <p className="text-base-content/70 text-xs">Tap an NFC tag to register</p>
          </div>
        </div>
      )}

      {/* Registration Loading */}
      {isRegistering && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-base-100 border-base-300 flex flex-col items-center gap-4 rounded-lg border p-6">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="text-base-content text-sm font-medium">Registering tag...</p>
          </div>
        </div>
      )}

      <SideDrawer
        width={480}
        headerTitle="NFC Tag Details"
        isDrawerOpen={isDrawerOpened}
        onClose={handleCloseDrawer}
      >
        <div className="flex flex-col gap-4 p-8">
          {/* Tag Basic Info */}
          <div className="border-b pb-4">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase">Tag ID</h3>
              <span className="font-mono text-lg">{selectedTag?.id}</span>
            </div>

            <div className="flex gap-4">
              <div>
                <h3 className="mb-1 text-xs font-semibold text-gray-500 uppercase">Status</h3>
                <StatusIndicator isActive={selectedTag?.active || false} />
              </div>

              <div>
                <h3 className="mb-1 text-xs font-semibold text-gray-500 uppercase">
                  Read/Write Count
                </h3>
                <span className="text-sm">{selectedTag?.read_write_count || 0}</span>
              </div>
            </div>
          </div>

          {/* Artwork Information */}
          {selectedTag?.artwork_id && (
            <div className="border-b pb-4">
              <h3 className="mb-3 text-xs font-semibold text-gray-500 uppercase">
                Attached Artwork
              </h3>
              {loadingArtwork ? (
                <ArtworkInfoSkeleton />
              ) : selectedArtwork ? (
                <div className="space-y-3">
                  {/* Artwork Image */}
                  {(() => {
                    // Handle different possible image data structures
                    let imageUrl = null;

                    if (
                      selectedArtwork.assets &&
                      Array.isArray(selectedArtwork.assets) &&
                      selectedArtwork.assets.length > 0
                    ) {
                      // Use assets array (actual structure from API)
                      imageUrl = selectedArtwork.assets[0].url;
                    } else if (
                      selectedArtwork.images &&
                      Array.isArray(selectedArtwork.images) &&
                      selectedArtwork.images.length > 0
                    ) {
                      // Fallback to images array if it exists
                      imageUrl =
                        selectedArtwork.images[0].url || selectedArtwork.images[0].image_url;
                    } else if (selectedArtwork.image_url) {
                      // If there's a direct image_url property
                      imageUrl = selectedArtwork.image_url;
                    } else if (selectedArtwork.image) {
                      // If there's an image property
                      imageUrl =
                        typeof selectedArtwork.image === 'string'
                          ? selectedArtwork.image
                          : selectedArtwork.image?.url || selectedArtwork.image?.image_url;
                    }

                    return imageUrl ? (
                      <div className="mb-3">
                        <img
                          src={imageUrl}
                          alt={selectedArtwork.title || 'Artwork'}
                          className="h-48 w-full cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-90"
                          onClick={() => navigate(`/dashboard/artworks/${selectedArtwork.id}`)}
                          onError={(e) => {
                            console.error('Failed to load image:', imageUrl);
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : null;
                  })()}

                  {/* Artwork Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500">Title</span>
                      <p
                        className="cursor-pointer text-sm font-medium text-[var(--color-primary-500)] transition-colors hover:text-[var(--color-primary-600)] hover:underline"
                        onClick={() => navigate(`/dashboard/artworks/${selectedArtwork.id}`)}
                      >
                        {selectedArtwork.title}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs text-gray-500">Artist</span>
                      <p className="text-sm">{selectedArtwork.artist}</p>
                    </div>

                    {selectedArtwork.medium && (
                      <div>
                        <span className="text-xs text-gray-500">Medium</span>
                        <p className="text-sm">{selectedArtwork.medium}</p>
                      </div>
                    )}

                    {selectedArtwork.year && (
                      <div>
                        <span className="text-xs text-gray-500">Year</span>
                        <p className="text-sm">{selectedArtwork.year}</p>
                      </div>
                    )}

                    {(selectedArtwork.height || selectedArtwork.width) && (
                      <div>
                        <span className="text-xs text-gray-500">Dimensions</span>
                        <p className="text-sm">
                          {selectedArtwork.height && `${selectedArtwork.height}`}
                          {selectedArtwork.height && selectedArtwork.width && ' × '}
                          {selectedArtwork.width && `${selectedArtwork.width}`}
                          {selectedArtwork.size_unit && ` ${selectedArtwork.size_unit}`}
                        </p>
                      </div>
                    )}

                    {(selectedArtwork.idnumber || selectedArtwork.id_number) && (
                      <div>
                        <span className="text-xs text-gray-500">ID Number</span>
                        <p className="text-sm">
                          {selectedArtwork.idnumber || selectedArtwork.id_number}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Tag Issuer Information */}
                  {selectedArtwork.tag_issued_by && (
                    <div className="mt-3">
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <span className="text-xs text-gray-500">Tag Issued By</span>
                          <div className="mt-1">
                            {isLoadingTagIssuer ? (
                              <UserInfoSkeleton />
                            ) : tagIssuerUser?.data ? (
                              <div>
                                <span className="text-sm font-medium">
                                  {tagIssuerUser.data.first_name || tagIssuerUser.data.last_name
                                    ? `${tagIssuerUser.data.first_name || ''} ${tagIssuerUser.data.last_name || ''}`.trim()
                                    : tagIssuerUser.data.email}
                                </span>
                              </div>
                            ) : (
                              <span className="font-mono text-xs text-gray-500">
                                {selectedArtwork.tag_issued_by}
                              </span>
                            )}
                          </div>
                        </div>

                        {selectedArtwork.tag_issued_at && (
                          <div className="flex-1">
                            <span className="text-xs text-gray-500">Issued At</span>
                            <p className="mt-1 text-sm">
                              {format(new Date(selectedArtwork.tag_issued_at), 'PP')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm">{selectedTag?.artwork_title || 'Unknown Artwork'}</p>
                  <p className="mt-1 text-xs text-gray-500">ID: {selectedTag?.artwork_id}</p>
                </div>
              )}
            </div>
          )}

          {/* Creation and Update Information */}
          <div className="space-y-3 border-b pt-4 pb-4">
            {/* Created By and Created At */}
            <div className="flex gap-4">
              <div className="flex-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase">Created By</h3>
                <div className="mt-1">
                  {selectedTag?.created_by ? (
                    isLoadingCreatedBy ? (
                      <UserInfoSkeleton />
                    ) : createdByUser?.data ? (
                      <div>
                        <span className="text-sm font-medium">
                          {createdByUser.data.first_name || createdByUser.data.last_name
                            ? `${createdByUser.data.first_name || ''} ${createdByUser.data.last_name || ''}`.trim()
                            : createdByUser.data.email}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {createdByUser.data.email}
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-gray-500">
                        {selectedTag.created_by}
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase">Created At</h3>
                <span className="mt-1 block text-sm">
                  {selectedTag?.created_at
                    ? format(new Date(selectedTag.created_at), 'PPpp')
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Updated By and Updated At */}
            {(selectedTag?.updated_by || selectedTag?.updated_at) && (
              <div className="mt-4 flex gap-4">
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">Updated By</h3>
                  <div className="mt-1">
                    {selectedTag?.updated_by ? (
                      isLoadingUpdatedBy ? (
                        <UserInfoSkeleton />
                      ) : updatedByUser?.data ? (
                        <div>
                          <span className="text-sm font-medium">
                            {updatedByUser.data.first_name || updatedByUser.data.last_name
                              ? `${updatedByUser.data.first_name || ''} ${updatedByUser.data.last_name || ''}`.trim()
                              : updatedByUser.data.email}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {updatedByUser.data.email}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-gray-500">
                          {selectedTag.updated_by}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">Updated At</h3>
                  <span className="mt-1 block text-sm">
                    {selectedTag?.updated_at
                      ? format(new Date(selectedTag.updated_at), 'PPpp')
                      : '—'}
                  </span>
                </div>
              </div>
            )}

            {/* Expiration Date if exists */}
            {selectedTag?.expiration_date && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase">Expiration Date</h3>
                <span className="mt-1 block text-sm">
                  {format(new Date(selectedTag.expiration_date), 'PPpp')}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4">
            {selectedTag?.artwork_id && (
              <ActionBox
                title="Detach from Artwork"
                description="Remove this tag from the attached artwork"
                buttonText="Detach Tag"
                borderColorClass="border-[var(--color-accent-yellow-400)]/50"
                boxBgClass="bg-[var(--color-accent-yellow-200)]/50"
                buttonBgClass="bg-[var(--color-accent-yellow-400)]/30"
                buttonHoverBgClass="hover:bg-[var(--color-accent-yellow-400)]/60"
                textColor="text-[var(--color-accent-yellow-600)]"
                onButtonClick={() => {
                  // TODO: Implement detach functionality
                  dispatch(
                    showNotification({
                      message: 'Detach functionality not yet implemented',
                      status: 'info',
                    })
                  );
                }}
              />
            )}

            <ActionBox
              title={selectedTag?.active ? 'Deactivate Tag' : 'Activate Tag'}
              description={
                selectedTag?.active ? 'Deactivate this NFC tag' : 'Activate this NFC tag'
              }
              buttonText={selectedTag?.active ? 'Deactivate' : 'Activate'}
              borderColorClass={
                selectedTag?.active
                  ? 'border-[var(--color-tertiary-red-400)]/50'
                  : 'border-[var(--color-tertiary-green-400)]/50'
              }
              boxBgClass={
                selectedTag?.active
                  ? 'bg-[var(--color-tertiary-red-200)]/50'
                  : 'bg-[var(--color-tertiary-green-200)]/20'
              }
              buttonBgClass={
                selectedTag?.active
                  ? 'bg-[var(--color-tertiary-red-400)]/30'
                  : 'bg-[var(--color-tertiary-green-400)]/30'
              }
              buttonHoverBgClass={
                selectedTag?.active
                  ? 'hover:bg-[var(--color-tertiary-red-400)]/60'
                  : 'hover:bg-[var(--color-tertiary-green-400)]/60'
              }
              textColor={
                selectedTag?.active
                  ? 'text-[var(--color-tertiary-red-600)]'
                  : 'text-[var(--color-tertiary-green-600)]'
              }
              onButtonClick={() => {
                if (selectedTag) {
                  handleToggleStatus(selectedTag);
                  handleCloseDrawer();
                }
              }}
            />
          </div>
        </div>
      </SideDrawer>
    </div>
  );
};

export default NfcTags;
