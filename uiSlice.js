import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: false,
  isDarkMode: false,
  theme: 'light',
  notifications: [],
  modals: {
    createRoadmap: false,
    editProfile: false,
    settings: false
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode: (state) => {
      state.isDarkMode = !state.isDarkMode;
      state.theme = state.isDarkMode ? 'dark' : 'light';
    },
    setDarkMode: (state, action) => {
      state.isDarkMode = action.payload;
      state.theme = state.isDarkMode ? 'dark' : 'light';
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      state.isDarkMode = action.payload === 'dark';
    },
    addNotification: (state, action) => {
      state.notifications.push(action.payload);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    openModal: (state, action) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key] = false;
      });
    }
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleDarkMode,
  setDarkMode,
  setTheme,
  addNotification,
  removeNotification,
  clearNotifications,
  openModal,
  closeModal,
  closeAllModals
} = uiSlice.actions;

export default uiSlice.reducer; 