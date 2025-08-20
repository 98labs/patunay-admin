import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  width?: number;
  headerTitle?: string;
  isDrawerOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}
const SideDrawer = ({ width = 384, headerTitle, isDrawerOpen, onClose, children }: Props) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (isDrawerOpen) {
      setIsMounted(true);
      document.body.style.overflow = 'hidden';
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      document.body.style.overflow = 'unset';
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isDrawerOpen]);

  if (!isMounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-[var(--color-neutral-black-01)]/20 transition-opacity duration-300 ease-in-out ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full overflow-auto bg-white shadow-md transition-transform duration-300 ease-in-out dark:bg-gray-800 ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: `${width}px` }}
      >
        {headerTitle && (
          <div className="flex justify-between px-8 pt-8 text-lg font-semibold">
            <h1>{headerTitle}</h1>
            <button onClick={onClose} className="cursor-pointer">
              <X />
            </button>
          </div>
        )}
        {children}
      </div>
    </>,
    document.body
  );
};

export default SideDrawer;
