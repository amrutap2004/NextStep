import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../auth/authService';

export const fetchResources = createAsyncThunk(
  'resources/fetchResources',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await authService.getResources(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  resources: [],
  loading: false,
  error: null,
  success: false
};

const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    reset: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchResources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchResources.fulfilled, (state, action) => {
        state.loading = false;
        state.resources = action.payload;
        state.success = true;
      })
      .addCase(fetchResources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  }
});

export const { reset, clearError } = resourcesSlice.actions;
export default resourcesSlice.reducer; 