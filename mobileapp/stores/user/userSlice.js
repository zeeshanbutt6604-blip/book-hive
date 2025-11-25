import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  auth: {
    isAuthenticated: false,
    userData: null,
    token: null,
    tokenExpire: null,
  },
  hasReviewed: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      const { user, token, tokenExpire } = action.payload;
      return {
        ...state,
        auth: {
          ...state.auth,
          isAuthenticated: true,
          userData: user,
          token,
          tokenExpire,
        },
      };
    },
    clearUser: (state) => {
      state.auth = initialState.auth;
    },
    setHasReviewed: (state, action) => {
      state.hasReviewed = action.payload;
    },
  },
});

export const getUser = (state) => state.user.auth;
export const getHasReviewed = (state) => state.user.hasReviewed;

export const { setUser, clearUser, setHasReviewed } = userSlice.actions;

export default userSlice.reducer;
