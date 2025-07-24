import { Suspense, ReactNode } from 'react';
import { Loading } from '@components';

interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const SuspenseWrapper = ({ children, fallback }: SuspenseWrapperProps) => {
  return (
    <Suspense fallback={fallback || <Loading fullScreen={false} />}>
      {children}
    </Suspense>
  );
};

export default SuspenseWrapper;