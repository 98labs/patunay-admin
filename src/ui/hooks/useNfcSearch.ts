import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLazySearchArtworkByNfcQuery } from '../store/api/artworkApi';
import { useLogger } from './useLogger';
import { useNfcStatus } from '../context/NfcStatusContext';
import type { NfcCardSearchData, NfcSearchError } from '../../shared/types/electron';

interface UseNfcSearchOptions {
  enabled?: boolean;
  onSearchStart?: (data: NfcCardSearchData) => void;
  onSearchSuccess?: (artworkId: string) => void;
  onSearchError?: (error: string) => void;
  onNotFound?: (data: NfcCardSearchData) => void;
}

/**
 * Hook for handling NFC card search and automatic navigation
 * Subscribes to NFC card detection events and navigates to artwork pages
 */
export const useNfcSearch = (options: UseNfcSearchOptions = {}) => {
  const {
    enabled = true,
    onSearchStart,
    onSearchSuccess,
    onSearchError,
    onNotFound,
  } = options;

  const navigate = useNavigate();
  const logger = useLogger('NfcSearch');
  const { nfcFeaturesEnabled } = useNfcStatus();
  const [searchArtworkByNfc, { isLoading }] = useLazySearchArtworkByNfcQuery();

  const handleNfcCardSearch = useCallback(async (data: NfcCardSearchData) => {
    console.log('🔍 useNfcSearch: Received NFC card search event', data);
    
    if (!enabled || !nfcFeaturesEnabled) {
      console.log('🔍 useNfcSearch: Search disabled', { enabled, nfcFeaturesEnabled });
      logger.debug('NFC search disabled or NFC not available');
      return;
    }
    
    // Only process search events if we're specifically on the Search Artwork page
    const currentPath = window.location.pathname;
    const isSearchPage = currentPath === '/dashboard/artworks/search';
    
    if (!isSearchPage) {
      console.log('🔍 useNfcSearch: Ignoring search - not on search page', { currentPath });
      return;
    }

    console.log('🔍 useNfcSearch: Starting artwork search');
    logger.info('NFC card detected for search', data);
    onSearchStart?.(data);

    try {
      // Search for artwork using UID with get_artwork RPC
      let artwork = null;
      
      if (data.uid) {
        console.log('🔍 useNfcSearch: Searching artwork by UID via get_artwork RPC:', data.uid);
        logger.debug('Searching artwork by NFC UID using get_artwork RPC', { uid: data.uid });
        
        const uidResult = await searchArtworkByNfc({ uid: data.uid });
        console.log('🔍 useNfcSearch: get_artwork RPC result for UID:', uidResult);
        
        if (uidResult.data) {
          artwork = uidResult.data;
          console.log('🔍 useNfcSearch: Found artwork by UID:', { id: artwork.id, title: artwork.title });
        } else {
          console.log('🔍 useNfcSearch: No artwork found for UID:', data.uid);
        }
      }

      // If not found by UID and we have data content, try using data as artwork ID
      if (!artwork && data.data && data.data.trim()) {
        console.log('🔍 useNfcSearch: Trying data content as artwork ID:', data.data.trim());
        logger.debug('Searching artwork by NFC data content using get_artwork RPC', { data: data.data });
        
        const dataResult = await searchArtworkByNfc({ data: data.data.trim() });
        console.log('🔍 useNfcSearch: get_artwork RPC result for data:', dataResult);
        
        if (dataResult.data) {
          artwork = dataResult.data;
          console.log('🔍 useNfcSearch: Found artwork by data:', { id: artwork.id, title: artwork.title });
        } else {
          console.log('🔍 useNfcSearch: No artwork found for data:', data.data.trim());
        }
      }

      if (artwork) {
        console.log('🔍 useNfcSearch: Artwork found! Navigating to:', `/dashboard/artworks/${artwork.id}`);
        logger.info('Artwork found for NFC tag, navigating', { 
          artworkId: artwork.id, 
          title: artwork.title 
        });
        
        onSearchSuccess?.(artwork.id);
        
        // Navigate to the artwork detail page
        navigate(`/dashboard/artworks/${artwork.id}`);
      } else {
        console.log('🔍 useNfcSearch: No artwork found for NFC tag', data);
        logger.warn('No artwork found for NFC tag', data);
        onNotFound?.(data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Failed to search artwork by NFC', error);
      onSearchError?.(errorMessage);
    }
  }, [
    enabled,
    nfcFeaturesEnabled,
    onSearchStart,
    onSearchSuccess,
    onSearchError,
    onNotFound,
    searchArtworkByNfc,
    navigate,
  ]);

  const handleNfcSearchError = useCallback((error: NfcSearchError) => {
    logger.error('NFC search error received', error);
    onSearchError?.(error.message);
  }, [onSearchError]);

  // Subscribe to NFC search events
  useEffect(() => {
    console.log('🔍 useNfcSearch: useEffect called', { enabled, hasElectron: !!window.electron });
    
    if (!enabled || !window.electron) {
      console.log('🔍 useNfcSearch: Not setting up listeners - disabled or no electron API');
      return;
    }

    console.log('🔍 useNfcSearch: Setting up NFC search event listeners');
    logger.debug('Setting up NFC search event listeners');

    // Subscribe to successful card reads for search
    if (window.electron.subscribeNfcCardSearch) {
      console.log('🔍 useNfcSearch: Subscribing to nfc-card-search events');
      window.electron.subscribeNfcCardSearch(handleNfcCardSearch);
    } else {
      console.error('🔍 useNfcSearch: subscribeNfcCardSearch not available!');
    }

    // Subscribe to search errors
    if (window.electron.subscribeNfcSearchError) {
      console.log('🔍 useNfcSearch: Subscribing to nfc-search-error events');
      window.electron.subscribeNfcSearchError(handleNfcSearchError);
    } else {
      console.error('🔍 useNfcSearch: subscribeNfcSearchError not available!');
    }

    return () => {
      logger.debug('Cleaning up NFC search event listeners');
      // Note: Current IPC implementation doesn't provide unsubscribe methods
    };
  }, [enabled, handleNfcCardSearch, handleNfcSearchError]);

  return {
    isSearching: isLoading,
    isEnabled: enabled && nfcFeaturesEnabled,
  };
};

export default useNfcSearch;