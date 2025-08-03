# Development Guide

## Prerequisites

### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version
- **VS Code** (recommended) or your preferred IDE

### Optional Tools
- **NFC Reader**: ACR122U or compatible (for NFC features)
- **Supabase CLI**: For local development
- **Docker**: For running Supabase locally

## Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd patunay-admin
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
# Copy environment template
cp .env.example .env.development

# Edit with your Supabase credentials
# Required variables:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
```

### 4. Database Setup
```bash
# If using Supabase cloud
# 1. Create a new Supabase project
# 2. Run migrations via Supabase dashboard

# If using local Supabase
npx supabase start
npx supabase db push
```

### 5. Start Development Server
```bash
# Start both React and Electron
npm run dev

# Or start separately
npm run dev:react    # React only (port 5173)
npm run dev:electron # Electron only
```

## Project Structure

```
patunay-admin/
├── src/
│   ├── electron/          # Main process (Electron)
│   │   ├── main.ts       # Entry point
│   │   ├── nfc/          # NFC service
│   │   ├── logging/      # Logging utilities
│   │   └── types/        # TypeScript types
│   │
│   ├── ui/               # Renderer process (React)
│   │   ├── components/   # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── store/        # Redux store
│   │   ├── hooks/        # Custom hooks
│   │   ├── supabase/     # Database layer
│   │   └── utils/        # Utilities
│   │
│   └── shared/           # Shared between processes
│
├── supabase/             # Database configuration
│   ├── migrations/       # SQL migrations
│   └── functions/        # Edge functions
│
├── docs/                 # Documentation
├── scripts/              # Utility scripts
└── build/               # Build resources
```

## Development Workflow

### Creating a New Feature

1. **Create Feature Branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Implement the Feature**
   - Add page component in `src/ui/pages/`
   - Create reusable components in `src/ui/components/`
   - Add API endpoints in `src/ui/store/api/`
   - Implement business logic

3. **Add Routes**
```typescript
// src/ui/router/index.tsx
{
  path: "/dashboard/your-feature",
  element: (
    <SuspenseWrapper>
      <YourFeaturePage />
    </SuspenseWrapper>
  ),
}
```

4. **Update Navigation**
```typescript
// Add to navigation items
const navItems = [
  // ...
  {
    label: "Your Feature",
    path: "/dashboard/your-feature",
    icon: YourIcon,
    permission: "view_feature"
  }
];
```

### Working with Components

#### Creating a Component
```typescript
// src/ui/components/YourComponent/YourComponent.tsx
import React from 'react';

interface YourComponentProps {
  title: string;
  onAction?: () => void;
}

export const YourComponent: React.FC<YourComponentProps> = ({ 
  title, 
  onAction 
}) => {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold">{title}</h2>
      <button onClick={onAction} className="btn btn-primary">
        Action
      </button>
    </div>
  );
};

// src/ui/components/YourComponent/index.ts
export { YourComponent } from './YourComponent';
```

#### Using Hooks
```typescript
// Custom hook example
import { useState, useEffect } from 'react';
import { useAppSelector } from '../store/hooks';

export function useYourFeature() {
  const [data, setData] = useState(null);
  const user = useAppSelector(state => state.auth.user);
  
  useEffect(() => {
    // Logic here
  }, [user]);
  
  return { data, user };
}
```

### Working with the Store

#### Creating an API Slice
```typescript
// src/ui/store/api/yourApi.ts
import { baseApi } from './baseApi';

export const yourApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getItems: build.query<Item[], void>({
      query: () => '/items',
      providesTags: ['Item'],
    }),
    
    createItem: build.mutation<Item, CreateItemDto>({
      query: (data) => ({
        url: '/items',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Item'],
    }),
  }),
});

export const { useGetItemsQuery, useCreateItemMutation } = yourApi;
```

#### Using RTK Query
```typescript
function YourComponent() {
  const { data, isLoading, error } = useGetItemsQuery();
  const [createItem] = useCreateItemMutation();
  
  const handleCreate = async (data: CreateItemDto) => {
    try {
      await createItem(data).unwrap();
      // Success handling
    } catch (error) {
      // Error handling
    }
  };
  
  if (isLoading) return <Loading />;
  if (error) return <Error error={error} />;
  
  return <ItemList items={data} onCreate={handleCreate} />;
}
```

### Database Operations

#### Creating a Supabase RPC Function
```typescript
// src/ui/supabase/rpc/yourFunction.ts
import { supabase } from '../index';

