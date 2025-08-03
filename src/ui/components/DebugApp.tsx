import React from 'react';

const DebugApp: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1>Debug Mode - App is Rendering</h1>
      <p>If you can see this, React is working!</p>
      <div>
        <h2>Environment Check:</h2>
        <ul>
          <li>Window location: {window.location.href}</li>
          <li>Local storage keys: {Object.keys(localStorage).join(', ')}</li>
          <li>Supabase URL: {import.meta.env.VITE_SUPABASE_URL || 'Not set'}</li>
        </ul>
      </div>
    </div>
  );
};

export default DebugApp;