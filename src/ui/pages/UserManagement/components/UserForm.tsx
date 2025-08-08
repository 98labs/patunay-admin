import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  FileUpload,
  PageHeader,
  Alert,
} from '@components';
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetUserQuery,
  UserRole,
} from '../../../store/api/userManagementApiV2';
import { useNotification } from '../../../hooks/useNotification';
import { ArrowLeft } from 'lucide-react';

const createUserSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    role: z.enum(['super_user', 'admin', 'issuer', 'appraiser', 'staff', 'viewer']),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role: z.enum(['super_user', 'admin', 'issuer', 'appraiser', 'staff', 'viewer']),
  phone: z.string().optional(),
  is_active: z.boolean(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type UpdateUserForm = z.infer<typeof updateUserSchema>;

interface UserFormProps {
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: UserRole;
    is_active: boolean;
    phone?: string;
    avatar_url?: string;
  } | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ user, mode, onSuccess, onCancel }) => {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { showSuccess, showError } = useNotification();

  // API hooks
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  // Fetch full user details if editing
  const { data: userDetails, isLoading: isLoadingUser } = useGetUserQuery(user?.id || '', {
    skip: !user?.id || mode === 'create',
  });

  const fullUser = mode === 'edit' ? userDetails?.data || user : null;

  // Form setup with conditional typing
  const createForm = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      role: 'staff',
      phone: '',
    },
  });

  const updateForm = useForm<UpdateUserForm>({
    resolver: zodResolver(updateUserSchema),
    mode: 'onChange',
    defaultValues: {
      email: fullUser?.email || '',
      first_name: fullUser?.first_name || '',
      last_name: fullUser?.last_name || '',
      role: fullUser?.role || 'staff',
      phone: fullUser?.phone || '',
      is_active: fullUser?.is_active ?? true,
    },
  });

  // Helper functions to get form errors safely
  const getFieldError = (fieldName: string): string | undefined => {
    if (mode === 'create') {
      const errors = createForm.formState.errors as Record<string, { message?: string }>;
      return errors[fieldName]?.message;
    } else {
      const errors = updateForm.formState.errors as Record<string, { message?: string }>;
      return errors[fieldName]?.message;
    }
  };

  const hasFieldError = (fieldName: string): boolean => {
    if (mode === 'create') {
      const errors = createForm.formState.errors as Record<string, unknown>;
      return !!errors[fieldName];
    } else {
      const errors = updateForm.formState.errors as Record<string, unknown>;
      return !!errors[fieldName];
    }
  };

  // Update form when user data loads
  useEffect(() => {
    if (mode === 'edit' && fullUser) {
      updateForm.reset({
        email: fullUser.email,
        first_name: fullUser.first_name || '',
        last_name: fullUser.last_name || '',
        role: fullUser.role,
        phone: fullUser.phone || '',
        is_active: fullUser.is_active ?? true,
      });

      if (fullUser.avatar_url) {
        setAvatarPreview(fullUser.avatar_url);
      }
    }
  }, [fullUser, mode, updateForm]);

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAvatarPreview(null);
    }
  };

  const onSubmit = async (data: CreateUserForm | UpdateUserForm) => {
    try {
      if (mode === 'create') {
        const createData = data as CreateUserForm;
        await createUser({
          email: createData.email,
          password: createData.password,
          first_name: createData.first_name,
          last_name: createData.last_name,
          role: createData.role,
          phone: createData.phone,
          avatar_file: avatarFile || undefined,
        }).unwrap();
        showSuccess('User created successfully');
      } else {
        const updateData = data as UpdateUserForm;
        await updateUser({
          id: user!.id,
          first_name: updateData.first_name,
          last_name: updateData.last_name,
          role: updateData.role,
          phone: updateData.phone,
          is_active: updateData.is_active,
          avatar_file: avatarFile || undefined,
        }).unwrap();
        showSuccess('User updated successfully');
      }
      onSuccess();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : `Failed to ${mode} user`;
      showError(errorMessage);
    }
  };

  const isLoading = isCreating || isUpdating || isLoadingUser;

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? 'Create User' : 'Edit User'}
        subtitle={
          mode === 'create' ? 'Add a new user to the system' : `Edit ${fullUser?.email || ''}`
        }
        action={
          <Button onClick={onCancel} variant="secondary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        }
      />

      <form
        onSubmit={
          mode === 'create' ? createForm.handleSubmit(onSubmit) : updateForm.handleSubmit(onSubmit)
        }
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">User Information</h3>
              </CardHeader>
              <CardContent className="space-y-6">
                {mode === 'create' && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        {...(mode === 'create'
                          ? createForm.register('email')
                          : updateForm.register('email'))}
                        placeholder="user@example.com"
                        autoComplete="email"
                        error={hasFieldError('email')}
                      />
                      {getFieldError('email') && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {getFieldError('email')}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="password"
                          {...createForm.register('password')}
                          placeholder="Enter password"
                          autoComplete="new-password"
                          error={hasFieldError('password')}
                        />
                        {getFieldError('password') && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {getFieldError('password')}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Confirm Password <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="password"
                          {...createForm.register('confirmPassword')}
                          placeholder="Confirm password"
                          autoComplete="new-password"
                          error={hasFieldError('confirmPassword')}
                        />
                        {getFieldError('confirmPassword') && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {getFieldError('confirmPassword')}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {mode === 'edit' && (
                  <Alert variant="info">
                    Email: {fullUser?.email}. Contact support to change user email addresses.
                  </Alert>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name
                    </label>
                    <Input
                      {...(mode === 'create'
                        ? createForm.register('first_name')
                        : updateForm.register('first_name'))}
                      placeholder="John"
                      error={hasFieldError('first_name')}
                    />
                    {getFieldError('first_name') && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {getFieldError('first_name')}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name
                    </label>
                    <Input
                      {...(mode === 'create'
                        ? createForm.register('last_name')
                        : updateForm.register('last_name'))}
                      placeholder="Doe"
                      error={hasFieldError('last_name')}
                    />
                    {getFieldError('last_name') && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {getFieldError('last_name')}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    {...(mode === 'create'
                      ? createForm.register('phone')
                      : updateForm.register('phone'))}
                    placeholder="+1 (555) 123-4567"
                    error={hasFieldError('phone')}
                  />
                  {getFieldError('phone') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {getFieldError('phone')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={mode === 'create' ? createForm.watch('role') : updateForm.watch('role')}
                    onChange={(value) => {
                      if (mode === 'create') {
                        createForm.setValue('role', value as UserRole);
                      } else {
                        updateForm.setValue('role', value as UserRole);
                      }
                    }}
                    options={[
                      { value: 'super_user', label: 'Super User' },
                      { value: 'admin', label: 'Admin' },
                      { value: 'issuer', label: 'Issuer' },
                      { value: 'appraiser', label: 'Appraiser' },
                      { value: 'staff', label: 'Staff' },
                      { value: 'viewer', label: 'Viewer' },
                    ]}
                    error={getFieldError('role')}
                  />
                  {getFieldError('role') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                      {getFieldError('role')}
                    </p>
                  )}
                </div>

                {mode === 'edit' && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        {...updateForm.register('is_active')}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        User is active
                      </span>
                    </label>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Avatar Upload */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">Profile Picture</h3>
              </CardHeader>
              <CardContent>
                <FileUpload
                  accept="image/*"
                  maxSize={5 * 1024 * 1024} // 5MB
                  value={avatarFile}
                  onChange={handleAvatarChange}
                  preview={avatarPreview}
                  label="Upload Avatar"
                  helperText="JPG, PNG or GIF. Max 5MB."
                />
              </CardContent>
            </Card>

            {/* Role Description */}
            <Card className="mt-6">
              <CardHeader>
                <h3 className="text-lg font-medium">Role Permissions</h3>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {(() => {
                    const role =
                      mode === 'create' ? createForm.watch('role') : updateForm.watch('role');
                    switch (role) {
                      case 'super_user':
                        return (
                          <p>
                            Full system access including user management, system configuration, and
                            all features.
                          </p>
                        );
                      case 'admin':
                        return (
                          <p>
                            Manage users, artworks, and system settings. Cannot modify super users.
                          </p>
                        );
                      case 'issuer':
                        return (
                          <p>
                            Create and manage artworks, attach NFC tags, and update artwork
                            information.
                          </p>
                        );
                      case 'appraiser':
                        return (
                          <p>
                            View artworks and add appraisal information. Cannot modify artwork
                            details.
                          </p>
                        );
                      case 'staff':
                        return <p>Basic read access to artworks and system information.</p>;
                      case 'viewer':
                        return <p>Limited read-only access to public artwork information.</p>;
                      default:
                        return null;
                    }
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <Card className="mt-6">
          <CardFooter className="flex justify-end space-x-4">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={isLoading}>
              {mode === 'create' ? 'Create User' : 'Update User'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};