export async function yourFunction(params: YourParams) {
  const { data, error } = await supabase
    .rpc('your_function_name', params);
    
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
}
```

#### Adding a Migration
```sql
-- supabase/migrations/[timestamp]_your_migration.sql
-- Description of what this migration does

-- Add new table
CREATE TABLE public.your_table (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Add RLS
ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view records" ON public.your_table
    FOR SELECT USING (auth.role() = 'authenticated');
```

### Working with NFC

#### Using NFC in Components
```typescript
import { useNfc } from '../../hooks/useNfc';

function NfcFeature() {
  const { isAvailable, readTag, isReading } = useNfc();
  
  const handleRead = async () => {
    try {
      const result = await readTag();
      console.log('Tag data:', result);
    } catch (error) {
      console.error('Read failed:', error);
    }
  };
  
  if (!isAvailable) {
    return <div>NFC reader not available</div>;
  }
  
  return (
    <button onClick={handleRead} disabled={isReading}>
      {isReading ? 'Reading...' : 'Read NFC Tag'}
    </button>
  );
}
```

## Testing

### Unit Testing
```bash
# Run tests
npm run test

# Run with coverage
npm run test:coverage

# Run in UI mode
npm run test:ui
```

### E2E Testing
```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui
```

### Writing Tests
```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('renders title', () => {
    render(<YourComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });
  
  it('calls onAction when clicked', () => {
    const handleAction = vi.fn();
    render(<YourComponent title="Test" onAction={handleAction} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleAction).toHaveBeenCalled();
  });
});
```

## Code Style

### TypeScript Guidelines
- Use strict type checking
- Avoid `any` type
- Define interfaces for props
- Use enums for constants

### React Guidelines
- Use functional components
- Implement proper error boundaries
- Use React.memo for expensive components
- Follow hooks rules

### Styling Guidelines
- Use Tailwind CSS classes
- Follow DaisyUI component patterns
- Keep styles consistent
- Use CSS modules for complex styles

## Building for Production

### Build Commands
```bash
# Full production build
npm run build

# Platform-specific builds
npm run dist:mac    # macOS
npm run dist:win    # Windows
npm run dist:linux  # Linux
```

### Build Configuration
- Electron Builder config in `package.json`
- Build resources in `build/` directory
- Auto-updater configuration

## Debugging

### React DevTools
- Automatically available in development
- Inspect component tree
- Monitor state changes
- Profile performance

### Redux DevTools
- View store state
- Track action dispatch
- Time-travel debugging
- Export/import state

### Electron DevTools
```javascript
// Enable in main process
mainWindow.webContents.openDevTools();

// Or use environment variable
ENABLE_DEVTOOLS=true npm run dev
```

### Logging
```typescript
// Use the logger utility
import { logger } from '../logging';

logger.info('Operation started', { userId, action });
logger.error('Operation failed', error);
```

## Common Tasks

### Adding a New Page
1. Create page component
2. Add to lazy components
3. Add route
4. Update navigation
5. Add permissions

### Adding an API Endpoint
1. Create RPC function (if needed)
2. Add to API slice
3. Export hooks
4. Use in components

### Updating the Database
1. Create migration file
2. Test locally
3. Apply to production
4. Update TypeScript types

## Troubleshooting

### Common Issues

**Build Failures**
```bash
# Clean and rebuild
npm run clean
npm run build
```

**Type Errors**
```bash
# Check types
npm run type-check

# Fix common issues
npm run lint:fix
```

**Database Connection**
- Verify Supabase credentials
- Check network connection
- Ensure RLS policies are correct

**NFC Not Working**
- Check reader connection
- Verify driver installation
- Enable debug logging

## Resources

### Documentation
- [React Documentation](https://react.dev)
- [Electron Documentation](https://www.electronjs.org)
- [Supabase Documentation](https://supabase.io/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)

### Tools
- [React Developer Tools](https://react.dev/learn/react-developer-tools)
- [Redux DevTools](https://github.com/reduxjs/redux-devtools)
- [Supabase Studio](https://supabase.io/studio)

### Community
- Project issues tracker
- Discord/Slack channels
- Stack Overflow tags