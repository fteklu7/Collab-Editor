import { useEffect, useRef, useCallback, useState } from "react";

const WS_URL = process.env.REACT_APP_WS_URL || "ws://localhost:4000";

export function useCollabSocket({ sessionId, username, language, onMessage }) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const onMessageRef = useRef(onMessage);

  // Keep the callback ref fresh without re-running the effect
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!sessionId || !username) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
      ws.send(
        JSON.stringify({
          type: "join",
          payload: { sessionId, username, language },
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessageRef.current(message);
      } catch {
        console.error("Failed to parse server message.");
      }
    };

    ws.onerror = () => {
      setError("WebSocket connection failed. Is the server running?");
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [sessionId, username, language]);

  const send = useCallback((type, payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  return { connected, error, send };
}
