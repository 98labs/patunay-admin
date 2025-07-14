# Component Usage Examples

This document provides practical examples of how to use the standardized components following the new development guidelines.

## Button Component

### Basic Usage
```tsx
import { Button } from '@components';

const SaveButton = () => {
  const handleSave = async () => {
    // Save logic here
    await saveData();
  };

  return (
    <Button onClick={handleSave}>
      Save Changes
    </Button>
  );
};
```

### With Icon and Loading State
```tsx
import { Button } from '@components';
import { Save, Trash2 } from 'lucide-react';

const ActionButtons = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveData();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteData();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        icon={Save}
        loading={isSaving}
        onClick={handleSave}
      >
        Save
      </Button>
      
      <Button 
        variant="danger"
        icon={Trash2}
        loading={isDeleting}
        onClick={handleDelete}
      >
        Delete
      </Button>
    </div>
  );
};
```

### Form Submit Button
```tsx
import { Button } from '@components';

const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await submitForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      
      <Button 
        type="submit"
        fullWidth
        loading={isSubmitting}
        size="lg"
      >
        Send Message
      </Button>
    </form>
  );
};
```

## Modal Component

### Confirmation Modal
```tsx
import { Modal, Button } from '@components';

const DeleteConfirmation = ({ isOpen, onClose, onConfirm, itemName }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Deletion"
      footer={
        <div className="flex gap-2 justify-end">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirm}
            loading={isDeleting}
          >
            Delete
          </Button>
        </div>
      }
    >
      <p>
        Are you sure you want to delete <strong>{itemName}</strong>? 
        This action cannot be undone.
      </p>
    </Modal>
  );
};
```

### Form Modal
```tsx
import { Modal, Button, FormField } from '@components';

const EditUserModal = ({ isOpen, onClose, user }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUser(user.id, formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit User"
      size="lg"
      closeOnEscape={!isSaving}
      closeOnOverlayClick={!isSaving}
    >
      <div className="space-y-4">
        <FormField
          label="Name"
          value={formData.name}
          onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
          required
        />
        
        <FormField
          label="Email"
          type="email"
          value={formData.email}
          onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
          required
        />
        
        <div className="flex gap-2 justify-end pt-4">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            loading={isSaving}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};
```

## Loading Component

### Page Loading
```tsx
import { Loading } from '@components';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadDashboardData()
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return <Loading text="Loading dashboard..." />;
  }

  return (
    <div>
      {/* Dashboard content */}
    </div>
  );
};
```

### Inline Loading
```tsx
import { Loading } from '@components';

const DataTable = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState([]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const newData = await fetchData();
      setData(newData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2>Data Table</h2>
        <Button onClick={refreshData} disabled={isLoading}>
          Refresh
        </Button>
      </div>
      
      {isLoading ? (
        <Loading 
          fullScreen={false}
          text="Refreshing data..."
          size="md"
        />
      ) : (
        <table>
          {/* Table content */}
        </table>
      )}
    </div>
  );
};
```

## Error Handling

### Using Error Handler
```tsx
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createErrorHandler } from '@/ui/utils/errorHandling';
import { useLogger } from '@hooks';

const ArtworkUpload = () => {
  const dispatch = useDispatch();
  const logger = useLogger('ArtworkUpload');
  const { handleError } = createErrorHandler(dispatch, logger, 'ArtworkUpload');
  
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);
    
    try {
      logger.info('Starting artwork upload', LogCategory.BUSINESS);
      
      const results = await uploadArtworkImages(files);
      
      logger.info('Upload completed successfully', LogCategory.BUSINESS, { 
        fileCount: files.length 
      });
      
      // Show success notification
      dispatch(showNotification({
        message: 'Images uploaded successfully',
        status: NotificationStatus.SUCCESS
      }));
      
    } catch (error) {
      handleError(error as Error, {
        action: 'upload_artwork_images',
        category: LogCategory.BUSINESS
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <Button 
        onClick={() => handleUpload(selectedFiles)}
        loading={isUploading}
      >
        Upload Images
      </Button>
    </div>
  );
};
```

