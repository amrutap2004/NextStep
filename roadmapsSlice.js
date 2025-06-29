import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../auth/authService';

// Async thunks
export const fetchRoadmaps = createAsyncThunk(
  'roadmaps/fetchRoadmaps',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await authService.getRoadmaps(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createRoadmap = createAsyncThunk(
  'roadmaps/createRoadmap',
  async (roadmapData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await authService.createRoadmap(roadmapData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateRoadmap = createAsyncThunk(
  'roadmaps/updateRoadmap',
  async ({ roadmapId, roadmapData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await authService.updateRoadmap(roadmapId, roadmapData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteRoadmap = createAsyncThunk(
  'roadmaps/deleteRoadmap',
  async (roadmapId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      await authService.deleteRoadmap(roadmapId, token);
      return roadmapId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  roadmaps: [],
  currentRoadmap: null,
  loading: false,
  error: null,
  success: false
};

const roadmapsSlice = createSlice({
  name: 'roadmaps',
  initialState,
  reducers: {
    reset: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentRoadmap: (state, action) => {
      state.currentRoadmap = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch roadmaps
      .addCase(fetchRoadmaps.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoadmaps.fulfilled, (state, action) => {
        state.loading = false;
        state.roadmaps = action.payload;
        state.success = true;
      })
      .addCase(fetchRoadmaps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Create roadmap
      .addCase(createRoadmap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRoadmap.fulfilled, (state, action) => {
        state.loading = false;
        state.roadmaps.push(action.payload);
        state.success = true;
      })
      .addCase(createRoadmap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Update roadmap
      .addCase(updateRoadmap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRoadmap.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.roadmaps.findIndex(roadmap => roadmap._id === action.payload._id);
        if (index !== -1) {
          state.roadmaps[index] = action.payload;
        }
        state.success = true;
      })
      .addCase(updateRoadmap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Delete roadmap
      .addCase(deleteRoadmap.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRoadmap.fulfilled, (state, action) => {
        state.loading = false;
        state.roadmaps = state.roadmaps.filter(roadmap => roadmap._id !== action.payload);
        state.success = true;
      })
      .addCase(deleteRoadmap.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  }
});

export const { reset, clearError, setCurrentRoadmap } = roadmapsSlice.actions;
export default roadmapsSlice.reducer; 