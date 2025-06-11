import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { User, UserRole, USER_ROLES, DEFAULT_PERMISSIONS, PERMISSION_DESCRIPTIONS } from '../../typings';
import supabase from '../../supabase';

interface UserFormData {
  email?: string;
  password?: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string;
  is_active: boolean;
  permissions: string[];
  avatar_file?: File;
}

interface UserFormProps {
  user?: User | null;
  isLoading?: boolean;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  isLoading = false,
  onSubmit,
  onCancel,
  mode,
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<UserFormData>({
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'staff',
      phone: '',
      is_active: true,
      permissions: [],
    },
  });

  const watchedRole = watch('role');

  // Update form when user prop changes
  useEffect(() => {
    if (user && mode === 'edit') {
      reset({
        email: user.email,
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role,
        phone: user.phone || '',
        is_active: user.is_active,
        permissions: user.permissions || [],
      });
      setSelectedPermissions(user.permissions || []);
      setAvatarPreview(user.avatar_url || null);
    }
  }, [user, mode, reset]);

  // Update permissions when role changes
  useEffect(() => {
    if (mode === 'create') {
      const defaultPerms = DEFAULT_PERMISSIONS[watchedRole] || [];
      setSelectedPermissions([...defaultPerms]);
      setValue('permissions', [...defaultPerms]);
    }
  }, [watchedRole, mode, setValue]);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const updatedPermissions = checked
      ? [...selectedPermissions, permission]
      : selectedPermissions.filter(p => p !== permission);
    
    setSelectedPermissions(updatedPermissions);
    setValue('permissions', updatedPermissions);
  };

  const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
    try {
      setIsUploadingAvatar(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleFormSubmit = async (data: UserFormData) => {
    const submitData = {
      ...data,
      permissions: selectedPermissions,
      avatar_file: avatarFile,
    };

    // Remove email from update data since it can't be changed
    if (mode === 'edit') {
      const { email, ...updateData } = submitData;
      onSubmit(updateData);
    } else {
      onSubmit(submitData);
    }
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB.');
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(user?.avatar_url || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const availablePermissions = Object.keys(PERMISSION_DESCRIPTIONS) as Array<keyof typeof PERMISSION_DESCRIPTIONS>;

  return (
    <div className="bg-base-100 border border-base-300 rounded-lg p-6 max-w-4xl mx-auto text-base-content">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-base-content">
          {mode === 'create' ? 'Create New User' : 'Edit User'}
        </h2>
        <button
          onClick={onCancel}
          className="btn btn-ghost btn-sm"
          disabled={isLoading}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="block text-sm font-medium mb-1">
              <span className="label-text">Email {mode === 'create' ? '*' : ''}</span>
            </label>
            {mode === 'edit' ? (
              <div className="input input-bordered bg-base-200 text-base-content flex items-center">
                {user?.email || 'No email available'}
              </div>
            ) : (
              <input
                type="email"
                className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
                disabled={isLoading}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
            )}
            {errors.email && mode === 'create' && (
              <label className="block text-sm font-medium mb-1">
                <span className="label-text-alt text-error">{errors.email.message}</span>
              </label>
            )}
          </div>
          <div className="form-control">
            <label className="block text-sm font-medium mb-1">
              <span className="label-text">Phone</span>
            </label>
            <input
              type="tel"
              className="input input-bordered"
              disabled={isLoading}
              {...register('phone')}
            />
          </div>

          {mode === 'create' && (
            <div className="form-control">
              <label className="block text-sm font-medium mb-1">
                <span className="label-text">Password *</span>
              </label>
              <input
                type="password"
                className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
                disabled={isLoading}
                {...register('password', {
                  required: mode === 'create' ? 'Password is required' : false,
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
              />
              {errors.password && (
                <label className="block text-sm font-medium mb-1">
                  <span className="label-text-alt text-error">{errors.password.message}</span>
                </label>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="block text-sm font-medium mb-1">
              <span className="label-text">First Name *</span>
            </label>
            <input
              type="text"
              className={`input input-bordered ${errors.first_name ? 'input-error' : ''}`}
              disabled={isLoading}
              {...register('first_name', {
                required: 'First name is required',
                minLength: {
                  value: 2,
                  message: 'First name must be at least 2 characters',
                },
              })}
            />
            {errors.first_name && (
              <label className="block text-sm font-medium mb-1">
                <span className="label-text-alt text-error">{errors.first_name.message}</span>
              </label>
            )}
          </div>

          <div className="form-control">
            <label className="block text-sm font-medium mb-1">
              <span className="label-text">Last Name *</span>
            </label>
            <input
              type="text"
              className={`input input-bordered ${errors.last_name ? 'input-error' : ''}`}
              disabled={isLoading}
              {...register('last_name', {
                required: 'Last name is required',
                minLength: {
                  value: 2,
                  message: 'Last name must be at least 2 characters',
                },
              })}
            />
            {errors.last_name && (
              <label className="block text-sm font-medium mb-1">
                <span className="label-text-alt text-error">{errors.last_name.message}</span>
              </label>
            )}
          </div>
        </div>

        {/* Avatar Upload */}
        <div className="form-control">
          <label className="block text-sm font-medium mb-1">
            <span className="label-text">Profile Picture</span>
          </label>
          <div className="flex items-center space-x-4">
            {/* Avatar Preview */}
            <div className="avatar">
              <div className="w-20 h-20 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <div className="w-full h-full bg-neutral text-neutral-content rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            
            {/* Upload Controls */}
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                className="file-input file-input-bordered file-input-sm w-full max-w-xs"
                accept="image/*"
                onChange={handleAvatarFileChange}
                disabled={isLoading || isUploadingAvatar}
              />
              
              {avatarFile && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-success">✓ {avatarFile.name}</span>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="btn btn-ghost btn-xs"
                    disabled={isLoading || isUploadingAvatar}
                  >
                    Remove
                  </button>
                </div>
              )}
              
              <div className="text-xs text-base-content/60">
                Supported formats: JPG, PNG, GIF (max 5MB)
              </div>
            </div>
          </div>
          
          {isUploadingAvatar && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="loading loading-spinner loading-sm"></span>
              <span className="text-sm">Uploading avatar...</span>
            </div>
          )}
        </div>

        {/* Role and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="form-control">
            <label className="block text-sm font-medium mb-1">
              <span className="label-text">Role *</span>
            </label>
            <select
              className={`select select-bordered ${errors.role ? 'select-error' : ''}`}
              disabled={isLoading}
              {...register('role', { required: 'Role is required' })}
            >
              {Object.entries(USER_ROLES).map(([value, { label, description }]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.role && (
              <label className="block text-sm font-medium mb-1">
                <span className="label-text-alt text-error">{errors.role.message}</span>
              </label>
            )}
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                {USER_ROLES[watchedRole]?.description}
              </span>
            </label>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                className="toggle toggle-success"
                disabled={isLoading}
                {...register('is_active')}
              />
              <span className="text-sm">
                {watch('is_active') ? 'Active' : 'Inactive'}
              </span>
            </label>
            <label className="label">
              <span className="label-text-alt text-base-content/60">
                {watch('is_active')
                  ? 'User can sign in and access the application'
                  : 'User cannot sign in or access the application'
                }
              </span>
            </label>
          </div>
        </div>

        {/* Permissions */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Permissions</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 border border-base-300 rounded-lg bg-base-50">
            {availablePermissions.map((permission) => (
              <label key={permission} className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm mt-1"
                  checked={selectedPermissions.includes(permission)}
                  onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                  disabled={isLoading}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-base-content">
                    {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div className="text-xs text-base-content/60">
                    {PERMISSION_DESCRIPTIONS[permission]}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <label className="label">
            <span className="label-text-alt text-base-content/60">
              Selected permissions: {selectedPermissions.length}
            </span>
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-base-300">
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
            disabled={isLoading || isUploadingAvatar}
          >
            {(isLoading || isUploadingAvatar) && <span className="loading loading-spinner loading-sm"></span>}
            {mode === 'create' ? 'Create User' : 'Update User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;