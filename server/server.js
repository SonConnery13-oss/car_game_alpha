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
const RACE_COUNTDOWN_MS = 3600;
const RACE_INVITE_TIMEOUT_MS = 12000;
const RACE_TIMEOUT_MS = 15 * 60 * 1000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map();
const raceSessions = new Map();
const pendingRaceInvites = new Map();
const leaderboard = loadLeaderboard();

app.use(express.static(CLIENT_DIR));

app.get("/health", (_req, res) => {
  res.json({ ok: true, rooms: rooms.size, leaderboardRecords: countLeaderboardRecords() });
});

app.get("/api/leaderboard", (_req, res) => {
  res.json({ leaderboard: serializeLeaderboard() });
});

app.get("/api/rooms", (_req, res) => {
  res.json({ rooms: serializeRooms() });
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
      players: getCoursePlayers(roomId, player.courseId).map(serializePlayer),
      leaderboard: serializeLeaderboard(),
      race: serializeRaceSession(getRaceSession(roomId, player.courseId), socket.id),
    });
    emitToCourse(roomId, player.courseId, "multiplayer:playerJoined", serializePlayer(room.get(socket.id)), socket.id);
    broadcastRoomsSnapshot();

    const race = getRaceSession(roomId, player.courseId);
    if (isRaceActive(race) && !race.participants.has(socket.id)) {
      race.spectators.add(socket.id);
      socket.emit("race:spectate", serializeRaceSession(race, socket.id));
    }
  });

  socket.on("multiplayer:updateProfile", (payload = {}) => {
    const player = getSocketPlayer(socket);
    if (!player) return;

    const previousCourseId = player.courseId;
    Object.assign(player, normalizePlayer(payload.player), {
      lastSeenAt: Date.now(),
    });

    if (previousCourseId !== player.courseId) {
      emitToCourse(player.roomId, previousCourseId, "multiplayer:playerLeft", { id: socket.id }, socket.id);
      emitToCourse(player.roomId, player.courseId, "multiplayer:playerJoined", serializePlayer(player), socket.id);
      broadcastRoomsSnapshot();
      return;
    }

    emitToCourse(player.roomId, player.courseId, "multiplayer:playerUpdated", serializePlayer(player));
    broadcastRoomsSnapshot();
  });

  socket.on("multiplayer:state", (payload = {}) => {
    const player = getSocketPlayer(socket);
    if (!player) return;

    player.state = normalizeState(payload);
    player.lastSeenAt = Date.now();
    emitToCourse(player.roomId, player.courseId, "multiplayer:state", {
      id: socket.id,
      displayName: player.displayName,
      carId: player.carId,
      courseId: player.courseId,
      state: player.state,
      sentAt: Date.now(),
    }, socket.id);
  });

  socket.on("multiplayer:leaveRoom", () => {
    leaveRoom(socket);
    broadcastRoomsSnapshot();
  });

  socket.on("rooms:list", () => {
    socket.emit("rooms:snapshot", { rooms: serializeRooms() });
  });

  socket.on("race:startRequest", () => {
    const player = getSocketPlayer(socket);
    if (!player) return;

    const existingRace = getRaceSession(player.roomId, player.courseId);
    if (isRaceActive(existingRace)) {
      existingRace.spectators.add(socket.id);
      socket.emit("race:spectate", serializeRaceSession(existingRace, socket.id));
      return;
    }

    createRaceInvite(player);
  });

  socket.on("race:inviteResponse", (payload = {}) => {
    handleRaceInviteResponse(socket, payload);
  });

  socket.on("race:finish", (payload = {}) => {
    const player = getSocketPlayer(socket);
    if (!player) return;

    saveRaceFinish(player, payload);
  });

  socket.on("race:leave", () => {
    const player = getSocketPlayer(socket);
    if (!player) return;

    removePlayerFromRace(player);
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
    broadcastRoomsSnapshot();
  });
});

function getRoom(roomId) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Map());
  return rooms.get(roomId);
}

function serializeRooms() {
  return [...rooms.entries()]
    .map(([roomId, room]) => {
      const players = [...room.values()];
      const host = players.sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))[0] ?? null;
      return {
        roomId,
        playerCount: room.size,
        courseId: host?.courseId ?? "map1",
        hostName: host?.displayName ?? "Host",
      };
    })
    .filter((room) => room.playerCount > 0)
    .sort((a, b) => a.roomId.localeCompare(b.roomId));
}

function broadcastRoomsSnapshot() {
  io.emit("rooms:snapshot", { rooms: serializeRooms() });
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
  const player = room?.get(socket.id);
  if (player && room.delete(socket.id)) {
    removePlayerFromRace(player);
    emitToCourse(roomId, player.courseId, "multiplayer:playerLeft", { id: socket.id }, socket.id);
  }

  if (room && room.size === 0) rooms.delete(roomId);
  socket.leave(roomId);
  socket.data.roomId = null;
}

