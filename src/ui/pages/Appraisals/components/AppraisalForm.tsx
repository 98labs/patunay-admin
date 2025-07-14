import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { FormField, Loading } from '@components';
import { Appraisal, CreateAppraisalData } from '../Appraisals';
import supabase from '../../../supabase';
import { format } from 'date-fns';

interface AppraisalFormProps {
  appraisal: Appraisal | null;
  mode: 'create' | 'edit';
  isLoading: boolean;
  onSubmit: (data: CreateAppraisalData) => void;
  onCancel: () => void;
}

interface Artwork {
  id: string;
  title: string;
  artist: string;
  id_number: string;
}

const AppraisalForm: React.FC<AppraisalFormProps> = ({
  appraisal,
  mode,
  isLoading,
  onSubmit,
  onCancel,
}) => {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateAppraisalData>({
    defaultValues: {
      artwork_id: appraisal?.artwork_id || '',
      condition: appraisal?.condition || 'Good',
      acquisition_cost: appraisal?.acquisition_cost || 0,
      appraised_value: appraisal?.appraised_value || 0,
      artist_info: appraisal?.artist_info || '',
      recent_auction_references: (appraisal?.recent_auction_references && appraisal.recent_auction_references.length > 0) 
        ? appraisal.recent_auction_references 
        : [],
      notes: appraisal?.notes || '',
      recommendation: appraisal?.recommendation || '',
      appraisal_date: appraisal?.appraisal_date 
        ? format(new Date(appraisal.appraisal_date), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      appraisers: (appraisal?.appraisers && appraisal.appraisers.length > 0) 
        ? appraisal.appraisers.map(a => a.name) 
        : [],
    },
  });

  const { fields: auctionFields, append: appendAuction, remove: removeAuction } = useFieldArray({
    control,
    name: 'recent_auction_references',
  });

  const { fields: appraiserFields, append: appendAppraiser, remove: removeAppraiser } = useFieldArray({
    control,
    name: 'appraisers',
  });

  // Fetch artworks
  useEffect(() => {
    const fetchArtworks = async () => {
      setIsLoadingArtworks(true);
      try {
        let query = supabase
          .from('artworks')
          .select('id, title, artist, id_number')
          .order('title');

        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%,id_number.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query.limit(50);

        if (error) throw error;
        setArtworks(data || []);
      } catch (error) {
        console.error('Error fetching artworks:', error);
        setArtworks([]);
      } finally {
        setIsLoadingArtworks(false);
      }
    };

    fetchArtworks();
  }, [searchQuery]);

  const selectedArtworkId = watch('artwork_id');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-base-100 border border-base-300 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-6">
          {mode === 'create' ? 'Create New Appraisal' : 'Edit Appraisal'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Artwork Selection */}
            <div>
              <label className="label">
                <span className="label-text">Select Artwork *</span>
              </label>
              {mode === 'create' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search artworks..."
                    className="input input-bordered w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <select
                    {...register('artwork_id', { required: 'Please select an artwork' })}
                    className="select select-bordered w-full"
                    disabled={isLoadingArtworks}
                  >
                    <option value="">Select an artwork</option>
                    {artworks.map((artwork) => (
                      <option key={artwork.id} value={artwork.id}>
                        {artwork.title} by {artwork.artist} (ID: {artwork.id_number})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-3 bg-base-200 rounded">
                  {appraisal?.artwork?.title} by {appraisal?.artwork?.artist}
                  <div className="text-sm text-base-content/60">ID: {appraisal?.artwork?.id_number}</div>
                </div>
              )}
              {errors.artwork_id && (
                <span className="text-error text-sm">{errors.artwork_id.message}</span>
              )}
            </div>

            {/* Appraisal Date */}
            <FormField
              label="Appraisal Date"
              type="date"
              {...register('appraisal_date', { required: 'Appraisal date is required' })}
              error={errors.appraisal_date?.message}
              required
            />

            {/* Condition */}
            <div>
              <label className="label">
                <span className="label-text">Condition *</span>
              </label>
              <select
                {...register('condition', { required: 'Condition is required' })}
                className="select select-bordered w-full"
              >
                <option value="Excellent">Excellent</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
              {errors.condition && (
                <span className="text-error text-sm">{errors.condition.message}</span>
              )}
            </div>

            {/* Values */}
            <FormField
              label="Acquisition Cost ($)"
              type="number"
              step="0.01"
              {...register('acquisition_cost', { 
                required: 'Acquisition cost is required',
                min: { value: 0, message: 'Cost must be positive' }
              })}
              error={errors.acquisition_cost?.message}
              required
            />

            <FormField
              label="Appraised Value ($)"
              type="number"
              step="0.01"
              {...register('appraised_value', { 
                required: 'Appraised value is required',
                min: { value: 0, message: 'Value must be positive' }
              })}
              error={errors.appraised_value?.message}
              required
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Artist Information */}
            <div>
              <label className="label">
                <span className="label-text">Artist Information</span>
              </label>
              <textarea
                {...register('artist_info')}
                className="textarea textarea-bordered w-full h-24"
                placeholder="Biographical information, exhibition history, etc."
              />
            </div>

            {/* Appraisers */}
            <div>
              <label className="label">
                <span className="label-text">Appraisers</span>
              </label>
              <div className="space-y-2">
                {appraiserFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      {...register(`appraisers.${index}` as const)}
                      className="input input-bordered flex-1"
                      placeholder="Appraiser name"
                    />
                    {appraiserFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAppraiser(index)}
                        className="btn btn-error btn-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendAppraiser('')}
                  className="btn btn-sm btn-outline"
                >
                  Add Appraiser
                </button>
              </div>
            </div>

            {/* Recent Auction References */}
            <div>
              <label className="label">
                <span className="label-text">Recent Auction References</span>
              </label>
              <div className="space-y-2">
                {auctionFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      {...register(`recent_auction_references.${index}` as const)}
                      className="input input-bordered flex-1"
                      placeholder="Auction reference"
                    />
                    <button
                      type="button"
                      onClick={() => removeAuction(index)}
                      className="btn btn-error btn-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => appendAuction('')}
                  className="btn btn-sm btn-outline"
                >
                  Add Reference
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="label">
                <span className="label-text">Notes</span>
              </label>
              <textarea
                {...register('notes')}
                className="textarea textarea-bordered w-full h-24"
                placeholder="Additional notes about the appraisal"
              />
            </div>

            {/* Recommendation */}
            <div>
              <label className="label">
                <span className="label-text">Recommendation</span>
              </label>
              <textarea
                {...register('recommendation')}
                className="textarea textarea-bordered w-full h-24"
                placeholder="Conservation recommendations, market advice, etc."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-base-300">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-ghost"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {mode === 'create' ? 'Creating...' : 'Updating...'}
              </>
            ) : (
              <>{mode === 'create' ? 'Create Appraisal' : 'Update Appraisal'}</>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default AppraisalForm;