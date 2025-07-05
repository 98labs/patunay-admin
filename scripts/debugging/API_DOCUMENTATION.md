# API Documentation

## Table of Contents
- [React Hooks](#react-hooks)
- [Services](#services)
- [Components](#components)
- [Utilities](#utilities)
- [Store/State Management](#storestate-management)

## React Hooks

### useLogger

Custom hook for structured logging throughout the application.

```typescript
const useLogger = (component?: string) => LoggerHook
```

**Parameters:**
- `component` (optional): Component name for automatic context inclusion

**Returns:**
Object with logging methods and utilities

**Example:**
```typescript
const MyComponent = () => {
  const logger = useLogger('MyComponent');
  
  const handleAction = async () => {
    try {
      logger.logUserAction('button_clicked', { buttonId: 'submit' });
      await performAction();
      logger.info('Action completed successfully');
    } catch (error) {
      logger.error('Action failed', LogCategory.BUSINESS, { action: 'submit' }, error);
    }
  };
  
  return <button onClick={handleAction}>Submit</button>;
};
```

**Available Methods:**

#### Basic Logging
- `error(message, category?, data?, error?)` - Log error messages
- `warn(message, category?, data?)` - Log warning messages  
- `info(message, category?, data?)` - Log informational messages
- `debug(message, category?, data?)` - Log debug messages

#### Specialized Logging
- `logUserAction(action, data?)` - Log user interactions
- `logApiCall(method, endpoint, data?)` - Log API request initiation
- `logApiResponse(method, endpoint, status, data?, duration?)` - Log API responses
- `logNavigation(from, to)` - Log navigation events
- `logFormSubmit(formName, data?)` - Log form submissions
- `logComponentError(error, errorInfo?)` - Log React component errors
- `createTimer(label)` - Create performance timer

#### Performance Timing
```typescript
const timer = logger.createTimer('expensive-operation');
await performExpensiveOperation();
timer(); // Automatically logs if > 100ms
```

### useAuth

Authentication state management hook.

```typescript
const useAuth = () => AuthState
```

**Returns:**
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
```

**Example:**
```typescript
const LoginComponent = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect handled automatically
    } catch (error) {
      // Error handled by hook
    }
  };
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button type="submit" loading={isLoading}>
        Login
      </Button>
    </form>
  );
};
```

## Services

### UserService

Service for user-related API operations.

```typescript
class UserService {
  static async getCurrentUser(): Promise<User>;
  static async updateUser(userId: string, data: Partial<User>): Promise<User>;
  static async getUserPreferences(userId: string): Promise<UserPreferences>;
  static async updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<UserPreferences>;
}
```

**Example:**
```typescript
// Get current user
try {
  const user = await UserService.getCurrentUser();
  console.log('Current user:', user.name);
} catch (error) {
  if (error instanceof UserNotFoundError) {
    // Handle user not found
  }
}

// Update user profile
await UserService.updateUser(userId, {
  name: 'New Name',
  email: 'new.email@example.com'
});
```

### ArtworkService

Service for artwork management operations.

```typescript
class ArtworkService {
  static async getArtworks(filters?: ArtworkFilters): Promise<PaginatedResponse<Artwork>>;
  static async getArtworkById(id: string): Promise<Artwork>;
  static async createArtwork(data: CreateArtworkData): Promise<Artwork>;
  static async updateArtwork(id: string, data: Partial<Artwork>): Promise<Artwork>;
  static async deleteArtwork(id: string): Promise<void>;
  static async uploadImages(artworkId: string, files: File[]): Promise<string[]>;
  static async generateReport(artworkId: string): Promise<Blob>;
}
```

**Example:**
```typescript
// Get artworks with filters
const artworks = await ArtworkService.getArtworks({
  page: 1,
  pageSize: 20,
  category: 'painting',
  hasNfc: true
});

// Create new artwork
const newArtwork = await ArtworkService.createArtwork({
  title: 'Sunset Painting',
  artist: 'John Doe',
  description: 'Beautiful sunset over mountains',
  category: 'painting'
});

// Upload images
const imageUrls = await ArtworkService.uploadImages(newArtwork.id, files);
```

### NFCService

Service for NFC tag operations.

```typescript
class NFCService {
  static async detectCard(): Promise<CardData>;
  static async writeToCard(data: string): Promise<WriteResult>;
  static async readFromCard(uid: string): Promise<string>;
  static async formatCard(uid: string): Promise<void>;
  static async getReaderStatus(): Promise<NfcReaderStatus>;
}
```

**Example:**
```typescript
// Detect NFC card
try {
  const cardData = await NFCService.detectCard();
  console.log('Card detected:', cardData.uid);
} catch (error) {
  if (error instanceof NFCNotAvailableError) {
    // Handle NFC not available
  }
}

// Write data to card
const result = await NFCService.writeToCard(JSON.stringify({
  artworkId: 'artwork-123',
  timestamp: Date.now()
}));

if (result.success) {
  console.log('Data written successfully');
}
```

## Components

### Button

Reusable button component with loading states and consistent styling.

```typescript
interface ButtonProps extends BaseComponentProps {
  children?: React.ReactNode;
  variant?: ButtonVariant;
  size?: ComponentSize;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void | Promise<void>;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}
```

**Example:**
```typescript
// Basic button
<Button onClick={handleSave}>
  Save Changes
</Button>

// Button with icon and loading state
<Button 
  variant="danger"
  icon={TrashIcon}
  loading={isDeleting}
  onClick={handleDelete}
>
  Delete Item
</Button>

// Full width submit button
<Button 
  type="submit"
  fullWidth
  size="lg"
  loading={isSubmitting}
>
  Create Account
</Button>
```

### Modal

Modal component with consistent behavior and accessibility features.

```typescript
interface ModalProps extends ModalBaseProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnEscape?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  showBackdrop?: boolean;
}
```

**Example:**
```typescript
// Basic confirmation modal
<Modal 
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  title="Confirm Action"
  footer={
    <div className="flex gap-2 justify-end">
      <Button variant="outline" onClick={() => setShowConfirm(false)}>
        Cancel
      </Button>
      <Button variant="danger" onClick={handleConfirm}>
        Confirm
      </Button>
    </div>
  }
