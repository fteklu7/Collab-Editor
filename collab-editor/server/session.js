const WebSocket = require("ws");

/**
 * SessionManager handles all active editing sessions.
 * Each session has a document (code string), a language, and a map of connected clients.
 */
class SessionManager {
  constructor() {
    // sessionId -> { code, language, clients: Map<clientId, { ws, username }> }
    this._sessions = new Map();
    // clientId -> sessionId (for reverse lookup on disconnect)
    this._clientIndex = new Map();
  }

  _ensureSession(sessionId, language = "javascript") {
    if (!this._sessions.has(sessionId)) {
      this._sessions.set(sessionId, {
        code: `// Session: ${sessionId}\n// Start coding here...\n`,
        language,
        clients: new Map(),
      });
    }
    return this._sessions.get(sessionId);
  }

  get(sessionId) {
    return this._sessions.get(sessionId);
  }

  join(sessionId, clientId, ws, username, language) {
    const session = this._ensureSession(sessionId, language);
    session.clients.set(clientId, { ws, username });
    this._clientIndex.set(clientId, sessionId);
  }

  leave(clientId) {
    const sessionId = this._clientIndex.get(clientId);
    if (!sessionId) return null;

    const session = this._sessions.get(sessionId);
    if (!session) return null;

    const clientInfo = session.clients.get(clientId);
    session.clients.delete(clientId);
    this._clientIndex.delete(clientId);

    // Clean up empty sessions
    if (session.clients.size === 0) {
      this._sessions.delete(sessionId);
    }

    return { sessionId, username: clientInfo?.username };
  }

  updateCode(sessionId, code) {
    const session = this._sessions.get(sessionId);
    if (session) session.code = code;
  }

  updateLanguage(sessionId, language) {
    const session = this._sessions.get(sessionId);
    if (session) session.language = language;
  }

  getUserList(sessionId) {
    const session = this._sessions.get(sessionId);
    if (!session) return [];
    return Array.from(session.clients.entries()).map(([id, { username }]) => ({
      clientId: id,
      username,
    }));
  }

  broadcast(sessionId, excludeClientId, message) {
    const session = this._sessions.get(sessionId);
    if (!session) return;

    const payload = JSON.stringify(message);

    for (const [clientId, { ws }] of session.clients) {
      if (clientId === excludeClientId) continue;
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}

module.exports = SessionManager;
