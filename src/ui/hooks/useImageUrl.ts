import { useState, useEffect, useCallback } from 'react';
import { getImageUrl, ImageUrlService } from '../services/imageUrlService';

interface UseImageUrlOptions {
  bucket?: string;
  path?: string;
  expiresIn?: number;
  transform?: {
    width?: number;
    height?: number;
    quality?: number;
  };
  enabled?: boolean;
}

interface UseImageUrlResult {
  url: string | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useImageUrl({
  bucket = 'artifacts',
  path,
  expiresIn,
  transform,
  enabled = true,
}: UseImageUrlOptions): UseImageUrlResult {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchUrl = useCallback(async () => {
    if (!path || !enabled) {
      setUrl(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const newUrl = await getImageUrl({
        bucket,
        path,
        expiresIn,
        transform,
      });
      
      setUrl(newUrl);
    } catch (err) {
      setError(err as Error);
      setUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, [bucket, path, expiresIn, transform, enabled]);
  
  useEffect(() => {
    fetchUrl();
  }, [fetchUrl]);
  
  return {
    url,
    isLoading,
    error,
    refresh: fetchUrl,
  };
}

// Hook for multiple image URLs
export function useImageUrls(
  configs: UseImageUrlOptions[]
): { urls: (string | null)[]; isLoading: boolean; error: Error | null } {
  const [urls, setUrls] = useState<(string | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchUrls = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const imageConfigs = configs.map(({ bucket = 'artifacts', path = '', expiresIn, transform }) => ({
          bucket,
          path,
          expiresIn,
          transform,
        }));
        
        const newUrls = await ImageUrlService.getImageUrls(imageConfigs);
        setUrls(newUrls);
      } catch (err) {
        setError(err as Error);
        setUrls([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (configs.length > 0) {
      fetchUrls();
    }
  }, [configs]);
  
  return { urls, isLoading, error };
}