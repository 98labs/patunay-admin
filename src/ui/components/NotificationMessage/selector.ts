import { RootState } from '../../lib/store';
import { initialState } from './slice';

export const selectNotif = (state: RootState) => state.notification || initialState;