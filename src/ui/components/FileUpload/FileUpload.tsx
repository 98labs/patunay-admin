import React, { useRef } from 'react';
import { Image, X } from 'lucide-react';

interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  value: File | null;
  onChange: (file: File | null) => void;
  preview?: string | null;
  label?: string;
  helperText?: string;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default
  value,
  onChange,
  preview,
  label = 'Upload file',
  helperText,
  error
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (maxSize && file.size > maxSize) {
        alert(`File size must be less than ${maxSize / 1024 / 1024}MB`);
        return;
      }
      onChange(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
        <div className="space-y-1 text-center">
          {preview ? (
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Preview"
                className="mx-auto h-32 w-32 rounded-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-2 -right-2 inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Image className="mx-auto h-12 w-12 text-gray-400" />
          )}
          
          <div className="flex text-sm text-gray-600 dark:text-gray-400">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
            >
              <span>{value ? 'Change file' : 'Upload a file'}</span>
              <input
                ref={inputRef}
                id="file-upload"
                name="file-upload"
                type="file"
                className="sr-only"
                accept={accept}
                onChange={handleFileChange}
              />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          
          {helperText && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {helperText}
            </p>
          )}
        </div>
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default FileUpload;