import { useState, useCallback, useEffect } from 'react';
import { 
  PageHeader, 
  Loading,
  ConfirmationModal,
} from '@components';
import AppraisalTable from './components/AppraisalTable';
import AppraisalForm from './components/AppraisalForm';
import { useNotification } from '../../hooks/useNotification';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthV2 as useAuth } from '../../hooks/useAuthV2';
import { Navigate } from 'react-router-dom';
import supabase from '../../supabase';
import { format } from 'date-fns';

export interface Appraisal {
  id: string;
  artwork_id: string;
  artwork?: {
    id: string;
    title: string;
    artist: string;
    id_number: string;
  };
  condition: string;
  acquisition_cost: number;
  appraised_value: number;
  artist_info: string;
  recent_auction_references: string[];
  notes: string;
  recommendation: string;
  appraisal_date: string;
  appraisers?: { name: string }[];
  created_at: string;
  updated_at: string;
}

export interface CreateAppraisalData {
  artwork_id: string;
  condition: string;
  acquisition_cost: number;
  appraised_value: number;
  artist_info: string;
  recent_auction_references: string[];
  notes: string;
  recommendation: string;
  appraisal_date: string;
  appraisers: string[];
}

export interface UpdateAppraisalData extends Partial<CreateAppraisalData> {
  id: string;
}

type ViewMode = 'list' | 'create' | 'edit' | 'view';