### Custom Error Classes
```tsx
import { 
  ValidationError, 
  NetworkError, 
  NFCError 
} from '@/ui/utils/errorHandling';

const NFCOperations = () => {
  const handleNFCWrite = async (data: string) => {
    try {
      // Validate input
      if (!data || data.trim().length === 0) {
        throw new ValidationError('Data cannot be empty');
      }
      
      // Check NFC availability
      if (!await isNFCAvailable()) {
        throw new NFCError('NFC device not available');
      }
      
      // Perform write operation
      const result = await writeToNFC(data);
      
      if (!result.success) {
        throw new NFCError(`Write failed: ${result.error}`, 'write');
      }
      
    } catch (error) {
      if (error instanceof ValidationError) {
        // Handle validation errors differently
        setFieldError('data', error.message);
      } else if (error instanceof NFCError) {
        // Show NFC-specific error message
        showNFCErrorDialog(error.message);
      } else {
        // Handle other errors
        handleError(error);
      }
    }
  };
};
```

## Logging Best Practices

### Component Logging
```tsx
import { useLogger } from '@hooks';
import { LogCategory } from '@/shared/logging/types';

const UserProfile = ({ userId }) => {
  const logger = useLogger('UserProfile');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        logger.info('Loading user profile', LogCategory.BUSINESS, { userId });
        
        const userData = await getUserById(userId);
        setUser(userData);
        
        logger.info('User profile loaded successfully', LogCategory.BUSINESS, { 
          userId, 
          userName: userData.name 
        });
        
      } catch (error) {
        logger.error(
          'Failed to load user profile', 
          LogCategory.BUSINESS, 
          error
        );
      }
    };

    loadUser();
  }, [userId, logger]);

  const handleUpdateProfile = async (updates) => {
    const timer = logger.createTimer('update_profile');
    
    try {
      logger.logUserAction('profile_update_started', { userId, updates });
      
      await updateUser(userId, updates);
      setUser(prev => ({ ...prev, ...updates }));
      
      logger.logUserAction('profile_update_completed', { userId });
      
    } catch (error) {
      logger.error('Profile update failed', LogCategory.BUSINESS, error);
      throw error;
    } finally {
      timer(); // Logs duration if > 100ms
    }
  };

  return (
    // Component JSX
  );
};
```

### API Call Logging
```tsx
const useArtworkAPI = () => {
  const logger = useLogger('ArtworkAPI');

  const createArtwork = async (artworkData) => {
    const timer = logger.createTimer('create_artwork');
    
    try {
      logger.logApiCall('POST', '/api/artworks', { 
        title: artworkData.title,
        category: artworkData.category 
      });
      
      const response = await fetch('/api/artworks', {
        method: 'POST',
        body: JSON.stringify(artworkData)
      });
      
      logger.logApiResponse(
        'POST', 
        '/api/artworks', 
        response.status, 
        null, 
        timer()
      );
      
      if (!response.ok) {
        throw new NetworkError(`API call failed: ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      logger.error('Artwork creation failed', LogCategory.API, error);
      throw error;
    }
  };

  return { createArtwork };
};
```

## Testing Examples

### Component Testing
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';

import Button from './Button';
import { createMockStore } from '@/test/utils';

describe('Button Component', () => {
  let mockStore;
  let mockOnClick;

  beforeEach(() => {
    mockStore = createMockStore();
    mockOnClick = vi.fn();
  });

  const renderButton = (props = {}) => {
    const defaultProps = {
      onClick: mockOnClick,
      ...props
    };

    return render(
      <Provider store={mockStore}>
        <Button {...defaultProps} />
      </Provider>
    );
  };

  it('renders with default props', () => {
    renderButton();
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('handles async click operations', async () => {
    mockOnClick.mockResolvedValueOnce(undefined);
    
    renderButton({ children: 'Save' });
    
    const button = screen.getByRole('button', { name: /save/i });
    fireEvent.click(button);
    
    // Should show loading state
    expect(button).toContainHTML('loading-spinner');
    
    await waitFor(() => {
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
    
    // Should no longer be loading
    expect(button).not.toContainHTML('loading-spinner');
  });
});
```

These examples demonstrate the consistent patterns and best practices established in the standardized component library.