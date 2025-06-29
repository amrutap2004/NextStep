import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../auth/authService';

// Async thunks
export const fetchSkills = createAsyncThunk(
  'skills/fetchSkills',
  async (_, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await authService.getSkills(token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const addSkill = createAsyncThunk(
  'skills/addSkill',
  async (skillData, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await authService.addSkill(skillData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateSkill = createAsyncThunk(
  'skills/updateSkill',
  async ({ skillId, skillData }, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      return await authService.updateSkill(skillId, skillData, token);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteSkill = createAsyncThunk(
  'skills/deleteSkill',
  async (skillId, thunkAPI) => {
    try {
      const token = thunkAPI.getState().auth.token;
      await authService.deleteSkill(skillId, token);
      return skillId;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  skills: [],
  loading: false,
  error: null,
  success: false
};

const skillsSlice = createSlice({
  name: 'skills',
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
      // Fetch skills
      .addCase(fetchSkills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.loading = false;
        state.skills = action.payload;
        state.success = true;
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Add skill
      .addCase(addSkill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSkill.fulfilled, (state, action) => {
        state.loading = false;
        state.skills.push(action.payload);
        state.success = true;
      })
      .addCase(addSkill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Update skill
      .addCase(updateSkill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSkill.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.skills.findIndex(skill => skill._id === action.payload._id);
        if (index !== -1) {
          state.skills[index] = action.payload;
        }
        state.success = true;
      })
      .addCase(updateSkill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Delete skill
      .addCase(deleteSkill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSkill.fulfilled, (state, action) => {
        state.loading = false;
        state.skills = state.skills.filter(skill => skill._id !== action.payload);
        state.success = true;
      })
      .addCase(deleteSkill.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  }
});

export const { reset, clearError } = skillsSlice.actions;
export default skillsSlice.reducer; 