const Appraisals = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null);
  const [appraisals, setAppraisals] = useState<Appraisal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionTargetAppraisal, setActionTargetAppraisal] = useState<Appraisal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSuccess, showError } = useNotification();
  const { canCreateAppraisals, canManageAppraisals, canManageOrgAppraisals, canManageAllAppraisals, canUpdateAppraisals, canViewAppraisalDetails, hasRole, hasPermission } = usePermissions();
  const { user, currentOrganization, organizations, isAppraiser, isLoading: isAuthLoading } = useAuth();

  // Fetch all appraisals
  const fetchAppraisals = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('artwork_appraisals')
        .select(`
          id,
          artwork_id,
          condition,
          acquisition_cost,
          appraised_value,
          artist_info,
          recent_auction_references,
          notes,
          recommendation,
          appraisal_date,
          created_at,
          updated_at,
          artworks!inner (
            id,
            title,
            artist,
            id_number
          )
        `)
        .order('appraisal_date', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform data
      const transformedData: Appraisal[] = (data || []).map(item => ({
        id: item.id,
        artwork_id: item.artwork_id,
        artwork: item.artworks,
        condition: item.condition || '',
        acquisition_cost: item.acquisition_cost || 0,
        appraised_value: item.appraised_value || 0,
        artist_info: item.artist_info || '',
        recent_auction_references: item.recent_auction_references || [],
        notes: item.notes || '',
        recommendation: item.recommendation || '',
        appraisal_date: item.appraisal_date,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));

      // Fetch appraisers for each appraisal
      for (const appraisal of transformedData) {
        const { data: appraisersData } = await supabase
          .from('appraisal_appraisers')
          .select(`
            artwork_appraisers (
              name
            )
          `)
          .eq('appraisal_id', appraisal.id)
          .is('deleted_at', null);

        appraisal.appraisers = appraisersData?.map(a => ({
          name: a.artwork_appraisers?.name || ''
        })) || [];
      }

      setAppraisals(transformedData);
    } catch (err) {
      console.error('Error fetching appraisals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load appraisals');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAppraisals();
  }, [fetchAppraisals]);

  // Handlers
  const handleCreateAppraisal = useCallback(async (appraisalData: CreateAppraisalData) => {
    try {
      setIsSubmitting(true);
      
      // Create appraisal
      const { data: newAppraisal, error: createError } = await supabase
        .from('artwork_appraisals')
        .insert({
          artwork_id: appraisalData.artwork_id,
          condition: appraisalData.condition,
          acquisition_cost: appraisalData.acquisition_cost,
          appraised_value: appraisalData.appraised_value,
          artist_info: appraisalData.artist_info,
          recent_auction_references: appraisalData.recent_auction_references?.filter(r => r && r.trim()) || [],
          notes: appraisalData.notes,
          recommendation: appraisalData.recommendation,
          appraisal_date: appraisalData.appraisal_date,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add appraisers
      if (appraisalData.appraisers && appraisalData.appraisers.length > 0) {
        for (const appraiserName of appraisalData.appraisers.filter(a => a && a.trim())) {
          // First, create or get the appraiser
          const { data: appraiser, error: appraiserError } = await supabase
            .from('artwork_appraisers')
            .upsert({ name: appraiserName })
            .select()
            .single();

          if (appraiserError) throw appraiserError;

          // Link appraiser to appraisal
          const { error: linkError } = await supabase
            .from('appraisal_appraisers')
            .insert({
              appraisal_id: newAppraisal.id,
              appraiser_id: appraiser.id,
            });

          if (linkError) throw linkError;
        }
      }

      showSuccess('Appraisal created successfully');
      setViewMode('list');
      fetchAppraisals();
    } catch (error: any) {
      showError(error?.message || 'Failed to create appraisal');
    } finally {
      setIsSubmitting(false);
    }
  }, [showSuccess, showError, fetchAppraisals]);

  const handleUpdateAppraisal = useCallback(async (appraisalData: UpdateAppraisalData) => {
    try {
      setIsSubmitting(true);
      
      const { id, appraisers, recent_auction_references, ...updateData } = appraisalData;
      
      // Clean the data
      const cleanedData = {
        ...updateData,
        recent_auction_references: recent_auction_references?.filter(r => r && r.trim()) || []
      };
      
      // Update appraisal
      const { error: updateError } = await supabase
        .from('artwork_appraisals')
        .update(cleanedData)
        .eq('id', id);

      if (updateError) throw updateError;

      // Update appraisers if provided
      if (appraisers) {
        // Soft delete existing appraisers
        const { error: deleteError } = await supabase
          .from('appraisal_appraisers')
          .update({ deleted_at: new Date().toISOString() })
          .eq('appraisal_id', id)
          .is('deleted_at', null);

        if (deleteError) throw deleteError;

        // Add new appraisers
        for (const appraiserName of appraisers.filter(a => a && a.trim())) {
          const { data: appraiser, error: appraiserError } = await supabase
            .from('artwork_appraisers')
            .upsert({ name: appraiserName })
            .select()
            .single();

          if (appraiserError) throw appraiserError;

          const { error: linkError } = await supabase
            .from('appraisal_appraisers')
            .insert({
              appraisal_id: id,
              appraiser_id: appraiser.id,
            });

          if (linkError) throw linkError;
        }
      }

      showSuccess('Appraisal updated successfully');
      setViewMode('list');
      setSelectedAppraisal(null);
      fetchAppraisals();
    } catch (error: any) {
      showError(error?.message || 'Failed to update appraisal');
    } finally {
      setIsSubmitting(false);
    }
  }, [showSuccess, showError, fetchAppraisals]);

  const handleDeleteAppraisal = useCallback((appraisal: Appraisal) => {
    setActionTargetAppraisal(appraisal);
    setShowDeleteModal(true);
  }, []);

  const confirmDeleteAppraisal = useCallback(async () => {
    if (!actionTargetAppraisal) return;

    try {
      setIsDeleting(true);
      
      // Delete appraisal (cascade will handle appraisal_appraisers)
      const { error } = await supabase
        .from('artwork_appraisals')
        .delete()
        .eq('id', actionTargetAppraisal.id);

      if (error) throw error;

      showSuccess('Appraisal deleted successfully');
      setShowDeleteModal(false);
      setActionTargetAppraisal(null);
      fetchAppraisals();
    } catch (error: any) {
      showError(error?.message || 'Failed to delete appraisal');
    } finally {
      setIsDeleting(false);
    }
  }, [actionTargetAppraisal, showSuccess, showError, fetchAppraisals]);

  const handleEditAppraisal = useCallback((appraisal: Appraisal) => {
    setSelectedAppraisal(appraisal);
    setViewMode('edit');
  }, []);

  const handleViewAppraisal = useCallback((appraisal: Appraisal) => {
    setSelectedAppraisal(appraisal);
    setViewMode('view');
  }, []);

  const handleCancelForm = useCallback(() => {
    setViewMode('list');
    setSelectedAppraisal(null);
  }, []);

  const handleFormSubmit = useCallback((data: any) => {
    if (viewMode === 'create') {
      handleCreateAppraisal(data);
    } else if (viewMode === 'edit' && selectedAppraisal) {
      handleUpdateAppraisal({
        id: selectedAppraisal.id,
        ...data,
      });
    }
  }, [viewMode, selectedAppraisal, handleCreateAppraisal, handleUpdateAppraisal]);

  // Fetch appraisals on mount
  useEffect(() => {
    fetchAppraisals();
  }, [fetchAppraisals]);

  // Check if user is appraiser in primary role or any organization
  const isPrimaryAppraiser = user?.role === 'appraiser';
  const isOrgAppraiser = organizations.some(org => org.role === 'appraiser');
  
  // Check if user has any appraisal permissions or is an appraiser
  const hasAppraisalAccess = isPrimaryAppraiser || isOrgAppraiser || isAppraiser || canCreateAppraisals || canManageAppraisals || canManageOrgAppraisals || canManageAllAppraisals || canUpdateAppraisals || canViewAppraisalDetails;

  // Show loading while auth is still loading or organization is not set
  if (isAuthLoading || currentOrganization === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  // Redirect if no access
  if (!hasAppraisalAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  // Loading state
  if (isLoading && appraisals.length === 0) {
    return <Loading fullScreen={false} />;
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto px-4">
        <PageHeader title="Appraisals" subtitle="Manage artwork appraisals" />
        <div className="alert alert-error">
          <div>
            <h3 className="font-bold">Error Loading Appraisals</h3>
            <div className="text-sm mt-2">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Appraisals" subtitle="Manage artwork appraisals" />
        
        {viewMode === 'list' && (
          <div className="flex items-center gap-3">
            <div className="text-sm text-base-content/70">
              {appraisals.length} appraisals
            </div>
            <button
              onClick={() => setViewMode('create')}
              className="btn btn-primary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Appraisal
            </button>
          </div>
        )}
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <AppraisalTable
          appraisals={appraisals}
          isLoading={isLoading}
          onEditAppraisal={handleEditAppraisal}
          onDeleteAppraisal={handleDeleteAppraisal}
          onViewAppraisal={handleViewAppraisal}
        />
      )}

      {/* Create/Edit Form */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <AppraisalForm
          appraisal={selectedAppraisal}
          mode={viewMode}
          isLoading={isSubmitting}
          onSubmit={handleFormSubmit}
          onCancel={handleCancelForm}
        />
      )}

      {/* View Appraisal Details */}
      {viewMode === 'view' && selectedAppraisal && (
        <div className="bg-base-100 border border-base-300 rounded-lg p-6 max-w-4xl mx-auto text-base-content">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Appraisal Details</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditAppraisal(selectedAppraisal)}
                className="btn btn-primary btn-sm"
              >
                Edit
              </button>
              <button
                onClick={handleCancelForm}
                className="btn btn-ghost btn-sm"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-base-300 pb-2">
                Artwork Information
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-base-content/70">Artwork</label>
                  <p className="text-base-content">
                    {selectedAppraisal.artwork?.title} by {selectedAppraisal.artwork?.artist}
                  </p>
                  <p className="text-sm text-base-content/60">ID: {selectedAppraisal.artwork?.id_number}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-base-content/70">Condition</label>
                  <p className="text-base-content">{selectedAppraisal.condition}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-base-content/70">Acquisition Cost</label>
                  <p className="text-base-content">${selectedAppraisal.acquisition_cost.toLocaleString()}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-base-content/70">Appraised Value</label>
                  <p className="text-base-content font-semibold text-lg">
                    ${selectedAppraisal.appraised_value.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-base-content/70">Appraisal Date</label>
                  <p className="text-base-content">
                    {format(new Date(selectedAppraisal.appraisal_date), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium border-b border-base-300 pb-2">
                Additional Information
              </h3>
              
              <div className="space-y-3">
                {selectedAppraisal.appraisers && selectedAppraisal.appraisers.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-base-content/70">Appraised By</label>
                    <p className="text-base-content">
                      {selectedAppraisal.appraisers.map(a => a.name).join(', ')}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-base-content/70">Artist Information</label>
                  <p className="text-base-content whitespace-pre-wrap">
                    {selectedAppraisal.artist_info || 'No information provided'}
                  </p>
                </div>
                
                {selectedAppraisal.recent_auction_references && selectedAppraisal.recent_auction_references.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-base-content/70">Recent Auction References</label>
                    <ul className="list-disc list-inside text-base-content">
                      {selectedAppraisal.recent_auction_references.map((ref, idx) => (
                        <li key={idx}>{ref}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-base-content/70">Notes</label>
                  <p className="text-base-content whitespace-pre-wrap">
                    {selectedAppraisal.notes || 'No notes'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-base-content/70">Recommendation</label>
                  <p className="text-base-content whitespace-pre-wrap">
                    {selectedAppraisal.recommendation || 'No recommendation'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setActionTargetAppraisal(null);
        }}
        onConfirm={confirmDeleteAppraisal}
        title="Delete Appraisal"
        message={actionTargetAppraisal ? 
          `Are you sure you want to delete the appraisal for "${actionTargetAppraisal.artwork?.title}"? This action cannot be undone.` :
          'Are you sure you want to delete this appraisal?'
        }
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        danger={true}
      />
    </div>
  );
};

export default Appraisals;