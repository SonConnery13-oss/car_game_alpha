const express = require("express");
const fs = require("fs");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const CLIENT_DIR = path.join(__dirname, "..", "client");
const DEFAULT_ROOM_ID = "lobby";
const LEADERBOARD_FILE = path.join(__dirname, "data", "leaderboard.json");
const LEADERBOARD_LIMIT = 100;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map();
const leaderboard = loadLeaderboard();

app.use(express.static(CLIENT_DIR));

app.get("/health", (_req, res) => {
  res.json({ ok: true, rooms: rooms.size, leaderboardRecords: countLeaderboardRecords() });
});

app.get("/api/leaderboard", (_req, res) => {
  res.json({ leaderboard: serializeLeaderboard() });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(CLIENT_DIR, "index.html"));
});

io.on("connection", (socket) => {
  socket.emit("multiplayer:connected", { id: socket.id });
  socket.emit("leaderboard:snapshot", { leaderboard: serializeLeaderboard() });

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
      leaderboard: serializeLeaderboard(),
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

  socket.on("leaderboard:request", () => {
    socket.emit("leaderboard:snapshot", { leaderboard: serializeLeaderboard() });
  });

  socket.on("leaderboard:submit", (payload = {}) => {
    const saved = saveLeaderboardRecord(payload, getSocketPlayer(socket));
    if (!saved) return;

    socket.emit("leaderboard:accepted", saved);
    if (saved.isPersonalBest) {
      io.emit("leaderboard:updated", {
        courseId: saved.courseId,
        records: saved.records,
      });
    }
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

function loadLeaderboard() {
  try {
    const raw = fs.readFileSync(LEADERBOARD_FILE, "utf8");
    return sanitizeLeaderboard(JSON.parse(raw));
  } catch {
    return {};
  }
}

function persistLeaderboard() {
  fs.mkdirSync(path.dirname(LEADERBOARD_FILE), { recursive: true });
  fs.writeFileSync(LEADERBOARD_FILE, `${JSON.stringify(leaderboard, null, 2)}\n`);
}

function saveLeaderboardRecord(payload = {}, player = null) {
  const courseId = normalizeCourseId(payload.courseId ?? player?.courseId);
  const record = normalizeLeaderboardRecord(payload.record ?? payload, player);
  if (!courseId || !record) return null;

  const courseRecords = leaderboard[courseId] ?? {};
  const previous = courseRecords[record.key];
  const isPersonalBest = !previous || record.time < previous.time;

  if (isPersonalBest) {
    courseRecords[record.key] = record;
    leaderboard[courseId] = courseRecords;
    persistLeaderboard();
  }

  return {
    courseId,
    record: courseRecords[record.key] ?? record,
    isPersonalBest,
    records: getCourseLeaderboard(courseId),
    leaderboard: serializeLeaderboard(),
  };
}

function serializeLeaderboard() {
  return Object.fromEntries(
    Object.keys(leaderboard)
      .sort()
      .map((courseId) => [courseId, getCourseLeaderboard(courseId)]),
  );
}

function getCourseLeaderboard(courseId) {
  return Object.values(leaderboard[courseId] ?? {})
    .filter((record) => Number.isFinite(record.time))
    .sort((a, b) => a.time - b.time || a.id.localeCompare(b.id))
    .slice(0, LEADERBOARD_LIMIT)
    .map(serializeLeaderboardRecord);
}

function serializeLeaderboardRecord(record) {
  return {
    id: record.id,
    key: record.key,
    time: record.time,
    carId: record.carId,
    finishedAt: record.finishedAt,
  };
}

function sanitizeLeaderboard(value = {}) {
  const sanitized = {};

  for (const [rawCourseId, rawRecords] of Object.entries(value ?? {})) {
    const courseId = normalizeCourseId(rawCourseId);
    if (!courseId) continue;

    const records = Array.isArray(rawRecords) ? rawRecords : Object.values(rawRecords ?? {});
    for (const rawRecord of records) {
      const record = normalizeLeaderboardRecord(rawRecord);
      if (!record) continue;

      const courseRecords = sanitized[courseId] ?? {};
      const previous = courseRecords[record.key];
      if (!previous || record.time < previous.time) {
        courseRecords[record.key] = record;
        sanitized[courseId] = courseRecords;
      }
    }
  }

  return sanitized;
}

function normalizeLeaderboardRecord(record = {}, player = null) {
  if (!record || typeof record !== "object") return null;

  const time = normalizeNumber(record.time, NaN);
  if (!Number.isFinite(time) || time <= 0 || time > 60 * 60 * 1000) return null;

  const key = normalizePlayerKey(record.key ?? record.playerId ?? player?.playerId ?? record.id ?? player?.displayName);
  if (!key) return null;

  const id = normalizeDisplayName(record.id ?? record.displayName ?? player?.displayName ?? key);
  return {
    id,
    key,
    time,
    carId: normalizeCarId(record.carId ?? player?.carId),
    finishedAt: normalizeTimestamp(record.finishedAt),
  };
}

function normalizeCourseId(courseId) {
  const value = String(courseId || "").trim().slice(0, 24);
  return /^[a-zA-Z0-9_-]+$/.test(value) ? value : null;
}

function normalizePlayerKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 32);
}

function normalizeDisplayName(value) {
  return String(value || "Guest").trim().slice(0, 24) || "Guest";
}

function normalizeCarId(value) {
  const carId = String(value || "gt3").trim().slice(0, 24);
  return /^[a-zA-Z0-9_-]+$/.test(carId) ? carId : "gt3";
}

function normalizeTimestamp(value) {
  const timestamp = normalizeNumber(value, Date.now());
  return Math.min(Math.max(timestamp, 0), Date.now());
}

function countLeaderboardRecords() {
  return Object.values(leaderboard).reduce((total, courseRecords) => total + Object.keys(courseRecords).length, 0);
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

server.listen(PORT, HOST, () => {
  console.log(`Multiplayer server running on port ${PORT}`);
});
