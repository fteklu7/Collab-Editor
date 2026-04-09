# Real-Time Collaborative Code Editor

A browser-based code editor where multiple people can write code together in the same session, live. Changes from one user appear instantly on everyone else's screen — no refreshing, no copying files back and forth. Built with React, Node.js, WebSockets, and Docker.

---

## What It Does

- Create a session and share the session ID with anyone
- Multiple users can join the same session and edit code simultaneously
- Changes sync in real time across all connected clients via WebSockets
- Switch between JavaScript, Python, Java, and C++ with syntax highlighting
- See who's currently in the session in the sidebar
- No login or account required — just enter a name and go

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, CodeMirror 6 |
| Backend | Node.js, ws (WebSockets) |
| Syntax Highlighting | CodeMirror language extensions |
| Containerization | Docker + Docker Compose |

---

## Project Structure

```
collab-editor/
├── server/
│   ├── index.js        # WebSocket server, message routing
│   ├── session.js      # Session and client state management
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.jsx           # Join screen (create or join session)
│   │   ├── Editor.jsx        # Main editor UI
│   │   ├── useCollabSocket.js # WebSocket hook
│   │   ├── App.css
│   │   ├── Editor.css
│   │   └── index.jsx
│   ├── public/index.html
│   └── package.json
├── docker-compose.yml
└── README.md
```

---

## How to Run

**Prerequisites:** Node.js 18+ and npm, or Docker.

### Option 1 — Run Locally (Recommended for Development)

```bash
# Start the WebSocket server
cd server
npm install
npm start
# Server runs on ws://localhost:4000

# In a separate terminal, start the React client
cd client
npm install
npm start
# Client runs on http://localhost:3000
```

Open `http://localhost:3000` in two browser tabs, create a session in one, and join with the session ID in the other. Start typing in one — you'll see changes appear in the other.

### Option 2 — Docker

```bash
docker compose up --build
# Client: http://localhost:3000
# Server: ws://localhost:4000
```

---

## How It Works

### Session Flow

1. User A opens the app, enters their name, and clicks **Create & Join** — a random 7-character session ID is generated
2. User A shares the session ID with User B
3. User B enters their name, switches to **Join Session**, types the session ID, and joins
4. Both users are now in the same session and see each other in the sidebar

### Message Protocol

All communication happens over WebSockets using JSON messages. The message types are:

| Type | Direction | Description |
|---|---|---|
| `join` | Client → Server | Join or create a session |
| `init` | Server → Client | Sends current code and user list on connect |
| `code_change` | Both | Broadcasts code updates to all other clients |
| `language_change` | Both | Syncs language selection across all clients |
| `user_joined` | Server → Clients | Notifies when someone new joins |
| `user_left` | Server → Clients | Notifies when someone disconnects |

### Conflict Handling

The server uses a **last-write-wins** strategy. When two users type at the same time, each keystroke is broadcast immediately. The server always stores the most recently received version of the document. This works well for small collaborative sessions — the same approach used by many lightweight real-time tools before implementing something like CRDT or OT (Operational Transformation).

### Session Cleanup

Sessions are held in memory. When the last user disconnects from a session, the session is automatically cleaned up, freeing memory.

---

## How to Talk About This Project

**The one-liner:**
> "I built a real-time collaborative code editor where multiple users can write code together in the same session. It uses WebSockets to broadcast changes instantly across connected clients, with syntax highlighting for four languages and a session-based architecture on the backend."

**If they ask how the real-time sync works:**
> "Every time a user types, the client sends a `code_change` message over a persistent WebSocket connection to the server. The server updates the stored document state and broadcasts that change to every other connected client in the same session — excluding the sender to avoid echo. The client applies the incoming change without triggering another broadcast."

**If they ask about conflict resolution:**
> "I used last-write-wins, which works well for small sessions. Each change is applied as it arrives. I'm aware of more robust approaches like Operational Transformation or CRDTs — which is how Google Docs and Figma handle it — but for this scope, last-write-wins keeps the code simple and the behavior predictable."

**If they ask about the session system:**
> "Sessions are managed in memory on the server using a Map. Each session stores the current document state, the selected language, and a list of connected clients with their WebSocket references. When the last person leaves a session, it's deleted automatically. For production, you'd want to back this with Redis or a database so sessions survive server restarts."

**If they ask why you built it:**
> "I wanted to work with WebSockets beyond just reading about them. Real-time sync is one of those things that sounds straightforward until you actually implement it — deciding what to broadcast, to whom, when to update local state vs. remote state, how to handle disconnects. Building it end to end taught me a lot about stateful server architecture."

---

## License

MIT