>
  <p>Are you sure you want to delete this item?</p>
</Modal>

// Large modal with custom header
<Modal 
  isOpen={showForm}
  onClose={handleClose}
  size="lg"
  closeOnEscape={false}
  header={
    <div>
      <h2>Advanced Settings</h2>
      <p className="text-sm text-gray-600">Configure advanced options</p>
    </div>
  }
>
  <AdvancedSettingsForm />
</Modal>
```

### Loading

Loading component for consistent loading states.

```typescript
interface LoadingProps extends BaseComponentProps {
  fullScreen?: boolean;
  text?: string;
  size?: ComponentSize;
  showText?: boolean;
  showDots?: boolean;
}
```

**Example:**
```typescript
// Full screen loading
<Loading />

// Inline loading with custom text
<Loading 
  fullScreen={false}
  text="Saving changes..."
  size="md"
/>

// Minimal loading spinner
<Loading 
  fullScreen={false}
  showText={false}
  size="sm"
/>
```

## Utilities

### Data Validation

```typescript
// Form validation utilities
export const validateEmail = (email: string): boolean;
export const validatePassword = (password: string): ValidationResult;
export const validateRequired = (value: any): boolean;
export const validateMinLength = (value: string, minLength: number): boolean;

// Data sanitization
export const sanitizeInput = (input: string): string;
export const sanitizeFileData = (data: any): any;
```

**Example:**
```typescript
// Validate form fields
const errors: Record<string, string> = {};

if (!validateEmail(email)) {
  errors.email = 'Please enter a valid email address';
}

const passwordValidation = validatePassword(password);
if (!passwordValidation.isValid) {
  errors.password = passwordValidation.message;
}

// Sanitize user input
const cleanInput = sanitizeInput(userInput);
```

### File Utilities

```typescript
export const formatFileSize = (bytes: number): string;
export const getFileExtension = (filename: string): string;
export const isImageFile = (file: File): boolean;
export const generateFileHash = (file: File): Promise<string>;
export const compressImage = (file: File, quality?: number): Promise<File>;
```

**Example:**
```typescript
// File handling
const fileSize = formatFileSize(file.size); // "2.5 MB"
const isImage = isImageFile(file); // true/false

// Image compression
const compressedFile = await compressImage(file, 0.8);
```

### Date Utilities

```typescript
export const formatDate = (date: Date | string, format?: string): string;
export const getRelativeTime = (date: Date | string): string;
export const isDateInRange = (date: Date, start: Date, end: Date): boolean;
export const addDays = (date: Date, days: number): Date;
```

**Example:**
```typescript
// Date formatting
const formatted = formatDate(new Date(), 'MMM dd, yyyy'); // "Jan 15, 2024"
const relative = getRelativeTime(createdAt); // "2 hours ago"
```

## Store/State Management

### Auth Store

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Actions
export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => { /* ... */ },
    loginSuccess: (state, action) => { /* ... */ },
    loginFailure: (state, action) => { /* ... */ },
    logout: (state) => { /* ... */ },
    clearError: (state) => { /* ... */ }
  }
});

// Selectors
export const selectUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
export const selectAuthError = (state: RootState) => state.auth.error;
```

### Artwork Store

```typescript
interface ArtworkState {
  artworks: Artwork[];
  currentArtwork: Artwork | null;
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  filters: ArtworkFilters;
}

// RTK Query endpoints
export const artworkApi = createApi({
  reducerPath: 'artworkApi',
  baseQuery: /* ... */,
  tagTypes: ['Artwork'],
  endpoints: (builder) => ({
    getArtworks: builder.query</* ... */>({
      query: (filters) => ({ /* ... */ }),
      providesTags: ['Artwork']
    }),
    createArtwork: builder.mutation</* ... */>({
      query: (data) => ({ /* ... */ }),
      invalidatesTags: ['Artwork']
    })
  })
});
```

### Usage in Components

```typescript
// Using selectors
const LoginComponent = () => {
  const user = useSelector(selectUser);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  
  // Component logic
};

// Using RTK Query
const ArtworksPage = () => {
  const {
    data: artworks,
    isLoading,
    error
  } = useGetArtworksQuery(filters);
  
  const [createArtwork, { isLoading: isCreating }] = useCreateArtworkMutation();
  
  // Component logic
};
```

This documentation provides comprehensive coverage of the application's API surface, making it easy for developers to understand and use the available components, hooks, and services consistently.