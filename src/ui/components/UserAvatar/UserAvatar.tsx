import { FC } from 'react';

interface UserAvatarProps {
  avatarUrl?: string | null;
  firstName?: string;
  lastName?: string;
  email?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg'
};

export const UserAvatar: FC<UserAvatarProps> = ({
  avatarUrl,
  firstName,
  lastName,
  email,
  size = 'md',
  className = ''
}) => {
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    }
    if (lastName) {
      return lastName.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return 'U';
  };

  const getBackgroundColor = () => {
    // Generate a consistent color based on the user's name or email
    const str = `${firstName}${lastName}${email}`.toLowerCase();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      'bg-primary',
      'bg-secondary', 
      'bg-accent',
      'bg-info',
      'bg-success',
      'bg-warning',
      'bg-error'
    ];
    
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (avatarUrl) {
    return (
      <div className={`avatar ${className}`}>
        <div className={`${sizeClasses[size]} rounded-full`}>
          <img 
            src={avatarUrl} 
            alt={`${firstName || ''} ${lastName || ''}`.trim() || 'User avatar'}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`avatar placeholder ${className}`}>
      <div className={`${getBackgroundColor()} text-neutral-content rounded-full ${sizeClasses[size]}`}>
        <span>{getInitials()}</span>
      </div>
    </div>
  );
};