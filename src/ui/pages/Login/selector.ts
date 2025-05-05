import { RootState } from '../../lib/store';
import { initialState } from './slice';

export const selectUser = (state: RootState) => state.auth || initialState;

