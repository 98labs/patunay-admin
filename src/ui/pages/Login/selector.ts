import { RootState } from '../../store/store';
import { initialState } from './slice';

export const selectUser = (state: RootState) => state.auth || initialState;

