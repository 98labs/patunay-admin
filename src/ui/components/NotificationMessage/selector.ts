import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '../../lib/store';
import { initialState } from './slice';

const selectDomain = (state: RootState) => {
  if (state) {
    return state.notification || initialState;
  } else {
    return initialState;
  }
};

export const selectNotif = createSelector(
  [selectDomain],
  notification => notification,
);
