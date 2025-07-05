import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '../../store/store';
import { initialState } from './slice';

const selectDomain = (state: RootState) => {
  if (state) {
    return state.artwork || initialState;
  } else {
    return initialState;
  }
};

export const selectNotif = createSelector(
  [selectDomain],
  artwork => artwork,
);
