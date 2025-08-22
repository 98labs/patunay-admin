import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { Button, Loading, PageHeader, SideDrawer, StatusIndicator, ActionBox } from '@components';
import { showNotification } from '../../components/NotificationMessage/slice';
import { getTags, Tag } from '../../supabase/rpc/getTags';
import { registerTag } from '../../supabase/rpc/registerTag';
import { updateTagStatus } from '../../supabase/rpc/updateTagStatus';
import { useNfcStatus } from '../../context/NfcStatusContext';
import { useGetUserStatsQuery } from 'store';
import { Row, createColumnHelper } from '@tanstack/react-table';
import { format } from 'date-fns';
import { NfcTagsDataTable } from './components/NfcTagsDataTable';
import { useGetUserQuery } from '../../store/api/userManagementApiV2';

const NfcTags = () => {
  const dispatch = useDispatch();
  const { isNfcAvailable, nfcFeaturesEnabled, deviceStatus } = useNfcStatus();
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

  const fetchTags = useCallback(async () => {
    try {
      const data = await getTags();
      setTags(data);
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
      window.electron.setMode('Read');
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
  };

  const handleOpenDrawer = useCallback((row: Row<Tag>) => {
    setSelectedTag(row.original);
    setIsDrawerOpened(true);
    setIsEditMode(false);
  }, []);

  // Fetch user data for created_by and updated_by
  const { data: createdByUser } = useGetUserQuery(selectedTag?.created_by || '', {
    skip: !selectedTag?.created_by,
  });
  
  const { data: updatedByUser } = useGetUserQuery(selectedTag?.updated_by || '', {
    skip: !selectedTag?.updated_by,
  });

  // Column helper for type safety
  const columnHelper = createColumnHelper<Tag>();

  // Table columns
  const columns = useMemo(
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
            <span className={`badge badge-sm ${isActive ? 'badge-success' : 'badge-error'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
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
        (card: { uid: string; data: any }) => {
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
  }, []);

  if (loading) return <Loading fullScreen={false} />;

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
      <NfcTagsDataTable
        data={tags}
        columns={columns}
        isLoading={loading}
        emptyMessage="No tags registered yet"
        centerAlignColumns={['active', 'read_write_count']}
        enablePagination={true}
        enableSorting={true}
        enableFiltering={true}
        onRowClick={handleOpenDrawer}
      />

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
              <h3 className="mb-2 text-xs font-semibold text-gray-500 uppercase">
                Attached Artwork
              </h3>
              <p className="text-sm">{selectedTag?.artwork_title || 'Unknown Artwork'}</p>
              <p className="mt-1 text-xs text-gray-500">ID: {selectedTag?.artwork_id}</p>
            </div>
          )}

          {/* Creation and Update Information */}
          <div className="space-y-3 border-t pt-4 border-b pb-4">
            {/* Created By and Created At */}
            <div className="flex gap-4">
              <div className="flex-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase">Created By</h3>
                <div className="mt-1">
                  {selectedTag?.created_by ? (
                    createdByUser?.data ? (
                      <div>
                        <span className="text-sm font-medium">
                          {createdByUser.data.first_name || createdByUser.data.last_name
                            ? `${createdByUser.data.first_name || ''} ${createdByUser.data.last_name || ''}`.trim()
                            : createdByUser.data.email}
                        </span>
                        <span className="text-xs text-gray-500 block">{createdByUser.data.email}</span>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-gray-500">{selectedTag.created_by}</span>
                    )
                  ) : (
                    <span className="text-xs text-gray-500">—</span>
                  )}
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xs font-semibold text-gray-500 uppercase">Created At</h3>
                <span className="text-sm block mt-1">
                  {selectedTag?.created_at ? format(new Date(selectedTag.created_at), 'PPpp') : 'N/A'}
                </span>
              </div>
            </div>

            {/* Updated By and Updated At */}
            {(selectedTag?.updated_by || selectedTag?.updated_at) && (
              <div className="flex gap-4 mt-4">
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">Updated By</h3>
                  <div className="mt-1">
                    {selectedTag?.updated_by ? (
                      updatedByUser?.data ? (
                        <div>
                          <span className="text-sm font-medium">
                            {updatedByUser.data.first_name || updatedByUser.data.last_name
                              ? `${updatedByUser.data.first_name || ''} ${updatedByUser.data.last_name || ''}`.trim()
                              : updatedByUser.data.email}
                          </span>
                          <span className="text-xs text-gray-500 block">{updatedByUser.data.email}</span>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-gray-500">{selectedTag.updated_by}</span>
                      )
                    ) : (
                      <span className="text-xs text-gray-500">—</span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase">Updated At</h3>
                  <span className="text-sm block mt-1">
                    {selectedTag?.updated_at ? format(new Date(selectedTag.updated_at), 'PPpp') : '—'}
                  </span>
                </div>
              </div>
            )}

            {/* Expiration Date if exists */}
            {selectedTag?.expiration_date && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase">Expiration Date</h3>
                <span className="text-sm block mt-1">
                  {format(new Date(selectedTag.expiration_date), 'PPpp')}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-4">
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
          </div>
        </div>
      </SideDrawer>
    </div>
  );
};

export default NfcTags;
