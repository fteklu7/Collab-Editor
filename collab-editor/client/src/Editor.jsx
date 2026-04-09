import React, { useState, useCallback, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { useCollabSocket } from "./useCollabSocket";
import "./Editor.css";

const LANGUAGES = {
  javascript: { label: "JavaScript", extension: javascript() },
  python: { label: "Python", extension: python() },
  java: { label: "Java", extension: java() },
  cpp: { label: "C++", extension: cpp() },
};

export default function Editor({ sessionId, username, onLeave }) {
  const [code, setCode] = useState("// Loading...\n");
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState([]);
  const [copied, setCopied] = useState(false);
  const isRemoteChange = useRef(false);

  const handleMessage = useCallback((message) => {
    const { type, payload } = message;

    switch (type) {
      case "init":
        setCode(payload.code);
        setLanguage(payload.language);
        setUsers(payload.users);
        break;

      case "code_change":
        if (payload.senderId !== undefined) {
          isRemoteChange.current = true;
          setCode(payload.code);
        }
        break;

      case "language_change":
        setLanguage(payload.language);
        break;

      case "user_joined":
      case "user_left":
        setUsers(payload.users);
        break;

      default:
        break;
    }
  }, []);

  const { connected, error, send } = useCollabSocket({
    sessionId,
    username,
    language,
    onMessage: handleMessage,
  });

  const handleCodeChange = useCallback(
    (value) => {
      if (isRemoteChange.current) {
        isRemoteChange.current = false;
        return;
      }
      setCode(value);
      send("code_change", { sessionId, code: value });
    },
    [sessionId, send]
  );

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    send("language_change", { sessionId, language: lang });
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="editor-layout">
      {/* Top Bar */}
      <div className="topbar">
        <div className="topbar-left">
          <span className="app-title">⌨ Collab Editor</span>
          <div className="session-info">
            <span className="session-label">Session:</span>
            <code className="session-id">{sessionId}</code>
            <button className="btn-ghost" onClick={copySessionId}>
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>

        <div className="topbar-right">
          <select
            className="lang-select"
            value={language}
            onChange={handleLanguageChange}
          >
            {Object.entries(LANGUAGES).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <div className={`status-dot ${connected ? "connected" : "disconnected"}`} />
          <span className="status-text">{connected ? "Connected" : "Disconnected"}</span>

          <button className="btn-leave" onClick={onLeave}>
            Leave
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="editor-body">
        {/* Sidebar - Active Users */}
        <div className="sidebar">
          <p className="sidebar-title">Active Users</p>
          {users.length === 0 ? (
            <p className="no-users">No users yet</p>
          ) : (
            <ul className="user-list">
              {users.map((u) => (
                <li key={u.clientId} className="user-item">
                  <span className="user-avatar">
                    {u.username.charAt(0).toUpperCase()}
                  </span>
                  <span className="user-name">
                    {u.username}
                    {u.username === username ? " (you)" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Code Editor */}
        <div className="editor-wrapper">
          <CodeMirror
            value={code}
            height="100%"
            theme={oneDark}
            extensions={[LANGUAGES[language]?.extension ?? javascript()]}
            onChange={handleCodeChange}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              autocompletion: true,
              foldGutter: true,
            }}
          />
        </div>
      </div>
    </div>
  );
}
