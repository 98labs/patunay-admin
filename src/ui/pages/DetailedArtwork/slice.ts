import { createSlice } from '@reduxjs/toolkit'

interface artworkState {
    data: any | null
  }

export const initialState: artworkState = {
    data: null,
  };
export const artworkSlice = createSlice({
    name: 'artwork',
    initialState,
    reducers: {
        setData: (state, action) => {
            state.data = action.payload
        },

        clearData: (state) => {
            state.data = null
        },
    }
})

export const { setData, clearData } = artworkSlice.actions

export default artworkSlice.reducer