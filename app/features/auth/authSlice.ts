// features/auth/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  name: string | null;
};

const initialState: AuthState = {
  name: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login(state, action: PayloadAction<{ name: string }>) {
      state.name = action.payload.name.trim() || null;
    },
    logout(state) {
      state.name = null;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
