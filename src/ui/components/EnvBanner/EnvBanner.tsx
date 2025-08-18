import React from 'react';

interface Props {
  env?: 'development' | 'staging' | 'demo' | 'production';
  message?: string;
  position?: 'top' | 'bottom';
  className?: string;
}

const envColors: Record<string, string> = {
  development: '#f59e42',
  staging: '#42a5f5',
  demo: '#ab47bc',
  production: '#43a047',
};

// Get current environment
const getCurrentEnv = (): 'development' | 'staging' | 'demo' | 'production' => {
  // Check VITE_SUPABASE_ENV first, then fall back to NODE_ENV
  const supabaseEnv = import.meta.env.VITE_SUPABASE_ENV;
  const nodeEnv = import.meta.env.NODE_ENV;

  if (supabaseEnv) {
    return supabaseEnv as 'development' | 'staging' | 'demo' | 'production';
  }

  if (nodeEnv === 'production') {
    return 'production';
  }

  return 'development';
};
const EnvBanner: React.FC<Props> = ({ env, message, className = '' }) => {
  // Use provided env or auto-detect
  const currentEnv = env || getCurrentEnv();

  // Don't show banner in production
  if (currentEnv === 'production') {
    return null;
  }

  const bannerMessage = message || currentEnv.toUpperCase();
  const bgColor = envColors[currentEnv];

  return (
    <div
      className={`fixed text-xs font-bold text-white uppercase shadow-lg select-none ${className}`}
      style={{
        top: '10px',
        left: '-20px',
        width: '80px',
        height: '18px',
        backgroundColor: bgColor,
        zIndex: 1000,
        transform: 'rotate(-45deg)',
        transformOrigin: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          fontSize: '8px',
          lineHeight: '1',
          whiteSpace: 'nowrap',
        }}
      >
        {bannerMessage}
      </span>
    </div>
  );
};

export default EnvBanner;
