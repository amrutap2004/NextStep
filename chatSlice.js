import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  onlineUsers: [],
  currentChat: null,
  loading: false,
  error: null
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    reset: (state) => {
      state.messages = [];
      state.onlineUsers = [];
      state.currentChat = null;
      state.loading = false;
      state.error = null;
    }
  }
});

export const {
  setMessages,
  addMessage,
  setOnlineUsers,
  setCurrentChat,
  setLoading,
  setError,
  clearError,
  reset
} = chatSlice.actions;

export default chatSlice.reducer; 