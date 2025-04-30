import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '../../lib/store';
import { initialState } from './slice';

const selectDomain = (state: RootState) => {
  if (state) {
    return state.auth || initialState;
  } else {
    return initialState;
  }
};

export const selectAuth = createSelector(
  [selectDomain],
  auth => auth,
);
