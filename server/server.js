const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;
const CLIENT_DIR = path.join(__dirname, "..", "client");
const DEFAULT_ROOM_ID = "lobby";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map();

app.use(express.static(CLIENT_DIR));

app.get("/health", (_req, res) => {
  res.json({ ok: true, rooms: rooms.size });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(CLIENT_DIR, "index.html"));
});

io.on("connection", (socket) => {
  socket.emit("multiplayer:connected", { id: socket.id });

  socket.on("multiplayer:join", (payload = {}) => {
    const roomId = normalizeRoomId(payload.roomId);
    const player = normalizePlayer(payload.player);

    leaveRoom(socket);
    socket.join(roomId);
    socket.data.roomId = roomId;

    const room = getRoom(roomId);
    room.set(socket.id, {
      id: socket.id,
      roomId,
      ...player,
      state: normalizeState(payload.state),
      joinedAt: Date.now(),
      lastSeenAt: Date.now(),
    });

    socket.emit("multiplayer:joined", {
      selfId: socket.id,
      roomId,
      players: [...room.values()].map(serializePlayer),
    });
    socket.to(roomId).emit("multiplayer:playerJoined", serializePlayer(room.get(socket.id)));
  });

  socket.on("multiplayer:updateProfile", (payload = {}) => {
    const player = getSocketPlayer(socket);
    if (!player) return;

    Object.assign(player, normalizePlayer(payload.player), {
      lastSeenAt: Date.now(),
    });
    io.to(player.roomId).emit("multiplayer:playerUpdated", serializePlayer(player));
  });

  socket.on("multiplayer:state", (payload = {}) => {
    const player = getSocketPlayer(socket);
    if (!player) return;

    player.state = normalizeState(payload);
    player.lastSeenAt = Date.now();
    socket.to(player.roomId).emit("multiplayer:state", {
      id: socket.id,
      state: player.state,
      sentAt: Date.now(),
    });
  });

  socket.on("disconnect", () => {
    leaveRoom(socket);
  });
});

function getRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  return rooms.get(roomId);
}

function getSocketPlayer(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return null;
  return rooms.get(roomId)?.get(socket.id) ?? null;
}

function leaveRoom(socket) {
  const roomId = socket.data.roomId;
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (room?.delete(socket.id)) {
    socket.to(roomId).emit("multiplayer:playerLeft", { id: socket.id });
  }

  if (room && room.size === 0) rooms.delete(roomId);
  socket.leave(roomId);
  socket.data.roomId = null;
}

function serializePlayer(player) {
  return {
    id: player.id,
    roomId: player.roomId,
    playerId: player.playerId,
    displayName: player.displayName,
    carId: player.carId,
    courseId: player.courseId,
    state: player.state,
    joinedAt: player.joinedAt,
  };
}

function normalizeRoomId(roomId) {
  const value = String(roomId || DEFAULT_ROOM_ID).trim().slice(0, 32);
  return /^[a-zA-Z0-9_-]+$/.test(value) ? value : DEFAULT_ROOM_ID;
}

function normalizePlayer(player = {}) {
  const displayName = String(player.displayName || "Guest").trim().slice(0, 24) || "Guest";
  return {
    playerId: String(player.playerId || displayName).trim().slice(0, 32),
    displayName,
    carId: String(player.carId || "gt3").trim().slice(0, 24),
    courseId: String(player.courseId || "map1").trim().slice(0, 24),
  };
}

function normalizeState(state = {}) {
  return {
    position: normalizeVec3(state.position),
    quaternion: normalizeQuat(state.quaternion),
    velocity: normalizeVec3(state.velocity),
    steering: normalizeNumber(state.steering),
    throttle: normalizeNumber(state.throttle),
    brake: normalizeNumber(state.brake),
    speed: normalizeNumber(state.speed),
    timestamp: normalizeNumber(state.timestamp, Date.now()),
  };
}

function normalizeVec3(value = {}) {
  return {
    x: normalizeNumber(value.x),
    y: normalizeNumber(value.y),
    z: normalizeNumber(value.z),
  };
}

function normalizeQuat(value = {}) {
  return {
    x: normalizeNumber(value.x),
    y: normalizeNumber(value.y),
    z: normalizeNumber(value.z),
    w: normalizeNumber(value.w, 1),
  };
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

server.listen(PORT, () => {
  console.log(`Multiplayer server running on http://localhost:${PORT}`);
});
