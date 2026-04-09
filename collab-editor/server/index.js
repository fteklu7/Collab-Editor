const http = require("http");
const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const SessionManager = require("./session");

const PORT = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ status: "Collab Editor server is running." }));
});

const wss = new WebSocket.Server({ server });
const sessions = new SessionManager();

console.log(`[server] WebSocket server starting on port ${PORT}`);

wss.on("connection", (ws, req) => {
  const clientId = uuidv4();
  console.log(`[server] Client connected: ${clientId}`);

  ws.on("message", (raw) => {
    let message;
    try {
      message = JSON.parse(raw);
    } catch {
      ws.send(JSON.stringify({ type: "error", payload: "Invalid JSON." }));
      return;
    }

    const { type, payload } = message;

    switch (type) {
      case "join": {
        const { sessionId, username, language } = payload;

        if (!sessionId || !username) {
          ws.send(JSON.stringify({ type: "error", payload: "sessionId and username are required." }));
          return;
        }

        sessions.join(sessionId, clientId, ws, username, language || "javascript");

        const session = sessions.get(sessionId);

        // Send the current document state to the joining client
        ws.send(JSON.stringify({
          type: "init",
          payload: {
            code: session.code,
            language: session.language,
            users: sessions.getUserList(sessionId),
          },
        }));

        // Notify everyone else that someone joined
        sessions.broadcast(sessionId, clientId, {
          type: "user_joined",
          payload: {
            clientId,
            username,
            users: sessions.getUserList(sessionId),
          },
        });

        console.log(`[server] ${username} joined session ${sessionId}`);
        break;
      }

      case "code_change": {
        const { sessionId, code } = payload;
        if (!sessionId) return;

        sessions.updateCode(sessionId, code);

        sessions.broadcast(sessionId, clientId, {
          type: "code_change",
          payload: { code, senderId: clientId },
        });
        break;
      }

      case "language_change": {
        const { sessionId, language } = payload;
        if (!sessionId) return;

        sessions.updateLanguage(sessionId, language);

        sessions.broadcast(sessionId, clientId, {
          type: "language_change",
          payload: { language },
        });

        console.log(`[server] Language changed to ${language} in session ${sessionId}`);
        break;
      }

      case "cursor": {
        const { sessionId, line, column } = payload;
        if (!sessionId) return;

        sessions.broadcast(sessionId, clientId, {
          type: "cursor",
          payload: { clientId, line, column },
        });
        break;
      }

      default:
        ws.send(JSON.stringify({ type: "error", payload: `Unknown message type: ${type}` }));
    }
  });

  ws.on("close", () => {
    const info = sessions.leave(clientId);
    if (info) {
      const { sessionId, username } = info;
      console.log(`[server] ${username} disconnected from session ${sessionId}`);

      sessions.broadcast(sessionId, clientId, {
        type: "user_left",
        payload: {
          clientId,
          username,
          users: sessions.getUserList(sessionId),
        },
      });
    }
  });

  ws.on("error", (err) => {
    console.error(`[server] WebSocket error for ${clientId}:`, err.message);
  });
});

server.listen(PORT, () => {
  console.log(`[server] Listening on port ${PORT}`);
});
