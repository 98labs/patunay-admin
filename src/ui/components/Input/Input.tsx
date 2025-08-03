import React, { forwardRef } from 'react';
import { classNames } from '../../utils/classNames';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={classNames(
          'block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 sm:text-sm',
          error
            ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500',
          'bg-white dark:bg-gray-700',
          'disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;