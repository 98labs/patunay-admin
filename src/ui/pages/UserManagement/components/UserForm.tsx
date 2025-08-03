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
  FormField,
  FileUpload,
  PageHeader,
  Alert
} from '@components';
import { 
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetUserQuery,
  UserRole
} from '../../../store/api/userManagementApiV2';
import supabase from '../../../supabase';
import { useNotification } from '../../../hooks/useNotification';
import { ArrowLeft, User } from 'lucide-react';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role: z.enum(['super_user', 'admin', 'issuer', 'appraiser', 'staff', 'viewer']),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
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
  } | null;
  mode: 'create' | 'edit';
  onSuccess: () => void;
  onCancel: () => void;
}

export const UserForm: React.FC<UserFormProps> = ({ 
  user, 
  mode, 
  onSuccess, 
  onCancel 
}) => {
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { showSuccess, showError } = useNotification();

  // API hooks
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  
  // Fetch full user details if editing
  const { data: userDetails, isLoading: isLoadingUser } = useGetUserQuery(
    user?.id || '',
    { skip: !user?.id || mode === 'create' }
  );

  const fullUser = mode === 'edit' ? (userDetails?.data || user) : null;

  // Form setup
  const form = useForm<CreateUserForm | UpdateUserForm>({
    resolver: zodResolver(mode === 'create' ? createUserSchema : updateUserSchema),
    defaultValues: mode === 'create' ? {
      email: '',
      password: '',
      confirmPassword: '',
      first_name: '',
      last_name: '',
      role: 'staff',
      phone: '',
    } : {
      email: fullUser?.email || '',
      first_name: fullUser?.first_name || '',
      last_name: fullUser?.last_name || '',
      role: fullUser?.role || 'staff',
      phone: fullUser?.phone || '',
      is_active: fullUser?.is_active ?? true,
    }
  });

  // Update form when user data loads
  useEffect(() => {
    if (mode === 'edit' && fullUser) {
      form.reset({
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
  }, [fullUser, mode, form]);

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
    } catch (error: any) {
      showError(error?.message || `Failed to ${mode} user`);
    }
  };

  const isLoading = isCreating || isUpdating || isLoadingUser;

  return (
    <div className="space-y-6">
      <PageHeader
        title={mode === 'create' ? 'Create User' : 'Edit User'}
        description={mode === 'create' ? 'Add a new user to the system' : `Edit ${fullUser?.email || ''}`}
        icon={<User className="h-8 w-8" />}
        actions={
          <Button onClick={onCancel} variant="secondary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        }
      />

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-medium">User Information</h3>
              </CardHeader>
              <CardContent className="space-y-6">
                {mode === 'create' && (
                  <>
                    <FormField
                      label="Email"
                      error={form.formState.errors.email?.message}
                      required
                    >
                      <Input
                        type="email"
                        {...form.register('email')}
                        placeholder="user@example.com"
                      />
                    </FormField>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Password"
                        error={form.formState.errors.password?.message}
                        required
                      >
                        <Input
                          type="password"
                          {...form.register('password')}
                          placeholder="Enter password"
                        />
                      </FormField>

                      <FormField
                        label="Confirm Password"
                        error={form.formState.errors.confirmPassword?.message}
                        required
                      >
                        <Input
                          type="password"
                          {...form.register('confirmPassword')}
                          placeholder="Confirm password"
                        />
                      </FormField>
                    </div>
                  </>
                )}

                {mode === 'edit' && (
                  <Alert variant="info">
                    Email: {fullUser?.email}. Contact support to change user email addresses.
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="First Name"
                    error={form.formState.errors.first_name?.message}
                  >
                    <Input
                      {...form.register('first_name')}
                      placeholder="John"
                    />
                  </FormField>

                  <FormField
                    label="Last Name"
                    error={form.formState.errors.last_name?.message}
                  >
                    <Input
                      {...form.register('last_name')}
                      placeholder="Doe"
                    />
                  </FormField>
                </div>

                <FormField
                  label="Phone"
                  error={form.formState.errors.phone?.message}
                >
                  <Input
                    type="tel"
                    {...form.register('phone')}
                    placeholder="+1 (555) 123-4567"
                  />
                </FormField>

                <FormField
                  label="Role"
                  error={form.formState.errors.role?.message}
                  required
                >
                  <Select
                    value={form.watch('role')}
                    onChange={(value) => form.setValue('role', value as UserRole)}
                    options={[
                      { value: 'super_user', label: 'Super User' },
                      { value: 'admin', label: 'Admin' },
                      { value: 'issuer', label: 'Issuer' },
                      { value: 'appraiser', label: 'Appraiser' },
                      { value: 'staff', label: 'Staff' },
                      { value: 'viewer', label: 'Viewer' },
                    ]}
                  />
                </FormField>

                {mode === 'edit' && (
                  <FormField label="Status">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        {...form.register('is_active')}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        User is active
                      </span>
                    </label>
                  </FormField>
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
                  {form.watch('role') === 'super_user' && (
                    <p>Full system access including user management, system configuration, and all features.</p>
                  )}
                  {form.watch('role') === 'admin' && (
                    <p>Manage users, artworks, and system settings. Cannot modify super users.</p>
                  )}
                  {form.watch('role') === 'issuer' && (
                    <p>Create and manage artworks, attach NFC tags, and update artwork information.</p>
                  )}
                  {form.watch('role') === 'appraiser' && (
                    <p>View artworks and add appraisal information. Cannot modify artwork details.</p>
                  )}
                  {form.watch('role') === 'staff' && (
                    <p>Basic read access to artworks and system information.</p>
                  )}
                  {form.watch('role') === 'viewer' && (
                    <p>Limited read-only access to public artwork information.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Actions */}
        <Card className="mt-6">
          <CardFooter className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
            >
              {mode === 'create' ? 'Create User' : 'Update User'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};