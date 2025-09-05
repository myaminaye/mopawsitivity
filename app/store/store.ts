// app/store.ts
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";

const PERSIST_KEY = "auth_v1";

function loadState() {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(PERSIST_KEY) : null;
    return raw ? (JSON.parse(raw) as { auth: { name: string | null } }) : undefined;
  } catch {
    return undefined;
  }
}

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  preloadedState: loadState(),
});

// Persist auth slice only
store.subscribe(() => {
  try {
    const state = store.getState();
    const toSave = { auth: { name: state.auth.name } };
    localStorage.setItem(PERSIST_KEY, JSON.stringify(toSave));
  } catch {
    /* ignore */
  }
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