function getCoursePlayers(roomId, courseId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return [...room.values()].filter((player) => player.courseId === courseId);
}

function emitToCourse(roomId, courseId, event, payload, exceptId = null) {
  for (const player of getCoursePlayers(roomId, courseId)) {
    if (player.id === exceptId) continue;
    io.to(player.id).emit(event, payload);
  }
}

function emitToRaceMembers(race, event, payload) {
  const ids = new Set([...race.participants.keys(), ...race.spectators]);
  for (const id of ids) {
    io.to(id).emit(event, payload);
  }
}

function isRaceEligiblePlayer(player) {
  return !/^guest(?:-|$)/i.test(player.playerId);
}

function createRaceInvite(hostPlayer) {
  const host = getRoom(hostPlayer.roomId).get(hostPlayer.id);
  if (!host || !isRaceEligiblePlayer(host)) return;

  const candidates = [...getRoom(host.roomId).values()]
    .filter((player) => player.id !== host.id && isRaceEligiblePlayer(player));

  if (!candidates.length) {
    startRaceForPlayers(host, []);
    return;
  }

  const invite = {
    id: `${host.roomId}-${host.courseId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    roomId: host.roomId,
    courseId: host.courseId,
    hostId: host.id,
    hostName: host.displayName,
    candidates: new Set(candidates.map((player) => player.id)),
    accepted: new Set(),
    declined: new Set(),
    timer: null,
  };
  pendingRaceInvites.set(invite.id, invite);

  const timeoutAt = Date.now() + RACE_INVITE_TIMEOUT_MS;
  for (const player of candidates) {
    io.to(player.id).emit("race:invite", {
      inviteId: invite.id,
      roomId: invite.roomId,
      courseId: invite.courseId,
      hostName: invite.hostName,
      timeoutAt,
    });
  }
  io.to(host.id).emit("race:inviteWaiting", {
    inviteId: invite.id,
    inviteCount: candidates.length,
    timeoutAt,
  });

  invite.timer = setTimeout(() => finalizeRaceInvite(invite.id), RACE_INVITE_TIMEOUT_MS);
}

function handleRaceInviteResponse(socket, payload = {}) {
  const inviteId = String(payload.inviteId ?? "");
  const invite = pendingRaceInvites.get(inviteId);
  const player = getSocketPlayer(socket);
  if (!invite || !player || player.roomId !== invite.roomId || !invite.candidates.has(player.id)) return;

  invite.declined.delete(player.id);
  invite.accepted.delete(player.id);

  if (payload.accepted) {
    invite.accepted.add(player.id);
    if (player.courseId !== invite.courseId) {
      const previousCourseId = player.courseId;
      player.courseId = invite.courseId;
      emitToCourse(player.roomId, previousCourseId, "multiplayer:playerLeft", { id: player.id }, player.id);
      emitToCourse(player.roomId, player.courseId, "multiplayer:playerJoined", serializePlayer(player), player.id);
      broadcastRoomsSnapshot();
    }
  } else {
    invite.declined.add(player.id);
  }

  if (invite.accepted.size + invite.declined.size >= invite.candidates.size) {
    finalizeRaceInvite(invite.id);
  }
}

function finalizeRaceInvite(inviteId) {
  const invite = pendingRaceInvites.get(inviteId);
  if (!invite) return;

  pendingRaceInvites.delete(inviteId);
  if (invite.timer) clearTimeout(invite.timer);

  for (const id of invite.candidates) {
    io.to(id).emit("race:inviteExpired", { inviteId });
  }

  const room = rooms.get(invite.roomId);
  const host = room?.get(invite.hostId);
  if (!host) return;

  const acceptedPlayers = [...invite.accepted]
    .map((id) => room.get(id))
    .filter((player) => player && player.courseId === invite.courseId && isRaceEligiblePlayer(player));

  startRaceForPlayers(host, acceptedPlayers);
}

function startRaceForPlayers(host, acceptedPlayers) {
  const existingRace = getRaceSession(host.roomId, host.courseId);
  if (isRaceActive(existingRace)) return;

  const participants = [host, ...acceptedPlayers].filter(isRaceEligiblePlayer);
  if (!participants.length) return;

  const race = createRaceSession(host.roomId, host.courseId, participants);
  setRaceSession(race);
  emitToRaceMembers(race, "race:countdown", serializeRaceSession(race));
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

function getRaceKey(roomId, courseId) {
  return `${roomId}:${courseId}`;
}

function getRaceSession(roomId, courseId) {
  return raceSessions.get(getRaceKey(roomId, courseId)) ?? null;
}

function setRaceSession(race) {
  raceSessions.set(getRaceKey(race.roomId, race.courseId), race);
}

function isRaceActive(race) {
  return Boolean(race && (race.status === "countdown" || race.status === "racing"));
}

function createRaceSession(roomId, courseId, players) {
  const startAt = Date.now() + RACE_COUNTDOWN_MS;
  const race = {
    id: `${roomId}-${courseId}-${Date.now()}`,
    roomId,
    courseId,
    status: "countdown",
    startAt,
    createdAt: Date.now(),
    participants: new Map(),
    spectators: new Set(),
    results: [],
    startTimer: null,
    timeoutTimer: null,
  };

  players
    .sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))
    .forEach((player, index) => {
      race.participants.set(player.id, {
        id: player.id,
        playerId: player.playerId,
        displayName: player.displayName,
        carId: player.carId,
        gridSlot: index,
        finished: false,
        finishTime: null,
      });
    });

  race.startTimer = setTimeout(() => {
    const activeRace = getRaceSession(roomId, courseId);
    if (activeRace?.id !== race.id || activeRace.status !== "countdown") return;
    activeRace.status = "racing";
    emitToRaceMembers(activeRace, "race:started", serializeRaceSession(activeRace));
  }, Math.max(startAt - Date.now(), 0));

  race.timeoutTimer = setTimeout(() => {
    const activeRace = getRaceSession(roomId, courseId);
    if (activeRace?.id === race.id) completeRace(activeRace);
  }, RACE_TIMEOUT_MS);

  return race;
}

function serializeRaceSession(race, viewerId = null) {
  if (!race) return null;

  const participants = [...race.participants.values()].map((participant) => ({
    id: participant.id,
    playerId: participant.playerId,
    displayName: participant.displayName,
    carId: participant.carId,
    gridSlot: participant.gridSlot,
    finished: participant.finished,
    finishTime: participant.finishTime,
  }));
  const payload = {
    id: race.id,
    roomId: race.roomId,
    courseId: race.courseId,
    status: race.status,
    startAt: race.startAt,
    participants,
    results: race.results.map(serializeRaceResult),
  };

  if (viewerId) {
    const viewerParticipant = race.participants.get(viewerId);
    payload.viewerMode = viewerParticipant ? "participant" : "spectator";
    payload.viewerGridSlot = viewerParticipant?.gridSlot ?? null;
  }

  return payload;
}

function saveRaceFinish(player, payload = {}) {
  const race = getRaceSession(player.roomId, player.courseId);
  if (!isRaceActive(race) || race.id !== payload.raceId) return;

  const participant = race.participants.get(player.id);
  if (!participant || participant.finished) return;

  const finishTime = normalizeNumber(payload.finishTime, NaN);
  if (!Number.isFinite(finishTime) || finishTime <= 0 || finishTime > 60 * 60 * 1000) return;

  participant.finished = true;
  participant.finishTime = finishTime;
  const result = {
    id: player.id,
    playerId: player.playerId,
    displayName: player.displayName,
    carId: player.carId,
    time: finishTime,
    finishedAt: Date.now(),
  };

  race.results = race.results.filter((entry) => entry.id !== player.id);
  race.results.push(result);
  race.results.sort(compareRaceResults);

  emitToRaceMembers(race, "race:finished", {
    raceId: race.id,
    courseId: player.courseId,
    result: serializeRaceResult(result),
    results: race.results.map(serializeRaceResult),
  });

  if ([...race.participants.values()].every((entry) => entry.finished)) {
    completeRace(race);
  }
}

function removePlayerFromRace(player) {
  const race = getRaceSession(player.roomId, player.courseId);
  if (!race) return;

  race.spectators.delete(player.id);
  if (!race.participants.delete(player.id)) return;

  race.results = race.results.filter((entry) => entry.id !== player.id);
  if (race.participants.size === 0) {
    completeRace(race);
    return;
  }

  if ([...race.participants.values()].every((entry) => entry.finished)) {
    completeRace(race);
    return;
  }

  emitToRaceMembers(race, "race:started", serializeRaceSession(race));
}

function completeRace(race) {
  if (!raceSessions.has(getRaceKey(race.roomId, race.courseId))) return;

  race.status = "completed";
  clearRaceTimers(race);
  raceSessions.delete(getRaceKey(race.roomId, race.courseId));
  emitToRaceMembers(race, "race:completed", serializeRaceSession(race));
}

function clearRaceTimers(race) {
  if (race.startTimer) clearTimeout(race.startTimer);
  if (race.timeoutTimer) clearTimeout(race.timeoutTimer);
}

function compareRaceResults(a, b) {
  return a.time - b.time || a.displayName.localeCompare(b.displayName);
}

function serializeRaceResult(result) {
  return {
    id: result.id,
    playerId: result.playerId,
    displayName: result.displayName,
    carId: result.carId,
    time: result.time,
    finishedAt: result.finishedAt,
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
