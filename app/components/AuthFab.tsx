"use client";

import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store";
import { login, logout } from "../features/auth/authSlice";

export default function AuthFab() {
  const dispatch = useDispatch<AppDispatch>();
  const name = useSelector((s: RootState) => s.auth.name);
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState("");

  return (
    <>
      <div style={{ position: "fixed", left: 20, bottom: 20, zIndex: 9999 }}>
        {!name ? (
          <button className="fab__btn" onClick={() => setOpen(true)}>
            Login
          </button>
        ) : (
          <div className="fab__menu" style={{ display: "grid", gap: 8 }}>
            <div style={{ padding: "6px 8px" }}>
              Hi, <b>{name}</b>
            </div>
            <button className="fab__btn" onClick={() => dispatch(logout())}>
              Logout
            </button>
          </div>
        )}
      </div>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Login</h3>
            <input value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="Your name" autoFocus style={{ width: "100%", padding: "12px 14px", border: "1px solid #ddd", borderRadius: 12, marginBottom: 12 }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button className="btn" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="btn"
                onClick={() => {
                  const trimmed = temp.trim();
                  if (trimmed) {
                    dispatch(login({ name: trimmed }));
                    setOpen(false);
                    setTemp("");
                  }
                }}
              >
                Login
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
