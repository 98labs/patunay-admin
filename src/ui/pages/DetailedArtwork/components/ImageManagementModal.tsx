import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Upload, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button, Modal } from '@components';
import { AssetEntity } from '@typings';
import { useNotification } from '../../../hooks/useNotification';
import supabase from '../../../supabase';

interface ImageManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworkId: string;
  artworkTitle: string;
  currentAssets: AssetEntity[];
  onUpdate: (assets: AssetEntity[]) => void;
}

export const ImageManagementModal = ({
  isOpen,
  onClose,
  artworkId,
  artworkTitle,
  currentAssets,
  onUpdate
}: ImageManagementModalProps) => {
  const [assets, setAssets] = useState<AssetEntity[]>(currentAssets || []);
  const [uploading, setUploading] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const { showError, showSuccess } = useNotification();

  useEffect(() => {
    setAssets(currentAssets || []);
  }, [currentAssets]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const newAssets: AssetEntity[] = [];

    try {
      for (const file of acceptedFiles) {
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `artworks/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("artifacts")
          .upload(filePath, file);

        if (uploadError) {
          showError(`Failed to upload ${file.name}: ${uploadError.message}`, "Upload Error");
          continue;
        }

        // Get public URL
        const { data } = supabase.storage
          .from("artifacts")
          .getPublicUrl(filePath);

        newAssets.push({
          filename: file.name,
          url: data.publicUrl,
          sortOrder: assets.length + newAssets.length
        });
      }

      if (newAssets.length > 0) {
        const updatedAssets = [...assets, ...newAssets];
        setAssets(updatedAssets);
        showSuccess(`${newAssets.length} image(s) uploaded successfully`);
      }
    } catch (error) {
      showError('Failed to upload images', 'Upload Error');
    } finally {
      setUploading(false);
    }
  }, [assets, showError, showSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    disabled: uploading
  });

  const handleDelete = async (index: number) => {
    const assetToDelete = assets[index];
    if (!assetToDelete) return;

    setDeletingIds(prev => new Set(prev).add(index));

    try {
      // Extract file path from URL
      const urlParts = assetToDelete.url?.split('/');
      const fileName = urlParts?.[urlParts.length - 1];
      
      if (fileName) {
        // Delete from storage
        const { error } = await supabase.storage
          .from('artifacts')
          .remove([`artworks/${fileName}`]);

        if (error) {
          console.error('Error deleting from storage:', error);
        }
      }

      // Remove from local state
      const updatedAssets = assets.filter((_, i) => i !== index)
        .map((asset, i) => ({ ...asset, sortOrder: i }));
      setAssets(updatedAssets);
      showSuccess('Image deleted successfully');
    } catch (error) {
      showError('Failed to delete image', 'Delete Error');
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newAssets = [...assets];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= assets.length) return;
    
    // Swap positions
    [newAssets[index], newAssets[newIndex]] = [newAssets[newIndex], newAssets[index]];
    
    // Update sort order
    const updatedAssets = newAssets.map((asset, i) => ({
      ...asset,
      sortOrder: i
    }));
    
    setAssets(updatedAssets);
  };

  const handleSave = async () => {
    try {
      // Update artwork in database
      const { error } = await supabase
        .from('artworks')
        .update({ assets })
        .eq('id', artworkId);

      if (error) throw error;

      showSuccess('Images updated successfully');
      onUpdate(assets);
      onClose();
    } catch (error) {
      showError('Failed to update images', 'Update Error');
    }
  };

  return (
    <Modal
      show={isOpen}
      onClose={onClose}
      title={`Manage Images - ${artworkTitle}`}
      size="large"
    >
      <div className="space-y-4">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary'
          } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-base-content/50" />
          <p className="text-sm font-semibold mb-2">
            {isDragActive ? 'Drop images here' : 'Drag and drop images here'}
          </p>
          <p className="text-sm text-base-content/70 mb-4">or click to select files</p>
          <p className="text-xs text-base-content/50">
            Supported formats: JPEG, PNG, GIF, WebP (max 10MB each)
          </p>
          {uploading && (
            <div className="mt-4">
              <span className="loading loading-spinner loading-sm"></span>
              <span className="ml-2 text-sm">Uploading...</span>
            </div>
          )}
        </div>

        {/* Current Images */}
        {assets.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Current Images ({assets.length})</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {assets.map((asset, index) => (
                <div
                  key={`${asset.url}-${index}`}
                  className="flex items-center gap-3 p-3 bg-base-200 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <img
                      src={asset.url}
                      alt={asset.filename}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder-image.png'; // Add a placeholder
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {asset.filename || `Image ${index + 1}`}
                    </p>
                    <p className="text-xs text-base-content/70">
                      Position: {index + 1} of {assets.length}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => moveImage(index, 'up')}
                      disabled={index === 0}
                      title="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      className="btn btn-ghost btn-xs"
                      onClick={() => moveImage(index, 'down')}
                      disabled={index === assets.length - 1}
                      title="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      className="btn btn-error btn-xs"
                      onClick={() => handleDelete(index)}
                      disabled={deletingIds.has(index)}
                      title="Delete image"
                    >
                      {deletingIds.has(index) ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Images Message */}
        {assets.length === 0 && (
          <div className="text-center py-8 text-base-content/50">
            <p>No images uploaded yet</p>
          </div>
        )}
      </div>

      {/* Modal Actions */}
      <div className="modal-action">
        <Button
          buttonType="secondary"
          buttonLabel="Cancel"
          onClick={onClose}
        />
        <Button
          buttonType="primary"
          buttonLabel="Save Changes"
          onClick={handleSave}
          disabled={uploading}
        />
      </div>
    </Modal>
  );
};