import { WebSocketServer } from "ws";
import { JSONFilePreset } from "lowdb/node";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const dbFile = path.join(dataDir, "signal-db.json");
fs.mkdirSync(dataDir, { recursive: true });

// Default DB shape
const defaultData = { rooms: {} };
const db = await JSONFilePreset(dbFile, defaultData);

function getRoom(roomId) {
  const rooms = db.data.rooms;
  if (!rooms[roomId]) {
    rooms[roomId] = { queueForA: [], queueForB: [] };
  }
  return rooms[roomId];
}

// Track live connections per room/role
const connections = new Map(); // key: `${roomId}|${role}` -> ws

const wss = new WebSocketServer({ port: 3001 });
console.log("[signal-ws] WebSocket signaling server listening on ws://localhost:3001");

wss.on("connection", (ws) => {
  let roomId = null;
  let role = null; // 'a' | 'b'

  ws.on("message", async (msg) => {
    try {
      const json = JSON.parse(msg.toString());
      const type = json.type;

      if (type === "join") {
        const { room, role: r } = json;
        if (r !== "a" && r !== "b") return;
        roomId = String(room);
        role = r;
        connections.set(`${roomId}|${role}`, ws);
        // Flush any queued signals for this side
        const roomObj = getRoom(roomId);
        const queue = role === "a" ? roomObj.queueForA : roomObj.queueForB;
        for (const item of queue) {
          ws.send(JSON.stringify({ type: "signal", payload: item }));
        }
        queue.length = 0;
        await db.write();
        return;
      }

      if (type === "signal") {
        const { payload } = json; // {type:'offer'|'answer'|'candidate', data}
        if (!roomId || !role) return;
        const destRole = role === "a" ? "b" : "a";
        const destKey = `${roomId}|${destRole}`;
        const destWs = connections.get(destKey);
        if (destWs && destWs.readyState === destWs.OPEN) {
          destWs.send(JSON.stringify({ type: "signal", payload }));
        } else {
          // Persist to queue for later
          const roomObj = getRoom(roomId);
          if (destRole === "a") roomObj.queueForA.push(payload);
          else roomObj.queueForB.push(payload);
          await db.write();
        }
        return;
      }

      if (type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
        return;
      }
    } catch (e) {
      console.error("[signal-ws] message error", e);
    }
  });

  ws.on("close", () => {
    if (roomId && role) {
      const key = `${roomId}|${role}`;
      const existing = connections.get(key);
      if (existing === ws) connections.delete(key);
    }
  });
});
