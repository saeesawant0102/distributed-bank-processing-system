// Express + WebSocket Server for DC Bank System
import express from "express";
import http from "http";
import cors from "cors";
import { WebSocketServer } from "ws";
import routes from "./routes.js";
import { eventBus, EVENT_TYPES } from "./events.js";
import { state } from "./state.js";

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Mount API routes
app.use("/api", routes);

// Root health check
app.get("/", (req, res) => {
  res.json({
    status: "online",
    name: "Distributed Bank Processing Simulation Server",
    nodes: state.nodes.length,
    endpoints: "/api/state, /api/reset, /ws",
  });
});

const server = http.createServer(app);

// WebSocket setup
const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  eventBus.addClient(ws);

  // Send initial state & recent events on connect
  ws.send(
    JSON.stringify({
      id: 0,
      time: new Date().toTimeString().split(" ")[0],
      experiment: "system",
      type: "CONNECTED",
      data: {
        clusterState: state.getState(),
        recentEvents: eventBus.getRecentEvents(20),
      },
      message: "Connected to DC Bank Simulation WebSocket Server",
    })
  );

  ws.on("close", () => {
    eventBus.removeClient(ws);
  });

  ws.on("error", (err) => {
    console.error("WS client error:", err.message);
    eventBus.removeClient(ws);
  });
});

server.listen(PORT, () => {
  console.log(`[DC Bank Backend] Server running on http://localhost:${PORT}`);
  console.log(`[DC Bank Backend] WebSocket server active on ws://localhost:${PORT}/ws`);
});
