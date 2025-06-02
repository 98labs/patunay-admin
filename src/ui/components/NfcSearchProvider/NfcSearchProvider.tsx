import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useNfcSearch } from '../../hooks/useNfcSearch';
import { useNfcStatus } from '../../context/NfcStatusContext';
import { useLogger } from '../../hooks/useLogger';
import { NfcModeEntity } from '../../typings/enums/nfcEnum';
import { showNotification } from '../NotificationMessage/slice';
import type { NfcCardSearchData } from '../../../shared/types/electron';

interface NfcSearchProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
}

/**
 * Provider component that enables automatic NFC search functionality
 * Sets NFC to search mode and handles automatic navigation to artwork pages
 */
export const NfcSearchProvider: React.FC<NfcSearchProviderProps> = ({ 
  children, 
  enabled = true 
}) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const logger = useLogger('NfcSearchProvider');
  const { nfcFeaturesEnabled } = useNfcStatus();
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Handle search events
  const handleSearchStart = (data: NfcCardSearchData) => {
    logger.info('NFC search started', data);
  };

  const handleSearchSuccess = (artworkId: string) => {
    logger.info('NFC search successful, navigating to artwork', { artworkId });
  };

  const handleSearchError = (error: string) => {
    logger.error('NFC search failed', { error });
    dispatch(showNotification({
      type: 'error',
      message: `NFC search failed: ${error}`,
      duration: 5000,
    }));
  };

  const handleNotFound = (data: NfcCardSearchData) => {
    logger.warn('No artwork found for NFC tag', data);
    dispatch(showNotification({
      type: 'warning',
      message: `No artwork found for NFC tag. UID: ${data.uid}`,
      duration: 4000,
    }));
  };

  // Use the NFC search hook - always enabled, let it handle internal filtering
  console.log('🎯 NfcSearchProvider: useNfcSearch states:', { enabled, isSearchMode, nfcFeaturesEnabled });
  
  const { isSearching, isEnabled } = useNfcSearch({
    enabled: enabled && nfcFeaturesEnabled, // Only disable if completely disabled or NFC not available
    onSearchStart: handleSearchStart,
    onSearchSuccess: handleSearchSuccess,
    onSearchError: handleSearchError,
    onNotFound: handleNotFound,
  });

  // Set NFC to search mode when the provider is enabled and NFC is available
  useEffect(() => {
    if (!enabled || !nfcFeaturesEnabled || !window.electron?.setMode) {
      setIsSearchMode(false);
      return;
    }

    // Only enable search mode specifically on the Search Artwork page
    const isSearchPage = location.pathname === '/dashboard/artworks/search';
    
    if (isSearchPage) {
      logger.info('Setting NFC to search mode for automatic navigation');
      
      try {
        window.electron.setMode('search');
        setIsSearchMode(true);
        logger.debug('NFC search mode activated');
      } catch (error) {
        logger.error('Failed to set NFC search mode', error);
        setIsSearchMode(false);
      }
    } else {
      setIsSearchMode(false);
      logger.debug('NFC search mode disabled - not on search page');
    }
  }, [enabled, nfcFeaturesEnabled, location.pathname]);

  // Log current state for debugging
  useEffect(() => {
    logger.debug('NFC Search Provider state', {
      enabled,
      nfcFeaturesEnabled,
      isSearchMode,
      isEnabled,
      isSearching,
      pathname: location.pathname,
    });
  }, [enabled, nfcFeaturesEnabled, isSearchMode, isEnabled, isSearching, location.pathname]);

  return <>{children}</>;
};

export default NfcSearchProvider;