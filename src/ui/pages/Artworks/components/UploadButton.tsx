import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { useDispatch } from 'react-redux';

import { showNotification } from '../../../components/NotificationMessage/slice'
import { UploadButtonProps } from './types';
import { cleanAndValidateData, uploadInBatches } from './utils';

const UploadButton: React.FC<UploadButtonProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input value
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        setIsLoading(true);
        try {
          const validatedData = cleanAndValidateData(result.data);

          // ⏩ Upload in chunks
          await uploadInBatches(validatedData, 100); // batch size = 100 artworks at a time
    
          dispatch(showNotification({
            title: 'ArtList',
            message: 'Successfully Uploaded!',
            status: 'success'
          }));
    
          onFileSelect(validatedData);
    
        } catch (error: any) {
          dispatch(showNotification({
            message: `Upload failed: ${error.message}`,
            status: 'error'
          }));
          console.error('Upload error:', error);
        } finally {
          setIsLoading(false);
        }
      },
      error: (err) => {
        setIsLoading(false); // make sure to reset here too
        dispatch(showNotification({
          message: 'CSV parsing error',
          status: 'error'
        }));
        console.error('CSV parse error:', err);
      }
    });
  };

  return (
    <div>
      <button 
          onClick={handleButtonClick}
          className={`flex items-center justify-center w-1/2 px-5 py-2 text-sm tracking-wide text-white transition-colors duration-200 ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} rounded-lg sm:w-auto gap-x-2`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_3098_154395)">
                  <path 
                    d="M13.3333 13.3332L9.99997 9.9999M9.99997 9.9999L6.66663 13.3332M9.99997 9.9999V17.4999M16.9916 15.3249C17.8044 14.8818 18.4465 14.1806 18.8165 13.3321C19.1866 12.4835 19.2635 11.5359 19.0351 10.6388C18.8068 9.7417 18.2862 8.94616 17.5555 8.37778C16.8248 7.80939 15.9257 7.50052 15 7.4999H13.95C13.6977 6.52427 13.2276 5.61852 12.5749 4.85073C11.9222 4.08295 11.104 3.47311 10.1817 3.06708C9.25943 2.66104 8.25709 2.46937 7.25006 2.50647C6.24304 2.54358 5.25752 2.80849 4.36761 3.28129C3.47771 3.7541 2.70656 4.42249 2.11215 5.23622C1.51774 6.04996 1.11554 6.98785 0.935783 7.9794C0.756025 8.97095 0.803388 9.99035 1.07431 10.961C1.34523 11.9316 1.83267 12.8281 2.49997 13.5832" 
                    stroke="currentColor"
                    strokeWidth="1.67" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"/>
                </g>
                <defs>
                  <clipPath id="clip0_3098_154395">
                    <rect width="20" height="20" fill="white"/>
                  </clipPath>
                </defs>
            </svg>

            {isLoading ? (
              <span>Importing...</span>
            ) : (
              <>
                <span>Upload File</span>
              </>
            )}
      </button>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default UploadButton;
