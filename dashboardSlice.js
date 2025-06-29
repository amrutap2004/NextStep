import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../auth/authService';

export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await authService.getDashboardData(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  stats: {
    totalSkills: 0,
    completedRoadmaps: 0,
    activeRoadmaps: 0,
    totalResources: 0
  },
  recentActivity: [],
  recommendations: [],
  loading: false,
  error: null,
  success: false
};

const dashboardSlice = createSlice({
  name: 'dashboard',
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
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.recentActivity = action.payload.recentActivity;
        state.recommendations = action.payload.recommendations;
        state.success = true;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  }
});

export const { reset, clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer; 