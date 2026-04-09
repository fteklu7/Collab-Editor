import React, { useState } from "react";
import Editor from "./Editor";
import "./App.css";

function generateSessionId() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

export default function App() {
  const [joined, setJoined] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState("create"); // "create" | "join"
  const [inputSession, setInputSession] = useState("");
  const [formError, setFormError] = useState("");

  const handleJoin = () => {
    const name = username.trim();
    const sid = mode === "create" ? generateSessionId() : inputSession.trim().toUpperCase();

    if (!name) {
      setFormError("Please enter your name.");
      return;
    }
    if (mode === "join" && !sid) {
      setFormError("Please enter a session ID.");
      return;
    }

    setSessionId(sid);
    setJoined(true);
  };

  const handleLeave = () => {
    setJoined(false);
    setSessionId("");
    setInputSession("");
    setFormError("");
  };

  if (joined) {
    return (
      <Editor
        sessionId={sessionId}
        username={username}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <div className="join-screen">
      <div className="join-card">
        <h1 className="join-title">⌨ Collab Editor</h1>
        <p className="join-subtitle">
          Write code together, in real time — no account needed.
        </p>

        <div className="join-field">
          <label>Your Name</label>
          <input
            type="text"
            placeholder="e.g. Fetume"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            maxLength={30}
          />
        </div>

        <div className="tab-row">
          <button
            className={`tab-btn ${mode === "create" ? "active" : ""}`}
            onClick={() => setMode("create")}
          >
            Create Session
          </button>
          <button
            className={`tab-btn ${mode === "join" ? "active" : ""}`}
            onClick={() => setMode("join")}
          >
            Join Session
          </button>
        </div>

        {mode === "join" && (
          <div className="join-field">
            <label>Session ID</label>
            <input
              type="text"
              placeholder="e.g. A3BK9ZQ"
              value={inputSession}
              onChange={(e) => setInputSession(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={20}
            />
          </div>
        )}

        {formError && <p className="form-error">{formError}</p>}

        <button className="btn-primary" onClick={handleJoin}>
          {mode === "create" ? "Create & Join" : "Join Session"}
        </button>
      </div>
    </div>
  );
}
