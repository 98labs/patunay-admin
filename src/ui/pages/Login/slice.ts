import { createSlice } from '@reduxjs/toolkit'

interface authState {
    user: {} | null;
  }

export const initialState: authState = {
    user: null
  };
export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.user = action.payload
        },

        removeUser: (state) => {
            state.user = null
        },

    }
})

export const { setUser, removeUser } = authSlice.actions

export default authSlice.reducer