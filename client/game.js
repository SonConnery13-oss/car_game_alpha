import * as THREE from "three";
import * as CANNON from "cannon-es";
import { COURSE_DEFS, DEFAULT_COURSE_ID } from "./maps/index.js";
import {
  getGearLabel,
  getVehiclePhysicsConfig,
  VehiclePhysics,
} from "./physics/vehiclePhysics.js";

const canvas = document.querySelector("#gameCanvas");
const speedValue = document.querySelector("#speedValue");
const gearValue = document.querySelector("#gearValue");
const lapValue = document.querySelector("#lapValue");
const currentLapValue = document.querySelector("#currentLapValue");
const bestLapValue = document.querySelector("#bestLapValue");
const startButton = document.querySelector("#startButton");
const boostMeter = document.querySelector("#boostMeter");
const boostFill = document.querySelector("#boostFill");
const message = document.querySelector("#message");
const mainMenu = document.querySelector("#mainMenu");
const developersScreen = document.querySelector("#developersScreen");
const garageScreen = document.querySelector("#garageScreen");
const rankingsScreen = document.querySelector("#rankingsScreen");
const gameStartButton = document.querySelector("#gameStartButton");
const mainLoginButton = document.querySelector("#mainLoginButton");
const developersButton = document.querySelector("#developersButton");
const garageButton = document.querySelector("#garageButton");
const rankingsButton = document.querySelector("#rankingsButton");
const selectedCarName = document.querySelector("#selectedCarName");
const selectedCarImage = document.querySelector("#selectedCarImage");
const garageOptions = document.querySelectorAll("[data-car-id]");
const courseOptions = document.querySelectorAll("[data-course-id]");
const rankingsCourseOptions = document.querySelectorAll("[data-rankings-course-id]");
const selectedCourseName = document.querySelector("#selectedCourseName");
const rankingsCourseName = document.querySelector("#rankingsCourseName");
const rankingsBody = document.querySelector("#rankingsBody");
const rankingsCarMix = document.querySelector("#rankingsCarMix");
const lapLabel = document.querySelector("#lapLabel");
const menuBackButtons = document.querySelectorAll("[data-menu-back]");
const menuReturnButton = document.querySelector("#menuReturnButton");
const controlsHint = document.querySelector("#controlsHint");
const physicsDebug = document.querySelector("#physicsDebug");
const miniMapCanvas = document.querySelector("#miniMapCanvas");
const roomIdInput = document.querySelector("#roomIdInput");
const joinRoomButton = document.querySelector("#joinRoomButton");
const multiplayerStatus = document.querySelector("#multiplayerStatus");
const loginScreen = document.querySelector("#loginScreen");
const signupScreen = document.querySelector("#signupScreen");
const loginForm = document.querySelector("#loginForm");
const signupForm = document.querySelector("#signupForm");
const authCurrentPlayer = document.querySelector("#authCurrentPlayer");
const loginIdInput = document.querySelector("#loginIdInput");
const loginPasswordInput = document.querySelector("#loginPasswordInput");
const signupIdInput = document.querySelector("#signupIdInput");
const signupPasswordInput = document.querySelector("#signupPasswordInput");
const authSignupButton = document.querySelector("#authSignupButton");
const authLoginButton = document.querySelector("#authLoginButton");
const authLogoutButton = document.querySelector("#authLogoutButton");
const loginToSignupButton = document.querySelector("#loginToSignupButton");
const signupToLoginButton = document.querySelector("#signupToLoginButton");
const authStatusMessages = document.querySelectorAll("[data-auth-status]");
const resultsOverlay = document.querySelector("#resultsOverlay");
const resultsTitle = document.querySelector("#resultsTitle");
const resultsCourse = document.querySelector("#resultsCourse");
const resultsPlayer = document.querySelector("#resultsPlayer");
const resultsTime = document.querySelector("#resultsTime");
const leaderboardBody = document.querySelector("#leaderboardBody");
const resultMenuButton = document.querySelector("#resultMenuButton");
const resultRetryButton = document.querySelector("#resultRetryButton");
const URL_PARAMS = new URLSearchParams(window.location.search);

const STORAGE_KEYS = {
  accounts: "racing.accounts.v1",
  session: "racing.session.v1",
  leaderboard: "racing.leaderboard.v1",
  room: "racing.room.v1",
};
const DEFAULT_ROAD_WIDTH = 14;
const DEFAULT_LOOP_LAPS = 3;
const FIXED_TIME_STEP = 1 / 120;
const TERRAIN_SIZE = 1120;
const SKY_DOME_RADIUS = 900;
const TERRAIN_SEGMENTS = 320;
const WHEEL_RADIUS = 0.42;
const SUSPENSION_REST_LENGTH = 0.27;
const WHEEL_CONNECTION_Y = -0.16;
const JUMP_RAMPS = [];
const TEST_AREA = {
  x: 0,
  z: 220,
  width: 210,
  depth: 104,
};
const BRIDGE_ROUTES = [
  { startX: -74, startZ: 116, endX: -58, endZ: TEST_AREA.z - TEST_AREA.depth / 2 - 1, width: 9.5 },
  { startX: 6, startZ: 134, endX: 0, endZ: TEST_AREA.z - TEST_AREA.depth / 2 - 1, width: 10.5 },
  { startX: 72, startZ: 98, endX: 58, endZ: TEST_AREA.z - TEST_AREA.depth / 2 - 1, width: 9.5 },
];
const TRACK_SURFACE_OFFSET = 0.065;
const MAX_FORWARD_SPEED = 200 / 3.6;
const STEERING_INPUT_RESPONSE = {
  keyboard: 2.25,
  analog: 3.85,
  return: 5.05,
};
const STEERING_INPUT_CURVE = {
  keyboard: 1.08,
  analog: 1.55,
};
const VISUAL_SUSPENSION = {
  stiffness: 260,
  damping: 38,
  heaveScale: 0.026,
  pitchScale: 0.065,
  rollScale: 0.072,
  brakeDive: 0.032,
  throttleSquat: 0.014,
  steeringRoll: 0.07,
  driftRoll: 0.046,
  handbrakePitch: 0.018,
  roadShake: 0,
  landingKick: 0.02,
  wheelResponse: 52,
  airborneResponse: 22,
  impactDecay: 34,
};
const CHASSIS_VISUAL_FILTER = {
  forwardCorrectionResponse: 2.8,
  lateralCorrectionResponse: 18,
  verticalCorrectionResponse: 16,
  minRotationResponse: 18,
  maxRotationResponse: 34,
  maxForwardSeparation: 0.26,
  maxLateralSeparation: 0.16,
  maxVerticalSeparation: 0.14,
  maxRotationLag: 0.13,
  snapDistance: 3.6,
};
const WHEEL_VISUAL_FILTER = {
  response: 58,
  maxLocalLag: 0.055,
  maxRotationLag: 0.12,
};
const CAR_MODELS = {
  gt3: {
    name: "GT3 RS Prototype",
    previewClass: "garage-preview-gt3",
    rimColor: 0xc52d22,
    brakeColor: 0xf5bf29,
    tuning: {
      maxForwardSpeed: 200 / 3.6,
      visualStiffnessScale: 1,
      visualDampingScale: 1,
    },
  },
  amg: {
    name: "AMG GT Track",
    previewClass: "garage-preview-amg",
    rimColor: 0x3c403d,
    brakeColor: 0x202427,
    tuning: {
      maxForwardSpeed: 210 / 3.6,
      visualStiffnessScale: 0.92,
      visualDampingScale: 0.9,
    },
  },
  ae86: {
    name: "AE86 H2 Trueno",
    previewClass: "garage-preview-ae86",
    rimColor: 0x16181a,
    brakeColor: 0xc52d22,
    tuning: {
      maxForwardSpeed: 172 / 3.6,
      visualStiffnessScale: 0.84,
      visualDampingScale: 0.82,
    },
  },
  rx7fd: {
    name: "RX-7 FD Spirit",
    previewClass: "garage-preview-rx7fd",
    rimColor: 0xd6d8d4,
    brakeColor: 0xd03b26,
    tuning: {
      maxForwardSpeed: 232 / 3.6,
      visualStiffnessScale: 0.96,
      visualDampingScale: 0.94,
    },
  },
  rx7fc: {
    name: "RX-7 FC Turbo",
    previewClass: "garage-preview-rx7fc",
    rimColor: 0x24272a,
    brakeColor: 0x202427,
    tuning: {
      maxForwardSpeed: 204 / 3.6,
      visualStiffnessScale: 0.9,
      visualDampingScale: 0.86,
    },
  },
  formulaRb22: {
    name: "Formula RB22",
    previewClass: "garage-preview-formula",
    rimColor: 0x11141a,
    brakeColor: 0xffc23a,
    tuning: {
      maxForwardSpeed: 340 / 3.6,
      visualStiffnessScale: 1.15,
      visualDampingScale: 1.18,
      cameraDistanceOffset: 1.1,
      cameraHeightOffset: -0.55,
      cameraLookAheadOffset: 4.5,
    },
  },
};
const DRIFT_BOOST_CAR_IDS = new Set(["ae86", "rx7fd", "rx7fc"]);
const DRIFT_BOOST_CHARGE_MIN = 0.015;
const DRIFT_BOOST_DRAIN_MIN = 0.055;
const DRIFT_BOOST_DRAIN_MAX = 0.095;

const initialCourseId = URL_PARAMS.get("track") ?? URL_PARAMS.get("course");
let selectedCourseId = COURSE_DEFS[initialCourseId] ? initialCourseId : DEFAULT_COURSE_ID;
let rankingsCourseId = selectedCourseId;
let activeCourse = COURSE_DEFS[selectedCourseId];
let skyDome = null;
const ROAD_WIDTH = activeCourse.roadWidth ?? DEFAULT_ROAD_WIDTH;
const RENDERER_PIXEL_RATIO_LIMIT = activeCourse.maxPixelRatio ?? 2;
const START_GRID_WIDTH = activeCourse.startGridWidth ?? ROAD_WIDTH;
const RACE_GRID_SPACING = 4.8;
const RACE_GRID_ROW_SPACING = 5.8;
const trackPoints = createTrackPoints(activeCourse);
const START_INDEX = activeCourse.startIndex ?? 0;
const FINISH_INDEX = activeCourse.finishIndex ?? (activeCourse.loop ? START_INDEX : trackPoints.length - 1);
const START_GATE = createCourseGate(START_INDEX);
const FINISH_GATE = createCourseGate(FINISH_INDEX);
const START_SPAWN_POINT = START_GATE.center.clone().addScaledVector(
  START_GATE.tangent,
  activeCourse.spawnOffset ?? (activeCourse.loop ? -2 : 2.8),
);
const START_X = START_SPAWN_POINT.x;
const START_Z = START_SPAWN_POINT.y;
const START_GROUND_Y = getTrackElevation(START_X, START_Z);
const START_HEIGHT = START_GROUND_Y + WHEEL_RADIUS + SUSPENSION_REST_LENGTH - WHEEL_CONNECTION_Y + 0.02;
const START_POSITION = new CANNON.Vec3(START_X, START_HEIGHT, START_Z);
const START_YAW = Math.atan2(START_GATE.tangent.x, START_GATE.tangent.y);
const miniMapState = createMiniMapState();

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x9fcbe6, activeCourse.fogDensity ?? 0.0042);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER_PIXEL_RATIO_LIMIT));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.04;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(
  68,
  window.innerWidth / window.innerHeight,
  0.1,
  1200,
);
camera.position.set(
  START_POSITION.x - START_GATE.tangent.x * 12,
  START_POSITION.y + 6,
  START_POSITION.z - START_GATE.tangent.y * 12,
);

const world = new CANNON.World({
  gravity: new CANNON.Vec3(0, -14.2, 0),
});
world.broadphase = new CANNON.SAPBroadphase(world);
world.allowSleep = true;
world.solver.iterations = 12;
world.solver.tolerance = 0.001;
world.quatNormalizeSkip = 0;
world.quatNormalizeFast = false;
world.defaultContactMaterial.friction = 0.45;
world.defaultContactMaterial.restitution = 0;

const groundMaterial = new CANNON.Material("ground");
const carMaterial = new CANNON.Material("car");
const barrierMaterial = new CANNON.Material("barrier");
world.addContactMaterial(
  new CANNON.ContactMaterial(carMaterial, groundMaterial, {
    friction: 0.62,
    restitution: 0,
    contactEquationStiffness: 1e6,
    contactEquationRelaxation: 5,
  }),
);
world.addContactMaterial(
  new CANNON.ContactMaterial(carMaterial, barrierMaterial, {
    friction: 0.002,
    restitution: 0.04,
    contactEquationStiffness: 7e5,
    contactEquationRelaxation: 5,
  }),
);

const keys = new Set();
const wheelMeshes = [];
const initialCarId = URL_PARAMS.get("car");
let selectedCarId = CAR_MODELS[initialCarId] ? initialCarId : "gt3";
let vehiclePhysicsConfig = getVehiclePhysicsConfig(selectedCarId);
let vehiclePhysics = null;
let paused = true;
let menuActive = true;
let cameraMode = 0;
let steering = 0;
let driveInput = 0;
let tractionGrip = 1;
let tireSlip = 0;
let driftAmount = 0;
let driftScore = 0;
let driftBoostCharge = 0;
let boostAmount = 0;
let driftLabelSprite = null;
const driftSmokeParticles = [];
const wallSparkParticles = [];
const tireMarkSegments = [];
const brakeLightTrails = [];
const boostSpeedStreaks = [];
const vehicleCollisionDebris = [];
const WALL_SPARK_GEOMETRY = new THREE.SphereGeometry(0.035, 6, 4);
const WALL_SPARK_COLORS = [0xfff1a6, 0xffc247, 0xff742f];
const TIRE_MARK_GEOMETRY = new THREE.BoxGeometry(0.34, 0.012, 1.08);
const BRAKE_TRAIL_GEOMETRY = new THREE.BoxGeometry(0.13, 0.04, 1);
const BOOST_STREAK_GEOMETRY = new THREE.BoxGeometry(0.045, 0.045, 2.7);
const VEHICLE_DEBRIS_GEOMETRY = new THREE.BoxGeometry(0.34, 0.1, 0.22);
const BOOST_STREAK_COLORS = [0x69c8ff, 0xa7ff5b, 0xff4fd8, 0xffd45a, 0xffffff];
const VEHICLE_DEBRIS_COLORS = [0xe8edf1, 0x101214, 0xffd200, 0xc83228, 0x2f3438];
const TIRE_MARK_HOLD_SECONDS = 5;
const TIRE_MARK_FADE_SECONDS = 3;
const BRAKE_TRAIL_HOLD_SECONDS = 5;
const BRAKE_TRAIL_FADE_SECONDS = 2.2;
const BRAKE_TRAIL_MAX_SEGMENTS = 720;
const VEHICLE_COLLISION_RADIUS = 2.85;
const VEHICLE_COLLISION_COOLDOWN_MS = 260;
const VEHICLE_DEBRIS_LIFE_SECONDS = 5;
const MULTIPLAYER_SEND_INTERVAL = 1000 / 20;
const REMOTE_INTERPOLATION_MS = 140;
let lastWallSparkAt = 0;
let tireMarkAccumulator = 0;
let brakeTrailAccumulator = 0;
let boostStreakAccumulator = 0;
const brakeTrailLastPoints = [null, null];
const lastVehicleCollisionAt = new Map();
const vehicleDynamics = {
  braking: false,
  throttle: false,
  reverse: false,
  handbrake: false,
  grounded: false,
  signedSpeed: 0,
  lateralVelocity: 0,
  slipAngle: 0,
  driftFactor: 0,
  rearGrip: 1,
  frontGrip: 1,
  preStepVelocityY: 0,
  airborneTime: 0,
  airborneFallSpeed: 0,
  lastGroundSlope: 0,
  lastSideSlope: 0,
  lastGroundedSpeed: 0,
  lastSteering: 0,
  lastForward: new CANNON.Vec3(0, 0, 1),
  lastRight: new CANNON.Vec3(1, 0, 0),
  surfaceGrip: 1,
};
const visualSuspension = {
  heave: 0,
  heaveVelocity: 0,
  pitch: 0,
  pitchVelocity: 0,
  roll: 0,
  rollVelocity: 0,
  wasGrounded: false,
  contactRatio: 0,
};
const cameraRig = {
  initialized: false,
  focus: new THREE.Vector3(),
  lookTarget: new THREE.Vector3(),
  forward: new THREE.Vector3(0, 0, 1),
};
const cameraOrbit = {
  active: false,
  yaw: 0,
  pitch: 0.26,
};
const mouseControls = {
  enabled: false,
  steer: 0,
  leftDown: false,
  rightDown: false,
};
const gamepadControls = {
  steer: 0,
  throttle: 0,
  brake: 0,
  handbrake: false,
};
const steeringInputState = {
  value: 0,
};
const carVisualMotion = {
  initialized: false,
  position: new THREE.Vector3(),
  quaternion: new THREE.Quaternion(),
  velocity: new THREE.Vector3(),
};
const wheelVisualStates = Array.from({ length: 4 }, () => ({
  compression: 0,
  previousCompression: 0,
  impact: 0,
  contact: false,
}));
const wheelMeshMotion = Array.from({ length: 4 }, () => ({
  initialized: false,
  position: new THREE.Vector3(),
  quaternion: new THREE.Quaternion(),
  localPosition: new THREE.Vector3(),
  localQuaternion: new THREE.Quaternion(),
}));
const remotePlayers = new Map();
const multiplayer = {
  socket: null,
  selfId: null,
  roomId: "lobby",
  connected: false,
  joined: false,
  lastSentAt: 0,
};
const raceSession = {
  id: null,
  status: "idle",
  mode: "idle",
  startAt: null,
  gridSlot: 0,
  gridTotal: 1,
  participants: [],
  results: [],
};
const tunedDamperState = {
  heave: 0,
  pitch: 0,
  roll: 0,
};
let previousStartGateSide = getGateSide(START_GATE, new THREE.Vector2(START_POSITION.x, START_POSITION.z));
let previousFinishGateSide = getGateSide(FINISH_GATE, new THREE.Vector2(START_POSITION.x, START_POSITION.z));
let lap = 0;
let raceStartedAt = performance.now();
let lapStartedAt = performance.now();
let bestLap = null;
let lastLapStamp = 0;
let readyTimeout = null;
let pauseStartedAt = null;
let raceCountdownActive = false;
let raceCountdownToken = 0;
let raceFinished = false;
let currentPlayer = null;
let sharedLeaderboard = {};

setupLighting();
createWorld();
const vehicleBundle = createVehicle();
const vehicle = vehicleBundle.vehicle;
const chassisBody = vehicleBundle.chassisBody;
vehiclePhysics = vehicle;
let carGroup = vehicleBundle.carGroup;
driftLabelSprite = createDriftLabelSprite();
scene.add(driftLabelSprite);
resetCar();
bindInput();
initializeAuth();
setupMenu();
initializeMultiplayer();
setupDebugTools();
animate();

function setupLighting() {
  scene.add(new THREE.HemisphereLight(0xd4edff, 0x61734a, 2.08));

  const sun = new THREE.DirectionalLight(0xfff4d2, 3.2);
  const sunPosition = activeCourse.sun ?? { x: -85, y: 120, z: -60 };
  sun.position.set(sunPosition.x, sunPosition.y, sunPosition.z);
  sun.castShadow = true;
  const shadowMapSize = activeCourse.shadowMapSize ?? 2048;
  sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  const shadowExtent = TERRAIN_SIZE * 0.58;
  sun.shadow.camera.left = -shadowExtent;
  sun.shadow.camera.right = shadowExtent;
  sun.shadow.camera.top = shadowExtent;
  sun.shadow.camera.bottom = -shadowExtent;
  sun.shadow.camera.near = 20;
  sun.shadow.camera.far = TERRAIN_SIZE;
  scene.add(sun);
}

function getTrackElevation(x, z) {
  if (activeCourse.environment === "mountain") {
    return getMountainTrackElevation(x, z);
  }

  const rollingGrade =
    0.48 * Math.sin((z + 32) * 0.028) +
    0.34 * Math.sin((x - 12) * 0.026 + z * 0.014);
  const northCrest = 0.72 * Math.exp(-((x + 18) ** 2) / 1700 - ((z - 56) ** 2) / 1200);
  const southDip = -0.46 * Math.exp(-((x - 24) ** 2) / 950 - ((z + 62) ** 2) / 1050);
  const longRise = 0.56 * Math.exp(-((z - 8) ** 2) / 4200) * Math.cos(x * 0.032);
  const westDrop = -0.34 * Math.exp(-((x + 78) ** 2) / 1200 - ((z + 32) ** 2) / 2200);
  const eastCrest = 0.44 * Math.exp(-((x - 58) ** 2) / 1700 - ((z + 76) ** 2) / 1600);
  const startDistance = Math.hypot(x - START_X, z - START_Z);
  const startBlend = smoothstep(5, 18, startDistance);
  const jumpRamp = getJumpRampElevation(x, z);
  const testArea = getTestAreaElevation(x, z);
  const courseFeatures = getCourseFeatureElevation(x, z);
  const roadRipple = getSurfaceRipple(x, z) * startBlend;

  return THREE.MathUtils.clamp(
    (rollingGrade + northCrest + southDip + longRise + westDrop + eastCrest) * startBlend +
      jumpRamp +
      testArea +
      courseFeatures +
      roadRipple,
    activeCourse.elevationBounds?.min ?? -0.85,
    activeCourse.elevationBounds?.max ?? (activeCourse.visualProfile === "monacoStreet" ? 3.1 : 2.4),
  );
}

function getMountainTrackElevation(x, z) {
  const axis = activeCourse.elevationAxis ?? { x: 0, z: -1 };
  const axisLength = Math.hypot(axis.x, axis.z) || 1;
  const normalizedAxisX = axis.x / axisLength;
  const normalizedAxisZ = axis.z / axisLength;
  const elevationReferenceSize = activeCourse.elevationReferenceSize ?? 560;
  const grade = ((x * normalizedAxisX + z * normalizedAxisZ) / (elevationReferenceSize / 2)) *
    (activeCourse.elevationScale ?? 2.8);
  const startDistance = Math.hypot(x - START_X, z - START_Z);
  const startBlend = smoothstep(5, 18, startDistance);
  const ridge =
    0.62 * Math.sin(x * 0.018 + z * 0.035) +
    0.38 * Math.sin(x * 0.046 - z * 0.022);
  const shoulderCrown =
    0.48 * Math.exp(-((x + 110) ** 2) / 3600 - ((z - 70) ** 2) / 5200) -
    0.32 * Math.exp(-((x - 120) ** 2) / 4200 - ((z + 110) ** 2) / 4800);
  const courseFeatures = getCourseFeatureElevation(x, z);
  const roadRipple = getSurfaceRipple(x, z) * 1.35 * startBlend;
  const ridgeScale = activeCourse.ridgeScale ?? 1;

  return THREE.MathUtils.clamp(
    (grade + ridge * ridgeScale + shoulderCrown) * startBlend + courseFeatures + roadRipple,
    activeCourse.elevationBounds?.min ?? -2.3,
    activeCourse.elevationBounds?.max ?? (activeCourse.visualProfile === "spaArdennes" ? 8.4 : 5.8),
  );
}

function getCourseFeatureElevation(x, z) {
  let elevation = 0;

  for (const feature of activeCourse.elevationFeatures ?? []) {
    const radiusX = Math.max(feature.radiusX ?? feature.radius ?? 1, 1);
    const radiusZ = Math.max(feature.radiusZ ?? feature.radius ?? 1, 1);
    const dx = (x - feature.x) / radiusX;
    const dz = (z - feature.z) / radiusZ;
    elevation += feature.height * Math.exp(-(dx * dx + dz * dz));
  }

  return elevation;
}

function getTestAreaElevation(x, z) {
  if (activeCourse.disableTestArea) return 0;

  const localX = x - TEST_AREA.x;
  const localZ = z - TEST_AREA.z;
  const halfWidth = TEST_AREA.width / 2;
  const halfDepth = TEST_AREA.depth / 2;

  if (Math.abs(localX) > halfWidth || Math.abs(localZ) > halfDepth) {
    return 0;
  }

  const edgeFade =
    smoothstep(halfWidth, halfWidth - 5, Math.abs(localX)) *
    smoothstep(halfDepth, halfDepth - 5, Math.abs(localZ));
  const laneMask = smoothstep(halfWidth - 4, halfWidth - 18, Math.abs(localX));
  let repeatedRidges = 0;

  for (let ridge = -38; ridge <= 36; ridge += 7.4) {
    repeatedRidges += 0.1 * Math.exp(-((localZ - ridge) ** 2) / 1.1);
  }

  const leftLane = smoothstep(38, 26, Math.abs(localX + 52));
  const centerLane = smoothstep(34, 19, Math.abs(localX));
  const rightLane = smoothstep(38, 26, Math.abs(localX - 52));
  const longWave = 0.08 * Math.sin(localZ * 0.22) * centerLane;
  const slopedPad = 0.52 * smoothstep(10, 34, localZ) * rightLane;
  const rippleLane = 0.045 * Math.sin(localZ * 1.15) * Math.sin(localX * 0.22) * leftLane;
  const curvedJumpA = getCurvedTestRamp(localX, localZ, -58, 18, 36, 14, 0.9);
  const curvedJumpB = getCurvedTestRamp(localX, localZ, 2, 27, 42, 16, 1.05);
  const curvedJumpC = getCurvedTestRamp(localX, localZ, 58, 12, 32, 12, 0.72);

  return (
    repeatedRidges * laneMask +
    slopedPad +
    longWave +
    rippleLane +
    curvedJumpA +
    curvedJumpB +
    curvedJumpC
  ) * edgeFade;
}

function getCurvedTestRamp(localX, localZ, centerX, centerZ, length, width, height) {
  const x = localX - centerX;
  const z = localZ - centerZ;

  if (Math.abs(x) > width / 2 || z < -length / 2 || z > length / 2) {
    return 0;
  }

  const t = (z + length / 2) / length;
  const sideFade = 1 - smoothstep(width * 0.36, width * 0.5, Math.abs(x));
  const curve = Math.sin(t * Math.PI);
  const lip = 0.18 * Math.sin(t * Math.PI * 2);
  return Math.max(0, height * (curve + lip) * sideFade);
}

function getSurfaceRipple(x, z) {
  const broadUndulation = 0.008 * Math.sin(x * 0.36 + z * 0.14);
  const smallBump =
    0.004 * Math.sin(x * 0.95 + z * 0.5) * Math.sin(z * 0.7 - x * 0.18);
  const patchedAsphalt = 0.003 * Math.sin((x + z) * 1.55);

  return broadUndulation + smallBump + patchedAsphalt;
}

function getJumpRampElevation(x, z) {
  let elevation = 0;

  for (const ramp of JUMP_RAMPS) {
    const local = getRampLocalPosition(ramp, x, z);
    const halfLength = ramp.length / 2;
    const halfWidth = ramp.width / 2;

    if (local.forward < -halfLength || local.forward > halfLength || Math.abs(local.right) > halfWidth) {
      continue;
    }

    const t = (local.forward + halfLength) / ramp.length;
    const sideBlend = 1 - smoothstep(halfWidth * 0.72, halfWidth, Math.abs(local.right));
    const rise = t < 0.68 ? smoothstep(0, 0.68, t) : 1 - smoothstep(0.68, 1, t) * 0.92;
    elevation = Math.max(elevation, ramp.height * rise * sideBlend);
  }

  return elevation;
}

function getRampLocalPosition(ramp, x, z) {
  const dx = x - ramp.x;
  const dz = z - ramp.z;
  const forwardX = Math.sin(ramp.yaw);
  const forwardZ = Math.cos(ramp.yaw);
  const rightX = Math.cos(ramp.yaw);
  const rightZ = -Math.sin(ramp.yaw);

  return {
    forward: dx * forwardX + dz * forwardZ,
    right: dx * rightX + dz * rightZ,
  };
}

function getTerrainNormal(x, z) {
  const sampleDistance = 1.4;
  const left = getTrackElevation(x - sampleDistance, z);
  const right = getTrackElevation(x + sampleDistance, z);
  const back = getTrackElevation(x, z - sampleDistance);
  const front = getTrackElevation(x, z + sampleDistance);
  const normal = new CANNON.Vec3(
    -(right - left) / (sampleDistance * 2),
    1,
    -(front - back) / (sampleDistance * 2),
  );
  normal.normalize();
  return normal;
}

function smoothstep(edge0, edge1, value) {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function pseudoRandom(seed) {
  return Math.abs(Math.sin(seed * 12.9898) * 43758.5453) % 1;
}

function createWorld() {
  createSky();
  createGround();
  createTerrainBody();
  createTrack();
  createStartLine();
  createCheckpointMarkers();
  createLowTrackWalls();

  if (activeCourse.environment === "mountain") {
    createMountainScenery();
    if (activeCourse.visualProfile === "spaArdennes") {
      createSpaCircuitScenery();
    }
  } else {
    createScenery();
    if (activeCourse.visualProfile === "monacoStreet") {
      createMonacoStreetScenery();
    }
    if (!activeCourse.disableBridgeRoutes) {
      createBridgeRoutes();
    }
    createGrandstands();
  }

  createTracksideCatchFences();
  createCourseGantries();
  createCourseAdBoards();
}

function createSky() {
  const skyColors = activeCourse.sky ?? {};
  const topColor = new THREE.Color(skyColors.topColor ?? 0x74b9ee);
  const bottomColor = new THREE.Color(skyColors.bottomColor ?? 0xe8f5ff);
  scene.background = bottomColor.clone();
  const skyGeometry = new THREE.SphereGeometry(SKY_DOME_RADIUS, 32, 18);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: topColor },
      bottomColor: { value: bottomColor },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vWorldPosition = position.xyz;
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition).y;
        float t = smoothstep(-0.15, 0.75, h);
        gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
      }
    `,
  });

  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.frustumCulled = false;
  skyDome = sky;
  scene.add(sky);
}

function createGround() {
  const groundTexture = activeCourse.environment === "mountain" ? makeGrassTexture(activeCourse.shoulder) : makeCityGroundTexture();
  groundTexture.repeat.set(
    activeCourse.environment === "mountain" ? 36 : 54,
    activeCourse.environment === "mountain" ? 36 : 54,
  );
  const geometry = createTerrainGeometry(TERRAIN_SIZE, activeCourse.terrainSegments ?? TERRAIN_SEGMENTS, -0.035);

  const ground = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map: groundTexture,
      color: activeCourse.environment === "mountain" ? 0x5a7542 : 0x5c6265,
      roughness: 0.92,
    }),
  );
  ground.receiveShadow = true;
  scene.add(ground);
}

function createTerrainBody() {
  const data = [];
  const half = TERRAIN_SIZE / 2;
  const segments = activeCourse.terrainSegments ?? TERRAIN_SEGMENTS;
  const elementSize = TERRAIN_SIZE / segments;

  for (let i = 0; i <= segments; i += 1) {
    data[i] = [];
    const x = -half + i * elementSize;

    for (let j = 0; j <= segments; j += 1) {
      const z = half - j * elementSize;
      data[i][j] = getTrackElevation(x, z);
    }
  }

  const heightfield = new CANNON.Heightfield(data, {
    elementSize,
    minValue: activeCourse.elevationBounds?.min ?? -4,
    maxValue: activeCourse.elevationBounds?.max ?? 8,
  });
  const terrainBody = new CANNON.Body({ mass: 0, material: groundMaterial });
  terrainBody.addShape(heightfield);
  terrainBody.position.set(-half, 0, half);
  terrainBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(terrainBody);
}

function createTerrainGeometry(size, segments, yOffset = 0) {
  const vertices = [];
  const uvs = [];
  const indices = [];
  const half = size / 2;
  const step = size / segments;

  for (let zIndex = 0; zIndex <= segments; zIndex += 1) {
    const z = -half + zIndex * step;

    for (let xIndex = 0; xIndex <= segments; xIndex += 1) {
      const x = -half + xIndex * step;
      vertices.push(x, getTrackElevation(x, z) + yOffset, z);
      uvs.push(xIndex / segments, 1 - zIndex / segments);
    }
  }

  for (let zIndex = 0; zIndex < segments; zIndex += 1) {
    for (let xIndex = 0; xIndex < segments; xIndex += 1) {
      const a = zIndex * (segments + 1) + xIndex;
      const b = a + 1;
      const c = a + segments + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createTrack() {
  const asphaltTexture = makeAsphaltTexture(activeCourse.asphalt);
  asphaltTexture.repeat.set(1, activeCourse.asphalt?.repeat ?? 30);
  const roadColor = activeCourse.asphalt?.color ?? (activeCourse.environment === "mountain" ? 0x25282a : 0x1d2022);

  const roadMaterial = new THREE.MeshStandardMaterial({
    map: asphaltTexture,
    color: roadColor,
    roughness: 0.84,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1.5,
    polygonOffsetUnits: -1.5,
  });
  const lineMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const curbMaterial = new THREE.MeshBasicMaterial({
    color: 0xd8dbd7,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const redLineMaterial = new THREE.MeshBasicMaterial({
    color: activeCourse.visualProfile === "spaArdennes" ? 0xd83a2f : activeCourse.environment === "mountain" ? 0x3f423b : 0xd92c24,
    transparent: activeCourse.environment === "mountain" && activeCourse.visualProfile !== "spaArdennes",
    opacity: activeCourse.environment === "mountain" && activeCourse.visualProfile !== "spaArdennes" ? 0.42 : 1,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -5,
    polygonOffsetUnits: -5,
  });

  const road = createRibbonMesh(
    ROAD_WIDTH,
    TRACK_SURFACE_OFFSET,
    roadMaterial,
    0,
    10,
  );
  road.receiveShadow = true;
  road.renderOrder = 2;
  scene.add(road);

  if (activeCourse.environment === "mountain") {
    createRoadShoulders();
  }

  const leftLine = createRibbonMesh(
    0.5,
    TRACK_SURFACE_OFFSET + 0.075,
    lineMaterial,
    ROAD_WIDTH / 2 - 0.55,
    2,
  );
  const rightLine = createRibbonMesh(
    0.5,
    TRACK_SURFACE_OFFSET + 0.075,
    lineMaterial,
    -ROAD_WIDTH / 2 + 0.55,
    2,
  );
  leftLine.renderOrder = 3;
  rightLine.renderOrder = 3;
  scene.add(leftLine, rightLine);
  const leftCurb = createRibbonMesh(
    0.24,
    TRACK_SURFACE_OFFSET + 0.09,
    curbMaterial,
    ROAD_WIDTH / 2 + 0.16,
    1,
  );
  const rightCurb = createRibbonMesh(
    0.24,
    TRACK_SURFACE_OFFSET + 0.09,
    curbMaterial,
    -ROAD_WIDTH / 2 - 0.16,
    1,
  );
  leftCurb.renderOrder = 4;
  rightCurb.renderOrder = 4;
  scene.add(leftCurb, rightCurb);
  const leftRedLine = createRibbonMesh(
    0.34,
    TRACK_SURFACE_OFFSET + 0.11,
    redLineMaterial,
    ROAD_WIDTH / 2 - 1.15,
    1,
  );
  const rightRedLine = createRibbonMesh(
    0.34,
    TRACK_SURFACE_OFFSET + 0.11,
    redLineMaterial,
    -ROAD_WIDTH / 2 + 1.15,
    1,
  );
  leftRedLine.renderOrder = 5;
  rightRedLine.renderOrder = 5;
  scene.add(leftRedLine, rightRedLine);

  if (activeCourse.visualProfile === "monacoStreet" || activeCourse.visualProfile === "spaArdennes") {
    addCurbRibbons(1);
    addCurbRibbons(-1);
  }

  if (activeCourse.environment === "mountain") {
    createCenterLaneMarks();
    createTireWearMarks();
  } else if (activeCourse.visualProfile === "monacoStreet") {
    createStreetLaneMarks();
  } else {
    createRacingLine();
  }
}

function createRoadShoulders() {
  const shoulderWidth = activeCourse.shoulderWidth ?? 4.5;
  const shoulderTexture = activeCourse.asphaltShoulders
    ? makeAsphaltTexture(activeCourse.asphalt)
    : makeRoadShoulderTexture(activeCourse.shoulder);
  shoulderTexture.repeat.set(1, 24);
  const shoulderMaterial = new THREE.MeshStandardMaterial({
    map: shoulderTexture,
    color: activeCourse.asphaltShoulders ? activeCourse.asphalt?.color ?? 0x101316 : 0x897b5c,
    roughness: activeCourse.asphaltShoulders ? 0.88 : 0.96,
    metalness: activeCourse.asphaltShoulders ? 0.02 : 0,
    polygonOffset: true,
    polygonOffsetFactor: -0.9,
    polygonOffsetUnits: -0.9,
  });
  const roughEdgeMaterial = new THREE.MeshBasicMaterial({
    color: 0x353532,
    transparent: true,
    opacity: 0.72,
    polygonOffset: true,
    polygonOffsetFactor: -5,
    polygonOffsetUnits: -5,
  });

  for (const side of [-1, 1]) {
    const shoulder = createRibbonMesh(
      shoulderWidth,
      TRACK_SURFACE_OFFSET + 0.025,
      shoulderMaterial,
      side * (ROAD_WIDTH / 2 + shoulderWidth / 2),
      4,
    );
    shoulder.receiveShadow = true;
    shoulder.renderOrder = 1;
    scene.add(shoulder);

    const raggedEdge = createRibbonMesh(
      0.32,
      TRACK_SURFACE_OFFSET + 0.12,
      roughEdgeMaterial,
      side * (ROAD_WIDTH / 2 + 0.28),
      1,
    );
    raggedEdge.renderOrder = 7;
    scene.add(raggedEdge);
  }
}

function createCenterLaneMarks() {
  const paintMaterial = new THREE.MeshBasicMaterial({
    color: 0xf2e7bd,
    transparent: true,
    opacity: 0.88,
    polygonOffset: true,
    polygonOffsetFactor: -7,
    polygonOffsetUnits: -7,
  });

  for (let i = 8; i < trackPoints.length - 8; i += 14) {
    const point = trackPoints[i];
    const tangent = getTrackTangent(i);
    const yaw = Math.atan2(tangent.x, tangent.y);
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.026, 4.2), paintMaterial);
    dash.position.set(point.x, getTrackElevation(point.x, point.y) + TRACK_SURFACE_OFFSET + 0.15, point.y);
    dash.rotation.y = yaw;
    dash.renderOrder = 8;
    scene.add(dash);
  }
}

function createStreetLaneMarks() {
  const whiteMaterial = new THREE.MeshBasicMaterial({
    color: 0xf4f4ee,
    transparent: true,
    opacity: 0.82,
    polygonOffset: true,
    polygonOffsetFactor: -7,
    polygonOffsetUnits: -7,
  });
  const yellowMaterial = new THREE.MeshBasicMaterial({
    color: 0xf2d04f,
    transparent: true,
    opacity: 0.86,
    polygonOffset: true,
    polygonOffsetFactor: -8,
    polygonOffsetUnits: -8,
  });

  for (let i = 7; i < trackPoints.length; i += 10) {
    const point = trackPoints[i];
    const tangent = getTrackTangent(i);
    const yaw = Math.atan2(tangent.x, tangent.y);
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.024, 3.4), whiteMaterial);
    dash.position.set(point.x, getTrackElevation(point.x, point.y) + TRACK_SURFACE_OFFSET + 0.145, point.y);
    dash.rotation.y = yaw;
    dash.renderOrder = 8;
    scene.add(dash);
  }

  for (const section of activeCourse.pitExitLines ?? []) {
    const indices = getTrackSectionIndices(section.start, section.end, 5);
    const side = section.side ?? -1;
    const offset = section.offset ?? ROAD_WIDTH / 2 - 1.7;

    for (const index of indices) {
      const point = trackPoints[index];
      const normal = getTrackNormal(index);
      const tangent = getTrackTangent(index);
      const base = point.clone().addScaledVector(normal, side * offset);
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.024, 3.8), yellowMaterial);
      dash.position.set(base.x, getTrackElevation(base.x, base.y) + TRACK_SURFACE_OFFSET + 0.155, base.y);
      dash.rotation.y = Math.atan2(tangent.x, tangent.y);
      dash.renderOrder = 9;
      scene.add(dash);
    }
  }
}

function createTireWearMarks() {
  const markMaterial = new THREE.MeshBasicMaterial({
    color: 0x080909,
    transparent: true,
    opacity: 0.18,
    polygonOffset: true,
    polygonOffsetFactor: -8,
    polygonOffsetUnits: -8,
  });

  for (let i = 10; i < trackPoints.length - 10; i += 7) {
    const point = trackPoints[i];
    const normal = getTrackNormal(i);
    const tangent = getTrackTangent(i);
    const yaw = Math.atan2(tangent.x, tangent.y);
    const curvature = getTrackCurvature(i);
    const wear = THREE.MathUtils.clamp(curvature * 16, 0, 1);
    if (wear < 0.18 && i % 21 !== 0) continue;

    for (const side of [-1, 1]) {
      const center = point.clone().addScaledVector(normal, side * (1.35 + wear * 1.15));
      const mark = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.018, 2.6 + wear * 2.4), markMaterial);
      mark.position.set(center.x, getTrackElevation(center.x, center.y) + TRACK_SURFACE_OFFSET + 0.16, center.y);
      mark.rotation.y = yaw + side * wear * 0.04;
      mark.renderOrder = 8;
      scene.add(mark);
    }
  }
}

function getTrackCurvature(index) {
  const prev = getTrackTangent(index - 4);
  const next = getTrackTangent(index + 4);
  return prev.distanceTo(next);
}

function createRacingLine() {
  const lineMaterial = new THREE.MeshBasicMaterial({
    color: 0xe02e28,
    transparent: true,
    opacity: 0.72,
    polygonOffset: true,
    polygonOffsetFactor: -6,
    polygonOffsetUnits: -6,
  });

  for (let i = 0; i < trackPoints.length; i += 5) {
    const point = trackPoints[i];
    const normal = getTrackNormal(i);
    const tangent = getTrackTangent(i);
    const offset = Math.sin((i / trackPoints.length) * Math.PI * 6) * 1.15;
    const center = point.clone().addScaledVector(normal, offset);
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.024, 2.65), lineMaterial);
    dash.position.set(center.x, getTrackElevation(center.x, center.y) + TRACK_SURFACE_OFFSET + 0.13, center.y);
    dash.rotation.y = Math.atan2(tangent.x, tangent.y);
    dash.renderOrder = 6;
    scene.add(dash);
  }
}

function createLaneMarkers() {
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xf6f2db,
    polygonOffset: true,
    polygonOffsetFactor: -5,
    polygonOffsetUnits: -5,
  });

  for (let i = 0; i < trackPoints.length; i += 8) {
    const point = trackPoints[i];
    const tangent = getTrackTangent(i);
    const yaw = Math.atan2(tangent.x, tangent.y);
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.025, 3.15), markerMaterial);
    dash.position.set(point.x, getTrackElevation(point.x, point.y) + TRACK_SURFACE_OFFSET + 0.11, point.y);
    dash.rotation.y = yaw;
    dash.renderOrder = 5;
    scene.add(dash);
  }
}

function createCrosswalks() {
  const stripeMaterial = new THREE.MeshBasicMaterial({
    color: 0xf8f8f1,
    polygonOffset: true,
    polygonOffsetFactor: -6,
    polygonOffsetUnits: -6,
  });
  const crosswalkIndices = [0, 68, 138, 206];

  for (const index of crosswalkIndices) {
    const wrappedIndex = normalizeTrackIndex(index);
    const point = trackPoints[wrappedIndex];
    const normal = getTrackNormal(wrappedIndex);
    const tangent = getTrackTangent(wrappedIndex);
    const yaw = Math.atan2(tangent.x, tangent.y);

    for (let stripeIndex = -3; stripeIndex <= 3; stripeIndex += 1) {
      const center = point.clone().addScaledVector(tangent, stripeIndex * 0.66);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH * 0.72, 0.028, 0.32), stripeMaterial);
      stripe.position.set(
        center.x,
        getTrackElevation(center.x, center.y) + TRACK_SURFACE_OFFSET + 0.13,
        center.y,
      );
      stripe.rotation.y = yaw + Math.PI / 2;
      stripe.userData.normal = normal;
      stripe.renderOrder = 6;
      scene.add(stripe);
    }
  }
}

function createJumpRampMarkers() {
  const markerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffd84a,
    transparent: true,
    opacity: 0.92,
    side: THREE.DoubleSide,
  });

  for (const ramp of JUMP_RAMPS) {
    const forward = new THREE.Vector2(Math.sin(ramp.yaw), Math.cos(ramp.yaw));
    const right = new THREE.Vector2(Math.cos(ramp.yaw), -Math.sin(ramp.yaw));

    for (let i = 0; i < 4; i += 1) {
      const centerForward = -ramp.length * 0.28 + i * 2.45;
      const center = new THREE.Vector2(ramp.x, ramp.z)
        .addScaledVector(forward, centerForward)
        .addScaledVector(right, 0);

      const marker = new THREE.Mesh(new THREE.PlaneGeometry(ramp.width * 0.58, 0.58), markerMaterial);
      marker.position.set(
        center.x,
        getTrackElevation(center.x, center.y) + TRACK_SURFACE_OFFSET + 0.052,
        center.y,
      );
      marker.rotation.x = -Math.PI / 2;
      marker.rotation.z = -ramp.yaw;
      scene.add(marker);
    }
  }
}

function createBarriers() {
  createBarrierLoop(ROAD_WIDTH / 2 + 1.45, 0xd8dde1);
  createBarrierLoop(-ROAD_WIDTH / 2 - 1.45, 0xd8dde1);
}

function createLowTrackWalls() {
  if (activeCourse.environment === "mountain" || activeCourse.guardRails?.replaceLowWalls) {
    createMountainGuardRails();
    return;
  }

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: activeCourse.visualProfile === "monacoStreet" ? 0xd5d7d2 : 0xd9ddd8,
    roughness: 0.48,
    metalness: 0.12,
  });
  const offset = ROAD_WIDTH / 2 + (activeCourse.wallOffset ?? 1.05);
  const wallOptions = {
    height: activeCourse.wallHeight ?? 0.52,
    thickness: activeCourse.wallThickness ?? 0.34,
    endGap: activeCourse.wallEndGap ?? (activeCourse.visualProfile === "monacoStreet" ? 0.08 : 1.05),
    segmentStep: activeCourse.wallSegmentStep ?? (activeCourse.visualProfile === "monacoStreet" ? 2 : 6),
    continuous: activeCourse.continuousWalls ?? false,
  };

  createLowWallLoop(offset, wallMaterial, wallOptions);
  createLowWallLoop(-offset, wallMaterial, wallOptions);
}

function createMountainGuardRails() {
  const railSettings = activeCourse.guardRails ?? {};
  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0xbfc5c3,
    roughness: 0.38,
    metalness: 0.56,
  });
  const postMaterial = new THREE.MeshStandardMaterial({
    color: 0x6d7471,
    roughness: 0.48,
    metalness: 0.42,
  });
  const railGeometry = new THREE.BoxGeometry(1, 0.16, 0.2);
  const postGeometry = new THREE.BoxGeometry(0.18, 1.1, 0.18);
  const railMatrices = [];
  const postMatrices = [];
  const sides = [
    { value: -1, enabled: railSettings.sides?.right !== false },
    { value: 1, enabled: railSettings.sides?.left !== false },
  ];
  const segmentStep = railSettings.segmentStep ?? 4;
  const postStep = railSettings.postStep ?? 8;
  const offset = ROAD_WIDTH / 2 + (railSettings.offset ?? 1.22);
  const segmentLimit = activeCourse.loop ? trackPoints.length : trackPoints.length - 1;

  for (const side of sides) {
    if (!side.enabled) continue;

    for (let i = 0; i < segmentLimit; i += segmentStep) {
      const nextIndex = activeCourse.loop
        ? (i + segmentStep) % trackPoints.length
        : Math.min(i + segmentStep, trackPoints.length - 1);
      const segment = getGuardRailSegment(i, nextIndex, side.value, offset, railSettings);
      if (!segment) continue;

      const { a, b } = segment;
      const dx = b.x - a.x;
      const dz = b.y - a.y;
      const length = Math.hypot(dx, dz) + 0.18;
      if (length < 1) continue;

      const angle = Math.atan2(-dz, dx);
      const centerX = (a.x + b.x) / 2;
      const centerZ = (a.y + b.y) / 2;
      const groundY = (getTrackElevation(a.x, a.y) + getTrackElevation(b.x, b.y)) / 2;

      addRailMatrix(railMatrices, centerX, groundY + 0.96, centerZ, angle, length);
      addRailMatrix(railMatrices, centerX, groundY + 0.56, centerZ, angle, length * 0.98);

      if (i % postStep === 0) {
        addPostMatrix(postMatrices, a.x, getTrackElevation(a.x, a.y) + 0.58, a.y, angle);
      }

      createGuardRailCollision(centerX, groundY + 0.62, centerZ, angle, length);
    }
  }

  addInstancedMesh(railGeometry, railMaterial, railMatrices, true);
  addInstancedMesh(postGeometry, postMaterial, postMatrices, true);
}

function addRailMatrix(matrices, x, y, z, angle, length) {
  const matrix = new THREE.Matrix4();
  matrix.compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle),
    new THREE.Vector3(length, 1, 1),
  );
  matrices.push(matrix);
}

function addPostMatrix(matrices, x, y, z, angle) {
  const matrix = new THREE.Matrix4();
  matrix.compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle),
    new THREE.Vector3(1, 1, 1),
  );
  matrices.push(matrix);
}

function addInstancedMesh(geometry, material, matrices, castShadow = false) {
  if (matrices.length === 0) return null;

  const mesh = new THREE.InstancedMesh(geometry, material, matrices.length);
  for (let i = 0; i < matrices.length; i += 1) {
    mesh.setMatrixAt(i, matrices[i]);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function createGuardRailCollision(centerX, centerY, centerZ, angle, length) {
  const body = new CANNON.Body({ mass: 0, material: barrierMaterial });
  body.userData = { type: "barrier" };
  body.position.set(centerX, centerY, centerZ);
  body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
  body.addShape(new CANNON.Box(new CANNON.Vec3(length / 2, 0.62, 0.26)));
  world.addBody(body);
}

function getGuardRailSegment(index, nextIndex, side, baseOffset, railSettings = {}) {
  const clearance = ROAD_WIDTH / 2 + 0.9;
  const pushSteps = railSettings.clearancePushSteps ?? [0, 2, 4, 7, 11, 16, 24, 34, 48, 66, 88, 116, 152, 196, 248];
  let bestSegment = null;
  let bestDistance = -Infinity;

  for (const push of pushSteps) {
    const offset = side * (baseOffset + push);
    const a = getOffsetTrackPoint(index, offset);
    const b = getOffsetTrackPoint(nextIndex, offset);
    const distance = getTrackCorridorDistanceForSegment(a, b, index, nextIndex);

    if (distance > bestDistance) {
      bestDistance = distance;
      bestSegment = { a, b };
    }

    if (distance >= clearance) return { a, b };
  }

  return bestDistance >= clearance ? bestSegment : null;
}

function createLowWallLoop(offset, material, options = {}) {
  const segmentStep = options.segmentStep ?? 6;
  const segmentLimit = activeCourse.loop ? trackPoints.length : trackPoints.length - segmentStep;

  for (let i = 0; i < segmentLimit; i += segmentStep) {
    const nextIndex = activeCourse.loop ? (i + segmentStep) % trackPoints.length : Math.min(i + segmentStep, trackPoints.length - 1);
    const a = getOffsetTrackPoint(i, getRoadEdgeAwareOffset(offset, i));
    const b = getOffsetTrackPoint(nextIndex, getRoadEdgeAwareOffset(offset, nextIndex));
    const midpoint = a.clone().add(b).multiplyScalar(0.5);

    if (shouldSkipTrackWallSegment(i, midpoint, options)) continue;
    createLowWallSegment(a, b, material, options.height ?? 0.52, options.thickness ?? 0.34, options.endGap ?? 1.05);
  }
}

function shouldSkipTrackWallSegment(index, midpoint, options = {}) {
  if (options.continuous) {
    return isNearBridgeAccess(midpoint.x, midpoint.y, 18) || isNearTestArea(midpoint.x, midpoint.y, 14);
  }

  const startPoint = trackPoints[0];
  const finishPoint = trackPoints[trackPoints.length - 1];
  const nearStartIndex = index < 22 || (activeCourse.loop && index > trackPoints.length - 22);
  const nearStartPosition = midpoint.distanceTo(startPoint) < 30;
  const nearFinishIndex = !activeCourse.loop && index > trackPoints.length - 24;
  const nearFinishPosition = !activeCourse.loop && midpoint.distanceTo(finishPoint) < 30;

  return (
    nearStartIndex ||
    nearStartPosition ||
    nearFinishIndex ||
    nearFinishPosition ||
    isNearBridgeAccess(midpoint.x, midpoint.y, 18) ||
    isNearTestArea(midpoint.x, midpoint.y, 14) ||
    isNearOtherTrackBranch(midpoint, index, ROAD_WIDTH + 4)
  );
}

function createTestAreaLowWalls() {
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xdedfd9,
    roughness: 0.5,
    metalness: 0.08,
  });
  const halfWidth = TEST_AREA.width / 2;
  const halfDepth = TEST_AREA.depth / 2;
  const zSouth = TEST_AREA.z - halfDepth - 0.7;
  const zNorth = TEST_AREA.z + halfDepth + 0.7;
  const xWest = TEST_AREA.x - halfWidth - 0.7;
  const xEast = TEST_AREA.x + halfWidth + 0.7;
  const cornerGap = 1.35;

  createLowWallSegment(
    new THREE.Vector2(xWest + cornerGap, zNorth),
    new THREE.Vector2(xEast - cornerGap, zNorth),
    wallMaterial,
    0.54,
    0.36,
    0.9,
  );
  createLowWallSegment(
    new THREE.Vector2(xWest, zSouth + cornerGap),
    new THREE.Vector2(xWest, zNorth - cornerGap),
    wallMaterial,
    0.54,
    0.36,
    0.9,
  );
  createLowWallSegment(
    new THREE.Vector2(xEast, zSouth + cornerGap),
    new THREE.Vector2(xEast, zNorth - cornerGap),
    wallMaterial,
    0.54,
    0.36,
    0.9,
  );

  const openings = BRIDGE_ROUTES
    .map((route) => ({ min: route.endX - route.width * 1.75, max: route.endX + route.width * 1.75 }))
    .sort((a, b) => a.min - b.min);
  let cursor = xWest + cornerGap;

  for (const opening of openings) {
    const end = Math.max(cursor, opening.min);
    if (end - cursor > 4) {
      createLowWallSegment(new THREE.Vector2(cursor, zSouth), new THREE.Vector2(end, zSouth), wallMaterial, 0.54, 0.36, 0.9);
    }
    cursor = Math.max(cursor, opening.max);
  }

  if (xEast - cornerGap - cursor > 4) {
    createLowWallSegment(new THREE.Vector2(cursor, zSouth), new THREE.Vector2(xEast - cornerGap, zSouth), wallMaterial, 0.54, 0.36, 0.9);
  }
}

function createBridgeRoutes() {
  const deckMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a5050,
    roughness: 0.72,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const railMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfd3cf,
    roughness: 0.5,
    metalness: 0.12,
  });
  const stripeMaterial = new THREE.MeshBasicMaterial({
    color: 0xd92c24,
    polygonOffset: true,
    polygonOffsetFactor: -5,
    polygonOffsetUnits: -5,
  });

  for (const route of BRIDGE_ROUTES) {
    createBridgeRibbon(route, deckMaterial, stripeMaterial);
    createBridgeRails(route, railMaterial);
  }
}

function createBridgeRibbon(route, deckMaterial, stripeMaterial) {
  const start = new THREE.Vector2(route.startX, route.startZ);
  const end = new THREE.Vector2(route.endX, route.endZ);
  const direction = end.clone().sub(start).normalize();
  const normal = new THREE.Vector2(-direction.y, direction.x);
  const steps = 18;
  const vertices = [];
  const uvs = [];
  const indices = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const center = start.clone().lerp(end, t);
    const width = route.width + Math.sin(t * Math.PI) * 1.2;

    for (let side = -1; side <= 1; side += 2) {
      const point = center.clone().addScaledVector(normal, side * width / 2);
      vertices.push(point.x, getTrackElevation(point.x, point.y) + TRACK_SURFACE_OFFSET + 0.12, point.y);
      uvs.push(side < 0 ? 0 : 1, t * 8);
    }
  }

  for (let i = 0; i < steps; i += 1) {
    const a = i * 2;
    const b = a + 1;
    const c = a + 2;
    const d = a + 3;
    indices.push(a, c, b, b, c, d);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const deck = new THREE.Mesh(geometry, deckMaterial);
  deck.receiveShadow = true;
  deck.renderOrder = 4;
  scene.add(deck);

  for (let i = 2; i < steps; i += 4) {
    const t = i / steps;
    const center = start.clone().lerp(end, t);
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(route.width * 0.66, 0.03, 0.36), stripeMaterial);
    stripe.position.set(center.x, getTrackElevation(center.x, center.y) + TRACK_SURFACE_OFFSET + 0.17, center.y);
    stripe.rotation.y = Math.atan2(direction.x, direction.y) + Math.PI / 2;
    stripe.renderOrder = 8;
    scene.add(stripe);
  }
}

function createBridgeRails(route, material) {
  const start = new THREE.Vector2(route.startX, route.startZ);
  const end = new THREE.Vector2(route.endX, route.endZ);
  const direction = end.clone().sub(start).normalize();
  const normal = new THREE.Vector2(-direction.y, direction.x);
  const railStartBase = start.clone().addScaledVector(direction, 2.4);
  const railEndBase = end.clone().addScaledVector(direction, -3.2);

  for (const side of [-1, 1]) {
    const railStart = railStartBase.clone().addScaledVector(normal, side * (route.width / 2 + 0.55));
    const railEnd = railEndBase.clone().addScaledVector(normal, side * (route.width / 2 + 0.55));
    createLowWallSegment(railStart, railEnd, material, 0.46, 0.3, 1.0);
  }
}

function createGrandstands() {
  const standMaterial = new THREE.MeshStandardMaterial({ color: 0xb8bdba, roughness: 0.64, metalness: 0.08 });
  const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x2f4f6b, roughness: 0.7 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x24282b, roughness: 0.52, metalness: 0.2 });
  const standDefs = [
    { index: 46, side: 1 },
    { index: 108, side: -1 },
    { index: 188, side: 1 },
    { index: 292, side: -1 },
  ];

  for (const def of standDefs) {
    createGrandstand(def.index, def.side, standMaterial, seatMaterial, roofMaterial);
  }
}

function createGrandstand(index, side, standMaterial, seatMaterial, roofMaterial) {
  const wrappedIndex = normalizeTrackIndex(index);
  const point = trackPoints[wrappedIndex];
  const normal = getTrackNormal(wrappedIndex);
  const tangent = getTrackTangent(wrappedIndex);
  const base = point.clone().addScaledVector(normal, side * (ROAD_WIDTH / 2 + 19));

  if (isNearTrack(base.x, base.y, ROAD_WIDTH + 6) || isNearTestArea(base.x, base.y, 8)) return;

  const yaw = Math.atan2(tangent.x, tangent.y);
  if (!isRectFootprintClearOfTrack(base.x, base.y, 17.5, 6.4, yaw, 3.2)) return;
  const groundY = getTrackElevation(base.x, base.y);
  const stand = new THREE.Group();

  for (let row = 0; row < 5; row += 1) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(15, 0.28, 0.8), row % 2 ? seatMaterial : standMaterial);
    seat.position.set(0, row * 0.42 + 0.24, side * (row * 0.78));
    seat.castShadow = true;
    seat.receiveShadow = true;
    stand.add(seat);
  }

  const basePlatform = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.3, 5.2), standMaterial);
  basePlatform.position.set(0, 0.08, side * 1.6);
  basePlatform.castShadow = true;
  basePlatform.receiveShadow = true;
  stand.add(basePlatform);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(17.5, 0.24, 4.6), roofMaterial);
  roof.position.set(0, 3.05, side * 1.7);
  roof.castShadow = true;
  stand.add(roof);

  for (const x of [-7.2, 7.2]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.0, 8), roofMaterial);
    post.position.set(x, 1.55, side * 0.2);
    post.castShadow = true;
    stand.add(post);
  }

  stand.position.set(base.x, groundY + 0.02, base.y);
  stand.rotation.y = yaw;
  scene.add(stand);
}

function createLowWallSegment(a, b, material, height = 0.52, thickness = 0.34, endGap = 0.65) {
  const dx = b.x - a.x;
  const dz = b.y - a.y;
  const length = Math.hypot(dx, dz) - endGap;

  if (length < 1.2) return;

  const angle = Math.atan2(-dz, dx);
  const centerX = (a.x + b.x) / 2;
  const centerZ = (a.y + b.y) / 2;
  const groundY = (getTrackElevation(a.x, a.y) + getTrackElevation(b.x, b.y)) / 2;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, height, thickness), material);
  mesh.position.set(centerX, groundY + height / 2 + 0.03, centerZ);
  mesh.rotation.y = angle;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const body = new CANNON.Body({ mass: 0, material: barrierMaterial });
  body.userData = { type: "barrier" };
  body.position.set(centerX, groundY + height / 2 + 0.03, centerZ);
  body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
  body.addShape(new CANNON.Box(new CANNON.Vec3(length / 2, height / 2, thickness / 2)));
  world.addBody(body);
}

function createStartLine() {
  const group = new THREE.Group();
  const stripeMaterialA = new THREE.MeshBasicMaterial({ color: 0xf7f7f2 });
  const stripeMaterialB = new THREE.MeshBasicMaterial({ color: 0x111416 });
  addCheckeredGate(group, START_GATE, stripeMaterialA, stripeMaterialB, START_GRID_WIDTH);

  if (!activeCourse.loop) {
    addCheckeredGate(group, FINISH_GATE, stripeMaterialA, stripeMaterialB);
  }

  scene.add(group);
}

function createCheckpointMarkers() {
  const checkpointIndices = getCheckpointIndices();
  if (!checkpointIndices.length) return;

  const group = new THREE.Group();
  const stripeMaterial = new THREE.MeshBasicMaterial({
    color: 0xb71922,
    polygonOffset: true,
    polygonOffsetFactor: -7,
    polygonOffsetUnits: -7,
  });
  const signMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4f5ef,
    roughness: 0.54,
    metalness: 0.06,
  });
  const postMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c625f,
    roughness: 0.5,
    metalness: 0.38,
  });
  const textMaterial = new THREE.MeshBasicMaterial({ color: 0xb71922 });

  checkpointIndices.forEach((index, checkpointIndex) => {
    const gate = createCourseGate(index);
    const yaw = Math.atan2(gate.tangent.x, gate.tangent.y);

    for (let stripeIndex = -1; stripeIndex <= 1; stripeIndex += 1) {
      const center = gate.center.clone().addScaledVector(gate.tangent, stripeIndex * 0.55);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH * 0.82, 0.03, 0.2), stripeMaterial);
      stripe.position.set(
        center.x,
        getTrackElevation(center.x, center.y) + TRACK_SURFACE_OFFSET + 0.155,
        center.y,
      );
      stripe.rotation.y = yaw + Math.PI / 2;
      stripe.renderOrder = 9;
      group.add(stripe);
    }

    const side = checkpointIndex % 2 === 0 ? 1 : -1;
    const signBase = gate.center.clone().addScaledVector(gate.normal, side * getRoadsideObjectOffset(1.9));
    if (!isRoadsideObjectClear(signBase.x, signBase.y, 1.2, 0.7)) return;

    const groundY = getTrackElevation(signBase.x, signBase.y);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 1.6, 8), postMaterial);
    post.position.set(signBase.x, groundY + 0.8, signBase.y);
    post.castShadow = true;
    group.add(post);

    const board = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.42, 0.08), signMaterial);
    board.position.set(signBase.x, groundY + 1.72, signBase.y);
    board.rotation.y = yaw + (side > 0 ? -0.18 : 0.18);
    board.castShadow = true;
    group.add(board);

    const marker = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.055, 0.085), textMaterial);
    marker.position.set(signBase.x, groundY + 1.72, signBase.y);
    marker.rotation.copy(board.rotation);
    marker.position.x += Math.sin(board.rotation.y) * 0.052;
    marker.position.z += Math.cos(board.rotation.y) * 0.052;
    group.add(marker);
  });

  scene.add(group);
}

function addCheckeredGate(group, gate, stripeMaterialA, stripeMaterialB, width = ROAD_WIDTH) {
  const center = gate.center;
  const normal = gate.normal;
  const tangent = gate.tangent;
  const yaw = Math.atan2(tangent.x, tangent.y);

  for (let i = 0; i < 8; i += 1) {
    const lateralOffset = -width / 2 + width / 16 + (i * width) / 8;
    const position = center.clone().addScaledVector(normal, lateralOffset);
    const y = getTrackElevation(position.x, position.y) + TRACK_SURFACE_OFFSET + 0.008;
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(width / 8, 0.004, 1.05),
      i % 2 === 0 ? stripeMaterialA : stripeMaterialB,
    );
    stripe.position.set(position.x, y, position.y);
    stripe.rotation.y = yaw;
    stripe.renderOrder = 8;
    group.add(stripe);
  }
}

function createScenery() {
  if (!activeCourse.disableTestArea) {
    createTestArea();
  }
  createCityBlocks();
  createStreetFurniture();
  createClouds();
}

function createMountainScenery() {
  createMountainBackdrop();
  createDrainageDitches();
  createMountainTrees();
  createRockFaces();
  createMountainRocks();
  createRoadReflectors();
  createRoadsideSigns();
  createClouds();
}

function createMonacoStreetScenery() {
  createCircuitRunoffZones();
  createMonacoHarborWater();
  createMonacoTunnel();
  createMonacoLandmarkBuildings();
  createMonacoTracksideBuildings();
  createYachtMarina();
  createMonacoBarrierStripes();
  createMonacoWallPanels();
}

function createSpaCircuitScenery() {
  createCircuitRunoffZones();
  createSpaTireBarriers();
  createSpaFacilities();
}

function createMonacoHarborWater() {
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x1f8fcc,
    roughness: 0.18,
    metalness: 0.02,
    clearcoat: 0.5,
    clearcoatRoughness: 0.08,
    transparent: true,
    opacity: 0.82,
  });
  const quayMaterial = new THREE.MeshStandardMaterial({
    color: 0xc7c5b8,
    roughness: 0.72,
    metalness: 0.03,
    polygonOffset: true,
    polygonOffsetFactor: -0.7,
    polygonOffsetUnits: -0.7,
  });

  for (const section of activeCourse.harborSections ?? []) {
    const water = createTracksideSurfaceRibbon(section, waterMaterial, TRACK_SURFACE_OFFSET - 0.02);
    if (water) {
      water.receiveShadow = true;
      water.renderOrder = 0;
      scene.add(water);
    }

    const quay = createTracksideSurfaceRibbon({
      ...section,
      width: 5.2,
      offset: (section.offset ?? 28) - (section.width ?? 30) / 2 - 2.4,
    }, quayMaterial, TRACK_SURFACE_OFFSET + 0.025);
    if (quay) {
      quay.receiveShadow = true;
      quay.renderOrder = 1;
      scene.add(quay);
    }
  }
}

function createMonacoTunnel() {
  const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x35383b, roughness: 0.64, metalness: 0.08 });
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x787c7a, roughness: 0.72, metalness: 0.04 });
  const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffefad });
  const ceilingGeometry = new THREE.BoxGeometry(ROAD_WIDTH + 6.2, 0.32, 5.2);
  const wallGeometry = new THREE.BoxGeometry(0.62, 3.45, 5.2);
  const lightGeometry = new THREE.BoxGeometry(0.95, 0.055, 0.22);
  const ceilingMatrices = [];
  const wallMatrices = [];
  const lightMatrices = [];

  for (const tunnel of activeCourse.tunnelSections ?? []) {
    const indices = getTrackSectionIndices(tunnel.start, tunnel.end, tunnel.step ?? tunnel.lightStep ?? 6);

    for (const index of indices) {
      const point = trackPoints[index];
      const tangent = getTrackTangent(index);
      const normal = getTrackNormal(index);
      const yaw = Math.atan2(tangent.x, tangent.y);
      const baseY = getTrackElevation(point.x, point.y);

      ceilingMatrices.push(makeTransformMatrix(point.x, baseY + 3.85, point.y, yaw, 1, 1, 1));
      lightMatrices.push(makeTransformMatrix(point.x, baseY + 3.66, point.y, yaw, 1, 1, 1));

      for (const side of [-1, 1]) {
        const sideBase = point.clone().addScaledVector(normal, side * (ROAD_WIDTH / 2 + (tunnel.sideWallOffset ?? 1.7)));
        wallMatrices.push(makeTransformMatrix(sideBase.x, baseY + 1.7, sideBase.y, yaw, 1, 1, 1));
      }
    }
  }

  addInstancedMesh(ceilingGeometry, ceilingMaterial, ceilingMatrices, true);
  addInstancedMesh(wallGeometry, wallMaterial, wallMatrices, true);
  addInstancedMesh(lightGeometry, lightMaterial, lightMatrices, false);
}

function createMonacoLandmarkBuildings() {
  for (const def of activeCourse.landmarkBuildings ?? []) {
    const index = getTrackIndexFromFraction(def.fraction);
    const point = trackPoints[index];
    const tangent = getTrackTangent(index);
    const normal = getTrackNormal(index);
    const side = def.side ?? 1;
    const base = point.clone().addScaledVector(normal, side * getRoadsideObjectOffset((def.depth ?? 14) * 0.5 + 7));
    if (!isRoadsideObjectClear(base.x, base.y, Math.max(def.width ?? 18, def.depth ?? 14) * 0.5, 0.8)) continue;

    const groundY = getTrackElevation(base.x, base.y);
    const yaw = Math.atan2(tangent.x, tangent.y);
    if (!isRectFootprintClearOfTrack(base.x, base.y, def.width ?? 18, def.depth ?? 14, yaw, 2.2)) continue;
    const facadeMaterial = new THREE.MeshStandardMaterial({
      map: makeBuildingTexture(def.color ?? 0xd6c6a0, 0xffefb4),
      roughness: 0.68,
      metalness: 0.02,
    });
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x3d3d3a, roughness: 0.82 });
    const signMaterial = new THREE.MeshBasicMaterial({
      map: makeTrackSignTexture(def.label ?? "MONACO", 0x17243a, 0xf5e8bd, 0xe2c070),
      transparent: true,
      side: THREE.DoubleSide,
    });
    const building = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(def.width ?? 18, def.height ?? 24, def.depth ?? 14), facadeMaterial);
    body.position.y = (def.height ?? 24) / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    building.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry((def.width ?? 18) + 1, 0.5, (def.depth ?? 14) + 1), roofMaterial);
    roof.position.y = (def.height ?? 24) + 0.28;
    roof.castShadow = true;
    building.add(roof);

    const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(def.width ?? 18, 16), 3.2), signMaterial);
    sign.position.set(0, Math.min((def.height ?? 24) * 0.7, 18), side * ((def.depth ?? 14) / 2 + 0.06));
    sign.rotation.y = side > 0 ? 0 : Math.PI;
    sign.renderOrder = 12;
    building.add(sign);

    building.position.set(base.x, groundY, base.y);
    building.rotation.y = yaw;
    scene.add(building);
  }
}

function createMonacoTracksideBuildings() {
  const zones = activeCourse.tracksideBuildings ?? [];
  if (!zones.length) return;

  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x303234, roughness: 0.82 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xf3efe2, roughness: 0.64 });

  for (const zone of zones) {
    const sides = zone.sides ?? [zone.side ?? 1];
    const indices = getTrackSectionIndices(zone.start, zone.end, zone.step ?? 18);

    for (let buildingIndex = 0; buildingIndex < indices.length; buildingIndex += 1) {
      const index = indices[buildingIndex];
      const point = trackPoints[index];
      const tangent = getTrackTangent(index);
      const normal = getTrackNormal(index);
      const yaw = Math.atan2(tangent.x, tangent.y);
      const seed = pseudoRandom(index * 5.73 + buildingIndex * 17.1);
      const width = (zone.width ?? 16) * (0.82 + seed * 0.36);
      const depth = (zone.depth ?? 13) * (0.88 + pseudoRandom(index * 2.4) * 0.3);
      const height = (zone.minHeight ?? 14) + pseudoRandom(index * 3.2) * ((zone.maxHeight ?? 34) - (zone.minHeight ?? 14));
      const color = zone.colors?.[Math.floor(seed * zone.colors.length) % zone.colors.length] ?? 0xd7d1c0;
      const facadeMaterial = new THREE.MeshStandardMaterial({
        map: makeBuildingTexture(color, zone.windowColor ?? 0xcfe7f1),
        roughness: 0.7,
        metalness: 0.02,
      });

      for (const side of sides) {
        const offset = zone.offset ?? getRoadsideObjectOffset(depth * 0.5 + 5.5);
        const lateral = point.clone().addScaledVector(normal, side * offset);
        const base = lateral.addScaledVector(tangent, (seed - 0.5) * (zone.jitter ?? 4));
        if (!isRectFootprintClearOfTrack(base.x, base.y, width, depth, yaw, zone.clearance ?? 1.8)) continue;

        const groundY = getTrackElevation(base.x, base.y);
        const building = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), facadeMaterial);
        body.position.y = height / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        building.add(body);

        const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.5, 0.32, depth + 0.5), roofMaterial);
        roof.position.y = height + 0.18;
        roof.castShadow = true;
        building.add(roof);

        if (zone.balconies !== false) {
          const balconyCount = Math.max(2, Math.floor(height / 6));
          for (let floor = 1; floor <= balconyCount; floor += 1) {
            const balcony = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, 0.12, 0.42), trimMaterial);
            balcony.position.set(0, floor * (height / (balconyCount + 1)), side * -(depth / 2 + 0.24));
            balcony.castShadow = true;
            building.add(balcony);
          }
        }

        building.position.set(base.x, groundY, base.y);
        building.rotation.y = yaw;
        scene.add(building);
      }
    }
  }
}

function createYachtMarina() {
  for (const section of activeCourse.yachtSections ?? []) {
    const count = section.count ?? 5;

    for (let yachtIndex = 0; yachtIndex < count; yachtIndex += 1) {
      const t = count <= 1 ? 0.5 : yachtIndex / (count - 1);
      const fraction = interpolateProgress(section.start, section.end, t);
      const index = getTrackIndexFromFraction(fraction);
      const point = trackPoints[index];
      const normal = getTrackNormal(index);
      const tangent = getTrackTangent(index);
      const side = section.side ?? -1;
      const offset = ROAD_WIDTH / 2 + 22 + yachtIndex * 3.2 + pseudoRandom(index * 2.7) * 9;
      const base = point.clone().addScaledVector(normal, side * offset).addScaledVector(tangent, (pseudoRandom(index) - 0.5) * 10);
      createYacht(base.x, getTrackElevation(base.x, base.y) + 0.12, base.y, Math.atan2(tangent.x, tangent.y) + side * 0.35);
    }
  }
}

function createYacht(x, y, z, yaw) {
  const yacht = new THREE.Group();
  const hullMaterial = new THREE.MeshStandardMaterial({ color: 0xf4f4ee, roughness: 0.32, metalness: 0.04 });
  const glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x9bd5ef, roughness: 0.08, metalness: 0.02, transparent: true, opacity: 0.7 });
  const mastMaterial = new THREE.MeshStandardMaterial({ color: 0xd2d5cf, roughness: 0.38, metalness: 0.44 });

  const hull = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.45, 1.35), hullMaterial);
  hull.position.y = 0.22;
  hull.castShadow = true;
  yacht.add(hull);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.65, 0.9), glassMaterial);
  cabin.position.set(0.25, 0.78, 0);
  cabin.castShadow = true;
  yacht.add(cabin);

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 3.4, 8), mastMaterial);
  mast.position.set(-0.8, 2.0, 0);
  mast.castShadow = true;
  yacht.add(mast);

  yacht.position.set(x, y, z);
  yacht.rotation.y = yaw;
  scene.add(yacht);
}

function createMonacoBarrierStripes() {
  if (activeCourse.guardRails?.replaceLowWalls) return;

  const stripeMaterial = new THREE.MeshBasicMaterial({
    color: 0xd52f2f,
    transparent: true,
    opacity: 0.84,
    polygonOffset: true,
    polygonOffsetFactor: -7,
    polygonOffsetUnits: -7,
  });

  for (let i = 10; i < trackPoints.length; i += 18) {
    const point = trackPoints[i];
    const tangent = getTrackTangent(i);
    const normal = getTrackNormal(i);
    const yaw = Math.atan2(tangent.x, tangent.y);

    for (const side of [-1, 1]) {
      const base = point.clone().addScaledVector(
        normal,
        getRoadEdgeAwareOffset(side * (ROAD_WIDTH / 2 + (activeCourse.wallOffset ?? 0.55) + 0.08), i),
      );
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.56, 1.65), stripeMaterial);
      stripe.position.set(base.x, getTrackElevation(base.x, base.y) + 0.8, base.y);
      stripe.rotation.y = yaw;
      stripe.renderOrder = 13;
      scene.add(stripe);
    }
  }
}

function createCircuitRunoffZones() {
  const gravelMaterial = new THREE.MeshStandardMaterial({
    map: makeRoadShoulderTexture(activeCourse.shoulder),
    color: 0xb1a884,
    roughness: 0.98,
    polygonOffset: true,
    polygonOffsetFactor: -0.8,
    polygonOffsetUnits: -0.8,
  });
  const grassMaterial = new THREE.MeshStandardMaterial({
    map: makeGrassTexture(activeCourse.shoulder),
    color: 0x5b8341,
    roughness: 0.96,
    polygonOffset: true,
    polygonOffsetFactor: -0.8,
    polygonOffsetUnits: -0.8,
  });
  const asphaltMaterial = new THREE.MeshStandardMaterial({
    map: makeAsphaltTexture(activeCourse.asphalt ?? { base: "#171a1d", repeat: 20 }),
    color: activeCourse.asphalt?.color ?? 0x16191c,
    roughness: 0.88,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -0.8,
    polygonOffsetUnits: -0.8,
  });
  const concreteMaterial = new THREE.MeshStandardMaterial({
    color: 0xbcc1bb,
    roughness: 0.9,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -0.8,
    polygonOffsetUnits: -0.8,
  });
  const materialByName = {
    gravel: gravelMaterial,
    grass: grassMaterial,
    asphalt: asphaltMaterial,
    concrete: concreteMaterial,
    paintedGreen: makePaintedRunoffMaterial(0x16a45b),
    paintedYellow: makePaintedRunoffMaterial(0xf4d331),
    paintedRed: makePaintedRunoffMaterial(0xd9352c),
    paintedBlue: makePaintedRunoffMaterial(0x2196d8),
    paintedWhite: makePaintedRunoffMaterial(0xf4f2e8),
  };

  for (const zone of activeCourse.runoffZones ?? []) {
    const normalizedZone = activeCourse.asphaltRunoffs
      ? { ...zone, material: "asphalt", striped: false, grip: 1 }
      : zone;

    if (normalizedZone.striped) {
      createStripedRunoffZone(normalizedZone, materialByName);
    } else {
      const material = materialByName[normalizedZone.material] ?? gravelMaterial;
      const runoff = createTracksideSurfaceRibbon(
        normalizedZone,
        material,
        TRACK_SURFACE_OFFSET + 0.032,
        normalizedZone.crossSegments ?? 5,
      );
      if (!runoff) continue;
      runoff.receiveShadow = true;
      runoff.renderOrder = 1;
      scene.add(runoff);
    }
  }
}

function makePaintedRunoffMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.76,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -0.95,
    polygonOffsetUnits: -0.95,
  });
}

function createStripedRunoffZone(zone, materialByName) {
  const stripeCount = Math.max(2, zone.stripeCount ?? zone.materials?.length ?? 3);
  const stripeWidth = (zone.width ?? 10) / stripeCount;
  const firstCenter = (zone.offset ?? ROAD_WIDTH / 2 + (zone.width ?? 10) / 2) - (zone.width ?? 10) / 2 + stripeWidth / 2;
  const materials = zone.materials ?? ["paintedGreen", "paintedYellow", "paintedRed"];

  for (let stripeIndex = 0; stripeIndex < stripeCount; stripeIndex += 1) {
    const material = materialByName[materials[stripeIndex % materials.length]] ?? materialByName.paintedGreen;
    const runoff = createTracksideSurfaceRibbon({
      ...zone,
      striped: false,
      width: stripeWidth + 0.04,
      offset: firstCenter + stripeIndex * stripeWidth,
    }, material, TRACK_SURFACE_OFFSET + 0.042 + stripeIndex * 0.001, zone.crossSegments ?? 2);
    if (!runoff) continue;
    runoff.receiveShadow = true;
    runoff.renderOrder = 2;
    scene.add(runoff);
  }
}

function createSpaTireBarriers() {
  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x070809, roughness: 0.72, metalness: 0.04 });
  const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xd6d2c8, roughness: 0.68 });
  const tireGeometry = new THREE.BoxGeometry(1.1, 0.82, 0.54);
  const stripeGeometry = new THREE.BoxGeometry(1.12, 0.16, 0.56);
  const tireMatrices = [];
  const stripeMatrices = [];

  for (const zone of activeCourse.tireBarrierZones ?? []) {
    const indices = getTrackSectionIndices(zone.start, zone.end, 7);
    const side = zone.side ?? 1;

    for (const index of indices) {
      const point = trackPoints[index];
      const tangent = getTrackTangent(index);
      const normal = getTrackNormal(index);
      const yaw = Math.atan2(tangent.x, tangent.y);

      for (let row = 0; row < (zone.rows ?? 2); row += 1) {
        const offset = ROAD_WIDTH / 2 + (activeCourse.shoulderWidth ?? 6) + 3.5 + row * 0.9;
        const base = point.clone().addScaledVector(normal, side * offset);
        const y = getTrackElevation(base.x, base.y) + 0.42 + row * 0.08;
        tireMatrices.push(makeTransformMatrix(base.x, y, base.y, yaw, 1, 1, 1));
        if ((index + row) % 2 === 0) stripeMatrices.push(makeTransformMatrix(base.x, y + 0.05, base.y, yaw, 1, 1, 1));
      }
    }
  }

  addInstancedMesh(tireGeometry, tireMaterial, tireMatrices, true);
  addInstancedMesh(stripeGeometry, stripeMaterial, stripeMatrices, true);
}

function createSpaFacilities() {
  const pitMaterial = new THREE.MeshStandardMaterial({ color: 0xcfd3d0, roughness: 0.62, metalness: 0.08 });
  const glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0x6ca2c5, roughness: 0.08, metalness: 0.08, transparent: true, opacity: 0.7 });
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x262a2d, roughness: 0.58, metalness: 0.22 });
  const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x375d7a, roughness: 0.72 });

  for (const zone of activeCourse.facilityZones ?? []) {
    const index = getTrackIndexFromFraction(zone.fraction);
    const point = trackPoints[index];
    const tangent = getTrackTangent(index);
    const normal = getTrackNormal(index);
    const side = zone.side ?? 1;
    const yaw = Math.atan2(tangent.x, tangent.y);
    const facilityLength = zone.length ?? (zone.type === "pit" ? 48 : 34);
    const facilityDepth = zone.depth ?? (zone.type === "pit" ? 10.5 : 5.2);
    const centerOffset = Number.isFinite(zone.offset)
      ? zone.offset
      : getRoadsideObjectOffset(facilityDepth * 0.5 + 8.5);
    const base = point.clone().addScaledVector(normal, side * centerOffset);
    const groundY = getTrackElevation(base.x, base.y);
    if (
      !isRoadsideObjectClear(base.x, base.y, facilityDepth * 0.5, 0.8) ||
      !isRectFootprintClearOfTrack(base.x, base.y, facilityLength, facilityDepth, yaw, 3.0)
    ) {
      continue;
    }

    if (zone.type === "pit") {
      const pit = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(facilityLength, 6.8, facilityDepth), pitMaterial);
      body.position.y = 3.4;
      body.castShadow = true;
      body.receiveShadow = true;
      pit.add(body);

      const glass = new THREE.Mesh(new THREE.BoxGeometry(facilityLength - 5, 2.1, 0.16), glassMaterial);
      glass.position.set(0, 5.2, side * -(facilityDepth / 2 + 0.1));
      glass.rotation.y = side > 0 ? Math.PI : 0;
      pit.add(glass);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(facilityLength + 3, 0.5, facilityDepth + 2.1), roofMaterial);
      roof.position.y = 7.05;
      roof.castShadow = true;
      pit.add(roof);

      pit.position.set(base.x, groundY, base.y);
      pit.rotation.y = yaw;
      scene.add(pit);
    } else {
      createTracksideGrandstand(base.x, groundY, base.y, yaw, side, facilityLength, seatMaterial, roofMaterial);
    }
  }
}

function createTracksideGrandstand(x, y, z, yaw, side, length, seatMaterial, roofMaterial) {
  if (!isRectFootprintClearOfTrack(x, z, length + 2, 5.2, yaw, 3.0)) return;
  const stand = new THREE.Group();
  const frameMaterial = new THREE.MeshStandardMaterial({ color: 0xaeb4af, roughness: 0.7, metalness: 0.06 });

  for (let row = 0; row < 6; row += 1) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(length, 0.28, 0.78), row % 2 ? seatMaterial : frameMaterial);
    seat.position.set(0, row * 0.46 + 0.3, side * row * 0.72);
    seat.castShadow = true;
    seat.receiveShadow = true;
    stand.add(seat);
  }

  const roof = new THREE.Mesh(new THREE.BoxGeometry(length + 2, 0.32, 5.2), roofMaterial);
  roof.position.set(0, 3.75, side * 2.1);
  roof.castShadow = true;
  stand.add(roof);

  stand.position.set(x, y, z);
  stand.rotation.y = yaw;
  scene.add(stand);
}

function createCourseAdBoards() {
  for (const board of activeCourse.adBoards ?? []) {
    const index = getTrackIndexFromFraction(board.fraction);
    const point = trackPoints[index];
    const normal = getTrackNormal(index);
    const tangent = getTrackTangent(index);
    const side = board.side ?? 1;
    const offset = getRoadsideObjectOffset(board.offset ?? 3.6);
    const base = point.clone().addScaledVector(normal, side * offset);
    if (!isRoadsideObjectClear(base.x, base.y, 1.8, 0.3)) continue;

    const boardMaterial = new THREE.MeshBasicMaterial({
      map: makeTrackSignTexture(
        board.text ?? activeCourse.menuLabel ?? "GP",
        activeCourse.visualProfile === "monacoStreet" ? 0x0b2348 : 0x182318,
        activeCourse.visualProfile === "spaArdennes" ? 0xffdf6e : 0xf7f2df,
        activeCourse.visualProfile === "spaArdennes" ? 0xc83a2a : 0xd7ae42,
      ),
      side: THREE.DoubleSide,
    });
    const postMaterial = new THREE.MeshStandardMaterial({ color: 0x646a68, roughness: 0.48, metalness: 0.38 });
    const groundY = getTrackElevation(base.x, base.y);
    const yaw = Math.atan2((-normal.x * side), (-normal.y * side)) + (activeCourse.adBoardYawOffset ?? 0);

    const panel = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.38), boardMaterial);
    panel.position.set(base.x, groundY + 2.2, base.y);
    panel.rotation.y = yaw;
    panel.castShadow = true;
    scene.add(panel);

    for (const lateral of [-1.75, 1.75]) {
      const postBase = base.clone().addScaledVector(tangent, lateral);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 2.2, 8), postMaterial);
      post.position.set(postBase.x, getTrackElevation(postBase.x, postBase.y) + 1.1, postBase.y);
      post.castShadow = true;
      scene.add(post);
    }
  }
}

function createCourseGantries() {
  const gantries = activeCourse.gantries ?? [];
  if (!gantries.length) return;

  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x383e40, roughness: 0.46, metalness: 0.42 });
  const trussMaterial = new THREE.MeshStandardMaterial({ color: 0xd5d8d2, roughness: 0.42, metalness: 0.28 });

  for (const gantry of gantries) {
    const index = getTrackIndexFromFraction(gantry.fraction);
    const point = trackPoints[index];
    const normal = getTrackNormal(index);
    const tangent = getTrackTangent(index);
    const roadClearance = gantry.clearance ?? 5.8;
    const height = gantry.height ?? 7.4;
    const postOffset = ROAD_WIDTH / 2 + (gantry.postOffset ?? 2.8);
    const span = postOffset * 2;
    const acrossYaw = Math.atan2(-normal.y, normal.x);
    const boardYaw = Math.atan2(tangent.x, tangent.y) + Math.PI / 2 + (activeCourse.gantrySignYawOffset ?? 0);
    const group = new THREE.Group();
    const postGeometry = new THREE.BoxGeometry(0.38, height, 0.38);
    const beamGeometry = new THREE.BoxGeometry(span + 1.2, 0.42, 0.48);
    const signGeometry = new THREE.BoxGeometry(Math.min(span - 2, gantry.signWidth ?? 12), 1.25, 0.16);
    const signMaterial = new THREE.MeshBasicMaterial({
      map: makeTrackSignTexture(
        gantry.text ?? activeCourse.menuLabel ?? "GP",
        gantry.background ?? (activeCourse.visualProfile === "spaArdennes" ? 0xf3ca21 : 0x057643),
        gantry.foreground ?? 0x101214,
        gantry.accent ?? (activeCourse.visualProfile === "spaArdennes" ? 0xd72f25 : 0xf7f3de),
      ),
    });

    for (const side of [-1, 1]) {
      const base = point.clone().addScaledVector(normal, side * postOffset);
      const groundY = getTrackElevation(base.x, base.y);
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(base.x, groundY + height / 2, base.y);
      post.castShadow = true;
      post.receiveShadow = true;
      group.add(post);
    }

    const centerY = getTrackElevation(point.x, point.y);
    const beam = new THREE.Mesh(beamGeometry, trussMaterial);
    beam.position.set(point.x, centerY + roadClearance + 1.18, point.y);
    beam.rotation.y = acrossYaw;
    beam.castShadow = true;
    beam.receiveShadow = true;
    group.add(beam);

    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(point.x, centerY + roadClearance + 0.38, point.y);
    sign.rotation.y = boardYaw;
    sign.renderOrder = 14;
    group.add(sign);

    scene.add(group);
  }
}

function createTracksideCatchFences() {
  const zones = activeCourse.catchFenceZones ?? [];
  if (!zones.length) return;

  const fenceMaterial = new THREE.MeshStandardMaterial({
    color: activeCourse.visualProfile === "monacoStreet" ? 0xd4dad5 : 0xc4cbc6,
    roughness: 0.34,
    metalness: 0.52,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
  });
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x737b78, roughness: 0.48, metalness: 0.46 });
  const panelGeometry = new THREE.BoxGeometry(1, 1, 0.055);
  const postGeometry = new THREE.BoxGeometry(0.12, 1, 0.12);
  const panelMatrices = [];
  const postMatrices = [];

  for (const zone of zones) {
    const sides = zone.sides ?? [zone.side ?? 1];
    const indices = getTrackSectionIndices(zone.start, zone.end, zone.step ?? 5);
    const height = zone.height ?? 2.7;

    for (const side of sides) {
      const offset = zone.offset ?? getRoadsideObjectOffset(1.2);

      for (let i = 0; i < indices.length - 1; i += 1) {
        const startIndex = indices[i];
        const endIndex = indices[i + 1];
        const a = getOffsetTrackPoint(startIndex, side * offset);
        const b = getOffsetTrackPoint(endIndex, side * offset);
        const dx = b.x - a.x;
        const dz = b.y - a.y;
        const length = Math.hypot(dx, dz);
        if (length < 1.1 || isTrackCorridorBlockedBySegment(a, b, startIndex, ROAD_WIDTH / 2 + 0.45)) continue;

        const angle = Math.atan2(-dz, dx);
        const y = (getTrackElevation(a.x, a.y) + getTrackElevation(b.x, b.y)) / 2;
        panelMatrices.push(makeTransformMatrix((a.x + b.x) / 2, y + 1.0 + height / 2, (a.y + b.y) / 2, angle, length, height, 1));

        if (i % 2 === 0) {
          postMatrices.push(makeTransformMatrix(a.x, getTrackElevation(a.x, a.y) + 1.0 + height / 2, a.y, angle, 1, height + 0.55, 1));
        }
      }
    }
  }

  addInstancedMesh(panelGeometry, fenceMaterial, panelMatrices, true);
  addInstancedMesh(postGeometry, postMaterial, postMatrices, true);
}

function createMonacoWallPanels() {
  if (activeCourse.guardRails?.replaceLowWalls) return;

  const zones = activeCourse.wallPanelZones ?? [];
  if (!zones.length) return;

  for (const zone of zones) {
    const sides = zone.sides ?? [zone.side ?? 1];
    const indices = getTrackSectionIndices(zone.start, zone.end, zone.step ?? 9);
    const texts = zone.texts ?? [zone.text ?? "MONACO"];
    const material = new THREE.MeshBasicMaterial({
      map: makeTrackSignTexture(
        texts[0],
        zone.background ?? 0x07905c,
        zone.foreground ?? 0xf6f2df,
        zone.accent ?? 0xf6f2df,
      ),
      side: THREE.DoubleSide,
    });

    for (let indexPosition = 0; indexPosition < indices.length; indexPosition += 1) {
      const index = indices[indexPosition];
      const point = trackPoints[index];
      const normal = getTrackNormal(index);
      const tangent = getTrackTangent(index);

      for (const side of sides) {
        const base = point.clone().addScaledVector(
          normal,
          getRoadEdgeAwareOffset(
            side * (ROAD_WIDTH / 2 + (activeCourse.wallOffset ?? 0.55) + (activeCourse.wallThickness ?? 0.5) * 0.5 + 0.08),
            index,
          ),
        );
        const panel = new THREE.Mesh(new THREE.PlaneGeometry(zone.width ?? 5.4, zone.height ?? 0.86), material);
        panel.position.set(base.x, getTrackElevation(base.x, base.y) + (zone.y ?? 1.16), base.y);
        panel.rotation.y = Math.atan2(-normal.x * side, -normal.y * side);
        panel.renderOrder = 15;
        panel.castShadow = true;
        scene.add(panel);

        if (texts.length > 1 && indexPosition % texts.length !== 0) {
          const textIndex = indexPosition % texts.length;
          panel.material = new THREE.MeshBasicMaterial({
            map: makeTrackSignTexture(
              texts[textIndex],
              zone.background ?? 0x07905c,
              zone.foreground ?? 0xf6f2df,
              zone.accent ?? 0xf6f2df,
            ),
            side: THREE.DoubleSide,
          });
        }
      }
    }
  }
}

function createTracksideSurfaceRibbon(section, material, yOffset = TRACK_SURFACE_OFFSET + 0.04, crossSegments = 3) {
  const indices = getTrackSectionIndices(section.start, section.end, 1);
  if (indices.length < 2) return null;

  const vertices = [];
  const uvs = [];
  const triangleIndices = [];
  const columns = Math.max(2, crossSegments + 1);
  const side = section.side ?? 1;
  const centerOffset = section.offset ?? ROAD_WIDTH / 2 + (section.width ?? 10) / 2;
  const width = section.width ?? 10;
  let distance = 0;
  let previous = null;

  for (const index of indices) {
    const point = trackPoints[index];
    const normal = getTrackNormal(index);
    const center = point.clone().addScaledVector(normal, side * centerOffset);
    if (previous) distance += center.distanceTo(previous);
    previous = center;

    for (let column = 0; column < columns; column += 1) {
      const t = column / (columns - 1);
      const lateral = (t - 0.5) * width;
      const sample = center.clone().addScaledVector(normal, side * lateral);
      vertices.push(sample.x, getTrackElevation(sample.x, sample.y) + yOffset, sample.y);
      uvs.push(t, distance / 12);
    }
  }

  for (let i = 0; i < indices.length - 1; i += 1) {
    for (let column = 0; column < columns - 1; column += 1) {
      const a = i * columns + column;
      const b = i * columns + column + 1;
      const c = (i + 1) * columns + column;
      const d = (i + 1) * columns + column + 1;
      triangleIndices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(triangleIndices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

function getTrackIndexFromFraction(fraction) {
  return normalizeTrackIndex(Math.round(THREE.MathUtils.clamp(fraction, 0, 1) * (trackPoints.length - 1)));
}

function getTrackSectionIndices(start, end, step = 1) {
  const count = trackPoints.length;
  const startIndex = getTrackIndexFromFraction(start);
  const endIndex = getTrackIndexFromFraction(end);
  const indices = [];
  const stride = Math.max(1, Math.floor(step));

  if (startIndex <= endIndex) {
    for (let index = startIndex; index <= endIndex; index += stride) indices.push(index);
  } else {
    for (let index = startIndex; index < count; index += stride) indices.push(index);
    for (let index = 0; index <= endIndex; index += stride) indices.push(index);
  }

  if (indices[indices.length - 1] !== endIndex) indices.push(endIndex);
  return indices;
}

function interpolateProgress(start, end, t) {
  if (start <= end) return THREE.MathUtils.lerp(start, end, t);
  return (start + (1 - start + end) * t) % 1;
}

function createDrainageDitches() {
  if (activeCourse.disableDrainageDitches) return;

  const ditchMaterial = new THREE.MeshStandardMaterial({
    color: 0x34382f,
    roughness: 0.96,
    polygonOffset: true,
    polygonOffsetFactor: -1.2,
    polygonOffsetUnits: -1.2,
  });

  for (const side of [-1, 1]) {
    const ditch = createRibbonMesh(
      0.42,
      TRACK_SURFACE_OFFSET + 0.018,
      ditchMaterial,
      side * (ROAD_WIDTH / 2 + 1.12),
      1,
    );
    ditch.receiveShadow = true;
    ditch.renderOrder = 2;
    scene.add(ditch);
  }
}

function createRoadReflectors() {
  const reflectorOffset = getRoadsideObjectOffset(0.55);
  const reflectorClearance = getRoadsideObjectOffset(0.25);
  const reflectorGeometry = new THREE.BoxGeometry(0.08, 0.28, 0.1);
  const amberMaterial = new THREE.MeshStandardMaterial({
    color: 0xffc452,
    emissive: 0x3a2600,
    roughness: 0.36,
    metalness: 0.08,
  });
  const whiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2f4e6,
    emissive: 0x202018,
    roughness: 0.36,
    metalness: 0.08,
  });
  const amberMatrices = [];
  const whiteMatrices = [];

  for (let i = 16; i < trackPoints.length - 16; i += 14) {
    const point = trackPoints[i];
    const normal = getTrackNormal(i);
    const tangent = getTrackTangent(i);
    const yaw = Math.atan2(tangent.x, tangent.y);

    for (const side of [-1, 1]) {
      const base = point.clone().addScaledVector(normal, side * reflectorOffset);
      if (!isRoadsideObjectClear(base.x, base.y, 0.25, 0.25) || isNearTrack(base.x, base.y, reflectorClearance)) continue;

      const matrix = makeTransformMatrix(
        base.x,
        getTrackElevation(base.x, base.y) + 1.0,
        base.y,
        yaw,
        1,
        1,
        1,
        0,
        side * 0.04,
      );

      if ((i / 14 + (side > 0 ? 0 : 1)) % 2 < 1) amberMatrices.push(matrix);
      else whiteMatrices.push(matrix);
    }
  }

  addInstancedMesh(reflectorGeometry, amberMaterial, amberMatrices, true);
  addInstancedMesh(reflectorGeometry, whiteMaterial, whiteMatrices, true);
}

function createMountainTrees() {
  const vegetation = activeCourse.vegetation ?? {};
  const treeStep = vegetation.treeStep ?? 8;
  const density = vegetation.treeDensity ?? 0.86;
  const nearOffset = vegetation.nearOffset ?? 9;
  const farOffset = vegetation.farOffset ?? 30;
  const colors = vegetation.colors ?? [0x254f2f, 0x2f6739, 0x406f38];
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5b3e24, roughness: 0.82 });
  const trunkGeometry = new THREE.CylinderGeometry(1, 1, 1, 8);
  const leafGeometry = new THREE.ConeGeometry(1, 1, 9);
  const trunkMatrices = [];
  const leafMatricesByColor = colors.map(() => []);

  for (let i = 4; i < trackPoints.length - 4; i += treeStep) {
    const point = trackPoints[i];
    const normal = getTrackNormal(i);

    for (const side of [-1, 1]) {
      const seed = pseudoRandom(i * 13.17 + side * 57.31);
      if (seed > density) continue;

      const offset = ROAD_WIDTH / 2 + nearOffset + pseudoRandom(i * 9.2 + side * 3.4) * farOffset;
      const base = point.clone().addScaledVector(normal, side * offset);
      const height = 5.2 + pseudoRandom(i * 4.1 + side) * 3.6;
      const yaw = seed * Math.PI * 2;
      const trunkRadius = 0.16 + seed * 0.08;
      const leafRadius = 1.25 + seed * 0.7;
      const colorIndex = Math.floor(seed * colors.length) % colors.length;
      if (!isRoadsideObjectClear(base.x, base.y, leafRadius, 1.1)) continue;

      const baseY = getTrackElevation(base.x, base.y);

      trunkMatrices.push(makeTransformMatrix(
        base.x,
        baseY + height * 0.21,
        base.y,
        yaw,
        trunkRadius,
        height * 0.42,
        trunkRadius,
      ));
      leafMatricesByColor[colorIndex].push(makeTransformMatrix(
        base.x,
        baseY + height * 0.68,
        base.y,
        yaw,
        leafRadius,
        height * 0.72,
        leafRadius,
      ));
    }
  }

  addInstancedMesh(trunkGeometry, trunkMaterial, trunkMatrices, true);

  for (let colorIndex = 0; colorIndex < colors.length; colorIndex += 1) {
    addInstancedMesh(
      leafGeometry,
      new THREE.MeshStandardMaterial({ color: colors[colorIndex], roughness: 0.9 }),
      leafMatricesByColor[colorIndex],
      true,
    );
  }
}

function createMountainRocks() {
  const scenery = activeCourse.scenery ?? {};
  const rockStep = scenery.rockStep ?? 18;
  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x66705c, roughness: 0.94 });
  const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
  const rockMatrices = [];

  for (let i = 12; i < trackPoints.length - 12; i += rockStep) {
    const point = trackPoints[i];
    const normal = getTrackNormal(i);
    const side = pseudoRandom(i * 2.71) > 0.5 ? 1 : -1;
    const offset = ROAD_WIDTH / 2 + 6 + pseudoRandom(i * 8.33) * 13;
    const base = point.clone().addScaledVector(normal, side * offset);
    const scale = 0.8 + pseudoRandom(i * 1.9) * 1.7;
    if (!isRoadsideObjectClear(base.x, base.y, scale, 0.8)) continue;

    rockMatrices.push(makeTransformMatrix(
      base.x,
      getTrackElevation(base.x, base.y) + scale * 0.45,
      base.y,
      pseudoRandom(i * 3.7) * Math.PI,
      scale,
      scale * (0.55 + pseudoRandom(i * 6.6) * 0.35),
      scale,
      pseudoRandom(i) * 0.5,
      pseudoRandom(i * 5.4) * 0.4,
    ));
  }

  addInstancedMesh(rockGeometry, rockMaterial, rockMatrices, true);
}

function createRockFaces() {
  const scenery = activeCourse.scenery ?? {};
  const cliffSide = scenery.cliffSide ?? -1;
  const cliffEvery = scenery.cliffEvery ?? 30;
  const rockMaterial = new THREE.MeshStandardMaterial({ color: 0x74786c, roughness: 0.96 });
  const rockFaceGeometry = new THREE.BoxGeometry(1, 1, 1);
  const matrices = [];

  for (let i = 24; i < trackPoints.length - 24; i += cliffEvery) {
    const point = trackPoints[i];
    const normal = getTrackNormal(i);
    const tangent = getTrackTangent(i);
    const offset = ROAD_WIDTH / 2 + 13 + pseudoRandom(i * 4.7) * 8;
    const base = point.clone().addScaledVector(normal, cliffSide * offset);
    const length = 8 + pseudoRandom(i * 6.1) * 9;
    const height = 3.5 + pseudoRandom(i * 2.4) * 5.5;
    const depth = 2.8 + pseudoRandom(i * 1.7) * 2.2;
    const footprintRadius = Math.max(length, depth) * 0.5;

    if (!isRoadsideObjectClear(base.x, base.y, footprintRadius, 0.8)) continue;

    matrices.push(makeTransformMatrix(
      base.x,
      getTrackElevation(base.x, base.y) + height / 2 - 0.2,
      base.y,
      Math.atan2(tangent.x, tangent.y) + 0.15 * cliffSide,
      length,
      height,
      depth,
      0,
      cliffSide * 0.08,
    ));
  }

  addInstancedMesh(rockFaceGeometry, rockMaterial, matrices, true);
}

function createMountainBackdrop() {
  const tint = activeCourse.scenery?.backdropTint ?? 0x747f66;
  const material = new THREE.MeshStandardMaterial({
    color: tint,
    roughness: 0.98,
    fog: true,
  });
  const ridgeGeometry = new THREE.ConeGeometry(1, 1, 7);
  const matrices = [];
  const bounds = getTrackBounds();
  const center = new THREE.Vector2(
    (bounds.minX + bounds.maxX) * 0.5,
    (bounds.minZ + bounds.maxZ) * 0.5,
  );
  const courseRadius = trackPoints.reduce(
    (maxRadius, point) => Math.max(maxRadius, point.distanceTo(center)),
    0,
  );

  for (let i = 0; i < 18; i += 1) {
    const angle = (i / 18) * Math.PI * 2;
    const height = 24 + pseudoRandom(i * 7.8) * 42;
    const width = 52 + pseudoRandom(i * 2.1) * 54;
    const depth = width * 0.8;
    let radius = courseRadius + 185 + width * 0.5 + pseudoRandom(i * 4.4) * 135;
    let x = center.x + Math.cos(angle) * radius;
    let z = center.y + Math.sin(angle) * radius;

    for (let attempt = 0; attempt < 4 && !isBackdropMountainClear(x, z, Math.max(width, depth) * 0.5); attempt += 1) {
      radius += 90;
      x = center.x + Math.cos(angle) * radius;
      z = center.y + Math.sin(angle) * radius;
    }

    if (!isBackdropMountainClear(x, z, Math.max(width, depth) * 0.5)) continue;

    matrices.push(makeTransformMatrix(
      x,
      getTrackElevation(x, z) + height / 2 - 1.0,
      z,
      -angle,
      width,
      height,
      depth,
    ));
  }

  const mesh = addInstancedMesh(ridgeGeometry, material, matrices, false);
  if (mesh) mesh.receiveShadow = false;
}

function getTrackBounds() {
  const xs = trackPoints.map((point) => point.x);
  const zs = trackPoints.map((point) => point.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minZ: Math.min(...zs),
    maxZ: Math.max(...zs),
  };
}

function isBackdropMountainClear(x, z, radius) {
  return !isNearTrack(x, z, getRoadsideObjectOffset(radius + 28));
}

function createRoadsideSigns() {
  const indices = activeCourse.scenery?.signIndices ?? [48, 132, 220, 318, 424];
  const postMaterial = new THREE.MeshStandardMaterial({ color: 0x575e5d, roughness: 0.52, metalness: 0.36 });
  const signMaterial = new THREE.MeshStandardMaterial({ color: 0xf1d24b, roughness: 0.48, metalness: 0.04 });
  const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0x171817 });

  for (let signIndex = 0; signIndex < indices.length; signIndex += 1) {
    const index = normalizeTrackIndex(indices[signIndex]);
    const point = trackPoints[index];
    const normal = getTrackNormal(index);
    const tangent = getTrackTangent(index);
    const side = signIndex % 2 === 0 ? 1 : -1;
    const base = point.clone().addScaledVector(normal, side * getRoadsideObjectOffset(2.2));
    if (!isRoadsideObjectClear(base.x, base.y, 1.2, 0.8)) continue;

    const baseY = getTrackElevation(base.x, base.y);
    const yaw = Math.atan2(normal.x * side, normal.y * side) + (activeCourse.roadsideSignYawOffset ?? 0);

    const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.1, 0.12), postMaterial);
    post.position.set(base.x, baseY + 1.05, base.y);
    post.castShadow = true;
    scene.add(post);

    const sign = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.62, 0.08), signMaterial);
    sign.position.set(base.x, baseY + 2.18, base.y);
    sign.rotation.y = yaw;
    sign.castShadow = true;
    scene.add(sign);

    const arrow = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.12, 0.09), arrowMaterial);
    arrow.position.set(
      base.x + normal.x * side * 0.045,
      baseY + 2.18,
      base.y + normal.y * side * 0.045,
    );
    arrow.rotation.y = Math.atan2(tangent.x, tangent.y) + (activeCourse.roadsideSignYawOffset ?? 0);
    arrow.renderOrder = 10;
    scene.add(arrow);
  }
}

function makeTransformMatrix(x, y, z, yaw, scaleX, scaleY, scaleZ, pitch = 0, roll = 0) {
  const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll));
  const matrix = new THREE.Matrix4();
  matrix.compose(
    new THREE.Vector3(x, y, z),
    quaternion,
    new THREE.Vector3(scaleX, scaleY, scaleZ),
  );
  return matrix;
}

function createTestArea() {
  const segmentsX = 72;
  const segmentsZ = 38;
  const vertices = [];
  const uvs = [];
  const indices = [];
  const halfWidth = TEST_AREA.width / 2;
  const halfDepth = TEST_AREA.depth / 2;
  const padMaterial = new THREE.MeshStandardMaterial({
    color: 0xbfc2bd,
    roughness: 0.9,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const redMaterial = new THREE.MeshBasicMaterial({
    color: 0xd92c24,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const whiteMaterial = new THREE.MeshBasicMaterial({
    color: 0xf5f2ea,
    polygonOffset: true,
    polygonOffsetFactor: -5,
    polygonOffsetUnits: -5,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x202326,
    roughness: 0.8,
    polygonOffset: true,
    polygonOffsetFactor: -6,
    polygonOffsetUnits: -6,
  });
  const yellowMaterial = new THREE.MeshBasicMaterial({
    color: 0xe7c348,
    polygonOffset: true,
    polygonOffsetFactor: -7,
    polygonOffsetUnits: -7,
  });
  const hangarMaterial = new THREE.MeshStandardMaterial({
    color: 0x7e8c94,
    roughness: 0.82,
    metalness: 0.06,
  });
  const hangarDoorMaterial = new THREE.MeshStandardMaterial({
    color: 0x30383d,
    roughness: 0.78,
    metalness: 0.12,
  });

  for (let zIndex = 0; zIndex <= segmentsZ; zIndex += 1) {
    const z = TEST_AREA.z - halfDepth + (zIndex / segmentsZ) * TEST_AREA.depth;

    for (let xIndex = 0; xIndex <= segmentsX; xIndex += 1) {
      const x = TEST_AREA.x - halfWidth + (xIndex / segmentsX) * TEST_AREA.width;
      vertices.push(x, getTrackElevation(x, z) + TRACK_SURFACE_OFFSET + 0.04, z);
      uvs.push(xIndex / segmentsX, zIndex / segmentsZ);
    }
  }

  for (let zIndex = 0; zIndex < segmentsZ; zIndex += 1) {
    for (let xIndex = 0; xIndex < segmentsX; xIndex += 1) {
      const a = zIndex * (segmentsX + 1) + xIndex;
      const b = a + 1;
      const c = a + segmentsX + 1;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const pad = new THREE.Mesh(geometry, padMaterial);
  pad.receiveShadow = true;
  pad.renderOrder = 2;
  scene.add(pad);

  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(64, 14, 10), hangarMaterial);
    wall.position.set(TEST_AREA.x + side * (halfWidth + 24), getTrackElevation(TEST_AREA.x + side * (halfWidth + 24), TEST_AREA.z) + 7, TEST_AREA.z);
    wall.castShadow = true;
    wall.receiveShadow = true;
    scene.add(wall);

    for (let door = -1; door <= 1; door += 1) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 0.18), hangarDoorMaterial);
      panel.position.set(TEST_AREA.x + side * (halfWidth + 18.9), getTrackElevation(TEST_AREA.x + side * (halfWidth + 18.9), TEST_AREA.z + door * 18) + 3.8, TEST_AREA.z + door * 18);
      panel.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      panel.renderOrder = 4;
      scene.add(panel);
    }
  }

  for (let hangar = -1; hangar <= 1; hangar += 1) {
    const building = new THREE.Mesh(new THREE.BoxGeometry(42, 12, 12), hangarMaterial);
    building.position.set(TEST_AREA.x + hangar * 54, getTrackElevation(TEST_AREA.x + hangar * 54, TEST_AREA.z + halfDepth + 18) + 6, TEST_AREA.z + halfDepth + 18);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
  }

  for (let lane = -1; lane <= 1; lane += 1) {
    const laneX = TEST_AREA.x + lane * 52;
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.03, TEST_AREA.depth - 6), whiteMaterial);
    line.position.set(laneX + 25, getTrackElevation(laneX + 25, TEST_AREA.z) + TRACK_SURFACE_OFFSET + 0.12, TEST_AREA.z);
    line.renderOrder = 7;
    scene.add(line);
  }

  for (const side of [-1, 1]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(TEST_AREA.width, 0.028, 0.34), side > 0 ? redMaterial : whiteMaterial);
    stripe.position.set(TEST_AREA.x, getTrackElevation(TEST_AREA.x, TEST_AREA.z + side * halfDepth) + TRACK_SURFACE_OFFSET + 0.1, TEST_AREA.z + side * halfDepth);
    stripe.renderOrder = 6;
    scene.add(stripe);
  }

  for (const side of [-1, 1]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.028, TEST_AREA.depth), side > 0 ? whiteMaterial : redMaterial);
    stripe.position.set(TEST_AREA.x + side * halfWidth, getTrackElevation(TEST_AREA.x + side * halfWidth, TEST_AREA.z) + TRACK_SURFACE_OFFSET + 0.1, TEST_AREA.z);
    stripe.renderOrder = 6;
    scene.add(stripe);
  }

  for (let z = TEST_AREA.z - halfDepth + 12; z <= TEST_AREA.z + halfDepth - 14; z += 7.4) {
    for (let lane = -1; lane <= 1; lane += 1) {
      const x = TEST_AREA.x + lane * 52;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(34, 0.035, 0.58), darkMaterial);
      strip.position.set(x, getTrackElevation(x, z) + TRACK_SURFACE_OFFSET + 0.17, z);
      strip.receiveShadow = true;
      strip.castShadow = true;
      strip.renderOrder = 8;
      scene.add(strip);
    }
  }

  for (let z = TEST_AREA.z - halfDepth + 9; z <= TEST_AREA.z + halfDepth - 9; z += 13) {
    const guide = new THREE.Mesh(new THREE.BoxGeometry(TEST_AREA.width - 18, 0.026, 0.22), yellowMaterial);
    guide.position.set(TEST_AREA.x, getTrackElevation(TEST_AREA.x, z) + TRACK_SURFACE_OFFSET + 0.14, z);
    guide.renderOrder = 9;
    scene.add(guide);
  }

  for (let x = TEST_AREA.x - halfWidth + 14; x <= TEST_AREA.x + halfWidth - 14; x += 18) {
    const parkingMark = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.027, 9.5), whiteMaterial);
    parkingMark.position.set(x, getTrackElevation(x, TEST_AREA.z + halfDepth - 13) + TRACK_SURFACE_OFFSET + 0.14, TEST_AREA.z + halfDepth - 13);
    parkingMark.renderOrder = 9;
    scene.add(parkingMark);
  }

  createCurvedRampMarkers([
    { x: TEST_AREA.x - 58, z: TEST_AREA.z + 18, width: 14, length: 36 },
    { x: TEST_AREA.x + 2, z: TEST_AREA.z + 27, width: 16, length: 42 },
    { x: TEST_AREA.x + 58, z: TEST_AREA.z + 12, width: 12, length: 32 },
  ], redMaterial, whiteMaterial);
  createTestAreaLowWalls();
}

function createCurvedRampMarkers(ramps, redMaterial, whiteMaterial) {
  for (const ramp of ramps) {
    for (let stripeIndex = 0; stripeIndex < 5; stripeIndex += 1) {
      const z = ramp.z - ramp.length * 0.34 + stripeIndex * (ramp.length * 0.14);
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(ramp.width * 0.78, 0.035, 0.5),
        stripeIndex % 2 === 0 ? redMaterial : whiteMaterial,
      );
      stripe.position.set(ramp.x, getTrackElevation(ramp.x, z) + TRACK_SURFACE_OFFSET + 0.18, z);
      stripe.renderOrder = 10;
      scene.add(stripe);
    }

    for (const side of [-1, 1]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.034, ramp.length * 0.84), redMaterial);
      edge.position.set(
        ramp.x + side * ramp.width * 0.47,
        getTrackElevation(ramp.x + side * ramp.width * 0.47, ramp.z) + TRACK_SURFACE_OFFSET + 0.16,
        ramp.z,
      );
      edge.renderOrder = 10;
      scene.add(edge);
    }
  }
}

function createCityGridRoads() {
  const asphalt = makeAsphaltTexture();
  asphalt.repeat.set(1, 18);
  const roadMaterial = new THREE.MeshStandardMaterial({
    map: asphalt,
    color: 0x1b1d1f,
    roughness: 0.88,
    polygonOffset: true,
    polygonOffsetFactor: -0.6,
    polygonOffsetUnits: -0.6,
  });
  const lineMaterial = new THREE.MeshBasicMaterial({
    color: 0xdedbd0,
    transparent: true,
    opacity: 0.78,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  const roadCenters = [-120, -80, -40, 0, 40, 80, 120];

  for (const z of roadCenters) {
    const road = new THREE.Mesh(new THREE.BoxGeometry(TERRAIN_SIZE, 0.018, 8), roadMaterial);
    road.position.set(0, getTrackElevation(0, z) + TRACK_SURFACE_OFFSET - 0.012, z);
    road.receiveShadow = true;
    scene.add(road);

    for (let x = -150; x <= 150; x += 18) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.022, 0.12), lineMaterial);
      dash.position.set(x, road.position.y + 0.025, z);
      dash.renderOrder = 1;
      scene.add(dash);
    }
  }

  for (const x of roadCenters) {
    const road = new THREE.Mesh(new THREE.BoxGeometry(8, 0.018, TERRAIN_SIZE), roadMaterial);
    road.position.set(x, getTrackElevation(x, 0) + TRACK_SURFACE_OFFSET - 0.014, 0);
    road.receiveShadow = true;
    scene.add(road);

    for (let z = -150; z <= 150; z += 18) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.022, 5.8), lineMaterial);
      dash.position.set(x, road.position.y + 0.025, z);
      dash.renderOrder = 1;
      scene.add(dash);
    }
  }
}

function createCityBlocks() {
  const buildingGroup = new THREE.Group();
  const facadeMaterials = [
    new THREE.MeshStandardMaterial({ map: makeBuildingTexture(0x54606a, 0x9dc2d3), roughness: 0.78 }),
    new THREE.MeshStandardMaterial({ map: makeBuildingTexture(0x454a51, 0xf1d48c), roughness: 0.74 }),
    new THREE.MeshStandardMaterial({ map: makeBuildingTexture(0x6b6259, 0xa9cbd8), roughness: 0.82 }),
    new THREE.MeshStandardMaterial({ map: makeBuildingTexture(0x39404a, 0xc0d7ea), roughness: 0.7 }),
  ];
  const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x26292c, roughness: 0.88 });

  for (let x = -142; x <= 142; x += 24) {
    for (let z = -142; z <= 142; z += 24) {
      if (isNearTrack(x, z, ROAD_WIDTH + 18)) continue;
      if (isNearTestArea(x, z, 16)) continue;
      if (isNearBridgeAccess(x, z, 15)) continue;
      if (isInsideVisualTracksideSection(x, z, activeCourse.harborSections, 12)) continue;
      if (Math.abs(x) % 40 < 8 || Math.abs(z) % 40 < 8) continue;

      const seed = Math.abs(Math.sin(x * 12.9898 + z * 78.233));
      const width = 10 + Math.floor(seed * 5);
      const depth = 9 + Math.floor(((seed * 17) % 1) * 7);
      const height = 10 + Math.floor(((seed * 31) % 1) * 36);
      if (!isRectFootprintClearOfTrack(x, z, width, depth, 0, 4.2)) continue;
      const baseY = getTrackElevation(x, z);
      const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        facadeMaterials[Math.floor(seed * facadeMaterials.length) % facadeMaterials.length],
      );
      building.position.set(x, baseY + height / 2, z);
      building.castShadow = true;
      building.receiveShadow = true;
      buildingGroup.add(building);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.4, 0.34, depth + 0.4), roofMaterial);
      roof.position.set(x, baseY + height + 0.18, z);
      roof.castShadow = true;
      buildingGroup.add(roof);
    }
  }

  scene.add(buildingGroup);
}

function createStreetFurniture() {
  const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x2b3033, roughness: 0.46, metalness: 0.45 });
  const lampMaterial = new THREE.MeshBasicMaterial({ color: 0xfff3b0 });
  const bollardMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d9d2, roughness: 0.58 });
  const signMaterial = new THREE.MeshStandardMaterial({ color: 0x253a56, roughness: 0.5, metalness: 0.1 });

  for (let i = 0; i < trackPoints.length; i += 14) {
    const point = trackPoints[i];
    const normal = getTrackNormal(i);
    const side = i % 28 === 0 ? 1 : -1;
    const base = point.clone().addScaledVector(normal, side * getRoadsideObjectOffset(3.1));
    if (!isRoadsideObjectClear(base.x, base.y, 1.0, 0.8)) continue;

    const baseY = getTrackElevation(base.x, base.y);

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 4.6, 8), poleMaterial);
    pole.position.set(base.x, baseY + 2.3, base.y);
    pole.castShadow = true;
    scene.add(pole);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.08, 0.08), poleMaterial);
    arm.position.set(base.x - normal.x * side * 0.45, baseY + 4.45, base.y - normal.y * side * 0.45);
    arm.rotation.y = Math.atan2(normal.x, normal.y);
    arm.castShadow = true;
    scene.add(arm);

    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), lampMaterial);
    lamp.position.set(base.x - normal.x * side * 0.95, baseY + 4.32, base.y - normal.y * side * 0.95);
    scene.add(lamp);
  }

  for (let i = 0; i < trackPoints.length; i += 9) {
    const point = trackPoints[i];
    const normal = getTrackNormal(i);
    for (const side of [-1, 1]) {
      const base = point.clone().addScaledVector(normal, side * getRoadsideObjectOffset(1.7));
      if (!isRoadsideObjectClear(base.x, base.y, 0.35, 0.5)) continue;

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 8), bollardMaterial);
      post.position.set(base.x, getTrackElevation(base.x, base.y) + 0.31, base.y);
      post.castShadow = true;
      scene.add(post);
    }
  }

  const signPositions = [24, 96, 166, 230];
  for (const index of signPositions) {
    const wrappedIndex = normalizeTrackIndex(index);
    const point = trackPoints[wrappedIndex];
    const normal = getTrackNormal(wrappedIndex);
    const base = point.clone().addScaledVector(normal, getRoadsideObjectOffset(3.0));
    if (!isRoadsideObjectClear(base.x, base.y, 1.3, 0.8)) continue;

    const baseY = getTrackElevation(base.x, base.y);
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.9, 0.08), signMaterial);
    sign.position.set(base.x, baseY + 2.6, base.y);
    sign.rotation.y = Math.atan2(normal.x, normal.y);
    sign.castShadow = true;
    scene.add(sign);
  }
}

function createClouds() {
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.75,
    transparent: true,
    opacity: 0.82,
  });

  for (let i = 0; i < 12; i += 1) {
    const cloud = new THREE.Group();
    const angle = (i / 12) * Math.PI * 2;
    const radius = 80 + ((i * 23) % 70);

    for (let j = 0; j < 5; j += 1) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(4.5 + j * 0.7, 12, 8), cloudMaterial);
      puff.position.set((j - 2) * 4.8, Math.sin(j) * 0.7, Math.cos(j * 1.6) * 1.8);
      puff.scale.y = 0.55;
      cloud.add(puff);
    }

    cloud.position.set(Math.cos(angle) * radius, 46 + ((i * 7) % 14), Math.sin(angle) * radius);
    cloud.rotation.y = -angle;
    scene.add(cloud);
  }
}

function getCarTuning() {
  return CAR_MODELS[selectedCarId]?.tuning ?? CAR_MODELS.gt3.tuning;
}

function getMaxForwardSpeed() {
  return vehiclePhysicsConfig.maxForwardSpeed ?? MAX_FORWARD_SPEED;
}

function getActivePhysicsConfig() {
  return vehiclePhysicsConfig;
}

function modelIdUsesNarrowTire(modelId) {
  return modelId === "ae86" || modelId === "rx7fc";
}

function getVisualTireRadius(physics, wheelIndex) {
  if (wheelIndex < 2) return physics.visualFrontTireRadius ?? physics.tireRadius ?? 0.42;
  return physics.visualRearTireRadius ?? physics.tireRadius ?? 0.42;
}

function getVisualTireWidth(physics, wheelIndex, modelId) {
  if (wheelIndex < 2) {
    return physics.visualFrontTireWidth ?? (modelIdUsesNarrowTire(modelId) ? 0.3 : 0.34);
  }
  return physics.visualRearTireWidth ?? physics.visualFrontTireWidth ?? (modelIdUsesNarrowTire(modelId) ? 0.3 : 0.34);
}

function isDriftBoostCar(carId = selectedCarId) {
  return DRIFT_BOOST_CAR_IDS.has(carId);
}

function createWheelVisual(physics, wheelIndex, modelId = selectedCarId) {
  const wheel = new THREE.Group();
  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x0c0d0f,
    roughness: modelId === "formulaRb22" ? 0.5 : 0.66,
    metalness: 0.08,
  });
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: CAR_MODELS[modelId]?.rimColor ?? 0xc52d22,
    roughness: modelId === "formulaRb22" ? 0.24 : 0.32,
    metalness: 0.58,
  });
  const brakeMaterial = new THREE.MeshStandardMaterial({
    color: CAR_MODELS[modelId]?.brakeColor ?? 0xf5bf29,
    roughness: 0.34,
    metalness: 0.24,
  });
  const hubMaterial = new THREE.MeshStandardMaterial({
    color: 0x1b1e22,
    roughness: 0.3,
    metalness: 0.64,
  });
  const tireRadius = getVisualTireRadius(physics, wheelIndex);
  const tireWidth = getVisualTireWidth(physics, wheelIndex, modelId);
  const tireGeometry = new THREE.CylinderGeometry(tireRadius, tireRadius, tireWidth, 28);
  tireGeometry.rotateZ(Math.PI / 2);
  const rimGeometry = new THREE.CylinderGeometry(tireRadius * 0.72, tireRadius * 0.72, tireWidth + 0.02, 28);
  rimGeometry.rotateZ(Math.PI / 2);
  const brakeGeometry = new THREE.CylinderGeometry(tireRadius * 0.52, tireRadius * 0.52, 0.05, 24);
  brakeGeometry.rotateZ(Math.PI / 2);
  const hubGeometry = new THREE.CylinderGeometry(tireRadius * 0.28, tireRadius * 0.28, tireWidth + 0.05, 16);
  hubGeometry.rotateZ(Math.PI / 2);

  const tire = new THREE.Mesh(tireGeometry, wheelMaterial);
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  const brake = new THREE.Mesh(brakeGeometry, brakeMaterial);
  const hub = new THREE.Mesh(hubGeometry, hubMaterial);
  const visibleFaceOffset = wheelIndex % 2 === 0 ? -tireWidth * 0.56 : tireWidth * 0.56;

  tire.name = "wheelTire";
  rim.name = "wheelRim";
  brake.name = "wheelBrake";
  hub.name = "wheelHub";
  rim.position.x = visibleFaceOffset * 0.42;
  brake.position.x = visibleFaceOffset * 0.72;
  hub.position.x = visibleFaceOffset * 0.46;
  tire.castShadow = true;
  rim.castShadow = true;
  brake.castShadow = true;
  hub.castShadow = true;

  for (let spokeIndex = 0; spokeIndex < 10; spokeIndex += 1) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, tireRadius), rimMaterial);
    spoke.name = "wheelSpoke";
    spoke.position.x = visibleFaceOffset;
    spoke.rotation.x = (spokeIndex / 10) * Math.PI * 2;
    spoke.castShadow = true;
    wheel.add(spoke);
  }

  const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.24, 0.1), brakeMaterial);
  caliper.name = "wheelCaliper";
  caliper.position.set(visibleFaceOffset * 1.06, 0.18, -0.08);
  caliper.castShadow = true;
  wheel.add(tire, brake, rim, hub, caliper);
  scene.add(wheel);
  return wheel;
}

function createVehicle() {
  const physics = getActivePhysicsConfig();
  const chassisHalfExtents = physics.chassisHalfExtents ?? { x: 1.16, y: 0.42, z: 2.22 };
  const chassisShape = new CANNON.Box(
    new CANNON.Vec3(chassisHalfExtents.x, chassisHalfExtents.y, chassisHalfExtents.z),
  );
  const chassisBody = new CANNON.Body({
    mass: physics.mass,
    material: carMaterial,
    angularDamping: physics.inertia.angularDamping,
    linearDamping: physics.inertia.linearDamping,
  });
  chassisBody.addShape(chassisShape);
  chassisBody.position.copy(START_POSITION);
  chassisBody.quaternion.setFromEuler(0, START_YAW, 0);
  chassisBody.collisionFilterGroup = 2;
  chassisBody.collisionFilterMask = 1;
  chassisBody.addEventListener("collide", handleChassisCollision);
  world.addBody(chassisBody);

  const vehicle = new VehiclePhysics({
    world,
    chassisBody,
    config: physics,
    gravity: Math.abs(world.gravity.y),
    getSurfaceGrip: getSurfaceGripAt,
    sampleGround: sampleGroundForVehicle,
    raycastFilterMask: 1,
  });

  const carGroup = createCarMesh(selectedCarId);
  scene.add(carGroup);

  for (let i = 0; i < vehicle.wheelInfos.length; i += 1) {
    wheelMeshes.push(createWheelVisual(physics, i, selectedCarId));
  }

  return { vehicle, chassisBody, carGroup };
}

function createCarMesh(modelId = selectedCarId) {
  if (modelId === "formulaRb22") {
    return createFormulaRb22Mesh();
  }

  if (modelId === "amg") {
    return createAmgCarMesh();
  }

  if (modelId === "ae86" || modelId === "rx7fd" || modelId === "rx7fc") {
    return createJdmCarMesh(modelId);
  }

  const group = new THREE.Group();
  const visualRoot = new THREE.Group();
  visualRoot.name = "carVisualRoot";
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xe7eef1,
    roughness: 0.29,
    metalness: 0.34,
  });
  const bodyShadowMaterial = new THREE.MeshStandardMaterial({
    color: 0xb9c7cd,
    roughness: 0.42,
    metalness: 0.22,
  });
  const redAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0xc83228,
    roughness: 0.34,
    metalness: 0.32,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x111315,
    roughness: 0.54,
    metalness: 0.22,
  });
  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x050607,
    roughness: 0.38,
    metalness: 0.34,
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x17222b,
    roughness: 0.05,
    metalness: 0.08,
    transmission: 0.18,
    transparent: true,
    opacity: 0.58,
  });
  const headlightMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xeaf7ff,
    roughness: 0.03,
    metalness: 0.08,
    transmission: 0.4,
    transparent: true,
    opacity: 0.84,
    side: THREE.DoubleSide,
  });
  const lightTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0x22272a,
    roughness: 0.18,
    metalness: 0.6,
  });
  const rearLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xb90f14,
    transparent: true,
    opacity: 0.88,
  });
  const damperMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2c84b,
    roughness: 0.32,
    metalness: 0.45,
  });
  const damperRodMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfd9df,
    roughness: 0.22,
    metalness: 0.72,
  });
  const tunedMassMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4d35e,
    roughness: 0.28,
    metalness: 0.58,
  });

  function box(width, height, depth, material, x, y, z, rx = 0, ry = 0, rz = 0, name = "") {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = material !== glassMaterial;
    if (name) mesh.name = name;
    visualRoot.add(mesh);
    return mesh;
  }

  function cylinder(radius, height, material, x, y, z, rx = 0, ry = 0, rz = 0, name = "") {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 16), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    if (name) mesh.name = name;
    visualRoot.add(mesh);
    return mesh;
  }

  function plane(width, height, material, x, y, z, rx = 0, ry = 0, rz = 0, name = "") {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = false;
    mesh.renderOrder = 8;
    if (name) mesh.name = name;
    visualRoot.add(mesh);
    return mesh;
  }

  const sideDecalMaterial = new THREE.MeshBasicMaterial({
    map: makeCarDecalTexture("GT3 RS"),
    transparent: true,
    side: THREE.DoubleSide,
  });
  const licenseMaterial = new THREE.MeshBasicMaterial({
    map: makeLicensePlateTexture("S GT 525"),
    side: THREE.DoubleSide,
  });

  box(2.18, 0.34, 3.9, bodyMaterial, 0, 0.02, -0.05);
  box(1.82, 0.2, 1.62, bodyMaterial, 0, 0.36, 0.98, -0.08);
  box(1.98, 0.28, 1.18, bodyShadowMaterial, 0, 0.38, -1.36, 0.05);
  box(1.54, 0.58, 1.16, glassMaterial, 0, 0.73, -0.34, -0.08);
  box(1.42, 0.08, 1.42, bodyMaterial, 0, 0.91, -0.38, -0.03);
  box(1.92, 0.08, 0.08, carbonMaterial, 0, 0.68, 0.36, -0.04);
  box(1.72, 0.06, 0.1, carbonMaterial, 0, 0.93, -0.99, -0.08);

  box(2.34, 0.16, 0.28, carbonMaterial, 0, -0.23, 2.13);
  box(1.54, 0.36, 0.12, carbonMaterial, 0, 0.06, 2.15);
  box(0.54, 0.12, 0.09, carbonMaterial, -0.83, 0.16, 2.17);
  box(0.54, 0.12, 0.09, carbonMaterial, 0.83, 0.16, 2.17);
  box(0.72, 0.07, 0.16, carbonMaterial, -1.08, -0.08, 1.76, 0, 0.22);
  box(0.72, 0.07, 0.16, carbonMaterial, 1.08, -0.08, 1.76, 0, -0.22);

  for (const side of [-1, 1]) {
    box(0.22, 0.44, 0.86, bodyMaterial, side * 1.08, 0.11, 1.36);
    box(0.22, 0.48, 0.92, bodyMaterial, side * 1.08, 0.1, -1.33);
    box(0.17, 0.62, 0.72, carbonMaterial, side * 1.16, -0.02, 1.3);
    box(0.17, 0.66, 0.78, carbonMaterial, side * 1.16, -0.03, -1.31);
    box(0.12, 0.28, 0.62, carbonMaterial, side * 1.12, 0.22, -0.42);
    box(0.08, 0.18, 0.34, bodyMaterial, side * 1.28, 0.48, 0.62, 0, 0, side * 0.12);
    box(0.1, 0.08, 0.36, trimMaterial, side * 1.34, 0.39, 0.56, 0, side * 0.22);
    box(0.1, 0.1, 1.82, carbonMaterial, side * 1.08, -0.25, -0.22);
    box(0.08, 0.06, 1.72, redAccentMaterial, side * 1.205, -0.07, -0.28);
    plane(1.34, 0.3, sideDecalMaterial, side * 1.215, 0.03, -0.32, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2);
  }

  for (const side of [-1, 1]) {
    box(0.23, 0.11, 0.52, carbonMaterial, side * 0.43, 0.51, 1.12, 0.08, side * 0.08);
    box(0.05, 0.12, 1.18, carbonMaterial, side * 0.63, 0.76, -0.36, 0, side * 0.08);
    box(0.05, 0.11, 1.05, carbonMaterial, side * 0.48, 0.99, -0.45, 0, side * 0.05);
  }

  for (const side of [-1, 1]) {
    const headlightRing = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.018, 10, 30), lightTrimMaterial);
    headlightRing.position.set(side * 0.68, 0.33, 2.12);
    headlightRing.castShadow = true;
    visualRoot.add(headlightRing);

    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.145, 24), headlightMaterial);
    lens.position.set(side * 0.68, 0.33, 2.135);
    lens.renderOrder = 9;
    visualRoot.add(lens);

    for (let bulbIndex = 0; bulbIndex < 3; bulbIndex += 1) {
      const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.026, 12), lightTrimMaterial);
      bulb.position.set(side * 0.68 + (bulbIndex - 1) * 0.055, 0.34 + Math.sin(bulbIndex) * 0.035, 2.145);
      bulb.renderOrder = 10;
      visualRoot.add(bulb);
    }
  }

  box(0.16, 0.02, 0.12, redAccentMaterial, 0, 0.38, 2.18);
  box(1.78, 0.08, 0.08, rearLightMaterial, 0, 0.28, -2.04);
  box(2.14, 0.3, 0.24, carbonMaterial, 0, -0.16, -2.08);
  for (let fin = -2; fin <= 2; fin += 1) {
    box(0.06, 0.22, 0.52, carbonMaterial, fin * 0.24, -0.31, -2.12);
  }
  cylinder(0.055, 0.36, lightTrimMaterial, -0.18, -0.21, -2.28, Math.PI / 2);
  cylinder(0.055, 0.36, lightTrimMaterial, 0.18, -0.21, -2.28, Math.PI / 2);
  plane(0.72, 0.22, licenseMaterial, 0, 0.02, -2.235, 0, Math.PI);

  box(2.78, 0.08, 0.32, carbonMaterial, 0, 1.16, -2.25, -0.05);
  box(2.3, 0.04, 0.24, bodyMaterial, 0, 1.2, -2.23, -0.05);
  box(0.1, 0.46, 0.58, carbonMaterial, -1.45, 1.12, -2.24, 0.02);
  box(0.1, 0.46, 0.58, carbonMaterial, 1.45, 1.12, -2.24, 0.02);
  box(0.08, 0.72, 0.08, carbonMaterial, -0.58, 0.78, -1.98, 0.18);
  box(0.08, 0.72, 0.08, carbonMaterial, 0.58, 0.78, -1.98, 0.18);
  for (let slat = -3; slat <= 3; slat += 1) {
    box(0.08, 0.19, 0.52, carbonMaterial, slat * 0.19, 0.54, -1.64, 0.1);
  }

  box(0.52, 0.68, 0.12, trimMaterial, -0.34, 0.66, -0.42, 0.62, 0.12, 0.16);
  box(0.52, 0.68, 0.12, trimMaterial, 0.34, 0.66, -0.42, 0.62, -0.12, -0.16);
  box(0.06, 0.5, 1.12, trimMaterial, -0.54, 0.62, -0.48, 0.32, 0.08);
  box(0.06, 0.5, 1.12, trimMaterial, 0.54, 0.62, -0.48, 0.32, -0.08);

  const damperPositions = [
    [-0.82, -0.12, 1.35],
    [0.82, -0.12, 1.35],
    [-0.82, -0.12, -1.35],
    [0.82, -0.12, -1.35],
  ];

  for (let index = 0; index < damperPositions.length; index += 1) {
    const [x, y, z] = damperPositions[index];
    const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.58, 10), damperMaterial);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.78, 10), damperRodMaterial);
    spring.name = `damperSpring${index}`;
    rod.name = `damperRod${index}`;
    spring.position.set(x, y + 0.06, z);
    rod.position.set(x, y + 0.06, z);
    spring.userData.baseY = y + 0.06;
    rod.userData.baseY = y + 0.06;
    spring.rotation.z = x < 0 ? -0.18 : 0.18;
    rod.rotation.z = spring.rotation.z;
    spring.castShadow = true;
    rod.castShadow = true;
    visualRoot.add(spring, rod);
  }

  const tunedMassBlock = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.46), tunedMassMaterial);
  tunedMassBlock.name = "tunedMassBlock";
  tunedMassBlock.position.set(0, 0.52, -0.08);
  tunedMassBlock.castShadow = true;

  const tunedMassRailA = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.88, 8), damperRodMaterial);
  tunedMassRailA.position.set(-0.25, 0.52, -0.08);
  tunedMassRailA.rotation.x = Math.PI / 2;
  const tunedMassRailB = tunedMassRailA.clone();
  tunedMassRailB.position.x = 0.25;

  visualRoot.add(tunedMassBlock, tunedMassRailA, tunedMassRailB);
  group.add(visualRoot);
  return group;
}

function createFormulaRb22Mesh() {
  const group = new THREE.Group();
  const visualRoot = new THREE.Group();
  visualRoot.name = "carVisualRoot";

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x071f4a,
    roughness: 0.12,
    metalness: 0.52,
    clearcoat: 0.8,
    clearcoatRoughness: 0.16,
  });
  const blueHighlightMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x104aa5,
    roughness: 0.1,
    metalness: 0.46,
    clearcoat: 0.78,
    clearcoatRoughness: 0.14,
  });
  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x05070b,
    roughness: 0.42,
    metalness: 0.38,
  });
  const matteBlackMaterial = new THREE.MeshStandardMaterial({
    color: 0x090b10,
    roughness: 0.64,
    metalness: 0.18,
  });
  const redAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0xd52b32,
    roughness: 0.22,
    metalness: 0.26,
  });
  const yellowAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4c43a,
    roughness: 0.2,
    metalness: 0.26,
  });
  const cockpitMaterial = new THREE.MeshStandardMaterial({
    color: 0x06080c,
    roughness: 0.78,
    metalness: 0.08,
  });
  const seatMaterial = new THREE.MeshStandardMaterial({
    color: 0x171b22,
    roughness: 0.68,
    metalness: 0.08,
  });
  const decalMaterial = new THREE.MeshBasicMaterial({
    map: makeFormulaSideDecalTexture(),
    transparent: true,
    side: THREE.DoubleSide,
  });
  const noseDecalMaterial = new THREE.MeshBasicMaterial({
    map: makeFormulaNoseDecalTexture(),
    transparent: true,
    side: THREE.DoubleSide,
  });
  const wingDecalMaterial = new THREE.MeshBasicMaterial({
    map: makeFormulaWingDecalTexture(),
    transparent: true,
    side: THREE.DoubleSide,
  });

  function box(width, height, depth, material, x, y, z, rx = 0, ry = 0, rz = 0, name = "") {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (name) mesh.name = name;
    visualRoot.add(mesh);
    return mesh;
  }

  function plane(width, height, material, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.renderOrder = 10;
    visualRoot.add(mesh);
    return mesh;
  }

  function cylinder(radius, height, material, x, y, z, rx = 0, ry = 0, rz = 0, name = "") {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 18), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    if (name) mesh.name = name;
    visualRoot.add(mesh);
    return mesh;
  }

  function ellipsoid(width, height, depth, material, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 14), material);
    mesh.scale.set(width / 2, height / 2, depth / 2);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    visualRoot.add(mesh);
    return mesh;
  }

  function wedge(width, height, depth, frontScale, material, x, y, z, rx = 0, ry = 0, rz = 0) {
    const rearHalf = width / 2;
    const frontHalf = (width * frontScale) / 2;
    const yBottom = -height / 2;
    const yTop = height / 2;
    const zRear = -depth / 2;
    const zFront = depth / 2;
    const vertices = new Float32Array([
      -rearHalf, yBottom, zRear,
      rearHalf, yBottom, zRear,
      rearHalf, yTop, zRear,
      -rearHalf, yTop, zRear,
      -frontHalf, yBottom * 0.72, zFront,
      frontHalf, yBottom * 0.72, zFront,
      frontHalf, yTop * 0.52, zFront,
      -frontHalf, yTop * 0.52, zFront,
    ]);
    const indices = [
      0, 1, 2, 0, 2, 3,
      4, 6, 5, 4, 7, 6,
      0, 4, 5, 0, 5, 1,
      3, 2, 6, 3, 6, 7,
      1, 5, 6, 1, 6, 2,
      0, 3, 7, 0, 7, 4,
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    visualRoot.add(mesh);
    return mesh;
  }

  function strut(ax, ay, az, bx, by, bz, radius = 0.025, material = carbonMaterial) {
    const start = new THREE.Vector3(ax, ay, az);
    const end = new THREE.Vector3(bx, by, bz);
    const direction = end.clone().sub(start);
    const length = direction.length();
    if (length <= 0.001) return null;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 8), material);
    mesh.position.copy(start).lerp(end, 0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    mesh.castShadow = true;
    visualRoot.add(mesh);
    return mesh;
  }

  box(1.18, 0.11, 4.65, carbonMaterial, 0, -0.25, -0.12);
  box(1.42, 0.07, 2.7, matteBlackMaterial, 0, -0.18, -0.58);
  wedge(0.46, 0.22, 2.3, 0.22, bodyMaterial, 0, 0.06, 1.28, -0.025);
  wedge(0.28, 0.12, 1.12, 0.16, blueHighlightMaterial, 0, 0.17, 1.74, -0.03);
  ellipsoid(1.12, 0.48, 1.76, bodyMaterial, 0, 0.16, -0.18, -0.04);
  ellipsoid(0.74, 0.3, 0.92, cockpitMaterial, 0, 0.32, -0.38, -0.06);
  box(0.5, 0.15, 0.48, seatMaterial, 0, 0.22, -0.58, -0.18);
  cylinder(0.13, 0.04, matteBlackMaterial, 0, 0.42, -0.02, Math.PI / 2, 0, 0.2);

  box(0.18, 0.08, 0.72, carbonMaterial, 0, 0.55, -0.24, -0.18);
  cylinder(0.04, 0.84, carbonMaterial, -0.28, 0.48, -0.25, 0.28, 0, -0.58);
  cylinder(0.04, 0.84, carbonMaterial, 0.28, 0.48, -0.25, 0.28, 0, 0.58);
  strut(-0.28, 0.48, -0.25, 0, 0.62, -0.72, 0.032);
  strut(0.28, 0.48, -0.25, 0, 0.62, -0.72, 0.032);

  box(0.42, 0.36, 0.62, bodyMaterial, 0, 0.38, -1.2, -0.18);
  box(0.12, 0.74, 1.22, bodyMaterial, 0, 0.69, -1.62, -0.18);
  box(0.08, 0.68, 0.88, yellowAccentMaterial, 0, 0.74, -1.5, -0.18);
  box(0.78, 0.18, 0.48, matteBlackMaterial, 0, 0.17, -1.55, -0.08);

  for (const side of [-1, 1]) {
    wedge(0.64, 0.34, 1.6, 0.55, blueHighlightMaterial, side * 0.66, -0.01, -0.42, 0, side * 0.04);
    wedge(0.44, 0.3, 1.08, 0.42, bodyMaterial, side * 0.86, 0.06, -0.64, 0, side * 0.1);
    box(0.48, 0.12, 1.34, carbonMaterial, side * 0.86, -0.2, -0.42);
    box(0.58, 0.07, 0.18, redAccentMaterial, side * 0.64, 0.24, -0.18, 0, side * 0.12);
    box(0.42, 0.06, 0.16, yellowAccentMaterial, side * 0.72, 0.18, -0.46, 0, side * 0.12);
    plane(0.78, 0.22, decalMaterial, side * 1.02, 0.09, -0.45, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2);
    plane(0.46, 0.18, noseDecalMaterial, side * 0.23, 0.19, 1.08, -0.18, 0, side * 0.07);
    box(0.2, 0.32, 0.48, matteBlackMaterial, side * 1.2, -0.04, 1.38, 0, side * 0.16);
    box(0.22, 0.38, 0.58, matteBlackMaterial, side * 1.23, -0.02, -1.43, 0, side * -0.08);
    strut(side * 0.24, -0.08, 1.22, side * 1.0, -0.08, 1.64, 0.022);
    strut(side * 0.2, 0.09, 1.0, side * 1.0, 0.02, 1.48, 0.018);
    strut(side * 0.34, -0.08, -1.16, side * 1.02, -0.08, -1.58, 0.024);
    strut(side * 0.28, 0.08, -1.02, side * 1.02, 0.03, -1.4, 0.018);
    cylinder(0.16, 0.08, carbonMaterial, side * 1.1, -0.02, 1.48, Math.PI / 2);
    cylinder(0.18, 0.08, carbonMaterial, side * 1.12, -0.02, -1.5, Math.PI / 2);
  }

  box(3.22, 0.07, 0.34, carbonMaterial, 0, -0.28, 2.42, -0.04);
  box(2.82, 0.045, 0.24, blueHighlightMaterial, 0, -0.2, 2.36, -0.08);
  box(2.52, 0.04, 0.18, redAccentMaterial, 0, -0.12, 2.26, -0.12);
  for (const side of [-1, 1]) {
    box(0.12, 0.34, 0.48, carbonMaterial, side * 1.66, -0.18, 2.38, 0, side * 0.12);
    box(0.06, 0.22, 0.62, yellowAccentMaterial, side * 1.35, -0.19, 2.34, 0, side * 0.08);
  }

  box(2.42, 0.09, 0.32, carbonMaterial, 0, 1.08, -2.32, -0.04);
  box(2.18, 0.06, 0.2, blueHighlightMaterial, 0, 0.91, -2.24, -0.08);
  box(2.18, 0.035, 0.16, redAccentMaterial, 0, 0.72, -2.15, -0.1);
  plane(1.32, 0.24, wingDecalMaterial, 0, 1.14, -2.49, 0, Math.PI);
  for (const side of [-1, 1]) {
    box(0.12, 0.76, 0.58, carbonMaterial, side * 1.28, 0.88, -2.32, 0.02);
    box(0.06, 0.62, 0.46, yellowAccentMaterial, side * 1.18, 0.9, -2.29, 0.02);
    strut(side * 0.32, 0.02, -1.52, side * 0.64, 0.78, -2.08, 0.025);
  }

  box(0.48, 0.16, 0.24, matteBlackMaterial, 0, 0.15, -2.06);
  cylinder(0.055, 0.34, matteBlackMaterial, -0.18, 0.08, -2.18, Math.PI / 2);
  cylinder(0.055, 0.34, matteBlackMaterial, 0.18, 0.08, -2.18, Math.PI / 2);

  const damperMaterial = new THREE.MeshStandardMaterial({
    color: 0xd8dce2,
    roughness: 0.28,
    metalness: 0.68,
  });
  const damperPoints = [
    [-0.9, -0.16, 1.48],
    [0.9, -0.16, 1.48],
    [-0.92, -0.16, -1.5],
    [0.92, -0.16, -1.5],
  ];
  for (let index = 0; index < damperPoints.length; index += 1) {
    const [x, y, z] = damperPoints[index];
    const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.52, 10), damperMaterial);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.74, 8), carbonMaterial);
    spring.name = `damperSpring${index}`;
    rod.name = `damperRod${index}`;
    spring.position.set(x, y, z);
    rod.position.set(x, y, z);
    spring.userData.baseY = y;
    rod.userData.baseY = y;
    spring.rotation.z = x < 0 ? -0.42 : 0.42;
    rod.rotation.z = spring.rotation.z;
    spring.castShadow = true;
    rod.castShadow = true;
    visualRoot.add(spring, rod);
  }

  const tunedMassBlock = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.12, 0.34), yellowAccentMaterial);
  tunedMassBlock.name = "tunedMassBlock";
  tunedMassBlock.position.set(0, 0.44, -0.1);
  tunedMassBlock.castShadow = true;
  visualRoot.add(tunedMassBlock);

  group.add(visualRoot);
  return group;
}

function createJdmCarMesh(modelId) {
  const group = new THREE.Group();
  const visualRoot = new THREE.Group();
  visualRoot.name = "carVisualRoot";

  const designs = {
    ae86: {
      body: 0xf0f1ec,
      lower: 0x111416,
      accent: 0x2c68d8,
      glass: 0x4d6664,
      plate: "AE86 H2",
      decal: "H2",
    },
    rx7fd: {
      body: 0xffd500,
      lower: 0x151515,
      accent: 0xd52b1e,
      glass: 0x17232a,
      plate: "RX7 FD",
      decal: "13B FD",
    },
    rx7fc: {
      body: 0xf0f1ee,
      lower: 0x101214,
      accent: 0x22262a,
      glass: 0x202a30,
      plate: "RX7 FC",
      decal: "TURBO II",
    },
  };
  const design = designs[modelId] ?? designs.ae86;

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: design.body,
    roughness: modelId === "rx7fd" ? 0.22 : 0.31,
    metalness: modelId === "rx7fd" ? 0.42 : 0.28,
  });
  const lowerMaterial = new THREE.MeshStandardMaterial({
    color: design.lower,
    roughness: 0.58,
    metalness: 0.16,
  });
  const accentMaterial = new THREE.MeshStandardMaterial({
    color: design.accent,
    roughness: 0.32,
    metalness: 0.28,
  });
  const blackMaterial = new THREE.MeshStandardMaterial({
    color: 0x080a0b,
    roughness: 0.62,
    metalness: 0.12,
  });
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x1c2023,
    roughness: 0.42,
    metalness: 0.42,
  });
  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xc7c9c3,
    roughness: 0.2,
    metalness: 0.76,
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: design.glass,
    roughness: 0.05,
    metalness: 0.05,
    transmission: 0.12,
    transparent: true,
    opacity: 0.58,
  });
  const headlightMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xeaf7ff,
    roughness: 0.03,
    metalness: 0.06,
    transmission: 0.28,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide,
  });
  const amberMaterial = new THREE.MeshBasicMaterial({
    color: 0xf2a23b,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
  });
  const redLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xd51f24,
    transparent: true,
    opacity: 0.86,
    side: THREE.DoubleSide,
  });
  const whiteLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xf4f1df,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });
  const decalMaterial = new THREE.MeshBasicMaterial({
    map: makeJdmSideDecalTexture(design.decal, design.accent, modelId),
    transparent: true,
    side: THREE.DoubleSide,
  });
  const plateMaterial = new THREE.MeshBasicMaterial({
    map: makeLicensePlateTexture(design.plate),
    side: THREE.DoubleSide,
  });

  function box(width, height, depth, material, x, y, z, rx = 0, ry = 0, rz = 0, name = "") {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = material !== glassMaterial;
    if (name) mesh.name = name;
    visualRoot.add(mesh);
    return mesh;
  }

  function plane(width, height, material, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.renderOrder = 10;
    visualRoot.add(mesh);
    return mesh;
  }

  function cylinder(radius, height, material, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 18), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    visualRoot.add(mesh);
    return mesh;
  }

  function ellipsoid(width, height, depth, material, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), material);
    mesh.scale.set(width / 2, height / 2, depth / 2);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = material !== glassMaterial;
    visualRoot.add(mesh);
    return mesh;
  }

  function addPanelLines(width, zFront, zRear, y = 0.25) {
    box(0.026, 0.03, zFront - zRear, trimMaterial, -width / 2 - 0.01, y, (zFront + zRear) / 2);
    box(0.026, 0.03, zFront - zRear, trimMaterial, width / 2 + 0.01, y, (zFront + zRear) / 2);
    for (const side of [-1, 1]) {
      box(0.036, 0.19, 0.04, trimMaterial, side * (width / 2 + 0.025), y + 0.1, 0.15);
      box(0.22, 0.035, 0.05, trimMaterial, side * (width / 2 + 0.045), y + 0.09, -0.42);
    }
  }

  function addExhaustPair(x, z, count = 1) {
    for (let i = 0; i < count; i += 1) {
      const offset = (i - (count - 1) / 2) * 0.18;
      cylinder(0.055, 0.36, chromeMaterial, x + offset, -0.24, z, Math.PI / 2);
      cylinder(0.038, 0.375, blackMaterial, x + offset, -0.24, z + 0.008, Math.PI / 2);
    }
  }

  if (modelId === "ae86") {
    box(2.0, 0.34, 3.72, bodyMaterial, 0, 0.02, -0.04);
    box(2.04, 0.22, 3.72, lowerMaterial, 0, -0.13, -0.04);
    box(1.78, 0.16, 1.28, bodyMaterial, 0, 0.29, 1.03, -0.08);
    box(1.7, 0.18, 1.12, bodyMaterial, 0, 0.34, -1.34, 0.06);
    box(1.38, 0.56, 1.16, glassMaterial, 0, 0.68, -0.38, -0.13);
    box(1.2, 0.09, 1.3, bodyMaterial, 0, 0.9, -0.52, -0.08);
    box(1.28, 0.34, 0.07, glassMaterial, 0, 0.58, -1.1, -0.46);
    box(1.88, 0.15, 0.28, lowerMaterial, 0, -0.08, 1.94);
    box(1.58, 0.12, 0.12, blackMaterial, 0, 0.13, 1.96);
    box(0.58, 0.12, 0.06, whiteLightMaterial, -0.48, 0.21, 2.03);
    box(0.58, 0.12, 0.06, whiteLightMaterial, 0.48, 0.21, 2.03);
    box(0.28, 0.09, 0.055, amberMaterial, -0.86, 0.13, 2.04);
    box(0.28, 0.09, 0.055, amberMaterial, 0.86, 0.13, 2.04);
    box(1.88, 0.08, 0.08, lowerMaterial, 0, 0.16, -1.96);
    box(1.72, 0.18, 0.18, bodyMaterial, 0, 0.13, -1.88);
    box(0.58, 0.11, 0.05, redLightMaterial, -0.48, 0.2, -2.0);
    box(0.58, 0.11, 0.05, redLightMaterial, 0.48, 0.2, -2.0);
    plane(0.7, 0.22, plateMaterial, 0, 0.04, -2.055, 0, Math.PI);
    addExhaustPair(0.56, -2.12, 1);
    addPanelLines(1.98, 1.45, -1.48, 0.2);

    for (const side of [-1, 1]) {
      box(0.22, 0.38, 0.74, bodyMaterial, side * 1.01, 0.08, 1.22);
      box(0.22, 0.42, 0.82, bodyMaterial, side * 1.01, 0.07, -1.22);
      box(0.15, 0.48, 0.74, lowerMaterial, side * 1.11, -0.05, 1.2);
      box(0.15, 0.5, 0.82, lowerMaterial, side * 1.11, -0.06, -1.23);
      box(0.11, 0.06, 2.78, lowerMaterial, side * 1.04, 0.03, -0.1);
      plane(1.2, 0.34, decalMaterial, side * 1.075, 0.08, -0.42, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2);
      box(0.07, 0.14, 0.3, lowerMaterial, side * 1.18, 0.42, 0.58, 0, side * 0.18);
      box(0.12, 0.06, 0.26, blackMaterial, side * 1.25, 0.35, 0.52, 0, side * 0.2);
      box(0.045, 0.46, 0.06, trimMaterial, side * 0.52, 0.68, 0.05, 0.08);
      box(0.044, 0.42, 0.05, trimMaterial, side * 0.46, 0.66, -0.74, -0.1);
    }
  } else if (modelId === "rx7fd") {
    ellipsoid(2.1, 0.48, 4.02, bodyMaterial, 0, 0.04, 0);
    box(2.02, 0.36, 3.78, bodyMaterial, 0, -0.04, -0.04);
    box(2.12, 0.18, 3.92, lowerMaterial, 0, -0.23, -0.02);
    box(1.72, 0.18, 1.46, bodyMaterial, 0, 0.28, 1.02, -0.08);
    box(1.7, 0.18, 1.42, bodyMaterial, 0, 0.31, -1.28, 0.05);
    ellipsoid(1.46, 0.64, 1.36, glassMaterial, 0, 0.58, -0.38, -0.04);
    box(1.2, 0.08, 1.08, bodyMaterial, 0, 0.82, -0.38, -0.03);
    box(1.52, 0.09, 1.16, bodyMaterial, 0, 0.34, 1.04, -0.1);
    box(2.12, 0.18, 0.24, lowerMaterial, 0, -0.16, 1.96);
    box(0.76, 0.15, 0.07, blackMaterial, 0, -0.02, 2.08);
    box(0.34, 0.1, 0.055, amberMaterial, -0.78, 0.06, 2.08);
    box(0.34, 0.1, 0.055, amberMaterial, 0.78, 0.06, 2.08);
    for (const side of [-1, 1]) {
      ellipsoid(0.52, 0.12, 0.055, headlightMaterial, side * 0.58, 0.24, 2.02);
      ellipsoid(0.22, 0.1, 0.05, whiteLightMaterial, side * 0.92, -0.03, 2.08);
      box(0.24, 0.42, 0.74, bodyMaterial, side * 0.99, 0.0, 1.18);
      box(0.22, 0.46, 0.8, bodyMaterial, side * 1.01, 0.0, -1.28);
      box(0.16, 0.2, 0.34, blackMaterial, side * 1.045, 0.11, 0.24, 0, side * 0.18);
      box(0.1, 0.1, 1.76, lowerMaterial, side * 1.07, -0.2, -0.12);
      box(0.1, 0.14, 0.98, bodyMaterial, side * 1.055, 0.12, -0.32);
      plane(1.05, 0.24, decalMaterial, side * 1.085, 0.2, -0.4, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2);
      box(0.08, 0.14, 0.32, bodyMaterial, side * 1.18, 0.42, 0.62, 0, side * 0.2);
      box(0.1, 0.05, 0.28, lowerMaterial, side * 1.24, 0.35, 0.56, 0, side * 0.18);
      box(0.045, 0.36, 0.06, trimMaterial, side * 0.54, 0.62, 0.04, 0.12);
      box(0.045, 0.34, 0.05, trimMaterial, side * 0.48, 0.62, -0.74, -0.08);
    }
    box(1.9, 0.22, 0.22, bodyMaterial, 0, 0.1, -1.9);
    box(1.7, 0.08, 0.5, bodyMaterial, 0, 0.34, -1.58, 0.06);
    for (const side of [-1, 1]) {
      ellipsoid(0.36, 0.16, 0.055, redLightMaterial, side * 0.5, 0.24, -2.02);
      ellipsoid(0.22, 0.12, 0.055, redLightMaterial, side * 0.82, 0.21, -2.02);
      box(0.36, 0.06, 0.055, amberMaterial, side * 0.5, 0.08, -2.03);
    }
    plane(0.68, 0.22, plateMaterial, 0, 0.02, -2.08, 0, Math.PI);
    box(1.66, 0.08, 0.22, bodyMaterial, 0, 0.78, -1.9, -0.06);
    box(0.09, 0.28, 0.38, bodyMaterial, -0.82, 0.62, -1.9, -0.02);
    box(0.09, 0.28, 0.38, bodyMaterial, 0.82, 0.62, -1.9, -0.02);
    box(0.74, 0.055, 0.12, bodyMaterial, -0.42, 0.5, -1.84, -0.04);
    box(0.74, 0.055, 0.12, bodyMaterial, 0.42, 0.5, -1.84, -0.04);
    addExhaustPair(0.68, -2.18, 1);
    addPanelLines(1.96, 1.35, -1.45, 0.22);
  } else {
    box(2.04, 0.36, 3.9, bodyMaterial, 0, 0.02, -0.03);
    box(2.06, 0.2, 3.92, lowerMaterial, 0, -0.18, -0.03);
    box(1.78, 0.14, 1.36, bodyMaterial, 0, 0.31, 1.04, -0.09);
    box(1.68, 0.18, 1.28, bodyMaterial, 0, 0.34, -1.36, 0.06);
    box(1.34, 0.58, 1.16, glassMaterial, 0, 0.66, -0.4, -0.1);
    box(1.12, 0.09, 1.24, bodyMaterial, 0, 0.9, -0.46, -0.08);
    box(2.1, 0.16, 0.28, lowerMaterial, 0, -0.12, 1.96);
    box(1.1, 0.14, 0.07, blackMaterial, 0, 0.0, 2.08);
    for (const side of [-1, 1]) {
      box(0.38, 0.22, 0.38, bodyMaterial, side * 0.48, 0.43, 1.5, -0.1);
      box(0.28, 0.12, 0.055, headlightMaterial, side * 0.48, 0.46, 1.72, -0.1);
      box(0.26, 0.08, 0.055, amberMaterial, side * 0.84, 0.02, 2.08);
      box(0.22, 0.42, 0.78, bodyMaterial, side * 1.0, 0.05, 1.22);
      box(0.22, 0.46, 0.82, bodyMaterial, side * 1.0, 0.04, -1.24);
      box(0.1, 0.08, 1.66, lowerMaterial, side * 1.08, -0.18, -0.08);
      plane(0.96, 0.2, decalMaterial, side * 1.08, 0.19, -0.42, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2);
      box(0.08, 0.14, 0.28, bodyMaterial, side * 1.17, 0.42, 0.56, 0, side * 0.2);
      box(0.045, 0.44, 0.06, trimMaterial, side * 0.5, 0.65, 0.08, 0.1);
      box(0.045, 0.38, 0.05, trimMaterial, side * 0.45, 0.64, -0.72, -0.08);
    }
    box(1.84, 0.2, 0.2, bodyMaterial, 0, 0.1, -1.94);
    box(1.78, 0.08, 0.08, trimMaterial, 0, 0.38, -1.8);
    for (const side of [-1, 1]) {
      box(0.52, 0.12, 0.055, redLightMaterial, side * 0.46, 0.22, -2.05);
      box(0.24, 0.1, 0.055, whiteLightMaterial, side * 0.84, 0.18, -2.05);
    }
    plane(0.68, 0.22, plateMaterial, 0, 0.02, -2.08, 0, Math.PI);
    box(1.84, 0.08, 0.2, bodyMaterial, 0, 0.9, -1.9, -0.04);
    box(0.09, 0.35, 0.42, bodyMaterial, -0.88, 0.74, -1.88, -0.02);
    box(0.09, 0.35, 0.42, bodyMaterial, 0.88, 0.74, -1.88, -0.02);
    addExhaustPair(-0.58, -2.18, 1);
    addPanelLines(1.96, 1.36, -1.44, 0.22);
  }

  const damperMaterial = new THREE.MeshStandardMaterial({
    color: 0xd7b845,
    roughness: 0.32,
    metalness: 0.45,
  });
  const damperRodMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfd9df,
    roughness: 0.22,
    metalness: 0.72,
  });
  for (const [index, point] of [
    [-0.78, -0.13, 1.24],
    [0.78, -0.13, 1.24],
    [-0.78, -0.13, -1.24],
    [0.78, -0.13, -1.24],
  ].entries()) {
    const [x, y, z] = point;
    const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.5, 10), damperMaterial);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.68, 10), damperRodMaterial);
    spring.name = `damperSpring${index}`;
    rod.name = `damperRod${index}`;
    spring.position.set(x, y, z);
    rod.position.set(x, y, z);
    spring.rotation.z = x < 0 ? -0.15 : 0.15;
    rod.rotation.z = spring.rotation.z;
    spring.castShadow = true;
    rod.castShadow = true;
    visualRoot.add(spring, rod);
  }

  const tunedMassMaterial = new THREE.MeshStandardMaterial({
    color: design.accent,
    roughness: 0.32,
    metalness: 0.44,
  });
  const tunedMassBlock = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.14, 0.36), tunedMassMaterial);
  tunedMassBlock.name = "tunedMassBlock";
  tunedMassBlock.position.set(0, 0.48, -0.08);
  tunedMassBlock.castShadow = true;
  visualRoot.add(tunedMassBlock);

  group.add(visualRoot);
  return group;
}

function createAmgCarMesh() {
  const group = new THREE.Group();
  const visualRoot = new THREE.Group();
  visualRoot.name = "carVisualRoot";

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x444d4b,
    roughness: 0.27,
    metalness: 0.5,
  });
  const bodyDarkMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d3433,
    roughness: 0.36,
    metalness: 0.44,
  });
  const greenAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0x8ee337,
    roughness: 0.32,
    metalness: 0.18,
  });
  const carbonMaterial = new THREE.MeshStandardMaterial({
    color: 0x050707,
    roughness: 0.4,
    metalness: 0.34,
  });
  const blackMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b0d0d,
    roughness: 0.58,
    metalness: 0.18,
  });
  const matteTrimMaterial = new THREE.MeshStandardMaterial({
    color: 0x151819,
    roughness: 0.74,
    metalness: 0.08,
  });
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x121c1f,
    roughness: 0.04,
    metalness: 0.08,
    transmission: 0.16,
    transparent: true,
    opacity: 0.56,
  });
  const smokedGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x090e10,
    roughness: 0.08,
    metalness: 0.05,
    transmission: 0.08,
    transparent: true,
    opacity: 0.46,
    side: THREE.DoubleSide,
  });
  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xc7cfca,
    roughness: 0.22,
    metalness: 0.76,
  });
  const headlightMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xdff5ff,
    roughness: 0.02,
    transmission: 0.35,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
  });
  const headlightHousingMaterial = new THREE.MeshStandardMaterial({
    color: 0x080a0b,
    roughness: 0.38,
    metalness: 0.42,
    side: THREE.DoubleSide,
  });
  const redLightMaterial = new THREE.MeshBasicMaterial({
    color: 0xff2a45,
    transparent: true,
    opacity: 0.82,
  });
  const damperMaterial = new THREE.MeshStandardMaterial({
    color: 0xf2c84b,
    roughness: 0.32,
    metalness: 0.45,
  });
  const damperRodMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfd9df,
    roughness: 0.22,
    metalness: 0.72,
  });
  const tunedMassMaterial = new THREE.MeshStandardMaterial({
    color: 0x8ee337,
    roughness: 0.28,
    metalness: 0.45,
  });

  function box(width, height, depth, material, x, y, z, rx = 0, ry = 0, rz = 0, name = "") {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    mesh.receiveShadow = material !== glassMaterial;
    if (name) mesh.name = name;
    visualRoot.add(mesh);
    return mesh;
  }

  function cylinder(radius, height, material, x, y, z, rx = 0, ry = 0, rz = 0, name = "") {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 18), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    if (name) mesh.name = name;
    visualRoot.add(mesh);
    return mesh;
  }

  function plane(width, height, material, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.renderOrder = 9;
    visualRoot.add(mesh);
    return mesh;
  }

  function torus(radius, tube, material, x, y, z, rx = 0, ry = 0, rz = 0) {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 36), material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    mesh.castShadow = true;
    visualRoot.add(mesh);
    return mesh;
  }

  const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0x8ee337, side: THREE.DoubleSide });
  const darkStripeMaterial = new THREE.MeshBasicMaterial({ color: 0x171b1c, side: THREE.DoubleSide });
  const meshPanelMaterial = new THREE.MeshBasicMaterial({
    color: 0x020303,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
  });
  const v8BadgeMaterial = new THREE.MeshBasicMaterial({
    map: makeCanvasTexture(256, 64, (context) => {
      context.clearRect(0, 0, 256, 64);
      context.fillStyle = "rgba(12, 14, 15, 0.82)";
      context.fillRect(0, 8, 256, 48);
      context.fillStyle = "#d8dfdc";
      context.font = "700 22px Arial, sans-serif";
      context.fillText("V8 BITURBO", 28, 41);
      context.fillStyle = "#8ee337";
      context.fillRect(10, 13, 8, 38);
    }),
    transparent: true,
    side: THREE.DoubleSide,
  });
  const amgBadgeMaterial = new THREE.MeshBasicMaterial({
    map: makeCanvasTexture(256, 80, (context) => {
      context.clearRect(0, 0, 256, 80);
      context.font = "italic 800 36px Arial, sans-serif";
      context.fillStyle = "#d8dfdc";
      context.fillText("AMG GT", 24, 50);
      context.fillStyle = "#8ee337";
      context.fillRect(176, 18, 12, 42);
      context.fillRect(194, 18, 12, 42);
    }),
    transparent: true,
    side: THREE.DoubleSide,
  });
  const plateMaterial = new THREE.MeshBasicMaterial({
    map: makeLicensePlateTexture("S MB 2932"),
    side: THREE.DoubleSide,
  });

  box(2.18, 0.32, 4.24, bodyMaterial, 0, -0.03, -0.03);
  box(2.08, 0.22, 2.0, bodyDarkMaterial, 0, 0.1, -1.03, 0.02);
  box(1.7, 0.22, 1.98, bodyMaterial, 0, 0.33, 0.82, -0.1);
  box(1.76, 0.18, 1.14, bodyDarkMaterial, 0, 0.38, -1.45, 0.08);
  box(1.5, 0.66, 1.28, glassMaterial, 0, 0.72, -0.34, -0.09);
  box(1.26, 0.11, 1.44, bodyMaterial, 0, 0.94, -0.42, -0.04);
  box(1.2, 0.06, 1.1, smokedGlassMaterial, 0, 0.96, -0.45, -0.04);
  box(1.58, 0.055, 0.12, matteTrimMaterial, 0, 0.7, 0.4, -0.05);
  box(1.64, 0.055, 0.12, matteTrimMaterial, 0, 0.91, -1.07, -0.06);

  box(0.11, 0.026, 1.58, greenAccentMaterial, -0.105, 0.505, 0.92, -0.095);
  box(0.11, 0.026, 1.58, greenAccentMaterial, 0.105, 0.505, 0.92, -0.095);
  box(0.06, 0.026, 1.4, matteTrimMaterial, 0.245, 0.503, 0.88, -0.095);
  box(0.9, 0.055, 0.075, greenAccentMaterial, 0.02, 0.405, 1.61, -0.08);

  for (const side of [-1, 1]) {
    box(0.24, 0.04, 0.54, matteTrimMaterial, side * 0.5, 0.52, 0.78, -0.12, side * 0.05);
    for (let fin = -2; fin <= 2; fin += 1) {
      box(0.026, 0.05, 0.48, blackMaterial, side * (0.5 + fin * 0.032), 0.56, 0.78, -0.12);
    }
  }

  box(2.42, 0.18, 0.34, carbonMaterial, 0, -0.26, 2.2);
  box(2.12, 0.2, 0.16, matteTrimMaterial, 0, -0.16, 2.08);
  box(1.46, 0.56, 0.15, blackMaterial, 0, 0.08, 2.22);
  box(1.58, 0.06, 0.08, chromeMaterial, 0, 0.38, 2.29);
  box(1.58, 0.06, 0.08, chromeMaterial, 0, -0.2, 2.29);
  box(0.06, 0.58, 0.08, chromeMaterial, -0.82, 0.08, 2.29);
  box(0.06, 0.58, 0.08, chromeMaterial, 0.82, 0.08, 2.29);
  for (let slat = -5; slat <= 5; slat += 1) {
    const height = slat === 0 ? 0.54 : 0.48 - Math.abs(slat) * 0.018;
    box(0.044, height, 0.08, chromeMaterial, slat * 0.13, 0.08, 2.33);
  }

  torus(0.17, 0.014, chromeMaterial, 0, 0.11, 2.37);
  for (let spoke = 0; spoke < 3; spoke += 1) {
    box(0.024, 0.018, 0.27, chromeMaterial, 0, 0.11, 2.385, 0, 0, (spoke / 3) * Math.PI * 2);
  }

  for (const side of [-1, 1]) {
    box(0.48, 0.3, 0.2, blackMaterial, side * 0.88, -0.09, 2.18, 0, side * 0.1);
    plane(0.42, 0.22, meshPanelMaterial, side * 0.88, -0.08, 2.285, 0, 0, side * 0.05);
    box(0.08, 0.2, 0.56, carbonMaterial, side * 1.18, -0.16, 1.93, 0, side * 0.16);
    box(0.04, 0.12, 0.5, carbonMaterial, side * 1.26, -0.2, 2.0, 0, side * 0.22);

    const housing = new THREE.Mesh(new THREE.CircleGeometry(0.22, 30), headlightHousingMaterial);
    housing.position.set(side * 0.7, 0.31, 2.17);
    housing.scale.set(1.7, 0.64, 1);
    housing.rotation.z = side * -0.08;
    housing.castShadow = true;
    visualRoot.add(housing);

    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.18, 30), headlightMaterial);
    lens.position.set(side * 0.7, 0.312, 2.19);
    lens.scale.set(1.58, 0.52, 1);
    lens.rotation.z = side * -0.08;
    lens.renderOrder = 10;
    visualRoot.add(lens);

    for (let led = 0; led < 3; led += 1) {
      box(0.08, 0.025, 0.028, chromeMaterial, side * (0.61 + led * 0.055), 0.34 - led * 0.01, 2.205, 0, 0, side * -0.12);
    }
  }

  for (const side of [-1, 1]) {
    box(0.26, 0.46, 0.84, bodyMaterial, side * 1.08, 0.08, 1.42);
    box(0.24, 0.56, 0.96, bodyDarkMaterial, side * 1.1, 0.08, -1.44);
    box(0.17, 0.6, 0.82, carbonMaterial, side * 1.2, -0.05, 1.31);
    box(0.17, 0.68, 0.88, carbonMaterial, side * 1.2, -0.06, -1.43);
    box(0.1, 0.22, 0.62, blackMaterial, side * 1.16, 0.27, 0.42);
    plane(0.44, 0.18, meshPanelMaterial, side * 1.215, 0.25, 0.42, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2);
    box(0.11, 0.1, 1.82, carbonMaterial, side * 1.1, -0.28, -0.17);
    plane(1.48, 0.22, stripeMaterial, side * 1.218, -0.055, -0.25, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2);
    plane(1.34, 0.045, darkStripeMaterial, side * 1.221, 0.09, -0.28, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2);
    plane(0.56, 0.14, v8BadgeMaterial, side * 1.224, 0.34, 0.42, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2);
    box(0.13, 0.07, 0.42, bodyMaterial, side * 1.34, 0.4, 0.6, 0, side * 0.2);
    box(0.15, 0.035, 0.34, chromeMaterial, side * 1.175, 0.26, -0.3, 0, side * 0.08);
    torus(0.12, 0.01, matteTrimMaterial, side * 1.215, 0.38, -1.0, 0, side > 0 ? Math.PI / 2 : -Math.PI / 2);
  }

  box(0.1, 0.48, 1.02, matteTrimMaterial, -0.55, 0.66, -0.45, 0.32, 0.08);
  box(0.1, 0.48, 1.02, matteTrimMaterial, 0.55, 0.66, -0.45, 0.32, -0.08);
  box(0.55, 0.62, 0.1, smokedGlassMaterial, -0.35, 0.65, -0.4, 0.62, 0.12, 0.16);
  box(0.55, 0.62, 0.1, smokedGlassMaterial, 0.35, 0.65, -0.4, 0.62, -0.12, -0.16);
  box(0.04, 0.38, 0.95, matteTrimMaterial, -0.42, 0.78, -0.42, 0.45, 0.05);
  box(0.04, 0.38, 0.95, matteTrimMaterial, 0.42, 0.78, -0.42, 0.45, -0.05);

  box(2.14, 0.28, 0.28, bodyDarkMaterial, 0, 0.04, -2.08);
  box(2.16, 0.28, 0.28, carbonMaterial, 0, -0.16, -2.17);
  box(0.72, 0.24, 0.08, blackMaterial, 0, -0.03, -2.31);
  box(0.82, 0.04, 0.06, chromeMaterial, 0, 0.38, -2.15);
  plane(0.54, 0.16, amgBadgeMaterial, 0.42, 0.24, -2.235, 0, Math.PI);
  plane(0.76, 0.23, plateMaterial, 0, 0.03, -2.305, 0, Math.PI);
  for (const side of [-1, 1]) {
    box(0.78, 0.055, 0.06, redLightMaterial, side * 0.55, 0.29, -2.2, 0, 0, side * 0.02);
    box(0.42, 0.035, 0.05, redLightMaterial, side * 0.74, -0.04, -2.25);
    cylinder(0.06, 0.38, chromeMaterial, side * 0.24, -0.26, -2.32, Math.PI / 2);
  }
  for (let fin = -3; fin <= 3; fin += 1) {
    box(0.052, 0.22, 0.54, carbonMaterial, fin * 0.2, -0.32, -2.16);
  }

  box(2.78, 0.08, 0.32, carbonMaterial, 0, 1.12, -2.21, -0.04);
  box(2.18, 0.035, 0.18, bodyDarkMaterial, 0, 1.155, -2.18, -0.04);
  box(0.12, 0.48, 0.58, carbonMaterial, -1.42, 1.06, -2.2, 0.02);
  box(0.12, 0.48, 0.58, carbonMaterial, 1.42, 1.06, -2.2, 0.02);
  box(0.075, 0.72, 0.08, carbonMaterial, -0.58, 0.74, -1.96, 0.14);
  box(0.075, 0.72, 0.08, carbonMaterial, 0.58, 0.74, -1.96, 0.14);
  box(0.06, 0.32, 0.08, greenAccentMaterial, -1.35, 1.17, -2.18);
  box(0.06, 0.32, 0.08, greenAccentMaterial, 1.35, 1.17, -2.18);

  const damperPositions = [
    [-0.82, -0.12, 1.35],
    [0.82, -0.12, 1.35],
    [-0.82, -0.12, -1.35],
    [0.82, -0.12, -1.35],
  ];

  for (let index = 0; index < damperPositions.length; index += 1) {
    const [x, y, z] = damperPositions[index];
    const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.58, 10), damperMaterial);
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.78, 10), damperRodMaterial);
    spring.name = `damperSpring${index}`;
    rod.name = `damperRod${index}`;
    spring.position.set(x, y + 0.06, z);
    rod.position.set(x, y + 0.06, z);
    spring.userData.baseY = y + 0.06;
    rod.userData.baseY = y + 0.06;
    spring.rotation.z = x < 0 ? -0.18 : 0.18;
    rod.rotation.z = spring.rotation.z;
    spring.castShadow = true;
    rod.castShadow = true;
    visualRoot.add(spring, rod);
  }

  const tunedMassBlock = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.18, 0.46), tunedMassMaterial);
  tunedMassBlock.name = "tunedMassBlock";
  tunedMassBlock.position.set(0, 0.52, -0.08);
  tunedMassBlock.castShadow = true;

  const tunedMassRailA = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.88, 8), damperRodMaterial);
  tunedMassRailA.position.set(-0.25, 0.52, -0.08);
  tunedMassRailA.rotation.x = Math.PI / 2;
  const tunedMassRailB = tunedMassRailA.clone();
  tunedMassRailB.position.x = 0.25;

  visualRoot.add(tunedMassBlock, tunedMassRailA, tunedMassRailB);
  group.add(visualRoot);
  return group;
}

function createTrackPoints(course = activeCourse) {
  const controlPoints = roundCourseControlPoints(
    course.controlPoints.map(([x, z]) => new THREE.Vector3(x, 0, z)),
    course,
  );
  const curve = new THREE.CatmullRomCurve3(
    controlPoints,
    course.loop,
    course.curveType ?? "catmullrom",
    course.curveTension ?? 0.45,
  );
  const sampled = curve.getSpacedPoints(course.samples ?? 360);
  const points = sampled.map((point) => new THREE.Vector2(point.x, point.z));

  if (course.loop && points[points.length - 1].distanceTo(points[0]) < 0.001) {
    points.pop();
  }

  return points;
}

function roundCourseControlPoints(controlPoints, course) {
  const roundness = course.cornerRoundness ?? 0;
  if (!roundness || controlPoints.length < 4) return controlPoints;

  const threshold = THREE.MathUtils.degToRad(course.cornerRoundThreshold ?? 128);
  const rounded = [];

  for (let i = 0; i < controlPoints.length; i += 1) {
    const point = controlPoints[i];
    if (!course.loop && (i === 0 || i === controlPoints.length - 1)) {
      rounded.push(point);
      continue;
    }
    if (course.loop && i === 0 && course.roundStartCorner !== true) {
      rounded.push(point);
      continue;
    }

    const previous = controlPoints[(i - 1 + controlPoints.length) % controlPoints.length];
    const next = controlPoints[(i + 1) % controlPoints.length];
    const toPrevious = previous.clone().sub(point);
    const toNext = next.clone().sub(point);
    const previousDistance = toPrevious.length();
    const nextDistance = toNext.length();
    if (previousDistance < 0.001 || nextDistance < 0.001) {
      rounded.push(point);
      continue;
    }

    const angle = toPrevious.angleTo(toNext);
    if (angle >= threshold) {
      rounded.push(point);
      continue;
    }

    const cutDistance = Math.min(roundness, previousDistance * 0.42, nextDistance * 0.42);
    rounded.push(point.clone().addScaledVector(toPrevious.normalize(), cutDistance));
    rounded.push(point.clone().addScaledVector(toNext.normalize(), cutDistance));
  }

  return rounded;
}

function getCheckpointIndices(course = activeCourse) {
  const fractions = course.checkpoints ?? [];
  const maxIndex = Math.max(0, trackPoints.length - 1);

  return fractions
    .map((fraction) => THREE.MathUtils.clamp(Math.round(fraction * maxIndex), 1, maxIndex - 1))
    .filter((index, position, list) => list.indexOf(index) === position);
}

function createCourseGate(index) {
  const point = trackPoints[index].clone();
  const tangent = getTrackTangent(index);
  return {
    center: point,
    tangent,
    normal: new THREE.Vector2(-tangent.y, tangent.x),
  };
}

function createMiniMapState() {
  if (!miniMapCanvas || !trackPoints.length) return null;

  const width = miniMapCanvas.width;
  const height = miniMapCanvas.height;
  const padding = 14;
  const xs = trackPoints.map((point) => point.x);
  const zs = trackPoints.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const scale =
    Math.min(
      (width - padding * 2) / Math.max(maxX - minX, 1),
      (height - padding * 2) / Math.max(maxZ - minZ, 1),
    ) * (activeCourse.miniMapScale ?? 1);

  return {
    context: miniMapCanvas.getContext("2d"),
    width,
    height,
    scale,
    centerX: (minX + maxX) * 0.5,
    centerZ: (minZ + maxZ) * 0.5,
    checkpointIndices: getCheckpointIndices(),
  };
}

function updateMiniMap() {
  if (!miniMapState?.context) return;

  const context = miniMapState.context;
  context.clearRect(0, 0, miniMapState.width, miniMapState.height);
  context.lineCap = "round";
  context.lineJoin = "round";

  drawMiniMapTrack(context, 12, "rgba(13, 19, 16, 0.84)");
  drawMiniMapTrack(context, 7, "rgba(238, 242, 231, 0.9)");
  drawMiniMapTrack(context, 4, "rgba(54, 78, 36, 0.94)");
  drawMiniMapTrack(context, 2.2, "rgba(30, 32, 30, 0.96)");
  drawMiniMapCheckpoints(context);
  drawMiniMapRemotePlayers(context);
  drawMiniMapCar(context);
}

function drawMiniMapTrack(context, width, color) {
  context.beginPath();
  trackPoints.forEach((point, index) => {
    const mapped = mapToMiniMap(point.x, point.y);
    if (index === 0) context.moveTo(mapped.x, mapped.y);
    else context.lineTo(mapped.x, mapped.y);
  });
  context.strokeStyle = color;
  context.lineWidth = width;
  context.stroke();
}

function drawMiniMapCheckpoints(context) {
  const start = mapToMiniMap(START_GATE.center.x, START_GATE.center.y);
  const finish = mapToMiniMap(FINISH_GATE.center.x, FINISH_GATE.center.y);

  context.fillStyle = "#d3202a";
  for (const index of miniMapState.checkpointIndices) {
    const point = trackPoints[index];
    const mapped = mapToMiniMap(point.x, point.y);
    context.beginPath();
    context.arc(mapped.x, mapped.y, 3.4, 0, Math.PI * 2);
    context.fill();
  }

  context.fillStyle = "#ffffff";
  context.fillRect(start.x - 4, start.y - 4, 8, 8);
  context.fillStyle = activeCourse.loop ? "#ffffff" : "#d3202a";
  context.fillRect(finish.x - 4, finish.y - 4, 8, 8);
}

function drawMiniMapCar(context) {
  const tangent = new CANNON.Vec3(0, 0, 1);
  chassisBody.vectorToWorldFrame(tangent, tangent);
  const angle = getMiniMapMarkerAngle(tangent.x, tangent.z);
  drawMiniMapVehicleMarker(context, chassisBody.position.x, chassisBody.position.z, angle, "#69c8ff");
}

function drawMiniMapRemotePlayers(context) {
  for (const remote of remotePlayers.values()) {
    if (remote.courseId && remote.courseId !== selectedCourseId) continue;

    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(remote.renderQuaternion);
    const angle = getMiniMapMarkerAngle(forward.x, forward.z);
    drawMiniMapVehicleMarker(
      context,
      remote.renderPosition.x,
      remote.renderPosition.z,
      angle,
      "#ffd45a",
      getMiniMapPlayerLabel(remote.displayName),
    );
  }
}

function getMiniMapMarkerAngle(forwardX, forwardZ) {
  return Math.atan2(forwardX, -forwardZ);
}

function drawMiniMapVehicleMarker(context, x, z, angle, color, label = "") {
  const mapped = mapToMiniMap(x, z);
  context.save();
  context.translate(mapped.x, mapped.y);
  context.rotate(angle);
  context.fillStyle = color;
  context.strokeStyle = "rgba(3, 7, 9, 0.86)";
  context.lineWidth = 1.4;
  context.beginPath();
  context.moveTo(0, -6);
  context.lineTo(4.8, 5.2);
  context.lineTo(0, 2.5);
  context.lineTo(-4.8, 5.2);
  context.closePath();
  context.fill();
  context.stroke();
  context.restore();

  if (!label) return;

  context.save();
  context.font = "800 9px Inter, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  const labelWidth = Math.min(54, context.measureText(label).width + 10);
  const labelX = THREE.MathUtils.clamp(mapped.x, labelWidth / 2 + 2, miniMapState.width - labelWidth / 2 - 2);
  const labelY = THREE.MathUtils.clamp(mapped.y - 12, 8, miniMapState.height - 8);
  context.fillStyle = "rgba(3, 7, 9, 0.72)";
  context.fillRect(labelX - labelWidth / 2, labelY - 6, labelWidth, 12);
  context.fillStyle = "#ffd45a";
  context.fillText(label, labelX, labelY + 0.5);
  context.restore();
}

function getMiniMapPlayerLabel(displayName) {
  const label = String(displayName || "Guest").trim();
  return label.length > 8 ? `${label.slice(0, 7)}.` : label;
}

function mapToMiniMap(x, z) {
  return {
    x: miniMapState.width * 0.5 + (x - miniMapState.centerX) * miniMapState.scale,
    y: miniMapState.height * 0.5 + (z - miniMapState.centerZ) * miniMapState.scale,
  };
}

function createRibbonMesh(width, y, material, centerOffset = 0, crossSegments = 6) {
  const vertices = [];
  const uvs = [];
  const indices = [];
  let distance = 0;
  let previous = null;
  const columns = Math.max(2, crossSegments + 1);

  for (let i = 0; i < trackPoints.length; i += 1) {
    const point = trackPoints[i];
    const normal = getTrackNormal(i);
    const sampleWidth = getRibbonWidthAtIndex(width, i);
    const center = point.clone().addScaledVector(normal, getRoadEdgeAwareOffset(centerOffset, i));

    if (previous) distance += center.distanceTo(previous);
    previous = center;

    for (let column = 0; column < columns; column += 1) {
      const t = column / (columns - 1);
      const lateralOffset = THREE.MathUtils.lerp(sampleWidth / 2, -sampleWidth / 2, t);
      const sample = center.clone().addScaledVector(normal, lateralOffset);

      vertices.push(sample.x, getTrackElevation(sample.x, sample.y) + y, sample.y);
      uvs.push(t, distance / 12);
    }
  }

  const count = trackPoints.length;
  const segmentCount = activeCourse.loop ? count : count - 1;
  for (let i = 0; i < segmentCount; i += 1) {
    const next = activeCourse.loop ? (i + 1) % count : i + 1;

    for (let column = 0; column < columns - 1; column += 1) {
      const a = i * columns + column;
      const b = i * columns + column + 1;
      const c = next * columns + column;
      const d = next * columns + column + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return new THREE.Mesh(geometry, material);
}

function addCurbRibbons(side) {
  const curbColors = activeCourse.curbColors ?? {};
  const primaryColor = curbColors.primary ?? 0xc9352c;
  const secondaryColor = curbColors.secondary ?? 0xf4f4ec;
  const red = makeCurbGeometry(side, 0);
  const white = makeCurbGeometry(side, 1);

  const redMesh = new THREE.Mesh(
    red,
    new THREE.MeshBasicMaterial({
      color: primaryColor,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -6,
      polygonOffsetUnits: -6,
    }),
  );
  const whiteMesh = new THREE.Mesh(
    white,
    new THREE.MeshBasicMaterial({
      color: secondaryColor,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -6,
      polygonOffsetUnits: -6,
    }),
  );
  redMesh.renderOrder = 7;
  whiteMesh.renderOrder = 7;
  scene.add(redMesh, whiteMesh);
}

function makeCurbGeometry(side, parity) {
  const vertices = [];
  const indices = [];
  const segmentCount = activeCourse.loop ? trackPoints.length : trackPoints.length - 1;

  for (let i = 0; i < segmentCount; i += 1) {
    if (Math.floor(i / 3) % 2 !== parity) continue;

    const next = activeCourse.loop ? (i + 1) % trackPoints.length : i + 1;
    const normalA = getTrackNormal(i);
    const normalB = getTrackNormal(next);
    const a = trackPoints[i];
    const b = trackPoints[next];
    const innerOffsetA = getRoadEdgeAwareOffset(side * (ROAD_WIDTH / 2 + 0.12), i);
    const outerOffsetA = getRoadEdgeAwareOffset(side * (ROAD_WIDTH / 2 + 1.02), i);
    const innerOffsetB = getRoadEdgeAwareOffset(side * (ROAD_WIDTH / 2 + 0.12), next);
    const outerOffsetB = getRoadEdgeAwareOffset(side * (ROAD_WIDTH / 2 + 1.02), next);
    const v = vertices.length / 3;

    const p1 = a.clone().addScaledVector(normalA, innerOffsetA);
    const p2 = a.clone().addScaledVector(normalA, outerOffsetA);
    const p3 = b.clone().addScaledVector(normalB, innerOffsetB);
    const p4 = b.clone().addScaledVector(normalB, outerOffsetB);

    vertices.push(
      p1.x,
      getTrackElevation(p1.x, p1.y) + TRACK_SURFACE_OFFSET + 0.13,
      p1.y,
      p2.x,
      getTrackElevation(p2.x, p2.y) + TRACK_SURFACE_OFFSET + 0.13,
      p2.y,
      p3.x,
      getTrackElevation(p3.x, p3.y) + TRACK_SURFACE_OFFSET + 0.13,
      p3.y,
      p4.x,
      getTrackElevation(p4.x, p4.y) + TRACK_SURFACE_OFFSET + 0.13,
      p4.y,
    );
    indices.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createBarrierLoop(offset, color) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.35,
    metalness: 0.3,
  });
  const segmentStep = 4;
  const segmentLimit = activeCourse.loop ? trackPoints.length : trackPoints.length - segmentStep;

  for (let i = 0; i < segmentLimit; i += segmentStep) {
    const a = getOffsetTrackPoint(i, offset);
    const nextIndex = activeCourse.loop ? (i + segmentStep) % trackPoints.length : Math.min(i + segmentStep, trackPoints.length - 1);
    const b = getOffsetTrackPoint(nextIndex, offset);
    createBarrierSegment(a, b, material);
  }
}

function createBarrierSegment(a, b, material) {
  const dx = b.x - a.x;
  const dz = b.y - a.y;
  const length = Math.hypot(dx, dz) + 0.22;
  const angle = Math.atan2(-dz, dx);
  const centerX = (a.x + b.x) / 2;
  const centerZ = (a.y + b.y) / 2;
  const groundY = (getTrackElevation(a.x, a.y) + getTrackElevation(b.x, b.y)) / 2;
  const height = 1.05;
  const thickness = 0.42;

  const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, height, thickness), material);
  mesh.position.set(centerX, groundY + height / 2 + 0.1, centerZ);
  mesh.rotation.y = angle;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const body = new CANNON.Body({ mass: 0, material: barrierMaterial });
  body.userData = { type: "barrier" };
  body.position.set(centerX, groundY + height / 2 + 0.1, centerZ);
  body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
  body.addShape(new CANNON.Box(new CANNON.Vec3(length / 2, height / 2, thickness / 2)));
  world.addBody(body);
}

function getTrackNormal(index) {
  const tangent = getTrackTangent(index);
  return new THREE.Vector2(-tangent.y, tangent.x);
}

function getTrackTangent(index) {
  const current = normalizeTrackIndex(index);
  const previous = activeCourse.loop
    ? trackPoints[(current - 1 + trackPoints.length) % trackPoints.length]
    : trackPoints[Math.max(0, current - 1)];
  const next = activeCourse.loop
    ? trackPoints[(current + 1) % trackPoints.length]
    : trackPoints[Math.min(trackPoints.length - 1, current + 1)];
  const tangent = next.clone().sub(previous);

  if (tangent.lengthSq() < 0.0001) return new THREE.Vector2(0, 1);
  return tangent.normalize();
}

function normalizeTrackIndex(index) {
  if (activeCourse.loop) {
    return ((index % trackPoints.length) + trackPoints.length) % trackPoints.length;
  }

  return THREE.MathUtils.clamp(index, 0, trackPoints.length - 1);
}

function getOffsetTrackPoint(index, offset) {
  const wrappedIndex = normalizeTrackIndex(index);
  return trackPoints[wrappedIndex].clone().addScaledVector(getTrackNormal(wrappedIndex), offset);
}

function getRibbonWidthAtIndex(width, index) {
  if (Math.abs(width - ROAD_WIDTH) > 0.001) return width;
  return getRoadWidthAtIndex(index);
}

function getRoadEdgeAwareOffset(offset, index) {
  if (!activeCourse.roadWidthSections?.length || Math.abs(offset) < ROAD_WIDTH / 2 - 2) return offset;

  const edgeInset = Math.abs(offset) - ROAD_WIDTH / 2;
  return Math.sign(offset || 1) * (getRoadWidthAtIndex(index) / 2 + edgeInset);
}

function getRoadWidthAtIndex(index) {
  let width = ROAD_WIDTH;
  const progress = normalizeTrackIndex(index) / Math.max(trackPoints.length - 1, 1);

  for (const section of activeCourse.roadWidthSections ?? []) {
    const targetWidth = section.width ?? ROAD_WIDTH + (section.extraWidth ?? 0);
    const blend = getProgressRangeBlend(progress, section.start, section.end, section.blend ?? 0.018);
    width = THREE.MathUtils.lerp(width, targetWidth, blend);
  }

  return width;
}

function getProgressRangeBlend(progress, start, end, blend = 0.018) {
  if (start <= end) {
    const enters = smoothstep(start - blend, start + blend, progress);
    const exits = 1 - smoothstep(end - blend, end + blend, progress);
    return THREE.MathUtils.clamp(enters * exits, 0, 1);
  }

  const shiftedProgress = progress < start ? progress + 1 : progress;
  const shiftedEnd = end + 1;
  const enters = smoothstep(start - blend, start + blend, shiftedProgress);
  const exits = 1 - smoothstep(shiftedEnd - blend, shiftedEnd + blend, shiftedProgress);
  return THREE.MathUtils.clamp(enters * exits, 0, 1);
}

function isNearTrack(x, z, margin) {
  return getDistanceToTrackSquared(x, z) < margin * margin;
}

function getRoadsideObjectOffset(extra = 0) {
  const shoulderWidth = activeCourse.environment === "mountain" ? activeCourse.shoulderWidth ?? 4.5 : 0;
  return ROAD_WIDTH / 2 + shoulderWidth + extra;
}

function isRoadsideObjectClear(x, z, radius = 0, buffer = 0.8) {
  return !isNearTrack(x, z, getRoadsideObjectOffset(radius + buffer));
}

function isRectFootprintClearOfTrack(x, z, width, depth, yaw = 0, buffer = 1.2) {
  const halfWidth = Math.max(width, 0.1) / 2;
  const halfDepth = Math.max(depth, 0.1) / 2;
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const clearance = ROAD_WIDTH / 2 + buffer;
  const samples = [
    [0, 0],
    [-halfWidth, -halfDepth],
    [halfWidth, -halfDepth],
    [-halfWidth, halfDepth],
    [halfWidth, halfDepth],
    [0, -halfDepth],
    [0, halfDepth],
    [-halfWidth, 0],
    [halfWidth, 0],
  ];

  return samples.every(([localX, localZ]) => {
    const sampleX = x + localX * cos + localZ * sin;
    const sampleZ = z - localX * sin + localZ * cos;
    const nearest = getNearestTrackInfo(sampleX, sampleZ);
    const roadClearance = Math.max(clearance, getRoadWidthAtIndex(nearest.index) / 2 + buffer);
    return nearest.distanceSquared >= roadClearance * roadClearance;
  });
}

function getSurfaceGripAt(x, z) {
  if (activeCourse.environment !== "mountain") return 1;

  const nearest = getNearestTrackInfo(x, z);
  const distance = Math.sqrt(nearest.distanceSquared);
  const asphaltEdge = ROAD_WIDTH / 2;
  const shoulderEdge = asphaltEdge + (activeCourse.shoulderWidth ?? 4.5);
  const progress = nearest.index / Math.max(trackPoints.length - 1, 1);
  const runoff = getRunoffZoneAt(progress, distance);

  if (distance <= asphaltEdge) return 1;
  if (activeCourse.asphaltRunoffs && runoff) return 1;
  if (Number.isFinite(runoff?.grip)) return runoff.grip;
  if (runoff?.material === "asphalt" || runoff?.material === "concrete") return 0.88;
  if (String(runoff?.material ?? "").startsWith("painted")) return 0.82;
  if (runoff?.material === "gravel") return 0.46;
  if (runoff?.material === "grass") return 0.6;

  if (distance <= shoulderEdge) {
    if (activeCourse.asphaltShoulders) return 1;
    const t = (distance - asphaltEdge) / Math.max(shoulderEdge - asphaltEdge, 0.001);
    return THREE.MathUtils.lerp(0.9, 0.68, t);
  }

  return 0.54;
}

function sampleGroundForVehicle(x, z) {
  return {
    height: getTrackElevation(x, z),
    normal: getTerrainNormal(x, z),
  };
}

function getDistanceToTrackSquared(x, z) {
  return getNearestTrackInfo(x, z).distanceSquared;
}

function getNearestTrackInfo(x, z) {
  const point = new THREE.Vector2(x, z);
  let minDistanceSquared = Infinity;
  let nearestIndex = 0;
  const segmentCount = activeCourse.loop ? trackPoints.length : trackPoints.length - 1;

  for (let i = 0; i < segmentCount; i += 1) {
    const a = trackPoints[i];
    const b = trackPoints[activeCourse.loop ? (i + 1) % trackPoints.length : Math.min(i + 1, trackPoints.length - 1)];
    const distance = getPointToSegmentDistance(point, a, b);
    const distanceSquared = distance * distance;
    if (distanceSquared < minDistanceSquared) {
      minDistanceSquared = distanceSquared;
      nearestIndex = i;
    }
  }

  return { distanceSquared: minDistanceSquared, index: nearestIndex };
}

function getRunoffZoneAt(progress, distance) {
  for (const zone of activeCourse.runoffZones ?? []) {
    if (!isProgressInRange(progress, zone.start, zone.end)) continue;

    const center = zone.offset ?? ROAD_WIDTH / 2 + (activeCourse.shoulderWidth ?? 5);
    const halfWidth = (zone.width ?? 8) / 2;
    if (distance >= center - halfWidth && distance <= center + halfWidth) return zone;
  }

  return null;
}

function isInsideVisualTracksideSection(x, z, sections = [], margin = 0) {
  if (!sections?.length) return false;

  const nearest = getNearestTrackInfo(x, z);
  const progress = nearest.index / Math.max(trackPoints.length - 1, 1);
  const distance = Math.sqrt(nearest.distanceSquared);

  return sections.some((section) => {
    if (!isProgressInRange(progress, section.start, section.end)) return false;

    const center = section.offset ?? ROAD_WIDTH / 2 + (section.width ?? 10) / 2;
    const halfWidth = (section.width ?? 10) / 2 + margin;
    return Math.abs(distance - center) <= halfWidth;
  });
}

function isProgressInRange(progress, start, end) {
  if (start <= end) return progress >= start && progress <= end;
  return progress >= start || progress <= end;
}

function isNearTestArea(x, z, margin = 0) {
  if (activeCourse.environment !== "city" || activeCourse.disableTestArea) return false;

  return (
    Math.abs(x - TEST_AREA.x) < TEST_AREA.width / 2 + margin &&
    Math.abs(z - TEST_AREA.z) < TEST_AREA.depth / 2 + margin
  );
}

function isNearBridgeAccess(x, z, margin = 0) {
  if (activeCourse.environment !== "city" || activeCourse.disableBridgeRoutes) return false;

  const point = new THREE.Vector2(x, z);

  return BRIDGE_ROUTES.some((route) => {
    const start = new THREE.Vector2(route.startX, route.startZ);
    const end = new THREE.Vector2(route.endX, route.endZ);
    return getPointToSegmentDistance(point, start, end) < route.width / 2 + margin;
  });
}

function getPointToSegmentDistance(point, start, end) {
  const segment = end.clone().sub(start);
  const lengthSquared = segment.lengthSq();

  if (lengthSquared < 0.0001) return point.distanceTo(start);

  const t = THREE.MathUtils.clamp(point.clone().sub(start).dot(segment) / lengthSquared, 0, 1);
  const closest = start.clone().addScaledVector(segment, t);
  return point.distanceTo(closest);
}

function isTrackCorridorBlockedBySegment(start, end, index, clearance) {
  if (!start || !end) return false;

  return getTrackCorridorDistanceForSegment(start, end, index) < clearance;
}

function getTrackCorridorDistanceForSegment(start, end, startIndex = null, endIndex = startIndex) {
  if (!start || !end) return Infinity;

  const segmentCount = activeCourse.loop ? trackPoints.length : trackPoints.length - 1;
  let minDistance = Infinity;

  for (let i = 0; i < segmentCount; i += 1) {
    if (isLocalGuardRailTrackSegment(i, startIndex, endIndex)) continue;

    const trackStart = trackPoints[i];
    const trackEnd = trackPoints[activeCourse.loop ? (i + 1) % trackPoints.length : Math.min(i + 1, trackPoints.length - 1)];
    minDistance = Math.min(minDistance, getSegmentToSegmentDistance(start, end, trackStart, trackEnd));
  }

  return minDistance;
}

function isLocalGuardRailTrackSegment(segmentIndex, startIndex, endIndex) {
  if (startIndex === null || startIndex === undefined) return false;

  const localRange = 24;
  return (
    getWrappedIndexDistance(segmentIndex, startIndex, trackPoints.length) < localRange ||
    getWrappedIndexDistance(segmentIndex, endIndex, trackPoints.length) < localRange
  );
}

function getSegmentToSegmentDistance(a, b, c, d) {
  if (doSegmentsIntersect(a, b, c, d)) return 0;

  return Math.min(
    getPointToSegmentDistance(a, c, d),
    getPointToSegmentDistance(b, c, d),
    getPointToSegmentDistance(c, a, b),
    getPointToSegmentDistance(d, a, b),
  );
}

function doSegmentsIntersect(a, b, c, d) {
  const abC = getSignedArea(a, b, c);
  const abD = getSignedArea(a, b, d);
  const cdA = getSignedArea(c, d, a);
  const cdB = getSignedArea(c, d, b);

  return abC * abD < 0 && cdA * cdB < 0;
}

function getSignedArea(a, b, c) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function isNearOtherTrackBranch(point, index, margin) {
  const marginSquared = margin * margin;

  for (let i = 0; i < trackPoints.length; i += 6) {
    if (getWrappedIndexDistance(index, i, trackPoints.length) < 34) continue;
    if (point.distanceToSquared(trackPoints[i]) < marginSquared) return true;
  }

  return false;
}

function getWrappedIndexDistance(a, b, count) {
  if (!activeCourse.loop) return Math.abs(a - b);

  const difference = Math.abs(a - b);
  return Math.min(difference, count - difference);
}

function bindInput() {
  window.addEventListener("keydown", (event) => {
    if (event.code === "F9" && !event.repeat) {
      togglePhysicsDebug();
      return;
    }

    const uiControlActive = isUiControlTarget(event.target);
    if (uiControlActive && (menuActive || isTextEntryTarget(event.target))) return;

    if (isDrivingKey(event.code)) event.preventDefault();
    if (menuActive && isMainMenuVisible() && event.code === "Enter" && !event.repeat) {
      startGame();
      return;
    }
    if (menuActive) return;

    if (raceCountdownActive) {
      return;
    }

    if (event.code === "KeyF" && !event.repeat && !menuActive) {
      setMouseControlsEnabled(!mouseControls.enabled);
      return;
    }

    if (mouseControls.enabled && isKeyboardDrivingControlKey(event.code)) {
      return;
    }

    keys.add(event.code);

    if (event.code === "KeyR") resetCar();
    if (event.code === "KeyC" && !event.repeat) cameraMode = (cameraMode + 1) % 2;
    if (event.code === "Enter" && !event.repeat) setPaused(!paused);
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });

  startButton.addEventListener("click", () => {
    if (menuActive || raceCountdownActive) return;
    setPaused(!paused);
  });
  menuReturnButton?.addEventListener("click", returnToMenu);

  window.addEventListener("contextmenu", (event) => {
    if (!menuActive) event.preventDefault();
  });

  canvas.addEventListener("mousedown", (event) => {
    if (menuActive || raceCountdownActive) return;
    event.preventDefault();

    if (event.button === 0 && mouseControls.enabled) {
      mouseControls.leftDown = true;
      updateMouseSteer(event.clientX);
    }

    if (event.button === 2) {
      if (mouseControls.enabled) {
        mouseControls.rightDown = true;
      } else {
        cameraOrbit.active = true;
        cameraOrbit.yaw = 0;
        cameraOrbit.pitch = 0.26;
      }
    }
  });

  window.addEventListener("mouseup", (event) => {
    if (event.button === 0) mouseControls.leftDown = false;
    if (event.button === 2) {
      mouseControls.rightDown = false;
      cameraOrbit.active = false;
    }
  });

  window.addEventListener("mousemove", (event) => {
    if (mouseControls.enabled && !menuActive) {
      updateMouseSteer(event.clientX);
    }

    if (cameraOrbit.active && !mouseControls.enabled && !menuActive) {
      cameraOrbit.yaw -= event.movementX * 0.006;
      cameraOrbit.pitch = THREE.MathUtils.clamp(cameraOrbit.pitch + event.movementY * 0.004, -0.35, 0.8);
    }
  });

  window.addEventListener("blur", () => {
    mouseControls.leftDown = false;
    mouseControls.rightDown = false;
    cameraOrbit.active = false;
    keys.clear();
  });

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, RENDERER_PIXEL_RATIO_LIMIT));
  });

  readyTimeout = window.setTimeout(() => {
    if (!paused) message.classList.remove("is-visible");
  }, 1200);
}

function updateMouseSteer(clientX) {
  const normalized = (clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
  mouseControls.steer = THREE.MathUtils.clamp(-normalized, -1, 1);
}

function setMouseControlsEnabled(enabled) {
  mouseControls.enabled = enabled;
  mouseControls.leftDown = false;
  mouseControls.rightDown = false;
  steeringInputState.value = 0;
  cameraOrbit.active = false;
  keys.clear();

  if (!menuActive) {
    flashMessage(enabled ? "MOUSE CONTROL" : "KEYBOARD CONTROL");
  }
}

function initializeAuth() {
  const session = loadStoredJson(STORAGE_KEYS.session, null);
  const accounts = loadStoredJson(STORAGE_KEYS.accounts, {});
  const account = session?.key ? accounts[session.key] : null;
  currentPlayer = account ? { id: account.id, key: session.key } : null;
  updateAuthUi();
}

function signUpPlayer() {
  const credentials = getEnteredCredentials("signup");
  if (!credentials) return;

  const accounts = loadStoredJson(STORAGE_KEYS.accounts, {});
  if (accounts[credentials.key]) {
    showAuthStatus("ID already exists.", true);
    return;
  }

  accounts[credentials.key] = {
    id: credentials.id,
    password: credentials.password,
    createdAt: Date.now(),
  };
  saveStoredJson(STORAGE_KEYS.accounts, accounts);
  setCurrentPlayer(credentials.key, credentials.id);
  showAuthStatus("Signed up. Auto login is on.");
  showMainMenu();
}

function loginPlayer() {
  const credentials = getEnteredCredentials("login");
  if (!credentials) return;

  const accounts = loadStoredJson(STORAGE_KEYS.accounts, {});
  const account = accounts[credentials.key];
  if (!account || account.password !== credentials.password) {
    showAuthStatus("Check your ID or password.", true);
    return;
  }

  setCurrentPlayer(credentials.key, account.id);
  showAuthStatus("Logged in.");
  showMainMenu();
}

function logoutPlayer() {
  currentPlayer = null;
  localStorage.removeItem(STORAGE_KEYS.session);
  updateAuthUi();
  sendMultiplayerProfile();
  showAuthStatus("Logged out.");
  showMainMenu();
}

function setCurrentPlayer(key, id) {
  currentPlayer = { key, id };
  saveStoredJson(STORAGE_KEYS.session, { key });
  updateAuthUi();
  sendMultiplayerProfile();
}

function getEnteredCredentials(mode) {
  const idInput = mode === "signup" ? signupIdInput : loginIdInput;
  const passwordInput = mode === "signup" ? signupPasswordInput : loginPasswordInput;
  const id = idInput?.value.trim() ?? "";
  const password = passwordInput?.value ?? "";

  if (!/^[A-Za-z0-9_-]{3,16}$/.test(id)) {
    showAuthStatus("Use 3-16 letters, numbers, _ or -.", true);
    return null;
  }

  if (password.length < 4 || password.length > 24) {
    showAuthStatus("Password must be 4-24 characters.", true);
    return null;
  }

  return {
    id,
    key: id.toLowerCase(),
    password,
  };
}

function updateAuthUi() {
  if (authCurrentPlayer) {
    authCurrentPlayer.textContent = currentPlayer ? currentPlayer.id : "Not signed in";
  }
  if (authLogoutButton) authLogoutButton.hidden = !currentPlayer;
  if (mainLoginButton) mainLoginButton.hidden = Boolean(currentPlayer);
  if (authLoginButton) authLoginButton.hidden = Boolean(currentPlayer);
  if (authSignupButton) authSignupButton.hidden = Boolean(currentPlayer);
  if (currentPlayer) {
    if (loginIdInput) loginIdInput.value = currentPlayer.id;
    if (signupIdInput) signupIdInput.value = currentPlayer.id;
    if (loginPasswordInput) loginPasswordInput.value = "";
    if (signupPasswordInput) signupPasswordInput.value = "";
  }
}

function showAuthStatus(text, isError = false) {
  for (const status of authStatusMessages) {
    status.textContent = text;
    status.classList.toggle("is-error", isError);
  }
}

function loadStoredJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStoredJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function initializeMultiplayer() {
  const initialRoomId = sanitizeRoomId(URL_PARAMS.get("room") ?? localStorage.getItem(STORAGE_KEYS.room) ?? "lobby");
  multiplayer.roomId = initialRoomId;
  if (roomIdInput) roomIdInput.value = initialRoomId;

  if (typeof io !== "function") {
    setMultiplayerStatus("Offline");
    return;
  }

  const socket = io();
  multiplayer.socket = socket;
  setMultiplayerStatus("Connecting");

  multiplayer.socket.on("connect", () => {
    multiplayer.connected = true;
    multiplayer.selfId = multiplayer.socket.id;
    joinMultiplayerRoom(getEnteredRoomId(), true);
  });

  multiplayer.socket.on("disconnect", () => {
    multiplayer.connected = false;
    multiplayer.joined = false;
    clearRemotePlayers();
    setMultiplayerStatus("Offline");
  });

  multiplayer.socket.on("multiplayer:joined", handleMultiplayerJoined);
  multiplayer.socket.on("multiplayer:playerJoined", createOrUpdateRemotePlayer);
  multiplayer.socket.on("multiplayer:playerUpdated", createOrUpdateRemotePlayer);
  multiplayer.socket.on("multiplayer:state", handleRemotePlayerState);
  multiplayer.socket.on("multiplayer:playerLeft", ({ id }) => removeRemotePlayer(id));
  multiplayer.socket.on("leaderboard:snapshot", handleLeaderboardSnapshot);
  multiplayer.socket.on("leaderboard:updated", handleLeaderboardUpdated);
  multiplayer.socket.on("leaderboard:accepted", handleLeaderboardAccepted);
  multiplayer.socket.on("race:countdown", handleRaceCountdown);
  multiplayer.socket.on("race:started", handleRaceStarted);
  multiplayer.socket.on("race:spectate", handleRaceSpectate);
  multiplayer.socket.on("race:finished", handleRaceFinished);
  multiplayer.socket.on("race:completed", handleRaceCompleted);
  multiplayer.socket.on("race:lineup", handleRaceLineup);
}

function joinMultiplayerRoom(roomId = "lobby", isReconnect = false) {
  const safeRoomId = sanitizeRoomId(roomId);
  multiplayer.roomId = safeRoomId;
  localStorage.setItem(STORAGE_KEYS.room, safeRoomId);
  syncRoomUrl(safeRoomId);
  if (roomIdInput) roomIdInput.value = safeRoomId;

  if (!multiplayer.socket?.connected) {
    setMultiplayerStatus("Offline");
    return;
  }

  if (!isReconnect) clearRemotePlayers();
  multiplayer.joined = false;
  setMultiplayerStatus("Joining");
  multiplayer.socket.emit("multiplayer:join", {
    roomId: safeRoomId,
    player: getMultiplayerProfile(),
    state: getMultiplayerState(),
  });
}

function handleMultiplayerJoined(payload = {}) {
  multiplayer.selfId = payload.selfId ?? multiplayer.socket?.id ?? null;
  multiplayer.roomId = sanitizeRoomId(payload.roomId ?? multiplayer.roomId);
  multiplayer.joined = true;
  clearRemotePlayers();

  for (const player of payload.players ?? []) {
    createOrUpdateRemotePlayer(player);
  }

  if (payload.leaderboard) {
    handleLeaderboardSnapshot({ leaderboard: payload.leaderboard });
  } else {
    requestLeaderboardSnapshot();
  }

  if (payload.race) {
    handleRaceSnapshot(payload.race);
  } else {
    resetRaceSession();
  }

  updateMultiplayerRoomStatus(payload.players?.length ?? remotePlayers.size + 1);
  sendMultiplayerState(true);
}

function requestLeaderboardSnapshot() {
  if (!multiplayer.socket?.connected) return;
  multiplayer.socket.emit("leaderboard:request");
}

function submitLeaderboardRecord(record, courseId = selectedCourseId) {
  if (!record || !multiplayer.socket?.connected) return;

  multiplayer.socket.emit("leaderboard:submit", {
    courseId,
    record,
  });
}

function handleLeaderboardSnapshot(payload = {}) {
  sharedLeaderboard = normalizeLeaderboardPayload(payload.leaderboard);
  refreshLeaderboardViews();
}

function handleLeaderboardUpdated(payload = {}) {
  const courseId = normalizeCourseId(payload.courseId);
  if (!courseId) return;

  sharedLeaderboard = {
    ...sharedLeaderboard,
    [courseId]: normalizeLeaderboardRecords(payload.records),
  };
  refreshLeaderboardViews();
}

function handleLeaderboardAccepted(payload = {}) {
  if (payload.leaderboard) {
    handleLeaderboardSnapshot({ leaderboard: payload.leaderboard });
    return;
  }

  handleLeaderboardUpdated(payload);
}

function refreshLeaderboardViews() {
  if (rankingsScreen && !rankingsScreen.hidden) renderRankingsScreen();
}

function normalizeLeaderboardPayload(payload = {}) {
  const normalized = {};

  for (const [rawCourseId, records] of Object.entries(payload ?? {})) {
    const courseId = normalizeCourseId(rawCourseId);
    if (!courseId) continue;
    normalized[courseId] = normalizeLeaderboardRecords(records);
  }

  return normalized;
}

function normalizeLeaderboardRecords(records = []) {
  const byKey = new Map();
  const values = Array.isArray(records) ? records : Object.values(records ?? {});

  for (const rawRecord of values) {
    const record = normalizeLeaderboardRecord(rawRecord);
    if (record) rememberBestLeaderboardRecord(byKey, record);
  }

  return [...byKey.values()].sort(compareLeaderboardRecords);
}

function normalizeLeaderboardRecord(record = {}) {
  if (!record || typeof record !== "object") return null;

  const time = Number(record.time);
  if (!Number.isFinite(time) || time <= 0) return null;

  const key = normalizeLeaderboardKey(record.key ?? record.playerId ?? record.id);
  if (!key) return null;

  const id = String(record.id ?? key).trim().slice(0, 24) || "PLAYER";
  const carId = String(record.carId ?? "gt3").trim().slice(0, 24) || "gt3";
  const finishedAt = Number(record.finishedAt);

  return {
    id,
    key,
    time,
    carId,
    finishedAt: Number.isFinite(finishedAt) ? finishedAt : Date.now(),
  };
}

function normalizeCourseId(courseId) {
  const value = String(courseId || "").trim().slice(0, 24);
  return COURSE_DEFS[value] ? value : null;
}

function normalizeLeaderboardKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 32);
}

function rememberBestLeaderboardRecord(recordsByKey, record) {
  const previous = recordsByKey.get(record.key);
  if (!previous || record.time < previous.time) {
    recordsByKey.set(record.key, record);
  }
}

function compareLeaderboardRecords(a, b) {
  return a.time - b.time || a.id.localeCompare(b.id);
}

function requestRaceStart() {
  if (!multiplayer.socket?.connected || !multiplayer.joined) {
    startLocalRace();
    return;
  }

  if (isActiveRaceSession()) {
    enterSpectatorMode();
    multiplayer.socket.emit("race:startRequest");
    return;
  }

  message.textContent = "MATCHING";
  message.classList.add("is-visible");
  multiplayer.socket.emit("race:startRequest");
}

function startLocalRace() {
  setupRaceScreen();
  resetRaceSession();
  resetRaceProgress();
  resetCar(0, 1);
  startPreRaceSequence();
}

function setupRaceScreen({ keepResults = false } = {}) {
  blurActiveUiControl();
  cancelRaceCountdown();
  if (!keepResults) hideResultsOverlay();
  raceFinished = false;
  menuActive = false;
  mainMenu?.classList.add("is-hidden");
  if (developersScreen) developersScreen.hidden = true;
  if (garageScreen) garageScreen.hidden = true;
  if (rankingsScreen) rankingsScreen.hidden = true;
  if (loginScreen) loginScreen.hidden = true;
  if (signupScreen) signupScreen.hidden = true;
  if (menuReturnButton) menuReturnButton.hidden = false;
  keys.clear();
}

function resetRaceSession() {
  raceSession.id = null;
  raceSession.status = "idle";
  raceSession.mode = "idle";
  raceSession.startAt = null;
  raceSession.gridSlot = 0;
  raceSession.gridTotal = 1;
  raceSession.participants = [];
  raceSession.results = [];
}

function resetRaceProgress() {
  const now = performance.now();
  lap = 0;
  raceStartedAt = now;
  lapStartedAt = now;
  bestLap = null;
  lastLapStamp = 0;
}

function isActiveRaceSession() {
  return raceSession.status === "countdown" || raceSession.status === "racing";
}

function handleRaceSnapshot(payload = {}) {
  if (!isRacePayloadForCurrentCourse(payload)) {
    resetRaceSession();
    return;
  }

  updateRaceSession(payload);
  if (isActiveRaceSession() && raceSession.mode === "spectator") {
    enterSpectatorMode();
  }
}

function handleRaceCountdown(payload = {}) {
  if (!isRacePayloadForCurrentCourse(payload)) return;

  updateRaceSession(payload);
  const participant = getSelfRaceParticipant();
  if (!participant) {
    enterSpectatorMode();
    return;
  }

  raceSession.mode = "participant";
  raceSession.gridSlot = participant.gridSlot ?? 0;
  raceSession.gridTotal = Math.max(raceSession.participants.length, 1);
  raceSession.results = [];

  setupRaceScreen();
  resetRaceProgress();
  resetCar(raceSession.gridSlot, raceSession.gridTotal);
  startPreRaceSequence({ startAt: raceSession.startAt, raceId: raceSession.id });
}

function handleRaceStarted(payload = {}) {
  if (!isRacePayloadForCurrentCourse(payload)) return;
  updateRaceSession(payload);
  if (raceSession.mode === "spectator") enterSpectatorMode();
}

function handleRaceSpectate(payload = {}) {
  if (!isRacePayloadForCurrentCourse(payload)) return;
  updateRaceSession({ ...payload, viewerMode: "spectator" });
  enterSpectatorMode();
}

function handleRaceFinished(payload = {}) {
  if (payload.courseId && payload.courseId !== selectedCourseId) return;

  const result = normalizeRaceResult(payload.result);
  if (result) rememberRaceResult(result);
  raceSession.results = normalizeRaceResults(payload.results ?? raceSession.results);

  if (resultsOverlay && !resultsOverlay.hidden) {
    renderRaceResults(currentPlayer?.key ?? multiplayer.selfId ?? null);
  }
}

function handleRaceCompleted(payload = {}) {
  if (!isRacePayloadForCurrentCourse(payload)) return;

  updateRaceSession(payload);
  raceSession.status = "completed";
  paused = true;
  syncPauseButton();

  if (raceSession.mode === "spectator") {
    message.textContent = "RACE END";
    message.classList.add("is-visible");
  }

  if (resultsOverlay && !resultsOverlay.hidden) {
    renderRaceResults(currentPlayer?.key ?? multiplayer.selfId ?? null);
  }
}

function handleRaceLineup(payload = {}) {
  if (payload.courseId !== selectedCourseId) return;

  const participants = normalizeRaceParticipants(payload.participants);
  const selfIndex = participants.findIndex((participant) => participant.id === multiplayer.selfId);
  const gridSlot = selfIndex >= 0 ? participants[selfIndex].gridSlot ?? selfIndex : participants.length;
  const gridTotal = Math.max(participants.length, 1);

  resetRaceSession();
  raceSession.participants = participants;
  raceSession.gridSlot = gridSlot;
  raceSession.gridTotal = gridTotal;
  setupRaceScreen({ keepResults: Boolean(resultsOverlay && !resultsOverlay.hidden) });
  resetCar(gridSlot, gridTotal);
  paused = true;
  pauseStartedAt = null;
  syncPauseButton();
  message.textContent = "READY";
  message.classList.add("is-visible");
}

function updateRaceSession(payload = {}) {
  raceSession.id = payload.id ?? raceSession.id;
  raceSession.status = payload.status ?? raceSession.status;
  raceSession.startAt = Number.isFinite(Number(payload.startAt)) ? Number(payload.startAt) : raceSession.startAt;
  raceSession.participants = normalizeRaceParticipants(payload.participants);
  raceSession.results = normalizeRaceResults(payload.results);

  const participant = getSelfRaceParticipant();
  raceSession.mode = payload.viewerMode ?? (participant ? "participant" : "spectator");
  raceSession.gridSlot = participant?.gridSlot ?? payload.viewerGridSlot ?? raceSession.gridSlot ?? 0;
  raceSession.gridTotal = Math.max(raceSession.participants.length, 1);
}

function normalizeRaceParticipants(participants = []) {
  return (Array.isArray(participants) ? participants : [])
    .map((participant, index) => ({
      id: String(participant.id ?? ""),
      playerId: normalizeLeaderboardKey(participant.playerId ?? participant.key ?? participant.id),
      displayName: String(participant.displayName ?? participant.id ?? "PLAYER").trim().slice(0, 24) || "PLAYER",
      carId: String(participant.carId ?? "gt3").trim().slice(0, 24) || "gt3",
      gridSlot: Number.isFinite(Number(participant.gridSlot)) ? Number(participant.gridSlot) : index,
      finished: Boolean(participant.finished),
      finishTime: Number.isFinite(Number(participant.finishTime)) ? Number(participant.finishTime) : null,
    }))
    .filter((participant) => participant.id);
}

function normalizeRaceResults(results = []) {
  const records = [];
  for (const rawResult of Array.isArray(results) ? results : []) {
    const result = normalizeRaceResult(rawResult);
    if (result) records.push(result);
  }
  return records.sort(compareRaceResults);
}

function normalizeRaceResult(result = {}) {
  if (!result || typeof result !== "object") return null;

  const time = Number(result.time);
  if (!Number.isFinite(time) || time <= 0) return null;

  const socketId = String(result.id ?? "");
  const playerId = normalizeLeaderboardKey(result.playerId ?? result.key ?? result.id);
  return {
    id: socketId,
    playerId,
    displayName: String(result.displayName ?? result.id ?? "PLAYER").trim().slice(0, 24) || "PLAYER",
    carId: String(result.carId ?? "gt3").trim().slice(0, 24) || "gt3",
    time,
    finishedAt: Number.isFinite(Number(result.finishedAt)) ? Number(result.finishedAt) : Date.now(),
  };
}

function rememberRaceResult(result) {
  const existingIndex = raceSession.results.findIndex((entry) => entry.id === result.id || entry.playerId === result.playerId);
  if (existingIndex >= 0) raceSession.results.splice(existingIndex, 1, result);
  else raceSession.results.push(result);
  raceSession.results.sort(compareRaceResults);
}

function compareRaceResults(a, b) {
  return a.time - b.time || a.displayName.localeCompare(b.displayName);
}

function getSelfRaceParticipant() {
  return raceSession.participants.find((participant) => participant.id === multiplayer.selfId) ?? null;
}

function isRacePayloadForCurrentCourse(payload = {}) {
  return Boolean(payload && payload.courseId === selectedCourseId);
}

function enterSpectatorMode() {
  setupRaceScreen();
  paused = true;
  pauseStartedAt = null;
  raceFinished = false;
  raceSession.mode = "spectator";
  syncPauseButton();
  cameraRig.initialized = false;
  message.textContent = "SPECTATING";
  message.classList.add("is-visible");
}

function submitRaceFinish(finishTime) {
  if (!multiplayer.socket?.connected || !raceSession.id || raceSession.mode !== "participant") return;

  multiplayer.socket.emit("race:finish", {
    raceId: raceSession.id,
    courseId: selectedCourseId,
    finishTime,
  });
}

function createLocalRaceResult(finishTime) {
  return {
    id: multiplayer.selfId ?? currentPlayer?.key ?? "local",
    playerId: currentPlayer?.key ?? multiplayer.selfId ?? "local",
    displayName: currentPlayer?.id ?? "PLAYER",
    carId: selectedCarId,
    time: finishTime,
    finishedAt: Date.now(),
  };
}

function createOrUpdateRemotePlayer(player = {}) {
  if (!player.id || player.id === multiplayer.selfId) return;

  if (player.courseId && player.courseId !== selectedCourseId) {
    removeRemotePlayer(player.id);
    return;
  }

  const existing = remotePlayers.get(player.id);
  if (existing && existing.carId !== player.carId) {
    removeRemotePlayer(player.id);
  }

  let remote = remotePlayers.get(player.id);
  if (!remote) {
    const mesh = createCarMesh(CAR_MODELS[player.carId] ? player.carId : "gt3");
    mesh.userData.remotePlayerId = player.id;
    scene.add(mesh);

    remote = {
      id: player.id,
      carId: CAR_MODELS[player.carId] ? player.carId : "gt3",
      courseId: player.courseId ?? selectedCourseId,
      mesh,
      fromPosition: new THREE.Vector3(),
      targetPosition: new THREE.Vector3(),
      renderPosition: new THREE.Vector3(),
      fromQuaternion: new THREE.Quaternion(),
      targetQuaternion: new THREE.Quaternion(),
      renderQuaternion: new THREE.Quaternion(),
      interpolationStart: performance.now(),
      interpolationDuration: REMOTE_INTERPOLATION_MS,
      lastUpdateAt: performance.now(),
      velocity: new THREE.Vector3(),
      steering: 0,
      brake: 0,
      speed: 0,
      brakeTrailAccumulator: 0,
      brakeTrailLastPoints: [null, null],
      nameLabel: null,
    };
    remotePlayers.set(player.id, remote);
  }

  remote.displayName = player.displayName ?? "Guest";
  remote.courseId = player.courseId ?? selectedCourseId;
  updateRemoteNameLabel(remote, remote.displayName);
  if (player.state) applyRemoteState(remote, player.state, true);
  updateMultiplayerRoomStatus();
  updateMiniMap();
}

function handleRemotePlayerState(payload = {}) {
  if (!payload.id || payload.id === multiplayer.selfId) return;

  const payloadCourseId = payload.courseId ?? payload.state?.courseId;
  if (payloadCourseId !== selectedCourseId) {
    removeRemotePlayer(payload.id);
    return;
  }

  let remote = remotePlayers.get(payload.id);
  if (!remote) {
    createOrUpdateRemotePlayer({
      id: payload.id,
      displayName: payload.displayName,
      carId: payload.carId ?? "gt3",
      courseId: payloadCourseId,
      state: payload.state,
    });
    remote = remotePlayers.get(payload.id);
  }

  if (remote) applyRemoteState(remote, payload.state);
}

function applyRemoteState(remote, state = {}, immediate = false) {
  const position = new THREE.Vector3(state.position?.x ?? 0, state.position?.y ?? 0, state.position?.z ?? 0);
  const quaternion = new THREE.Quaternion(
    state.quaternion?.x ?? 0,
    state.quaternion?.y ?? 0,
    state.quaternion?.z ?? 0,
    state.quaternion?.w ?? 1,
  ).normalize();

  if (immediate) {
    remote.renderPosition.copy(position);
    remote.fromPosition.copy(position);
    remote.targetPosition.copy(position);
    remote.renderQuaternion.copy(quaternion);
    remote.fromQuaternion.copy(quaternion);
    remote.targetQuaternion.copy(quaternion);
    remote.mesh.position.copy(position);
    remote.mesh.quaternion.copy(quaternion);
  } else {
    remote.fromPosition.copy(remote.renderPosition);
    remote.fromQuaternion.copy(remote.renderQuaternion);
    remote.targetPosition.copy(position);
    remote.targetQuaternion.copy(quaternion);
  }

  remote.velocity.set(state.velocity?.x ?? 0, state.velocity?.y ?? 0, state.velocity?.z ?? 0);
  remote.steering = state.steering ?? 0;
  remote.brake = THREE.MathUtils.clamp(state.brake ?? 0, 0, 1);
  remote.speed = Math.max(0, state.speed ?? remote.velocity.length());
  remote.interpolationStart = performance.now();
  remote.interpolationDuration = REMOTE_INTERPOLATION_MS;
  remote.lastUpdateAt = performance.now();
}

function updateRemotePlayers(delta) {
  const now = performance.now();

  for (const remote of remotePlayers.values()) {
    const alpha = THREE.MathUtils.clamp(
      (now - remote.interpolationStart) / Math.max(remote.interpolationDuration, 1),
      0,
      1,
    );
    const smoothAlpha = alpha * alpha * (3 - 2 * alpha);
    remote.renderPosition.lerpVectors(remote.fromPosition, remote.targetPosition, smoothAlpha);
    remote.renderQuaternion.copy(remote.fromQuaternion).slerp(remote.targetQuaternion, smoothAlpha);
    remote.mesh.position.copy(remote.renderPosition);
    remote.mesh.quaternion.copy(remote.renderQuaternion);

    const visualRoot = remote.mesh.getObjectByName("carVisualRoot");
    if (visualRoot) {
      visualRoot.rotation.z = THREE.MathUtils.clamp(-remote.steering * 0.1, -0.06, 0.06);
    }

    emitRemoteBrakeLightTrails(remote, delta);
  }
}

function updateRemoteNameLabel(remote, displayName) {
  const safeName = String(displayName || "Guest").trim().slice(0, 24) || "Guest";
  if (remote.nameLabel?.userData?.labelText === safeName) return;

  if (remote.nameLabel) {
    remote.mesh.remove(remote.nameLabel);
    disposeObject3D(remote.nameLabel);
  }

  remote.nameLabel = createRemoteNameLabel(safeName);
  remote.mesh.add(remote.nameLabel);
}

function createRemoteNameLabel(displayName) {
  const texture = makeCanvasTexture(320, 88, (context, width, height) => {
    const name = String(displayName || "Guest").trim().slice(0, 24) || "Guest";
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(3, 7, 9, 0.78)";
    drawRoundedCanvasRect(context, 12, 16, width - 24, 52, 18);
    context.fill();
    context.strokeStyle = "rgba(255, 212, 90, 0.78)";
    context.lineWidth = 3;
    context.stroke();

    let fontSize = 30;
    do {
      context.font = `900 ${fontSize}px Inter, system-ui, sans-serif`;
      fontSize -= 1;
    } while (fontSize > 18 && context.measureText(name).width > width - 54);

    context.fillStyle = "#ffffff";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(name, width / 2, 43);
  });
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.name = "remotePlayerNameLabel";
  sprite.position.set(0, 2.45, 0);
  sprite.scale.set(3.4, 0.94, 1);
  sprite.renderOrder = 40;
  sprite.userData.labelText = displayName;
  return sprite;
}

function drawRoundedCanvasRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function removeRemotePlayer(id) {
  const remote = remotePlayers.get(id);
  if (!remote) return;

  scene.remove(remote.mesh);
  disposeObject3D(remote.mesh);
  remotePlayers.delete(id);
  lastVehicleCollisionAt.delete(id);
  updateMultiplayerRoomStatus();
  updateMiniMap();
}

function clearRemotePlayers() {
  for (const id of [...remotePlayers.keys()]) {
    removeRemotePlayer(id);
  }
}

function sendMultiplayerProfile() {
  if (!multiplayer.socket?.connected || !multiplayer.joined) return;

  multiplayer.socket.emit("multiplayer:updateProfile", {
    player: getMultiplayerProfile(),
  });
}

function sendMultiplayerState(force = false) {
  if (!multiplayer.socket?.connected || !multiplayer.joined) return;

  const now = performance.now();
  if (!force && now - multiplayer.lastSentAt < MULTIPLAYER_SEND_INTERVAL) return;

  multiplayer.lastSentAt = now;
  multiplayer.socket.emit("multiplayer:state", getMultiplayerState());
}

function getMultiplayerState() {
  return {
    courseId: selectedCourseId,
    raceId: raceSession.id,
    position: {
      x: chassisBody.position.x,
      y: chassisBody.position.y,
      z: chassisBody.position.z,
    },
    quaternion: {
      x: chassisBody.quaternion.x,
      y: chassisBody.quaternion.y,
      z: chassisBody.quaternion.z,
      w: chassisBody.quaternion.w,
    },
    velocity: {
      x: chassisBody.velocity.x,
      y: chassisBody.velocity.y,
      z: chassisBody.velocity.z,
    },
    steering: vehiclePhysics?.steeringAngle ?? steering,
    throttle: vehiclePhysics?.throttle ?? 0,
    brake: vehiclePhysics?.brake ?? 0,
    speed: chassisBody.velocity.length(),
    timestamp: Date.now(),
  };
}

function getMultiplayerProfile() {
  const fallbackId = multiplayer.selfId ? `guest-${multiplayer.selfId.slice(0, 5)}` : "guest";
  return {
    playerId: currentPlayer?.key ?? fallbackId,
    displayName: currentPlayer?.id ?? fallbackId,
    carId: selectedCarId,
    courseId: selectedCourseId,
  };
}

function getEnteredRoomId() {
  return sanitizeRoomId(roomIdInput?.value ?? multiplayer.roomId);
}

function sanitizeRoomId(value) {
  const roomId = String(value || "lobby").trim().slice(0, 32);
  return /^[A-Za-z0-9_-]+$/.test(roomId) ? roomId : "lobby";
}

function syncRoomUrl(roomId) {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  window.history.replaceState(null, "", url.toString());
}

function setMultiplayerStatus(text) {
  if (multiplayerStatus) multiplayerStatus.textContent = text;
}

function updateMultiplayerRoomStatus(totalPlayers = remotePlayers.size + (multiplayer.joined ? 1 : 0)) {
  if (!multiplayer.joined) {
    setMultiplayerStatus(multiplayer.connected ? "Connected" : "Offline");
    return;
  }

  setMultiplayerStatus(`${multiplayer.roomId} / ${totalPlayers}`);
}

function setupMenu() {
  updateSelectedCarUi();
  updateSelectedCourseUi();
  renderRankingsScreen();
  updateAuthUi();
  syncPauseButton();
  if (menuReturnButton) menuReturnButton.hidden = true;
  message.textContent = "READY";
  message.classList.add("is-visible");

  gameStartButton?.addEventListener("click", startGame);
  mainLoginButton?.addEventListener("click", () => showMenuScreen("login"));
  developersButton?.addEventListener("click", () => showMenuScreen("developers"));
  garageButton?.addEventListener("click", () => showMenuScreen("garage"));
  rankingsButton?.addEventListener("click", () => showMenuScreen("rankings"));
  joinRoomButton?.addEventListener("click", () => joinMultiplayerRoom(getEnteredRoomId()));
  authLoginButton?.addEventListener("click", () => showMenuScreen("login"));
  authSignupButton?.addEventListener("click", () => showMenuScreen("signup"));
  loginToSignupButton?.addEventListener("click", () => showMenuScreen("signup"));
  signupToLoginButton?.addEventListener("click", () => showMenuScreen("login"));
  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    loginPlayer();
  });
  signupForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    signUpPlayer();
  });
  authLogoutButton?.addEventListener("click", logoutPlayer);
  resultMenuButton?.addEventListener("click", returnToMenu);
  resultRetryButton?.addEventListener("click", retryRace);

  for (const button of menuBackButtons) {
    button.addEventListener("click", showMainMenu);
  }

  for (const option of garageOptions) {
    option.addEventListener("click", () => selectCar(option.dataset.carId));
  }

  for (const option of courseOptions) {
    option.addEventListener("click", () => selectCourse(option.dataset.courseId));
  }

  for (const option of rankingsCourseOptions) {
    option.addEventListener("click", () => selectRankingsCourse(option.dataset.rankingsCourseId));
  }

  if (URL_PARAMS.get("autostart") === "1" || window.location.hash.includes("autostart")) {
    window.setTimeout(startGame, 0);
  }
}

function startGame() {
  if (!currentPlayer) {
    showAuthStatus("Sign up or log in first.", true);
    message.textContent = "LOGIN";
    message.classList.add("is-visible");
    showMenuScreen("login");
    return;
  }

  requestRaceStart();
}

function showMenuScreen(screen) {
  blurActiveUiControl();
  if (mainMenu) mainMenu.classList.add("is-hidden");
  if (developersScreen) developersScreen.hidden = screen !== "developers";
  if (garageScreen) garageScreen.hidden = screen !== "garage";
  if (rankingsScreen) rankingsScreen.hidden = screen !== "rankings";
  if (loginScreen) loginScreen.hidden = screen !== "login";
  if (signupScreen) signupScreen.hidden = screen !== "signup";
  if (screen === "rankings") renderRankingsScreen();
  focusAuthScreen(screen);
}

function showMainMenu() {
  blurActiveUiControl();
  if (developersScreen) developersScreen.hidden = true;
  if (garageScreen) garageScreen.hidden = true;
  if (rankingsScreen) rankingsScreen.hidden = true;
  if (loginScreen) loginScreen.hidden = true;
  if (signupScreen) signupScreen.hidden = true;
  mainMenu?.classList.remove("is-hidden");
}

function returnToMenu() {
  if (isActiveRaceSession() && raceSession.mode === "participant") {
    multiplayer.socket?.emit("race:leave");
  }
  cancelRaceCountdown();
  hideResultsOverlay();
  resetRaceSession();
  menuActive = true;
  paused = true;
  raceFinished = false;
  pauseStartedAt = null;
  mouseControls.leftDown = false;
  mouseControls.rightDown = false;
  cameraOrbit.active = false;
  syncPauseButton();
  mainMenu?.classList.remove("is-hidden");
  if (developersScreen) developersScreen.hidden = true;
  if (garageScreen) garageScreen.hidden = true;
  if (rankingsScreen) rankingsScreen.hidden = true;
  if (menuReturnButton) menuReturnButton.hidden = true;
  window.clearTimeout(readyTimeout);
  message.textContent = "READY";
  message.classList.add("is-visible");
  if (rankingsScreen) rankingsScreen.hidden = true;
  if (loginScreen) loginScreen.hidden = true;
  if (signupScreen) signupScreen.hidden = true;
}

function retryRace() {
  if (!currentPlayer) {
    hideResultsOverlay();
    returnToMenu();
    showAuthStatus("Sign up or log in first.", true);
    return;
  }

  requestRaceStart();
}

function cancelRaceCountdown() {
  raceCountdownToken += 1;
  raceCountdownActive = false;
  controlsHint?.classList.remove("is-visible");
  if (controlsHint) controlsHint.hidden = true;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function startPreRaceSequence({ startAt = null } = {}) {
  const token = ++raceCountdownToken;
  raceCountdownActive = true;
  paused = true;
  pauseStartedAt = performance.now();
  syncPauseButton();
  window.clearTimeout(readyTimeout);

  if (controlsHint) {
    controlsHint.hidden = false;
    controlsHint.classList.add("is-visible");
  }

  if (Number.isFinite(startAt)) {
    const steps = [
      ["3", startAt - 3000],
      ["2", startAt - 2000],
      ["1", startAt - 1000],
      ["START!", startAt],
    ];

    for (const [text, targetTime] of steps) {
      await wait(Math.max(0, targetTime - Date.now()));
      if (token !== raceCountdownToken) return;
      message.textContent = text;
      message.classList.add("is-visible");
    }
  } else {
    const steps = [
      ["3", 800],
      ["2", 800],
      ["1", 800],
      ["START!", 520],
    ];

    for (const [text, duration] of steps) {
      if (token !== raceCountdownToken) return;
      message.textContent = text;
      message.classList.add("is-visible");
      await wait(duration);
    }
  }

  if (token !== raceCountdownToken) return;
  raceCountdownActive = false;
  if (controlsHint) {
    controlsHint.classList.remove("is-visible");
    controlsHint.hidden = true;
  }
  paused = false;
  pauseStartedAt = null;
  raceStartedAt = performance.now();
  lapStartedAt = raceStartedAt;
  if (raceSession.id) raceSession.status = "racing";
  syncPauseButton();
  readyTimeout = window.setTimeout(() => message.classList.remove("is-visible"), 700);
}

function selectCar(carId) {
  if (!CAR_MODELS[carId]) return;

  selectedCarId = carId;
  vehiclePhysicsConfig = getVehiclePhysicsConfig(selectedCarId);
  vehicle.configure(vehiclePhysicsConfig);
  vehiclePhysics = vehicle;
  resetDriftBoost(true);
  replaceWheelMeshes();
  replaceCarMesh();
  applyVehicleTuning();
  updateWheelStyle();
  updateSelectedCarUi();
  sendMultiplayerProfile();
}

function selectCourse(courseId) {
  if (!COURSE_DEFS[courseId] || courseId === selectedCourseId) return;

  const url = new URL(window.location.href);
  url.searchParams.set("track", courseId);
  url.searchParams.set("car", selectedCarId);
  url.searchParams.set("room", multiplayer.roomId);
  window.location.href = url.toString();
}

function replaceCarMesh() {
  if (carGroup) {
    scene.remove(carGroup);
    disposeObject3D(carGroup);
  }

  carGroup = createCarMesh(selectedCarId);
  scene.add(carGroup);
  carVisualMotion.initialized = false;
  for (const wheelMotion of wheelMeshMotion) {
    wheelMotion.initialized = false;
  }
}

function replaceWheelMeshes() {
  for (const wheel of wheelMeshes.splice(0)) {
    scene.remove(wheel);
    disposeObject3D(wheel);
  }

  for (let i = 0; i < vehicle.wheelInfos.length; i += 1) {
    wheelMeshes.push(createWheelVisual(vehiclePhysicsConfig, i, selectedCarId));
    wheelMeshMotion[i].initialized = false;
  }
}

function updateSelectedCarUi() {
  const selected = CAR_MODELS[selectedCarId];
  if (!selected) return;

  if (selectedCarName) selectedCarName.textContent = selected.name;
  if (selectedCarImage) {
    selectedCarImage.className = `garage-preview ${selected.previewClass}`;
  }

  for (const option of garageOptions) {
    option.classList.toggle("is-selected", option.dataset.carId === selectedCarId);
  }
}

function updateSelectedCourseUi() {
  const selected = COURSE_DEFS[selectedCourseId];
  if (!selected) return;

  if (selectedCourseName) {
    selectedCourseName.textContent = `${selected.menuLabel ?? selected.name} / ${selected.distanceLabel}`;
  }
  if (lapLabel) lapLabel.textContent = selected.loop ? "LAPS" : "RUN";

  for (const option of courseOptions) {
    const course = COURSE_DEFS[option.dataset.courseId];
    option.classList.toggle("is-selected", option.dataset.courseId === selectedCourseId);

    if (course) {
      const name = option.querySelector("strong");
      const distance = option.querySelector("small");
      if (name) name.textContent = course.menuLabel ?? course.name;
      if (distance) distance.textContent = course.distanceLabel;
    }
  }
}

function selectRankingsCourse(courseId) {
  if (!COURSE_DEFS[courseId]) return;

  rankingsCourseId = courseId;
  renderRankingsScreen();
}

function renderRankingsScreen() {
  if (!rankingsBody || !rankingsCarMix) return;

  const course = COURSE_DEFS[rankingsCourseId] ?? COURSE_DEFS[DEFAULT_COURSE_ID];
  rankingsCourseId = course.id;

  if (rankingsCourseName) {
    rankingsCourseName.textContent = `${course.name} / ${course.distanceLabel}`;
  }

  for (const option of rankingsCourseOptions) {
    const optionCourse = COURSE_DEFS[option.dataset.rankingsCourseId];
    option.classList.toggle("is-selected", option.dataset.rankingsCourseId === rankingsCourseId);
    if (optionCourse) option.textContent = optionCourse.menuLabel ?? optionCourse.name;
  }

  const records = getCourseLeaderboard(rankingsCourseId);
  rankingsBody.replaceChildren();
  rankingsCarMix.replaceChildren();

  if (!records.length) {
    const empty = document.createElement("div");
    empty.className = "leaderboard-empty";
    empty.textContent = "No records yet.";
    rankingsBody.append(empty);

    const carEmpty = document.createElement("div");
    carEmpty.className = "rankings-car-item";
    carEmpty.append(createTextElement("strong", "No cars recorded"), createTextElement("small", "Finish this course to add data."));
    rankingsCarMix.append(carEmpty);
    return;
  }

  const leaderTime = records[0].time;
  records.forEach((record, index) => {
    const row = document.createElement("div");
    row.className = "leaderboard-row rankings-row";
    row.classList.toggle("is-player", record.key === currentPlayer?.key);

    const gap = record.time - leaderTime;
    row.append(
      createTextElement("span", `#${index + 1}`),
      createTextElement("span", record.id ?? "PLAYER"),
      createTextElement("span", getCarName(record.carId)),
      createTextElement("span", formatTime(record.time)),
      createTextElement("span", gap <= 0 ? "--" : `+${formatTime(gap)}`),
    );
    rankingsBody.append(row);
  });

  const carCounts = new Map();
  for (const record of records) {
    const carId = record.carId ?? "unknown";
    carCounts.set(carId, (carCounts.get(carId) ?? 0) + 1);
  }

  for (const [carId, count] of [...carCounts.entries()].sort((a, b) => b[1] - a[1] || getCarName(a[0]).localeCompare(getCarName(b[0])))) {
    const item = document.createElement("div");
    item.className = "rankings-car-item";
    item.append(
      createTextElement("strong", getCarName(carId)),
      createTextElement("small", `${count} ${count === 1 ? "record" : "records"}`),
    );
    rankingsCarMix.append(item);
  }
}

function createTextElement(tagName, text) {
  const element = document.createElement(tagName);
  element.textContent = text;
  return element;
}

function getCarName(carId) {
  return CAR_MODELS[carId]?.name ?? "Unknown Car";
}

function updateWheelStyle() {
  const rimColor = CAR_MODELS[selectedCarId]?.rimColor ?? 0xc52d22;
  const brakeColor = CAR_MODELS[selectedCarId]?.brakeColor ?? 0xf5bf29;

  for (const wheel of wheelMeshes) {
    wheel.traverse((child) => {
      if (!child.isMesh || !child.material?.color) return;

      if (child.name === "wheelRim" || child.name === "wheelSpoke") {
        child.material.color.setHex(rimColor);
      }

      if (child.name === "wheelBrake" || child.name === "wheelCaliper") {
        child.material.color.setHex(brakeColor);
      }
    });
  }
}

function applyVehicleTuning() {
  vehicle.configure(getActivePhysicsConfig());
}

function disposeObject3D(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (material.map) material.map.dispose();
        material.dispose();
      }
    }
  });
}

function setupDebugTools() {
  const debugEnabled =
    new URLSearchParams(window.location.search).has("debug") ||
    window.location.hash.includes("debug");
  if (physicsDebug) physicsDebug.hidden = !debugEnabled;
  if (!debugEnabled) return;

  window.racingDebug = {
    getState() {
      const forward = new CANNON.Vec3(0, 0, 1);
      const rightVector = new CANNON.Vec3(1, 0, 0);
      chassisBody.vectorToWorldFrame(forward, forward);
      chassisBody.vectorToWorldFrame(rightVector, rightVector);
      forward.y = 0;
      rightVector.y = 0;
      forward.normalize();
      rightVector.normalize();
      const groundY = getTrackElevation(chassisBody.position.x, chassisBody.position.z);

      return {
        position: {
          x: chassisBody.position.x,
          y: chassisBody.position.y,
          z: chassisBody.position.z,
        },
        velocity: {
          x: chassisBody.velocity.x,
          y: chassisBody.velocity.y,
          z: chassisBody.velocity.z,
        },
        forwardSpeed: chassisBody.velocity.dot(forward),
        lateralSpeed: chassisBody.velocity.dot(rightVector),
        tractionGrip,
        rpm: vehiclePhysics.rpm,
        gear: vehiclePhysics.gear,
        throttle: vehiclePhysics.throttle,
        brake: vehiclePhysics.brake,
        steeringAngle: vehiclePhysics.steeringAngle,
        wheels: vehiclePhysics.wheels,
        groundY,
        heightAboveGround: chassisBody.position.y - groundY,
        angularVelocity: {
          x: chassisBody.angularVelocity.x,
          y: chassisBody.angularVelocity.y,
          z: chassisBody.angularVelocity.z,
        },
        grounded: isVehicleGrounded(),
      };
    },
  };
}

function togglePhysicsDebug() {
  if (!physicsDebug) return;
  physicsDebug.hidden = !physicsDebug.hidden;
}

function isMainMenuVisible() {
  return Boolean(mainMenu && !mainMenu.classList.contains("is-hidden"));
}

function isUiControlTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const control = target.closest("input, textarea, select, button");
  const editable = target.closest("[contenteditable]");
  return Boolean(control || (editable && editable.getAttribute("contenteditable") !== "false"));
}

function isTextEntryTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  const textControl = target.closest("input, textarea, select");
  const editable = target.closest("[contenteditable]");
  return Boolean(textControl || (editable && editable.getAttribute("contenteditable") !== "false"));
}

function blurActiveUiControl() {
  if (isUiControlTarget(document.activeElement)) {
    document.activeElement.blur();
  }
}

function focusAuthScreen(screen) {
  const target = screen === "login" ? loginIdInput : screen === "signup" ? signupIdInput : null;
  if (!target) return;

  window.setTimeout(() => {
    const isVisible =
      (screen === "login" && loginScreen && !loginScreen.hidden) ||
      (screen === "signup" && signupScreen && !signupScreen.hidden);
    if (isVisible) target.focus();
  }, 0);
}

function isDrivingKey(code) {
  return [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
    "Space",
    "KeyF",
    "ShiftLeft",
    "ShiftRight",
    "Enter",
  ].includes(code);
}

function isKeyboardDrivingControlKey(code) {
  return [
    "ArrowUp",
    "ArrowDown",
    "ArrowLeft",
    "ArrowRight",
    "KeyW",
    "KeyA",
    "KeyS",
    "KeyD",
  ].includes(code);
}

function applyInputDeadzone(value, deadzone = 0.08) {
  const magnitude = Math.abs(value);
  if (magnitude <= deadzone) return 0;
  return Math.sign(value) * ((magnitude - deadzone) / (1 - deadzone));
}

function updateGamepadControls() {
  gamepadControls.steer = 0;
  gamepadControls.throttle = 0;
  gamepadControls.brake = 0;
  gamepadControls.handbrake = false;

  if (!navigator.getGamepads) return gamepadControls;

  const pads = navigator.getGamepads();
  const pad = Array.from(pads).find((candidate) => candidate && candidate.connected);
  if (!pad) return gamepadControls;

  const leftStickX = applyInputDeadzone(pad.axes?.[0] ?? 0, 0.1);
  const rightTrigger = pad.buttons?.[7]?.value ?? Math.max(0, (pad.axes?.[5] ?? -1) * 0.5 + 0.5);
  const leftTrigger = pad.buttons?.[6]?.value ?? Math.max(0, (pad.axes?.[4] ?? -1) * 0.5 + 0.5);

  // Browser Gamepad API uses negative X for left, while this car's steering input uses positive left.
  gamepadControls.steer = THREE.MathUtils.clamp(-leftStickX, -1, 1);
  gamepadControls.throttle = THREE.MathUtils.clamp(rightTrigger, 0, 1);
  gamepadControls.brake = THREE.MathUtils.clamp(leftTrigger, 0, 1);
  gamepadControls.handbrake = Boolean(pad.buttons?.[0]?.pressed || pad.buttons?.[1]?.pressed);
  return gamepadControls;
}

function readDrivingInput(delta = FIXED_TIME_STEP) {
  const keyboardDrivingEnabled = !mouseControls.enabled;
  const left = keyboardDrivingEnabled && (keys.has("KeyA") || keys.has("ArrowLeft"));
  const right = keyboardDrivingEnabled && (keys.has("KeyD") || keys.has("ArrowRight"));
  const keyboardThrottle = keyboardDrivingEnabled && (keys.has("KeyW") || keys.has("ArrowUp"));
  const keyboardBrakeReverse = keyboardDrivingEnabled && (keys.has("KeyS") || keys.has("ArrowDown"));
  const gamepad = updateGamepadControls();
  const mouseThrottle = mouseControls.enabled && mouseControls.leftDown;
  const mouseBrake = mouseControls.enabled && mouseControls.rightDown;
  const throttlePedal = Math.max(keyboardThrottle ? 1 : 0, mouseThrottle ? 1 : 0, gamepad.throttle);
  const brakePedal = Math.max(keyboardBrakeReverse ? 1 : 0, mouseBrake ? 1 : 0, gamepad.brake);
  const handbrake = keys.has("Space") || gamepad.handbrake;
  const boost = keys.has("ShiftLeft") && isDriftBoostCar();
  const keyboardSteerInput = (left ? -1 : 0) + (right ? 1 : 0);
  const gamepadSteerInput = Math.abs(gamepad.steer) > 0.04 ? gamepad.steer : 0;
  const steerSource = mouseControls.enabled || gamepadSteerInput ? "analog" : "keyboard";
  const rawSteerInput = THREE.MathUtils.clamp(
    mouseControls.enabled ? mouseControls.steer : (gamepadSteerInput || keyboardSteerInput),
    -1,
    1,
  );
  const steerInput = smoothSteerInput(applySteeringInputCurve(rawSteerInput, steerSource), delta, steerSource);

  return {
    steer: steerInput,
    throttle: throttlePedal,
    brake: brakePedal,
    handbrake,
    boost,
    boostPower: 0,
  };
}

function applySteeringInputCurve(value, source) {
  const magnitude = Math.abs(value);
  if (magnitude <= 0.001) return 0;

  const curve = STEERING_INPUT_CURVE[source] ?? STEERING_INPUT_CURVE.keyboard;
  return Math.sign(value) * Math.pow(magnitude, curve);
}

function smoothSteerInput(rawSteerInput, delta, source) {
  const current = steeringInputState.value;
  const returningToCenter =
    Math.abs(rawSteerInput) < Math.abs(current) ||
    (Math.sign(rawSteerInput) !== Math.sign(current) && Math.abs(current) > 0.01);
  const response = returningToCenter
    ? STEERING_INPUT_RESPONSE.return
    : STEERING_INPUT_RESPONSE[source] ?? STEERING_INPUT_RESPONSE.keyboard;
  const blend = 1 - Math.exp(-response * delta);

  steeringInputState.value = THREE.MathUtils.lerp(current, rawSteerInput, blend);
  if (Math.abs(rawSteerInput) < 0.001 && Math.abs(steeringInputState.value) < 0.01) {
    steeringInputState.value = 0;
  }

  return THREE.MathUtils.clamp(steeringInputState.value, -1, 1);
}

function updateControls(delta) {
  const drivingInput = readDrivingInput(delta);
  prepareBoostInput(drivingInput);
  vehicle.updatePhysics(delta, drivingInput);
  syncVehicleDynamicsFromPhysics(delta);
  updateDriftBoost(delta, drivingInput);
  handleMultiplayerVehicleCollisions();

  if (chassisBody.position.y < getFallResetY()) {
    resetCar();
  }
}

function getFallResetY() {
  if (Number.isFinite(activeCourse.fallResetY)) return activeCourse.fallResetY;
  const minElevation = activeCourse.elevationBounds?.min ?? -4;
  return minElevation - 6;
}

function prepareBoostInput(input) {
  if (!isDriftBoostCar() || driftBoostCharge < DRIFT_BOOST_CHARGE_MIN) {
    input.boost = false;
    input.boostPower = 0;
    return;
  }

  input.boost = Boolean(input.boost);
  input.boostPower = input.boost ? THREE.MathUtils.clamp(driftBoostCharge, 0, 1) : 0;
}

function updateDriftBoost(delta, input) {
  if (!isDriftBoostCar()) {
    resetDriftBoost();
    return;
  }

  const speed = Math.abs(vehicleDynamics.signedSpeed);
  const usingBoost = Boolean(input.boost && input.boostPower > 0);
  const isChargingDrift = driftAmount > 0.18 && vehicleDynamics.grounded && speed > 8;

  if (usingBoost) {
    const drainRate = THREE.MathUtils.lerp(DRIFT_BOOST_DRAIN_MIN, DRIFT_BOOST_DRAIN_MAX, input.boostPower);
    driftBoostCharge = Math.max(0, driftBoostCharge - drainRate * delta);
    boostAmount = input.boostPower;
  } else {
    boostAmount = Math.max(0, boostAmount - delta * 4);
  }

  if (isChargingDrift && !usingBoost) {
    const speedCharge = THREE.MathUtils.lerp(0.13, 0.32, THREE.MathUtils.clamp(speed / 34, 0, 1));
    const handbrakeBonus = input.handbrake ? 1.25 : 1;
    driftBoostCharge = Math.min(1, driftBoostCharge + speedCharge * driftAmount * handbrakeBonus * delta);
  }
}

function resetDriftBoost(fill = false) {
  driftBoostCharge = fill && isDriftBoostCar() ? 1 : 0;
  boostAmount = 0;
}

function syncVehicleDynamicsFromPhysics(delta) {
  const forward = new CANNON.Vec3(0, 0, 1);
  const rightVector = new CANNON.Vec3(1, 0, 0);
  chassisBody.vectorToWorldFrame(forward, forward);
  chassisBody.vectorToWorldFrame(rightVector, rightVector);
  forward.y = 0;
  rightVector.y = 0;
  if (forward.lengthSquared() > 0.0001) forward.normalize();
  if (rightVector.lengthSquared() > 0.0001) rightVector.normalize();

  const grounded = vehicle.grounded;
  const signedSpeed = vehicle.signedSpeed;

  steering = vehicle.steeringAngle;
  driveInput = vehicle.driveInput;
  tireSlip = THREE.MathUtils.clamp(vehicle.averageSlip, 0, 1.6);
  driftAmount = THREE.MathUtils.clamp(
    Math.max((vehicle.averageSlip - 0.14) * 0.85, vehicle.driftFactor ?? 0),
    0,
    1,
  );
  tractionGrip = THREE.MathUtils.clamp(1 - Math.max(0, vehicle.averageSlip - 0.45) * 0.32, 0.46, 1);

  vehicleDynamics.braking = vehicle.brake > 0.05 && Math.abs(signedSpeed) > 0.8;
  vehicleDynamics.throttle = Math.abs(vehicle.driveInput) > 0.05;
  vehicleDynamics.reverse = vehicle.gear < 0 && vehicle.driveInput < -0.05;
  vehicleDynamics.handbrake = vehicle.handbrakeActive;
  vehicleDynamics.grounded = grounded;
  vehicleDynamics.signedSpeed = signedSpeed;
  vehicleDynamics.lateralVelocity = vehicle.lateralVelocity ?? vehicle.lateralSpeed ?? 0;
  vehicleDynamics.slipAngle = vehicle.slipAngle ?? 0;
  vehicleDynamics.driftFactor = vehicle.driftFactor ?? driftAmount;
  vehicleDynamics.rearGrip = vehicle.rearGrip ?? 1;
  vehicleDynamics.frontGrip = vehicle.frontGrip ?? 1;
  vehicleDynamics.airborneTime = grounded ? 0 : vehicleDynamics.airborneTime + delta;
  vehicleDynamics.airborneFallSpeed = grounded
    ? vehicleDynamics.airborneFallSpeed
    : Math.max(vehicleDynamics.airborneFallSpeed, -chassisBody.velocity.y);
  vehicleDynamics.lastGroundedSpeed = grounded ? signedSpeed : vehicleDynamics.lastGroundedSpeed;
  vehicleDynamics.lastSteering = steering;
  vehicleDynamics.lastForward.copy(forward);
  vehicleDynamics.lastRight.copy(rightVector);
  vehicleDynamics.surfaceGrip = getSurfaceGripAt(chassisBody.position.x, chassisBody.position.z);
  tunedDamperState.heave = chassisBody.velocity.y;
  tunedDamperState.pitch = chassisBody.angularVelocity.x;
  tunedDamperState.roll = chassisBody.angularVelocity.z;
}

function isVehicleGrounded() {
  return vehicle?.grounded ?? false;
}

function updateVehicleMeshes(delta) {
  const targetPosition = new THREE.Vector3(chassisBody.position.x, chassisBody.position.y, chassisBody.position.z);
  const targetQuaternion = new THREE.Quaternion(
    chassisBody.quaternion.x,
    chassisBody.quaternion.y,
    chassisBody.quaternion.z,
    chassisBody.quaternion.w,
  );
  const inverseTargetQuaternion = targetQuaternion.clone().invert();

  updateSmoothedChassisPose(targetPosition, targetQuaternion, delta);
  carGroup.position.copy(carVisualMotion.position);
  carGroup.quaternion.copy(carVisualMotion.quaternion);

  for (let i = 0; i < vehicle.wheelInfos.length; i += 1) {
    vehicle.updateWheelTransform(i);
    const transform = vehicle.wheelInfos[i].worldTransform;
    const targetWheelPosition = new THREE.Vector3(
      transform.position.x,
      transform.position.y,
      transform.position.z,
    );
    const targetWheelQuaternion = new THREE.Quaternion(
      transform.quaternion.x,
      transform.quaternion.y,
      transform.quaternion.z,
      transform.quaternion.w,
    );
    const localWheelPosition = targetWheelPosition
      .clone()
      .sub(targetPosition)
      .applyQuaternion(inverseTargetQuaternion);
    const localWheelQuaternion = inverseTargetQuaternion.clone().multiply(targetWheelQuaternion);
    const wheelState = wheelMeshMotion[i];

    if (!wheelState.initialized) {
      wheelState.initialized = true;
      wheelState.localPosition.copy(localWheelPosition);
      wheelState.localQuaternion.copy(localWheelQuaternion);
    } else {
      const wheelBlend = 1 - Math.exp(-WHEEL_VISUAL_FILTER.response * delta);
      wheelState.localPosition.lerp(localWheelPosition, wheelBlend);
      keepVectorNearTarget(wheelState.localPosition, localWheelPosition, WHEEL_VISUAL_FILTER.maxLocalLag);
      wheelState.localQuaternion.slerp(localWheelQuaternion, wheelBlend);
      keepQuaternionNearTarget(
        wheelState.localQuaternion,
        localWheelQuaternion,
        WHEEL_VISUAL_FILTER.maxRotationLag,
      );
    }

    wheelState.position
      .copy(wheelState.localPosition)
      .applyQuaternion(carVisualMotion.quaternion)
      .add(carVisualMotion.position);
    wheelState.quaternion.copy(carVisualMotion.quaternion).multiply(wheelState.localQuaternion).normalize();
    wheelMeshes[i].position.copy(wheelState.position);
    wheelMeshes[i].quaternion.copy(wheelState.quaternion);
  }

  updateSuspensionVisual(delta);
  updateTunedMassVisual();
  emitDriftTireMarks(delta);
  emitBrakeLightTrails(delta);
  emitBoostSpeedStreaks(delta);
  emitDriftSmoke(delta);
  updateDriftTireMarks(delta);
  updateBrakeLightTrails(delta);
  updateBoostSpeedStreaks(delta);
  updateDriftSmoke(delta);
  updateWallSparks(delta);
  updateVehicleCollisionDebris(delta);
  updateDriftLabel(delta);
}

function updateSmoothedChassisPose(targetPosition, targetQuaternion, delta) {
  if (!carVisualMotion.initialized) {
    carVisualMotion.initialized = true;
    carVisualMotion.position.copy(targetPosition);
    carVisualMotion.quaternion.copy(targetQuaternion);
    carVisualMotion.velocity.set(chassisBody.velocity.x, chassisBody.velocity.y, chassisBody.velocity.z);
    return;
  }

  const positionError = targetPosition.clone().sub(carVisualMotion.position);
  if (positionError.lengthSq() > CHASSIS_VISUAL_FILTER.snapDistance ** 2) {
    carVisualMotion.position.copy(targetPosition);
    carVisualMotion.quaternion.copy(targetQuaternion);
    carVisualMotion.velocity.set(chassisBody.velocity.x, chassisBody.velocity.y, chassisBody.velocity.z);
    return;
  }

  const integrationDelta = paused ? 0 : THREE.MathUtils.clamp(delta, 0, 1 / 30);
  const chassisVelocity = new THREE.Vector3(
    chassisBody.velocity.x,
    chassisBody.velocity.y,
    chassisBody.velocity.z,
  );
  carVisualMotion.velocity.copy(chassisVelocity);
  carVisualMotion.position.addScaledVector(carVisualMotion.velocity, integrationDelta);
  correctSeparatedBodyPosition(targetPosition, targetQuaternion, delta);

  const speed = chassisBody.velocity.length();
  const speedFactor = smoothstep(4, getMaxForwardSpeed(), speed);
  const rotationResponse = THREE.MathUtils.lerp(
    CHASSIS_VISUAL_FILTER.minRotationResponse,
    CHASSIS_VISUAL_FILTER.maxRotationResponse,
    speedFactor,
  );

  carVisualMotion.quaternion.slerp(targetQuaternion, 1 - Math.exp(-rotationResponse * delta));
  keepQuaternionNearTarget(
    carVisualMotion.quaternion,
    targetQuaternion,
    CHASSIS_VISUAL_FILTER.maxRotationLag,
  );
}

function correctSeparatedBodyPosition(targetPosition, targetQuaternion, delta) {
  const error = targetPosition.clone().sub(carVisualMotion.position);
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(targetQuaternion);
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(targetQuaternion);
  forward.y = 0;
  right.y = 0;
  if (forward.lengthSq() < 0.0001 || right.lengthSq() < 0.0001) return;

  forward.normalize();
  right.normalize();

  const forwardCorrection = getBodyAxisCorrection(
    error.dot(forward),
    CHASSIS_VISUAL_FILTER.forwardCorrectionResponse,
    CHASSIS_VISUAL_FILTER.maxForwardSeparation,
    delta,
  );
  const lateralCorrection = getBodyAxisCorrection(
    error.dot(right),
    CHASSIS_VISUAL_FILTER.lateralCorrectionResponse,
    CHASSIS_VISUAL_FILTER.maxLateralSeparation,
    delta,
  );
  const verticalCorrection = getBodyAxisCorrection(
    error.y,
    CHASSIS_VISUAL_FILTER.verticalCorrectionResponse,
    CHASSIS_VISUAL_FILTER.maxVerticalSeparation,
    delta,
  );

  carVisualMotion.position.addScaledVector(forward, forwardCorrection);
  carVisualMotion.position.addScaledVector(right, lateralCorrection);
  carVisualMotion.position.y += verticalCorrection;
}

function getBodyAxisCorrection(error, response, maxSeparation, delta) {
  const correction = error * (1 - Math.exp(-response * delta));
  const remaining = error - correction;
  if (Math.abs(remaining) <= maxSeparation) return correction;

  return correction + Math.sign(remaining) * (Math.abs(remaining) - maxSeparation);
}

function keepVectorNearTarget(vector, target, maxDistance) {
  const offset = target.clone().sub(vector);
  const distance = offset.length();
  if (distance <= maxDistance || distance <= 0.00001) return;

  vector.copy(target).addScaledVector(offset.multiplyScalar(1 / distance), -maxDistance);
}

function keepQuaternionNearTarget(quaternion, target, maxAngle) {
  const angle = quaternion.angleTo(target);
  if (angle <= maxAngle || angle <= 0.00001) {
    quaternion.normalize();
    return;
  }

  quaternion.slerp(target, 1 - maxAngle / angle);
  quaternion.normalize();
}

function getHorizontalVehicleForward() {
  const forward = new THREE.Vector3(vehicleDynamics.lastForward.x, 0, vehicleDynamics.lastForward.z);
  if (forward.lengthSq() < 0.0001) {
    forward.set(0, 0, 1).applyQuaternion(carVisualMotion.quaternion);
    forward.y = 0;
  }
  return forward.lengthSq() > 0.0001 ? forward.normalize() : new THREE.Vector3(0, 0, 1);
}

function getHorizontalVehicleRight() {
  const right = new THREE.Vector3(vehicleDynamics.lastRight.x, 0, vehicleDynamics.lastRight.z);
  if (right.lengthSq() < 0.0001) {
    right.set(1, 0, 0).applyQuaternion(carVisualMotion.quaternion);
    right.y = 0;
  }
  return right.lengthSq() > 0.0001 ? right.normalize() : new THREE.Vector3(1, 0, 0);
}

function getHorizontalTravelDirection() {
  const velocity = new THREE.Vector3(chassisBody.velocity.x, 0, chassisBody.velocity.z);
  return velocity.lengthSq() > 0.01 ? velocity.normalize() : getHorizontalVehicleForward();
}

function getYawQuaternion(direction) {
  const yaw = Math.atan2(direction.x, direction.z);
  return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
}

function setGroundEffectHeight(mesh, offset = 0.025) {
  mesh.position.y = getTrackElevation(mesh.position.x, mesh.position.z) + TRACK_SURFACE_OFFSET + offset;
}

function disposeEffectMesh(mesh, disposeGeometry = false) {
  scene.remove(mesh);
  if (disposeGeometry) mesh.geometry.dispose();
  if (Array.isArray(mesh.material)) {
    for (const material of mesh.material) material.dispose();
  } else {
    mesh.material.dispose();
  }
}

function trimEffectArray(array, maxCount) {
  while (array.length > maxCount) {
    disposeEffectMesh(array.shift());
  }
}

function emitDriftTireMarks(delta) {
  const speedAbs = Math.abs(vehicleDynamics.signedSpeed);
  const shouldMark = !paused && driftAmount > 0.18 && vehicleDynamics.grounded && speedAbs > 5.8;
  if (!shouldMark) {
    tireMarkAccumulator = Math.min(tireMarkAccumulator, 0.4);
    return;
  }

  const speedFactor = THREE.MathUtils.clamp(speedAbs / 32, 0, 1);
  tireMarkAccumulator += delta * THREE.MathUtils.lerp(10, 24, Math.max(driftAmount, speedFactor));

  let emitted = 0;
  while (tireMarkAccumulator >= 1 && emitted < 4) {
    tireMarkAccumulator -= 1;
    createTireMarkSegment(2, speedFactor);
    createTireMarkSegment(3, speedFactor);
    emitted += 1;
  }
  trimEffectArray(tireMarkSegments, 430);
}

function createTireMarkSegment(wheelIndex, speedFactor) {
  const wheel = wheelMeshes[wheelIndex];
  if (!wheel) return;

  const direction = getHorizontalTravelDirection();
  const material = new THREE.MeshBasicMaterial({
    color: 0x050505,
    transparent: true,
    opacity: THREE.MathUtils.lerp(0.22, 0.42, driftAmount),
    depthWrite: false,
  });
  const mark = new THREE.Mesh(TIRE_MARK_GEOMETRY, material);

  mark.position.copy(wheel.position);
  mark.position.addScaledVector(direction, -0.18 - Math.random() * 0.2);
  setGroundEffectHeight(mark, 0.024);
  mark.quaternion.copy(getYawQuaternion(direction));
  mark.rotation.y += (Math.random() - 0.5) * 0.08;
  mark.scale.set(
    THREE.MathUtils.lerp(0.72, 1.18, driftAmount),
    1,
    THREE.MathUtils.lerp(0.72, 1.5, speedFactor),
  );
  mark.renderOrder = 9;
  mark.userData.age = 0;
  mark.userData.hold = TIRE_MARK_HOLD_SECONDS;
  mark.userData.fade = TIRE_MARK_FADE_SECONDS;
  mark.userData.initialOpacity = mark.material.opacity;

  tireMarkSegments.push(mark);
  scene.add(mark);
}

function updateDriftTireMarks(delta) {
  updateFadingMeshList(tireMarkSegments, delta);
}

function emitBrakeLightTrails(delta) {
  const speedAbs = Math.abs(vehicleDynamics.signedSpeed);
  const brakeTrail = vehicleDynamics.braking && speedAbs > 2.2;
  if (paused || !brakeTrail) {
    resetBrakeTrailAnchors();
    return;
  }

  const intensity = THREE.MathUtils.lerp(0.52, 1, THREE.MathUtils.clamp(vehiclePhysics.brake ?? 0, 0, 1));
  brakeTrailAccumulator += delta * THREE.MathUtils.lerp(12, 26, intensity);
  if (brakeTrailAccumulator < 1) return;

  brakeTrailAccumulator -= Math.floor(brakeTrailAccumulator);
  createBrakeLightTrail(-1, intensity);
  createBrakeLightTrail(1, intensity);
  trimEffectArray(brakeLightTrails, BRAKE_TRAIL_MAX_SEGMENTS);
}

function getBrakeTrailIndex(side) {
  return side < 0 ? 0 : 1;
}

function resetBrakeTrailAnchors() {
  brakeTrailAccumulator = 0;
  brakeTrailLastPoints[0] = null;
  brakeTrailLastPoints[1] = null;
}

function getBrakeLightWorldPosition(side) {
  const forward = getHorizontalVehicleForward();
  const right = getHorizontalVehicleRight();
  const rearLight = carVisualMotion.position
    .clone()
    .addScaledVector(right, side * 0.62)
    .addScaledVector(forward, -2.12);
  rearLight.y += 0.42;
  return rearLight;
}

function createBrakeLightTrail(side, intensity) {
  const index = getBrakeTrailIndex(side);
  const current = getBrakeLightWorldPosition(side);
  const previous = brakeTrailLastPoints[index];
  brakeTrailLastPoints[index] = current.clone();
  if (!previous) return;

  createBrakeLightTrailSegment(previous, current, side, intensity, getHorizontalVehicleForward());
}

function emitRemoteBrakeLightTrails(remote, delta) {
  const brakeTrail = remote.brake > 0.05 && remote.speed > 2.2;
  if (paused || !brakeTrail) {
    resetRemoteBrakeTrailAnchors(remote);
    return;
  }

  const intensity = THREE.MathUtils.lerp(0.52, 1, THREE.MathUtils.clamp(remote.brake, 0, 1));
  remote.brakeTrailAccumulator += delta * THREE.MathUtils.lerp(12, 26, intensity);
  if (remote.brakeTrailAccumulator < 1) return;

  remote.brakeTrailAccumulator -= Math.floor(remote.brakeTrailAccumulator);
  createRemoteBrakeLightTrail(remote, -1, intensity);
  createRemoteBrakeLightTrail(remote, 1, intensity);
  trimEffectArray(brakeLightTrails, BRAKE_TRAIL_MAX_SEGMENTS);
}

function resetRemoteBrakeTrailAnchors(remote) {
  remote.brakeTrailAccumulator = 0;
  remote.brakeTrailLastPoints[0] = null;
  remote.brakeTrailLastPoints[1] = null;
}

function createRemoteBrakeLightTrail(remote, side, intensity) {
  const index = getBrakeTrailIndex(side);
  const forward = getRemoteHorizontalForward(remote);
  const current = getRemoteBrakeLightWorldPosition(remote, side, forward);
  const previous = remote.brakeTrailLastPoints[index];
  remote.brakeTrailLastPoints[index] = current.clone();
  if (!previous) return;

  createBrakeLightTrailSegment(previous, current, side, intensity, forward);
}

function getRemoteBrakeLightWorldPosition(remote, side, forward = getRemoteHorizontalForward(remote)) {
  const right = getRemoteHorizontalRight(remote);
  const rearLight = remote.renderPosition
    .clone()
    .addScaledVector(right, side * 0.62)
    .addScaledVector(forward, -2.12);
  rearLight.y += 0.42;
  return rearLight;
}

function getRemoteHorizontalForward(remote) {
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(remote.renderQuaternion);
  forward.y = 0;
  return forward.lengthSq() > 0.0001 ? forward.normalize() : new THREE.Vector3(0, 0, 1);
}

function getRemoteHorizontalRight(remote) {
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(remote.renderQuaternion);
  right.y = 0;
  return right.lengthSq() > 0.0001 ? right.normalize() : new THREE.Vector3(1, 0, 0);
}

function createBrakeLightTrailSegment(previous, current, side, intensity, fallbackDirection = null) {
  const segment = current.clone().sub(previous);
  const length = segment.length();
  if (length < 0.045) return;

  const horizontalSegment = new THREE.Vector3(segment.x, 0, segment.z);
  const direction = horizontalSegment.lengthSq() > 0.0001
    ? horizontalSegment.normalize()
    : fallbackDirection?.lengthSq() > 0.0001
      ? fallbackDirection.clone().normalize()
      : getHorizontalVehicleForward();

  const trail = new THREE.Mesh(
    BRAKE_TRAIL_GEOMETRY,
    new THREE.MeshBasicMaterial({
      color: side < 0 ? 0xff2e24 : 0xff4934,
      transparent: true,
      opacity: THREE.MathUtils.lerp(0.34, 0.72, intensity),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  trail.position.copy(previous).lerp(current, 0.5);
  trail.quaternion.copy(getYawQuaternion(direction));
  trail.scale.set(
    THREE.MathUtils.lerp(0.75, 1.18, intensity),
    1,
    Math.max(length, 0.12),
  );
  trail.renderOrder = 12;
  trail.userData.age = 0;
  trail.userData.hold = BRAKE_TRAIL_HOLD_SECONDS;
  trail.userData.fade = BRAKE_TRAIL_FADE_SECONDS;
  trail.userData.initialOpacity = trail.material.opacity;

  brakeLightTrails.push(trail);
  scene.add(trail);
}

function updateBrakeLightTrails(delta) {
  updateFadingMeshList(brakeLightTrails, delta);
}

function emitBoostSpeedStreaks(delta) {
  if (paused || boostAmount < 0.04) {
    boostStreakAccumulator = Math.min(boostStreakAccumulator, 0.4);
    return;
  }

  boostStreakAccumulator += delta * THREE.MathUtils.lerp(34, 92, boostAmount);
  let emitted = 0;
  while (boostStreakAccumulator >= 1 && emitted < 10) {
    boostStreakAccumulator -= 1;
    createBoostSpeedStreak(false);
    if (Math.random() < 0.72) createBoostSpeedStreak(true);
    if (Math.random() < 0.9) createBoostScreenStreak();
    if (Math.random() < 0.42) createBoostScreenStreak(true);
    emitted += 1;
  }
  trimEffectArray(boostSpeedStreaks, 440);
}

function createBoostSpeedStreak(background = false) {
  const forward = getHorizontalVehicleForward();
  const right = getHorizontalVehicleRight();
  const speedAbs = Math.abs(vehicleDynamics.signedSpeed);
  const color = BOOST_STREAK_COLORS[Math.floor(Math.random() * BOOST_STREAK_COLORS.length)];
  const sideSign = Math.random() < 0.5 ? -1 : 1;
  const side = background
    ? sideSign * THREE.MathUtils.lerp(5.5, 32, Math.random())
    : (Math.random() - 0.5) * 2.9;
  const longitudinal = background
    ? THREE.MathUtils.lerp(-28, 58, Math.random())
    : THREE.MathUtils.lerp(-2.3, 1.6, Math.random());
  const height = background
    ? THREE.MathUtils.lerp(0.7, 12, Math.random())
    : THREE.MathUtils.lerp(0.32, 1.3, Math.random());
  const lengthScale = background
    ? THREE.MathUtils.lerp(3.1, 7.4, boostAmount)
    : THREE.MathUtils.lerp(0.85, 2.25, boostAmount);

  const streak = new THREE.Mesh(
    BOOST_STREAK_GEOMETRY,
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: background
        ? THREE.MathUtils.lerp(0.24, 0.58, boostAmount)
        : THREE.MathUtils.lerp(0.42, 0.88, boostAmount),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  streak.position
    .copy(carVisualMotion.position)
    .addScaledVector(right, side)
    .addScaledVector(forward, longitudinal);
  streak.position.y += height;
  streak.quaternion.copy(getYawQuaternion(forward));
  streak.scale.setScalar(background ? THREE.MathUtils.lerp(1.15, 1.85, Math.random()) : 1);
  streak.scale.z = lengthScale;
  streak.renderOrder = 13;
  streak.userData.initialOpacity = streak.material.opacity;
  streak.userData.life = background
    ? THREE.MathUtils.lerp(0.46, 0.72, Math.random())
    : THREE.MathUtils.lerp(0.28, 0.48, Math.random());
  streak.userData.maxLife = streak.userData.life;
  streak.userData.velocity = forward
    .clone()
    .multiplyScalar(
      background
        ? -(38 + Math.random() * 52 + speedAbs * 0.72)
        : -(24 + Math.random() * 34 + speedAbs * 0.58),
    )
    .addScaledVector(right, (Math.random() - 0.5) * (background ? 9 : 4));

  boostSpeedStreaks.push(streak);
  scene.add(streak);
}

function createBoostScreenStreak(farLayer = false) {
  const forward = getHorizontalVehicleForward();
  const right = getHorizontalVehicleRight();
  const cameraForward = new THREE.Vector3();
  camera.getWorldDirection(cameraForward);
  const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
  const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
  const speedAbs = Math.abs(vehicleDynamics.signedSpeed);
  const color = BOOST_STREAK_COLORS[Math.floor(Math.random() * BOOST_STREAK_COLORS.length)];
  const depth = farLayer
    ? THREE.MathUtils.lerp(42, 118, Math.random())
    : THREE.MathUtils.lerp(16, 74, Math.random());
  const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) * depth;
  const visibleWidth = visibleHeight * camera.aspect;
  const screenX = (Math.random() - 0.5) * visibleWidth * (farLayer ? 1.35 : 1.18);
  const verticalBias = Math.random() < 0.58 ? THREE.MathUtils.lerp(-0.48, 0.04, Math.random()) : THREE.MathUtils.lerp(0.04, 0.62, Math.random());
  const screenY = verticalBias * visibleHeight;
  const lengthScale = farLayer
    ? THREE.MathUtils.lerp(4.6, 10.5, boostAmount)
    : THREE.MathUtils.lerp(2.6, 7.8, boostAmount);

  const streak = new THREE.Mesh(
    BOOST_STREAK_GEOMETRY,
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: farLayer
        ? THREE.MathUtils.lerp(0.16, 0.42, boostAmount)
        : THREE.MathUtils.lerp(0.24, 0.62, boostAmount),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  streak.position
    .copy(camera.position)
    .addScaledVector(cameraForward, depth)
    .addScaledVector(cameraRight, screenX)
    .addScaledVector(cameraUp, screenY);
  streak.position.addScaledVector(right, (Math.random() - 0.5) * (farLayer ? 9 : 5));
  streak.quaternion.copy(getYawQuaternion(forward));
  streak.rotation.y += (Math.random() - 0.5) * 0.14;
  streak.scale.set(
    farLayer ? THREE.MathUtils.lerp(1.4, 2.4, Math.random()) : THREE.MathUtils.lerp(1, 1.65, Math.random()),
    1,
    lengthScale,
  );
  streak.renderOrder = 13;
  streak.userData.initialOpacity = streak.material.opacity;
  streak.userData.life = farLayer
    ? THREE.MathUtils.lerp(0.52, 0.9, Math.random())
    : THREE.MathUtils.lerp(0.36, 0.68, Math.random());
  streak.userData.maxLife = streak.userData.life;
  streak.userData.velocity = forward
    .clone()
    .multiplyScalar(-(42 + Math.random() * 74 + speedAbs * (farLayer ? 0.88 : 0.72)))
    .addScaledVector(right, (Math.random() - 0.5) * (farLayer ? 14 : 8));

  boostSpeedStreaks.push(streak);
  scene.add(streak);
}

function updateBoostSpeedStreaks(delta) {
  for (let i = boostSpeedStreaks.length - 1; i >= 0; i -= 1) {
    const streak = boostSpeedStreaks[i];
    streak.userData.life -= delta;
    streak.position.addScaledVector(streak.userData.velocity, delta);
    streak.material.opacity =
      Math.max(0, streak.userData.life / streak.userData.maxLife) *
      (streak.userData.initialOpacity ?? 0.82);
    streak.scale.z *= 1 + delta * 2.4;

    if (streak.userData.life <= 0) {
      disposeEffectMesh(streak);
      boostSpeedStreaks.splice(i, 1);
    }
  }
}

function updateFadingMeshList(meshes, delta, moveWithVelocity = false) {
  for (let i = meshes.length - 1; i >= 0; i -= 1) {
    const mesh = meshes[i];
    mesh.userData.age += delta;
    if (moveWithVelocity && mesh.userData.velocity) {
      mesh.position.addScaledVector(mesh.userData.velocity, delta);
    }

    const fadeStart = mesh.userData.hold;
    const fadeDuration = mesh.userData.fade;
    const fade = mesh.userData.age <= fadeStart
      ? 1
      : 1 - THREE.MathUtils.clamp((mesh.userData.age - fadeStart) / fadeDuration, 0, 1);
    mesh.material.opacity = mesh.userData.initialOpacity * fade;

    if (fade <= 0) {
      disposeEffectMesh(mesh);
      meshes.splice(i, 1);
    }
  }
}

function emitDriftSmoke(delta) {
  if (paused || driftAmount < 0.12 || !vehicleDynamics.grounded || Math.abs(vehicleDynamics.signedSpeed) < 7) return;

  const emissionIntensity = driftAmount * Math.min(Math.abs(vehicleDynamics.signedSpeed) / 26, 1) * delta * 55;
  const emissionCount = Math.min(
    3,
    Math.floor(emissionIntensity) + (Math.random() < emissionIntensity % 1 ? 1 : 0),
  );
  if (emissionCount <= 0) return;

  for (let emissionIndex = 0; emissionIndex < emissionCount; emissionIndex += 1) {
    for (const wheelIndex of [2, 3]) {
      const wheel = wheelMeshes[wheelIndex];
      if (!wheel) continue;

      const puff = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 8, 6),
        new THREE.MeshBasicMaterial({
          color: 0xaeb2b1,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
        }),
      );
      puff.position.copy(wheel.position);
      puff.position.y += 0.08;
      puff.scale.setScalar(0.72 + Math.random() * 0.42);
      puff.userData.life = 1.05;
      puff.userData.maxLife = 1.05;
      puff.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.58,
        0.44 + Math.random() * 0.36,
        (Math.random() - 0.5) * 0.58,
      );
      driftSmokeParticles.push(puff);
      scene.add(puff);
    }
  }

  while (driftSmokeParticles.length > 240) {
    const oldPuff = driftSmokeParticles.shift();
    scene.remove(oldPuff);
    oldPuff.geometry.dispose();
    oldPuff.material.dispose();
  }
}

function updateDriftSmoke(delta) {
  for (let i = driftSmokeParticles.length - 1; i >= 0; i -= 1) {
    const puff = driftSmokeParticles[i];
    puff.userData.life -= delta;
    puff.position.addScaledVector(puff.userData.velocity, delta);
    puff.scale.multiplyScalar(1 + delta * 1.15);
    puff.material.opacity = Math.max(0, 0.22 * (puff.userData.life / puff.userData.maxLife));

    if (puff.userData.life <= 0) {
      scene.remove(puff);
      puff.geometry.dispose();
      puff.material.dispose();
      driftSmokeParticles.splice(i, 1);
    }
  }
}

function handleChassisCollision(event) {
  if (event.body?.userData?.type !== "barrier" || !event.contact) return;

  const contact = event.contact;
  const normal = getBarrierContactNormal(contact);
  if (!normal) return;

  const speed = chassisBody.velocity.length();
  const normalSpeed = chassisBody.velocity.dot(normal);
  const tangentSpeed = Math.sqrt(Math.max(0, speed * speed - normalSpeed * normalSpeed));

  if (normalSpeed < -0.1) {
    const slideCorrection = -normalSpeed * 1.06 + 0.22;
    chassisBody.velocity.x += normal.x * slideCorrection;
    chassisBody.velocity.y += normal.y * slideCorrection;
    chassisBody.velocity.z += normal.z * slideCorrection;
  }

  chassisBody.angularVelocity.x *= 0.92;
  chassisBody.angularVelocity.y *= 0.84;
  chassisBody.angularVelocity.z *= 0.92;

  const impact = Math.max(0, -normalSpeed) + tangentSpeed * 0.28;
  const now = performance.now();
  if (impact < 4.2 || now - lastWallSparkAt < 34) return;

  const point = getBarrierContactPoint(contact);
  emitWallSparks(point, normal, tangentSpeed, impact);
  lastWallSparkAt = now;
}

function getBarrierContactNormal(contact) {
  if (contact.bi === chassisBody) {
    return new CANNON.Vec3(-contact.ni.x, -contact.ni.y, -contact.ni.z);
  }

  if (contact.bj === chassisBody) {
    return new CANNON.Vec3(contact.ni.x, contact.ni.y, contact.ni.z);
  }

  return null;
}

function getBarrierContactPoint(contact) {
  const body = contact.bi === chassisBody ? contact.bi : contact.bj;
  const offset = contact.bi === chassisBody ? contact.ri : contact.rj;
  return new THREE.Vector3(
    body.position.x + offset.x,
    body.position.y + offset.y,
    body.position.z + offset.z,
  );
}

function emitWallSparks(point, normal, tangentSpeed, impact) {
  const normalVector = new THREE.Vector3(normal.x, normal.y, normal.z).normalize();
  const carVelocity = new THREE.Vector3(chassisBody.velocity.x, chassisBody.velocity.y, chassisBody.velocity.z);
  const tangent = carVelocity.clone().addScaledVector(normalVector, -carVelocity.dot(normalVector));
  if (tangent.lengthSq() < 0.001) tangent.set(Math.random() - 0.5, 0, Math.random() - 0.5);
  tangent.normalize();

  const count = THREE.MathUtils.clamp(Math.floor(impact * 1.2), 5, 18);
  for (let i = 0; i < count; i += 1) {
    const color = WALL_SPARK_COLORS[Math.floor(Math.random() * WALL_SPARK_COLORS.length)];
    const spark = new THREE.Mesh(
      WALL_SPARK_GEOMETRY,
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    spark.position.copy(point);
    spark.position.addScaledVector(normalVector, 0.08 + Math.random() * 0.1);
    spark.scale.setScalar(0.8 + Math.random() * 1.6);
    spark.userData.life = 0.24 + Math.random() * 0.16;
    spark.userData.maxLife = spark.userData.life;
    spark.userData.velocity = tangent
      .clone()
      .multiplyScalar((0.8 + Math.random() * 2.8) * Math.min(tangentSpeed, 36) * 0.08)
      .addScaledVector(normalVector, 0.9 + Math.random() * 1.8);
    spark.userData.velocity.y += 0.65 + Math.random() * 1.35;
    wallSparkParticles.push(spark);
    scene.add(spark);
  }
}

function updateWallSparks(delta) {
  for (let i = wallSparkParticles.length - 1; i >= 0; i -= 1) {
    const spark = wallSparkParticles[i];
    spark.userData.life -= delta;
    spark.userData.velocity.y -= 7.2 * delta;
    spark.position.addScaledVector(spark.userData.velocity, delta);
    spark.scale.multiplyScalar(1 - Math.min(delta * 2.6, 0.65));
    spark.material.opacity = Math.max(0, spark.userData.life / spark.userData.maxLife);

    if (spark.userData.life <= 0) {
      scene.remove(spark);
      spark.material.dispose();
      wallSparkParticles.splice(i, 1);
    }
  }
}

function handleMultiplayerVehicleCollisions() {
  if (paused || remotePlayers.size === 0) return;

  const localPosition = new THREE.Vector3(chassisBody.position.x, chassisBody.position.y, chassisBody.position.z);
  const localVelocity = new THREE.Vector3(chassisBody.velocity.x, 0, chassisBody.velocity.z);
  const now = performance.now();

  for (const remote of remotePlayers.values()) {
    if (remote.courseId !== selectedCourseId) continue;

    const offset = localPosition.clone().sub(remote.renderPosition);
    offset.y = 0;
    const distance = offset.length();
    if (distance <= 0.001 || distance >= VEHICLE_COLLISION_RADIUS) continue;

    const normal = offset.multiplyScalar(1 / distance);
    const remoteVelocity = remote.velocity.clone();
    remoteVelocity.y = 0;
    const relativeVelocity = localVelocity.clone().sub(remoteVelocity);
    const closingSpeed = Math.max(0, -relativeVelocity.dot(normal));
    const penetration = VEHICLE_COLLISION_RADIUS - distance;
    const impulse = penetration * 5.8 + closingSpeed * 0.72 + 0.65;

    chassisBody.position.x += normal.x * penetration * 0.36;
    chassisBody.position.z += normal.z * penetration * 0.36;
    chassisBody.velocity.x += normal.x * impulse;
    chassisBody.velocity.z += normal.z * impulse;
    const yawDirection = Math.sign(normal.x * vehicleDynamics.lastForward.z - normal.z * vehicleDynamics.lastForward.x) || 1;
    chassisBody.angularVelocity.y += yawDirection * THREE.MathUtils.clamp(impulse * 0.055, 0.04, 0.48);
    chassisBody.wakeUp();

    const lastHitAt = lastVehicleCollisionAt.get(remote.id) ?? 0;
    if (now - lastHitAt < VEHICLE_COLLISION_COOLDOWN_MS || (closingSpeed < 1.3 && penetration < 0.24)) continue;

    const contactPoint = remote.renderPosition.clone().lerp(localPosition, 0.5);
    contactPoint.y = Math.max(chassisBody.position.y, remote.renderPosition.y) + 0.48;
    const cannonNormal = new CANNON.Vec3(normal.x, 0, normal.z);
    const impact = Math.max(4.5, closingSpeed + penetration * 9);
    emitVehicleCollisionEffects(contactPoint, cannonNormal, impact, remote);
    lastVehicleCollisionAt.set(remote.id, now);
  }
}

function emitVehicleCollisionEffects(point, normal, impact, remote) {
  const tangentSpeed = impact * 0.36;
  emitWallSparks(point, normal, tangentSpeed, impact);
  emitDetachedVehicleParts(point, normal, impact, remote);
}

function emitDetachedVehicleParts(point, normal, impact, remote) {
  const normalVector = new THREE.Vector3(normal.x, normal.y, normal.z);
  if (normalVector.lengthSq() < 0.0001) normalVector.set(0, 0, 1);
  normalVector.normalize();
  const right = getHorizontalVehicleRight();
  const colors = getVehicleDebrisColors(selectedCarId, remote?.carId);
  const count = THREE.MathUtils.clamp(Math.floor(impact * 0.65), 4, 11);

  for (let i = 0; i < count; i += 1) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const part = new THREE.Mesh(
      VEHICLE_DEBRIS_GEOMETRY,
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.48,
        metalness: 0.32,
        transparent: true,
        opacity: 1,
      }),
    );
    part.position.copy(point);
    part.position.addScaledVector(normalVector, 0.18 + Math.random() * 0.24);
    part.position.addScaledVector(right, (Math.random() - 0.5) * 0.72);
    part.scale.set(
      THREE.MathUtils.lerp(0.55, 1.35, Math.random()),
      THREE.MathUtils.lerp(0.45, 1.15, Math.random()),
      THREE.MathUtils.lerp(0.5, 1.4, Math.random()),
    );
    part.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    part.castShadow = true;
    part.userData.life = VEHICLE_DEBRIS_LIFE_SECONDS;
    part.userData.maxLife = VEHICLE_DEBRIS_LIFE_SECONDS;
    part.userData.velocity = normalVector
      .clone()
      .multiplyScalar(1.5 + Math.random() * 4.2 + impact * 0.11)
      .addScaledVector(right, (Math.random() - 0.5) * 4.4);
    part.userData.velocity.y = 1.4 + Math.random() * 3.2;
    part.userData.spin = new THREE.Vector3(
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 8,
    );
    vehicleCollisionDebris.push(part);
    scene.add(part);
  }

  trimEffectArray(vehicleCollisionDebris, 80);
}

function getVehicleDebrisColors(localCarId, remoteCarId) {
  const colors = [...VEHICLE_DEBRIS_COLORS];
  const carAccent = {
    ae86: [0xf2f4ee, 0x111315, 0x2b68d8],
    rx7fd: [0xffd200, 0x111315, 0xd6d8d4],
    rx7fc: [0xf2f2ee, 0x24272a, 0x111315],
    amg: [0x14181a, 0x8ee337, 0x3c403d],
    gt3: [0xe7eef1, 0xc83228, 0x202426],
  };
  for (const carId of [localCarId, remoteCarId]) {
    if (carAccent[carId]) colors.push(...carAccent[carId]);
  }
  return colors;
}

function updateVehicleCollisionDebris(delta) {
  for (let i = vehicleCollisionDebris.length - 1; i >= 0; i -= 1) {
    const part = vehicleCollisionDebris[i];
    part.userData.life -= delta;
    part.userData.velocity.y -= 7.8 * delta;
    part.position.addScaledVector(part.userData.velocity, delta);
    part.rotation.x += part.userData.spin.x * delta;
    part.rotation.y += part.userData.spin.y * delta;
    part.rotation.z += part.userData.spin.z * delta;

    const fade = THREE.MathUtils.clamp(part.userData.life / 1.1, 0, 1);
    part.material.opacity = fade;

    if (part.userData.life <= 0) {
      disposeEffectMesh(part);
      vehicleCollisionDebris.splice(i, 1);
    }
  }
}

function clearVehicleCollisionDebris() {
  for (const part of vehicleCollisionDebris.splice(0)) {
    disposeEffectMesh(part);
  }
  lastVehicleCollisionAt.clear();
}

function createDriftLabelSprite() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3.2, 1.2, 1);
  sprite.userData.canvas = canvas;
  sprite.userData.context = context;
  sprite.userData.texture = texture;
  sprite.userData.lastText = "";
  sprite.renderOrder = 20;
  return sprite;
}

function updateDriftLabel(delta) {
  if (!driftLabelSprite) return;

  const rightVector = new CANNON.Vec3(1, 0, 0);
  chassisBody.vectorToWorldFrame(rightVector, rightVector);
  rightVector.y = 0;
  if (rightVector.lengthSquared() < 0.0001) rightVector.set(1, 0, 0);
  rightVector.normalize();

  const lateralSpeed = Math.abs(chassisBody.velocity.dot(rightVector));
  const speedScore = Math.abs(vehicleDynamics.signedSpeed) * 0.7 + lateralSpeed * 1.9;
  const isDrifting = driftAmount > 0.16 && vehicleDynamics.grounded && speedScore > 8;

  if (isDrifting) {
    driftScore += speedScore * driftAmount * delta * 8.5;
  } else {
    driftScore = Math.max(0, driftScore - delta * 180);
  }

  const targetOpacity = isDrifting || driftScore > 1 ? 1 : 0;
  driftLabelSprite.material.opacity = THREE.MathUtils.lerp(
    driftLabelSprite.material.opacity,
    targetOpacity,
    1 - Math.exp(-10 * delta),
  );

  const labelNumber = Math.floor(driftScore);
  const text = `Drift!! ${labelNumber}`;
  if (text !== driftLabelSprite.userData.lastText) {
    drawDriftLabel(text);
    driftLabelSprite.userData.lastText = text;
  }

  const carPosition = carVisualMotion.initialized
    ? carVisualMotion.position
    : new THREE.Vector3(chassisBody.position.x, chassisBody.position.y, chassisBody.position.z);
  driftLabelSprite.position.set(
    carPosition.x + rightVector.x * 2.4,
    carPosition.y + 1.28,
    carPosition.z + rightVector.z * 2.4,
  );
  driftLabelSprite.visible = driftLabelSprite.material.opacity > 0.02;
}

function drawDriftLabel(text) {
  const canvas = driftLabelSprite.userData.canvas;
  const context = driftLabelSprite.userData.context;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.shadowColor = "rgba(0, 0, 0, 0.45)";
  context.shadowBlur = 10;
  context.fillStyle = "rgba(18, 20, 22, 0.62)";
  context.fillRect(18, 16, 220, 62);
  context.shadowBlur = 0;
  context.strokeStyle = "rgba(255, 255, 255, 0.55)";
  context.lineWidth = 3;
  context.strokeRect(18, 16, 220, 62);
  context.fillStyle = "#ffffff";
  context.font = "900 30px Inter, Arial, sans-serif";
  context.fillText("Drift!!", 34, 48);
  context.fillStyle = "#ff4a3d";
  context.font = "800 22px Inter, Arial, sans-serif";
  context.fillText(text.replace("Drift!! ", ""), 148, 49);
  context.fillStyle = "rgba(255, 255, 255, 0.72)";
  context.font = "700 13px Inter, Arial, sans-serif";
  context.fillText("POINTS", 149, 66);
  driftLabelSprite.userData.texture.needsUpdate = true;
}

function updateSuspensionVisual(delta) {
  const visualRoot = carGroup.getObjectByName("carVisualRoot");
  if (!visualRoot) return;

  const tuning = getCarTuning();
  const dt = Math.max(delta, 1 / 120);
  const speedAbs = Math.abs(vehicleDynamics.signedSpeed);
  const highSpeedSuppression = THREE.MathUtils.lerp(0.58, 0.2, smoothstep(16, 70, speedAbs));
  const impactSuppression = THREE.MathUtils.lerp(0.55, 0.22, smoothstep(28, 78, speedAbs));
  const compression = vehicle.wheelInfos.map((wheel, index) => {
    const contact = wheel.isInContact || wheel.raycastResult?.hasHit;
    const restLength = wheel.suspensionRestLength ?? SUSPENSION_REST_LENGTH;
    const suspensionLength = Number.isFinite(wheel.suspensionLength)
      ? wheel.suspensionLength
      : restLength;
    const targetCompression = contact
      ? THREE.MathUtils.clamp(
          (restLength - suspensionLength) / restLength,
          -0.24,
          0.72,
        ) * highSpeedSuppression
      : -0.16;
    const state = wheelVisualStates[index];
    const previousCompression = state.compression;
    const response =
      1 -
      Math.exp(
        -(contact ? VISUAL_SUSPENSION.wheelResponse : VISUAL_SUSPENSION.airborneResponse) * dt,
      );

    state.previousCompression = previousCompression;
    state.compression += (targetCompression - state.compression) * response;

    const compressionVelocity = (state.compression - previousCompression) / dt;
    if (contact && !state.contact) {
      const landingSpeed = Math.max(0, -vehicleDynamics.preStepVelocityY, -chassisBody.velocity.y);
      const impactEnergy = landingSpeed * 0.024 + Math.max(0, compressionVelocity) * 0.006;
      if (impactEnergy > 0.035) {
        state.impact += THREE.MathUtils.clamp(impactEnergy * impactSuppression, 0, 0.12);
      }
    }

    state.impact *= Math.exp(-VISUAL_SUSPENSION.impactDecay * dt);
    state.contact = contact;
    return state.compression + state.impact * 0.08 * impactSuppression;
  });
  const groundedWheels = vehicle.wheelInfos.filter(
    (wheel) => wheel.isInContact || wheel.raycastResult?.hasHit,
  ).length;
  const grounded = groundedWheels > 0;
  const contactRatio = groundedWheels / vehicle.wheelInfos.length;
  const averageCompression =
    compression.reduce((sum, value) => sum + value, 0) / vehicle.wheelInfos.length;
  const frontCompression = (compression[0] + compression[1]) * 0.5;
  const rearCompression = (compression[2] + compression[3]) * 0.5;
  const leftCompression = (compression[0] + compression[2]) * 0.5;
  const rightCompression = (compression[1] + compression[3]) * 0.5;
  const speedFactor = THREE.MathUtils.clamp(speedAbs / Math.min(getMaxForwardSpeed(), 34), 0, 1);
  const highSpeedLeanGain = THREE.MathUtils.lerp(0.72, 0.3, smoothstep(34, 78, speedAbs));
  const roadShakeSpeedGain =
    smoothstep(3, 24, speedAbs) * THREE.MathUtils.lerp(0.38, 0.08, smoothstep(34, 76, speedAbs));
  const throttleSquat =
    vehicleDynamics.throttle && driveInput > 0.08
      ? -VISUAL_SUSPENSION.throttleSquat * driveInput * (1 - speedFactor * 0.42)
      : 0;
  const brakeDive =
    vehicleDynamics.braking && vehicleDynamics.signedSpeed > 0
      ? VISUAL_SUSPENSION.brakeDive * speedFactor
      : 0;
  const steeringLean =
    steering *
    VISUAL_SUSPENSION.steeringRoll *
    THREE.MathUtils.clamp(speedFactor + Math.abs(driveInput) * 0.34, 0, 1) *
    highSpeedLeanGain;
  const driftVisual = THREE.MathUtils.clamp(vehicleDynamics.driftFactor ?? driftAmount, 0, 1);
  const driftDirection = Math.sign(vehicleDynamics.slipAngle || steering || chassisBody.angularVelocity.y);
  const handbrakePitch =
    vehicleDynamics.handbrake && driftVisual > 0.04
      ? VISUAL_SUSPENSION.handbrakePitch * driftVisual * speedFactor
      : 0;
  const driftLean =
    -driftDirection *
    VISUAL_SUSPENSION.driftRoll *
    driftVisual *
    smoothstep(5, 26, speedAbs) *
    highSpeedLeanGain;
  const time = performance.now() * 0.001;
  const surfaceShake = getSurfaceRipple(chassisBody.position.x + 3.7, chassisBody.position.z - 2.1) * 0.58;
  const roadShake =
    contactRatio *
    roadShakeSpeedGain *
    VISUAL_SUSPENSION.roadShake *
    (surfaceShake + Math.sin(time * 24) * 0.44 + Math.sin(time * 47) * 0.28);
  const airborneSag = grounded ? 0 : -0.025;
  const targetHeave =
    (-averageCompression * VISUAL_SUSPENSION.heaveScale + roadShake + airborneSag) *
    (2 - tuning.visualStiffnessScale);
  const targetPitch =
    (frontCompression - rearCompression) * VISUAL_SUSPENSION.pitchScale +
    brakeDive +
    handbrakePitch +
    throttleSquat +
    THREE.MathUtils.clamp(chassisBody.angularVelocity.x * 0.018, -0.08, 0.08);
  const targetRoll =
    (leftCompression - rightCompression) * VISUAL_SUSPENSION.rollScale +
    steeringLean +
    driftLean +
    THREE.MathUtils.clamp(chassisBody.angularVelocity.z * 0.014, -0.07, 0.07);

  if (grounded && !visualSuspension.wasGrounded) {
    const landingSpeed = Math.max(0, -vehicleDynamics.preStepVelocityY, -chassisBody.velocity.y);
    visualSuspension.heaveVelocity -= THREE.MathUtils.clamp(
      landingSpeed * VISUAL_SUSPENSION.landingKick * impactSuppression,
      0.01,
      0.18,
    );
    visualSuspension.pitchVelocity += THREE.MathUtils.clamp(
      chassisBody.angularVelocity.x * 0.08,
      -0.12,
      0.12,
    );
    visualSuspension.rollVelocity += THREE.MathUtils.clamp(
      chassisBody.angularVelocity.z * 0.07,
      -0.11,
      0.11,
    );
  }

  springValue(visualSuspension, "heave", targetHeave, delta);
  springValue(visualSuspension, "pitch", targetPitch, delta);
  springValue(visualSuspension, "roll", targetRoll, delta);

  visualRoot.position.y = THREE.MathUtils.clamp(visualSuspension.heave - 0.06, -0.12, 0.06);
  visualRoot.rotation.x = THREE.MathUtils.clamp(visualSuspension.pitch, -0.08, 0.1);
  visualRoot.rotation.z = THREE.MathUtils.clamp(visualSuspension.roll, -0.1, 0.1);
  updateDamperVisuals(visualRoot);
  visualSuspension.wasGrounded = grounded;
  visualSuspension.contactRatio = contactRatio;
}

function updateDamperVisuals(visualRoot) {
  for (let i = 0; i < wheelVisualStates.length; i += 1) {
    const spring = visualRoot.getObjectByName(`damperSpring${i}`);
    const rod = visualRoot.getObjectByName(`damperRod${i}`);
    if (!spring || !rod) continue;

    const compression = THREE.MathUtils.clamp(
      wheelVisualStates[i].compression + wheelVisualStates[i].impact * 0.12,
      -0.18,
      0.58,
    );
    const springScale = THREE.MathUtils.clamp(1 - compression * 0.16, 0.86, 1.04);
    const rodScale = THREE.MathUtils.clamp(1 - compression * 0.1, 0.9, 1.03);
    const travelOffset = -compression * 0.014;

    spring.scale.y = springScale;
    rod.scale.y = rodScale;
    spring.position.y = spring.userData.baseY + travelOffset;
    rod.position.y = rod.userData.baseY + travelOffset * 0.65;
  }
}

function springValue(state, key, target, delta) {
  const tuning = getCarTuning();
  const velocityKey = `${key}Velocity`;
  const displacement = target - state[key];
  state[velocityKey] += displacement * VISUAL_SUSPENSION.stiffness * tuning.visualStiffnessScale * delta;
  state[velocityKey] *= Math.exp(-VISUAL_SUSPENSION.damping * tuning.visualDampingScale * delta);
  state[key] += state[velocityKey] * delta;
}

function updateTunedMassVisual() {
  const block = carGroup.getObjectByName("tunedMassBlock");
  if (!block) return;

  block.position.y = 0.52 - THREE.MathUtils.clamp(tunedDamperState.heave * 0.035, -0.08, 0.08);
  block.rotation.x = THREE.MathUtils.clamp(-tunedDamperState.pitch * 0.035, -0.08, 0.08);
  block.rotation.z = THREE.MathUtils.clamp(tunedDamperState.roll * 0.035, -0.08, 0.08);
}

function updateCamera(delta) {
  const cameraSubject = getCameraSubject();
  const tuning = getCarTuning();
  const carPosition = cameraSubject.position;
  const carQuaternion = cameraSubject.quaternion;
  const rawForward = new THREE.Vector3(0, 0, 1).applyQuaternion(carQuaternion).normalize();
  const horizontalForward = new THREE.Vector3(rawForward.x, 0, rawForward.z);
  if (horizontalForward.lengthSq() < 0.0001) horizontalForward.set(0, 0, 1);
  horizontalForward.normalize();

  const up = new THREE.Vector3(0, 1, 0);
  const focusTarget = carPosition.clone();
  focusTarget.y = getTrackElevation(carPosition.x, carPosition.z) + 0.88;

  if (!cameraRig.initialized) {
    cameraRig.initialized = true;
    cameraRig.focus.copy(focusTarget);
    cameraRig.forward.copy(horizontalForward);
  }

  const speedFactor = THREE.MathUtils.clamp(cameraSubject.speed / getMaxForwardSpeed(), 0, 1);
  const focusBlend = 1 - Math.exp(-(10.5 + speedFactor * 5.5) * delta);
  const forwardBlend = 1 - Math.exp(-(6.5 + speedFactor * 5.5) * delta);
  cameraRig.focus.lerp(focusTarget, focusBlend);
  cameraRig.forward.lerp(horizontalForward, forwardBlend).normalize();

  const target = cameraRig.focus.clone().add(up.clone().multiplyScalar(0.78));
  const cameraRight = new THREE.Vector3(cameraRig.forward.z, 0, -cameraRig.forward.x);
  if (cameraRight.lengthSq() < 0.0001) cameraRight.set(1, 0, 0);
  cameraRight.normalize();

  let desiredPosition;
  let lookTarget;

  if (cameraMode === 0 && cameraOrbit.active && !mouseControls.enabled) {
    const distance = THREE.MathUtils.lerp(8.0, 7.0, speedFactor);
    const height = THREE.MathUtils.lerp(3.7, 4.55, speedFactor);
    const baseBackYaw = Math.atan2(-cameraRig.forward.x, -cameraRig.forward.z);
    const yaw = baseBackYaw + cameraOrbit.yaw;
    const horizontalDistance = distance * Math.cos(cameraOrbit.pitch);
    const orbitOffset = new THREE.Vector3(
      Math.sin(yaw) * horizontalDistance,
      height + Math.sin(cameraOrbit.pitch) * distance,
      Math.cos(yaw) * horizontalDistance,
    );
    desiredPosition = target.clone().add(orbitOffset);
    lookTarget = target.clone().add(up.clone().multiplyScalar(0.3));
  } else if (cameraMode === 0) {
    const distance = THREE.MathUtils.lerp(8.4, 7.1, speedFactor) + (tuning.cameraDistanceOffset ?? 0);
    const height = THREE.MathUtils.lerp(4.25, 5.25, speedFactor) + (tuning.cameraHeightOffset ?? 0);
    const lookAhead = THREE.MathUtils.lerp(10.5, 16.5, speedFactor) + (tuning.cameraLookAheadOffset ?? 0);
    desiredPosition = target.clone().addScaledVector(cameraRig.forward, -distance).add(up.clone().multiplyScalar(height));
    lookTarget = target.clone().addScaledVector(cameraRig.forward, lookAhead).add(up.clone().multiplyScalar(0.15));
  } else {
    desiredPosition = target.clone().addScaledVector(cameraRig.forward, 0.85).add(up.clone().multiplyScalar(0.24));
    lookTarget = target.clone().addScaledVector(cameraRig.forward, 18).add(up.clone().multiplyScalar(0.08));
  }

  const driftShake = cameraSubject.isLocal ? getHandbrakeCameraShake(speedFactor) : 0;
  if (driftShake > 0) {
    const time = performance.now() * 0.001;
    desiredPosition.addScaledVector(cameraRight, Math.sin(time * 58) * driftShake);
    desiredPosition.y += Math.sin(time * 83) * driftShake * 0.46;
    lookTarget.addScaledVector(cameraRight, Math.cos(time * 47) * driftShake * 0.34);
  }

  const positionBlend = 1 - Math.exp(-(cameraMode === 0 ? 6.4 + speedFactor * 4.8 : 9.5) * delta);
  const lookBlend = 1 - Math.exp(-(cameraMode === 0 ? 8.4 + speedFactor * 5.2 : 11.5) * delta);
  camera.position.lerp(desiredPosition, positionBlend);

  if (!cameraRig.lookTarget.lengthSq()) cameraRig.lookTarget.copy(lookTarget);
  cameraRig.lookTarget.lerp(lookTarget, lookBlend);
  camera.lookAt(cameraRig.lookTarget);
}

function getHandbrakeCameraShake(speedFactor) {
  if (!vehicleDynamics.handbrake || !vehicleDynamics.grounded) return 0;

  const driftShake = THREE.MathUtils.clamp(vehicleDynamics.driftFactor * speedFactor, 0, 1);
  return THREE.MathUtils.lerp(0, 0.13, driftShake);
}

function getCameraSubject() {
  const spectatedRemote = getSpectatedRemotePlayer();
  if (spectatedRemote) {
    return {
      position: spectatedRemote.renderPosition.clone(),
      quaternion: spectatedRemote.renderQuaternion.clone(),
      speed: spectatedRemote.velocity.length(),
      isLocal: false,
    };
  }

  return {
    position: carVisualMotion.initialized
      ? carVisualMotion.position.clone()
      : new THREE.Vector3(chassisBody.position.x, chassisBody.position.y, chassisBody.position.z),
    quaternion: carVisualMotion.initialized
      ? carVisualMotion.quaternion.clone()
      : new THREE.Quaternion(
          chassisBody.quaternion.x,
          chassisBody.quaternion.y,
          chassisBody.quaternion.z,
          chassisBody.quaternion.w,
        ),
    speed: Math.abs(vehicleDynamics.signedSpeed),
    isLocal: true,
  };
}

function getSpectatedRemotePlayer() {
  if (raceSession.mode !== "spectator" || !isActiveRaceSession()) return null;

  const unfinishedParticipantIds = raceSession.participants
    .filter((participant) => !participant.finished)
    .map((participant) => participant.id);

  for (const id of unfinishedParticipantIds) {
    const remote = remotePlayers.get(id);
    if (remote) return remote;
  }

  return [...remotePlayers.values()].find((remote) => remote.courseId === selectedCourseId) ?? null;
}

function updateLap() {
  if (raceFinished) return;

  const currentPoint = new THREE.Vector2(chassisBody.position.x, chassisBody.position.z);
  const now = performance.now();
  const targetGate = activeCourse.loop ? START_GATE : FINISH_GATE;
  const previousGateSide = activeCourse.loop ? previousStartGateSide : previousFinishGateSide;
  const currentGateSide = getGateSide(targetGate, currentPoint);
  const gateCooldown = activeCourse.loop ? 5000 : 3500;

  if (
    previousGateSide < 0 &&
    currentGateSide >= 0 &&
    isInsideGate(targetGate, currentPoint) &&
    now - lastLapStamp > gateCooldown
  ) {
    const lapTime = now - lapStartedAt;

    if (lapTime > (activeCourse.minCompletionTime ?? 9000)) {
      lastLapStamp = now;

      if (activeCourse.loop) {
        lap += 1;
        bestLap = bestLap === null ? lapTime : Math.min(bestLap, lapTime);
        if (lap >= getRaceLapTotal()) {
          finishRace(now - raceStartedAt);
        } else {
          lapStartedAt = now;
          flashMessage(`LAP ${lap}`);
        }
      } else {
        finishRace(lapTime);
      }
    }
  }

  previousStartGateSide = getGateSide(START_GATE, currentPoint);
  previousFinishGateSide = getGateSide(FINISH_GATE, currentPoint);
}

function getGateSide(gate, point) {
  return point.clone().sub(gate.center).dot(gate.tangent);
}

function isInsideGate(gate, point) {
  const offset = point.clone().sub(gate.center);
  const lateralDistance = Math.abs(offset.dot(gate.normal));
  const longitudinalDistance = Math.abs(offset.dot(gate.tangent));
  return lateralDistance <= ROAD_WIDTH / 2 + 2.5 && longitudinalDistance <= 10;
}

function finishRace(finishTime) {
  raceFinished = true;
  paused = true;
  pauseStartedAt = null;
  bestLap = bestLap === null ? finishTime : Math.min(bestLap, finishTime);
  currentLapValue.textContent = formatTime(finishTime);
  bestLapValue.textContent = formatTime(bestLap);
  speedValue.textContent = String(Math.min(Math.round(chassisBody.velocity.length() * 3.6), 999)).padStart(3, "0");
  syncPauseButton();
  if (menuReturnButton) menuReturnButton.hidden = true;
  window.clearTimeout(readyTimeout);
  message.textContent = "FINISH";
  message.classList.add("is-visible");

  const savedRecord = saveLeaderboardRecord(finishTime);
  rememberRaceResult(createLocalRaceResult(finishTime));
  submitRaceFinish(finishTime);
  showResultsOverlay(finishTime, savedRecord);
}

function getRaceLapTotal() {
  if (!activeCourse.loop) return 1;
  return Math.max(1, activeCourse.totalLaps ?? DEFAULT_LOOP_LAPS);
}

function saveLeaderboardRecord(finishTime) {
  if (!currentPlayer) return null;

  const leaderboard = loadStoredJson(STORAGE_KEYS.leaderboard, {});
  const courseRecords = leaderboard[selectedCourseId] ?? {};
  const previous = courseRecords[currentPlayer.key];
  const record = {
    id: currentPlayer.id,
    key: currentPlayer.key,
    time: finishTime,
    carId: selectedCarId,
    finishedAt: Date.now(),
  };
  const isPersonalBest = !previous || finishTime < previous.time;

  if (isPersonalBest) {
    courseRecords[currentPlayer.key] = record;
    leaderboard[selectedCourseId] = courseRecords;
    saveStoredJson(STORAGE_KEYS.leaderboard, leaderboard);
  }

  const bestRecord = courseRecords[currentPlayer.key] ?? record;
  submitLeaderboardRecord(bestRecord, selectedCourseId);

  return {
    record: bestRecord,
    isPersonalBest,
  };
}

function getCourseLeaderboard(courseId = selectedCourseId) {
  const leaderboard = loadStoredJson(STORAGE_KEYS.leaderboard, {});
  const recordsByKey = new Map();

  addLeaderboardRecords(recordsByKey, leaderboard[courseId]);
  addLeaderboardRecords(recordsByKey, sharedLeaderboard[courseId]);

  return [...recordsByKey.values()].sort(compareLeaderboardRecords);
}

function addLeaderboardRecords(recordsByKey, source) {
  const records = Array.isArray(source) ? source : Object.values(source ?? {});

  for (const rawRecord of records) {
    const record = normalizeLeaderboardRecord(rawRecord);
    if (record) rememberBestLeaderboardRecord(recordsByKey, record);
  }
}

function showResultsOverlay(finishTime, savedRecord) {
  if (!resultsOverlay) return;

  resultsOverlay.hidden = false;
  if (resultsTitle) resultsTitle.textContent = savedRecord?.isPersonalBest ? "New Best" : "Race Complete";
  if (resultsCourse) resultsCourse.textContent = activeCourse.name;
  if (resultsPlayer) resultsPlayer.textContent = currentPlayer?.id ?? "GUEST";
  if (resultsTime) resultsTime.textContent = formatTime(finishTime);
  renderRaceResults(savedRecord?.record?.key ?? currentPlayer?.key ?? multiplayer.selfId ?? null);
}

function hideResultsOverlay() {
  if (resultsOverlay) resultsOverlay.hidden = true;
}

function renderRaceResults(playerKey) {
  if (!leaderboardBody) return;

  leaderboardBody.replaceChildren();
  const records = raceSession.results.length ? [...raceSession.results].sort(compareRaceResults) : [createLocalRaceResult(0)].filter(
    (record) => record.time > 0,
  );
  if (!records.length) {
    const empty = document.createElement("div");
    empty.className = "leaderboard-empty";
    empty.textContent = "No finish times yet.";
    leaderboardBody.append(empty);
    return;
  }

  const leaderTime = records[0].time;
  const playerIndex = records.findIndex((record) => record.playerId === playerKey || record.id === playerKey);
  const visibleRecords = records.slice(0, 8);

  if (playerIndex >= 8) {
    visibleRecords.push(records[playerIndex]);
  }

  for (const record of visibleRecords) {
    const rank = records.indexOf(record) + 1;
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.classList.toggle("is-player", record.playerId === playerKey || record.id === playerKey);

    const rankCell = document.createElement("span");
    const idCell = document.createElement("span");
    const timeCell = document.createElement("span");
    const gapCell = document.createElement("span");
    const gap = record.time - leaderTime;

    rankCell.textContent = `#${rank}`;
    idCell.textContent = record.displayName;
    timeCell.textContent = formatTime(record.time);
    gapCell.textContent = gap <= 0 ? "--" : `+${formatTime(gap)}`;
    row.append(rankCell, idCell, timeCell, gapCell);
    leaderboardBody.append(row);
  }
}

function updateHud() {
  const kmh = Math.round(chassisBody.velocity.length() * 3.6);
  const elapsed = performance.now() - lapStartedAt;
  speedValue.textContent = String(Math.min(kmh, 999)).padStart(3, "0");
  lapValue.textContent = `${lap} / ${getRaceLapTotal()}`;
  currentLapValue.textContent = formatTime(elapsed);
  bestLapValue.textContent = bestLap === null ? "--.---" : formatTime(bestLap);
  gearValue.textContent = estimateGear(kmh);
  updateBoostMeter();
  updatePhysicsDebug(kmh);
}

function updateBoostMeter() {
  if (!boostMeter || !boostFill) return;

  const hasBoostSystem = isDriftBoostCar();
  boostMeter.hidden = !hasBoostSystem;
  if (!hasBoostSystem) {
    boostFill.style.width = "0%";
    boostFill.classList.remove("is-active");
    return;
  }

  boostFill.style.width = `${Math.round(driftBoostCharge * 100)}%`;
  boostFill.classList.toggle("is-active", boostAmount > 0.02);
}

function updatePhysicsDebug(kmh) {
  if (!physicsDebug || physicsDebug.hidden) return;

  const wheelRows = vehiclePhysics.wheels
    .map((wheel) => {
      const grip = THREE.MathUtils.clamp(wheel.gripUsage, 0, 1.6);
      const compression = THREE.MathUtils.clamp(wheel.compression, 0, 1);
      const slip = THREE.MathUtils.clamp(Math.abs(wheel.slipRatio) + Math.abs(wheel.slipAngle) * 0.35, 0, 1.6);
      const gripColor = grip > 1 ? "#ff594a" : grip > 0.82 ? "#ffd45a" : "#a7ff5b";
      const point = wheel.contactPointWorld;
      const normal = wheel.groundNormal ?? wheel.raycastResult?.hitNormalWorld;
      const contactPoint = wheel.contact
        ? `${point.x.toFixed(1)}, ${point.y.toFixed(1)}, ${point.z.toFixed(1)}`
        : "air";
      const normalText = normal
        ? `${normal.x.toFixed(2)}, ${normal.y.toFixed(2)}, ${normal.z.toFixed(2)}`
        : "0.00, 1.00, 0.00";
      return `
        <div class="debug-wheel">
          <span>${wheel.name}${wheel.contact ? "" : "*"}</span>
          <div class="debug-bar"><span style="width:${Math.min(grip, 1) * 100}%;background:${gripColor}"></span></div>
          <div class="debug-bar"><span style="width:${Math.min(slip, 1) * 100}%;background:#69c8ff"></span></div>
          <div class="debug-bar"><span style="width:${compression * 100}%;background:#d9a7ff"></span></div>
          <span>${wheel.absActive ? "ABS" : wheel.locked ? "LOCK" : "OK"}</span>
          <small>p ${contactPoint} / n ${normalText} / c ${compression.toFixed(2)}</small>
        </div>`;
    })
    .join("");

  physicsDebug.innerHTML = `
    <strong>Physics Debug</strong>
    <div class="debug-grid">
      <span>speed</span><span>${kmh} km/h</span>
      <span>rpm</span><span>${Math.round(vehiclePhysics.rpm)}</span>
      <span>gear</span><span>${getGearLabel(vehiclePhysics.gear)}</span>
      <span>throttle</span><span>${vehiclePhysics.throttle.toFixed(2)}</span>
      <span>brake</span><span>${vehiclePhysics.brake.toFixed(2)}</span>
      <span>steer</span><span>${THREE.MathUtils.radToDeg(vehiclePhysics.steeringAngle).toFixed(1)} deg</span>
      <span>long accel</span><span>${vehiclePhysics.longitudinalAcceleration.toFixed(2)} m/s2</span>
      <span>lat accel</span><span>${vehiclePhysics.lateralAcceleration.toFixed(2)} m/s2</span>
      <span>front/rear grip</span><span>${vehiclePhysics.frontGripUsage.toFixed(2)} / ${vehiclePhysics.rearGripUsage.toFixed(2)}</span>
      <span>handbrake drift</span><span>${vehiclePhysics.handbrakeDriftFactor.toFixed(2)} / ${vehiclePhysics.rearGrip.toFixed(2)} rear</span>
      <span>slip angle</span><span>${THREE.MathUtils.radToDeg(vehiclePhysics.slipAngle).toFixed(1)} deg</span>
      <span>drag</span><span>${Math.round(vehiclePhysics.aeroDrag)} N</span>
      <span>boost</span><span>${isDriftBoostCar() ? `${Math.round(driftBoostCharge * 100)}%${boostAmount > 0.02 ? " ON" : ""}` : "n/a"}</span>
    </div>
    <div class="debug-wheels">${wheelRows}</div>
  `;
}

function estimateGear(kmh) {
  if (vehiclePhysics) return getGearLabel(vehiclePhysics.gear);

  const reverseInput =
    (!mouseControls.enabled && (keys.has("KeyS") || keys.has("ArrowDown"))) ||
    (mouseControls.enabled && mouseControls.rightDown) ||
    driveInput < -0.05 ||
    vehicleDynamics.reverse;
  if (reverseInput && kmh < 24) return "R";
  if (kmh < 3) return "N";
  if (kmh < 42) return "1";
  if (kmh < 82) return "2";
  if (kmh < 125) return "3";
  if (kmh < 168) return "4";
  if (kmh < 210) return "5";
  return "6";
}

function formatTime(ms) {
  const totalSeconds = ms / 1000;
  const seconds = Math.floor(totalSeconds);
  const millis = Math.floor((totalSeconds - seconds) * 1000);
  return `${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function getRaceStartTransform(gridSlot = 0, gridTotal = 1) {
  const total = Math.max(1, Math.floor(gridTotal));
  const columns = Math.max(1, Math.min(total, Math.floor(START_GRID_WIDTH / RACE_GRID_SPACING)));
  const slot = THREE.MathUtils.clamp(Math.floor(gridSlot), 0, Math.max(total - 1, 0));
  const row = Math.floor(slot / columns);
  const col = slot % columns;
  const rowCount = Math.min(columns, total - row * columns);
  const lateralOffset = (col - (rowCount - 1) / 2) * RACE_GRID_SPACING;
  const backwardOffset = row * RACE_GRID_ROW_SPACING;
  const point = START_SPAWN_POINT.clone()
    .addScaledVector(START_GATE.normal, lateralOffset)
    .addScaledVector(START_GATE.tangent, -backwardOffset);
  const groundY = getTrackElevation(point.x, point.y);

  return {
    position: new CANNON.Vec3(
      point.x,
      groundY + WHEEL_RADIUS + SUSPENSION_REST_LENGTH - WHEEL_CONNECTION_Y + 0.02,
      point.y,
    ),
    yaw: START_YAW,
  };
}

function resetCar(gridSlot = raceSession.gridSlot ?? 0, gridTotal = raceSession.gridTotal ?? 1) {
  const startTransform = getRaceStartTransform(gridSlot, gridTotal);
  vehicle.reset();
  vehiclePhysics = vehicle;
  chassisBody.position.copy(startTransform.position);
  chassisBody.quaternion.setFromEuler(0, startTransform.yaw, 0);
  chassisBody.velocity.set(0, 0, 0);
  chassisBody.angularVelocity.set(0, 0, 0);
  chassisBody.force.set(0, 0, 0);
  chassisBody.torque.set(0, 0, 0);
  const startPoint = new THREE.Vector2(startTransform.position.x, startTransform.position.z);
  previousStartGateSide = getGateSide(START_GATE, startPoint);
  previousFinishGateSide = getGateSide(FINISH_GATE, startPoint);
  steering = 0;
  steeringInputState.value = 0;
  driveInput = 0;
  tractionGrip = 1;
  tireSlip = 0;
  driftAmount = 0;
  driftScore = 0;
  resetDriftBoost(true);
  if (driftLabelSprite) {
    driftLabelSprite.material.opacity = 0;
    driftLabelSprite.visible = false;
    driftLabelSprite.userData.lastText = "";
  }
  vehicleDynamics.braking = false;
  vehicleDynamics.throttle = false;
  vehicleDynamics.reverse = false;
  vehicleDynamics.handbrake = false;
  vehicleDynamics.grounded = false;
  vehicleDynamics.signedSpeed = 0;
  vehicleDynamics.lateralVelocity = 0;
  vehicleDynamics.slipAngle = 0;
  vehicleDynamics.driftFactor = 0;
  vehicleDynamics.rearGrip = 1;
  vehicleDynamics.frontGrip = 1;
  vehicleDynamics.preStepVelocityY = 0;
  vehicleDynamics.airborneTime = 0;
  vehicleDynamics.airborneFallSpeed = 0;
  vehicleDynamics.lastGroundSlope = 0;
  vehicleDynamics.lastSideSlope = 0;
  vehicleDynamics.lastGroundedSpeed = 0;
  vehicleDynamics.lastSteering = 0;
  vehicleDynamics.lastForward.set(0, 0, 1);
  vehicleDynamics.lastRight.set(1, 0, 0);
  vehicleDynamics.surfaceGrip = 1;
  visualSuspension.heave = 0;
  visualSuspension.heaveVelocity = 0;
  visualSuspension.pitch = 0;
  visualSuspension.pitchVelocity = 0;
  visualSuspension.roll = 0;
  visualSuspension.rollVelocity = 0;
  visualSuspension.wasGrounded = false;
  visualSuspension.contactRatio = 0;
  cameraRig.initialized = false;
  cameraRig.lookTarget.set(0, 0, 0);
  carVisualMotion.initialized = false;
  for (const wheelMotion of wheelMeshMotion) {
    wheelMotion.initialized = false;
  }
  for (const puff of driftSmokeParticles.splice(0)) {
    scene.remove(puff);
    puff.geometry.dispose();
    puff.material.dispose();
  }
  for (const spark of wallSparkParticles.splice(0)) {
    scene.remove(spark);
    spark.material.dispose();
  }
  for (const mark of tireMarkSegments.splice(0)) {
    disposeEffectMesh(mark);
  }
  for (const trail of brakeLightTrails.splice(0)) {
    disposeEffectMesh(trail);
  }
  for (const streak of boostSpeedStreaks.splice(0)) {
    disposeEffectMesh(streak);
  }
  clearVehicleCollisionDebris();
  lastWallSparkAt = 0;
  tireMarkAccumulator = 0;
  resetBrakeTrailAnchors();
  boostStreakAccumulator = 0;
  for (const wheelState of wheelVisualStates) {
    wheelState.compression = 0;
    wheelState.previousCompression = 0;
    wheelState.impact = 0;
    wheelState.contact = false;
  }
  tunedDamperState.heave = 0;
  tunedDamperState.pitch = 0;
  tunedDamperState.roll = 0;
  lapStartedAt = performance.now();
  updateMiniMap();
  sendMultiplayerState(true);
}

function syncPauseButton() {
  startButton.classList.toggle("is-running", !paused);
  startButton.classList.toggle("is-paused", paused);
}

function setPaused(value) {
  if (raceCountdownActive) return;
  if (raceFinished) return;
  if (raceSession.mode === "spectator" && isActiveRaceSession()) return;
  if (paused === value) return;

  paused = value;
  syncPauseButton();

  window.clearTimeout(readyTimeout);
  message.textContent = paused ? "PAUSED" : "READY";
  message.classList.add("is-visible");

  if (paused) {
    pauseStartedAt = performance.now();
  } else {
    if (pauseStartedAt !== null) {
      lapStartedAt += performance.now() - pauseStartedAt;
      pauseStartedAt = null;
    }

    readyTimeout = window.setTimeout(() => message.classList.remove("is-visible"), 700);
  }
}

function flashMessage(text) {
  window.clearTimeout(readyTimeout);
  message.textContent = text;
  message.classList.add("is-visible");
  readyTimeout = window.setTimeout(() => {
    if (!paused) message.classList.remove("is-visible");
  }, 820);
}

function animate() {
  let lastTime;
  let physicsAccumulator = 0;

  function frame(time) {
    requestAnimationFrame(frame);

    if (lastTime === undefined) lastTime = time;
    const delta = Math.min((time - lastTime) / 1000, 0.06);
    lastTime = time;

    if (!paused) {
      physicsAccumulator += delta;
      let physicsSteps = 0;

      while (physicsAccumulator >= FIXED_TIME_STEP && physicsSteps < 8) {
        updateControls(FIXED_TIME_STEP);
        vehicleDynamics.preStepVelocityY = chassisBody.velocity.y;
        world.step(FIXED_TIME_STEP);
        physicsAccumulator -= FIXED_TIME_STEP;
        physicsSteps += 1;
      }

      if (physicsSteps === 8 && physicsAccumulator >= FIXED_TIME_STEP) {
        physicsAccumulator = 0;
      }

      updateLap();
      updateHud();
      sendMultiplayerState();
    } else {
      physicsAccumulator = 0;
      sendMultiplayerState();
    }

    updateVehicleMeshes(delta);
    updateRemotePlayers(delta);
    updateMiniMap();
    updateCamera(delta);
    if (skyDome) skyDome.position.copy(camera.position);
    const displayKmh = Math.round(chassisBody.velocity.length() * 3.6);
    gearValue.textContent = estimateGear(displayKmh);
    updatePhysicsDebug(displayKmh);
    renderer.render(scene, camera);
  }

  requestAnimationFrame(frame);
}

function cssColor(hex, alpha = 1) {
  const r = (hex >> 16) & 255;
  const g = (hex >> 8) & 255;
  const b = hex & 255;
  return alpha >= 1 ? `#${hex.toString(16).padStart(6, "0")}` : `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function makeCanvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  draw(context, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function makeCityGroundTexture() {
  return makeCanvasTexture(256, 256, (context) => {
    context.fillStyle = "#565c5f";
    context.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 2800; i += 1) {
      const shade = 72 + Math.floor(Math.random() * 34);
      context.fillStyle = `rgba(${shade}, ${shade + 2}, ${shade + 3}, 0.22)`;
      context.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1);
    }

    context.strokeStyle = "rgba(35, 38, 40, 0.28)";
    context.lineWidth = 1;
    for (let p = 0; p <= 256; p += 64) {
      context.beginPath();
      context.moveTo(p, 0);
      context.lineTo(p, 256);
      context.moveTo(0, p);
      context.lineTo(256, p);
      context.stroke();
    }
  });
}

function makeSidewalkTexture() {
  return makeCanvasTexture(256, 256, (context) => {
    context.fillStyle = "#9a9d9c";
    context.fillRect(0, 0, 256, 256);

    context.strokeStyle = "rgba(60, 64, 65, 0.38)";
    context.lineWidth = 2;
    for (let p = 0; p <= 256; p += 32) {
      context.beginPath();
      context.moveTo(p, 0);
      context.lineTo(p, 256);
      context.moveTo(0, p);
      context.lineTo(256, p);
      context.stroke();
    }

    for (let i = 0; i < 1200; i += 1) {
      const shade = 135 + Math.floor(Math.random() * 38);
      context.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.18)`;
      context.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
    }
  });
}

function makeBuildingTexture(baseColor, windowColor) {
  return makeCanvasTexture(256, 512, (context) => {
    context.fillStyle = cssColor(baseColor);
    context.fillRect(0, 0, 256, 512);
    context.fillStyle = "rgba(0, 0, 0, 0.16)";

    for (let x = 0; x <= 256; x += 64) {
      context.fillRect(x, 0, 2, 512);
    }

    for (let y = 18; y < 500; y += 42) {
      for (let x = 18; x < 238; x += 38) {
        const lit = ((x * 17 + y * 11) % 7) < 4;
        context.fillStyle = lit ? cssColor(windowColor, 0.82) : "rgba(18, 24, 28, 0.72)";
        context.fillRect(x, y, 18, 20);
        context.fillStyle = "rgba(255, 255, 255, 0.18)";
        context.fillRect(x + 2, y + 2, 5, 16);
      }
    }

    context.strokeStyle = "rgba(255, 255, 255, 0.08)";
    context.lineWidth = 1;
    for (let y = 0; y < 512; y += 42) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(256, y);
      context.stroke();
    }
  });
}

function makeCarDecalTexture(text) {
  return makeCanvasTexture(512, 128, (context) => {
    context.clearRect(0, 0, 512, 128);
    context.fillStyle = "rgba(198, 41, 34, 0.94)";
    context.beginPath();
    context.moveTo(24, 76);
    context.lineTo(424, 76);
    context.lineTo(488, 105);
    context.lineTo(36, 105);
    context.closePath();
    context.fill();

    context.font = "italic 700 56px Arial, sans-serif";
    context.lineWidth = 5;
    context.strokeStyle = "rgba(255, 255, 255, 0.48)";
    context.strokeText(text, 176, 98);
    context.fillStyle = "#c62922";
    context.fillText(text, 176, 98);
  });
}

function makeTrackSignTexture(text, backgroundHex = 0x17243a, textHex = 0xf7f2df, accentHex = 0xd7ae42) {
  return makeCanvasTexture(512, 160, (context, width, height) => {
    context.fillStyle = cssColor(backgroundHex);
    context.fillRect(0, 0, width, height);

    context.fillStyle = cssColor(accentHex);
    context.fillRect(0, 0, width, 16);
    context.fillRect(0, height - 16, width, 16);
    context.fillRect(0, 0, 18, height);

    const label = String(text || "GP").trim().slice(0, 18).toUpperCase();
    let fontSize = 54;
    do {
      context.font = `italic 900 ${fontSize}px Arial, sans-serif`;
      fontSize -= 2;
    } while (fontSize > 28 && context.measureText(label).width > width - 72);

    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineWidth = 5;
    context.strokeStyle = "rgba(0, 0, 0, 0.36)";
    context.strokeText(label, width / 2, height / 2 + 4);
    context.fillStyle = cssColor(textHex);
    context.fillText(label, width / 2, height / 2 + 4);
  });
}

function makeJdmSideDecalTexture(text, accentHex = 0x2c68d8, modelId = "ae86") {
  return makeCanvasTexture(512, 160, (context) => {
    context.clearRect(0, 0, 512, 160);
    const accent = cssColor(accentHex);

    if (modelId === "ae86") {
      context.fillStyle = "rgba(17, 20, 22, 0.95)";
      context.fillRect(0, 92, 512, 48);
      context.fillStyle = "rgba(255, 255, 255, 0.88)";
      context.font = "700 22px Arial, sans-serif";
      context.fillText("WATER ENGINE", 38, 78);
      context.strokeStyle = accent;
      context.lineWidth = 7;
      context.beginPath();
      context.moveTo(270, 118);
      context.lineTo(350, 70);
      context.lineTo(486, 96);
      context.stroke();
      context.font = "italic 900 62px Arial, sans-serif";
      context.lineWidth = 5;
      context.strokeStyle = "rgba(255, 255, 255, 0.82)";
      context.strokeText(text, 344, 126);
      context.fillStyle = accent;
      context.fillText(text, 344, 126);
      return;
    }

    if (modelId === "rx7fd") {
      context.fillStyle = "rgba(10, 12, 13, 0.84)";
      context.beginPath();
      context.moveTo(34, 100);
      context.bezierCurveTo(150, 60, 300, 58, 480, 94);
      context.lineTo(460, 128);
      context.bezierCurveTo(290, 106, 144, 108, 38, 136);
      context.closePath();
      context.fill();
      context.fillStyle = accent;
      context.font = "italic 900 46px Arial, sans-serif";
      context.fillText(text, 290, 115);
      context.fillStyle = "rgba(255, 255, 255, 0.78)";
      context.font = "700 20px Arial, sans-serif";
      context.fillText("TWIN ROTOR", 56, 100);
      return;
    }

    context.fillStyle = "rgba(14, 16, 18, 0.72)";
    context.fillRect(48, 92, 410, 28);
    context.fillStyle = "rgba(210, 214, 218, 0.82)";
    context.fillRect(72, 54, 338, 8);
    context.fillStyle = accent;
    context.font = "italic 800 36px Arial, sans-serif";
    context.fillText(text, 278, 86);
  });
}

function makeFormulaSideDecalTexture() {
  return makeCanvasTexture(512, 160, (context) => {
    context.clearRect(0, 0, 512, 160);
    const gradient = context.createLinearGradient(0, 0, 512, 160);
    gradient.addColorStop(0, "rgba(8, 18, 42, 0)");
    gradient.addColorStop(0.28, "rgba(16, 74, 165, 0.88)");
    gradient.addColorStop(0.68, "rgba(4, 8, 14, 0.9)");
    gradient.addColorStop(1, "rgba(8, 18, 42, 0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.moveTo(18, 106);
    context.lineTo(152, 58);
    context.lineTo(490, 78);
    context.lineTo(430, 124);
    context.lineTo(54, 136);
    context.closePath();
    context.fill();

    context.strokeStyle = "#f4c43a";
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(86, 128);
    context.lineTo(242, 72);
    context.lineTo(438, 92);
    context.stroke();

    context.strokeStyle = "#d52b32";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(58, 92);
    context.lineTo(192, 46);
    context.lineTo(362, 58);
    context.stroke();

    context.font = "italic 900 46px Arial, sans-serif";
    context.lineWidth = 4;
    context.strokeStyle = "rgba(0, 0, 0, 0.7)";
    context.strokeText("AURORA", 210, 106);
    context.fillStyle = "#f5f7ff";
    context.fillText("AURORA", 210, 106);
    context.font = "800 20px Arial, sans-serif";
    context.fillStyle = "#f4c43a";
    context.fillText("VTX RACING", 58, 78);
  });
}

function makeFormulaNoseDecalTexture() {
  return makeCanvasTexture(256, 128, (context) => {
    context.clearRect(0, 0, 256, 128);
    context.fillStyle = "rgba(4, 8, 14, 0.84)";
    context.beginPath();
    context.moveTo(26, 98);
    context.lineTo(128, 22);
    context.lineTo(230, 98);
    context.closePath();
    context.fill();
    context.strokeStyle = "#104aa5";
    context.lineWidth = 8;
    context.stroke();
    context.font = "italic 900 44px Arial, sans-serif";
    context.fillStyle = "#f4c43a";
    context.fillText("22", 102, 84);
    context.fillStyle = "#d52b32";
    context.fillRect(44, 102, 168, 8);
  });
}

function makeFormulaWingDecalTexture() {
  return makeCanvasTexture(512, 96, (context) => {
    context.clearRect(0, 0, 512, 96);
    context.fillStyle = "rgba(5, 7, 11, 0.9)";
    context.fillRect(0, 0, 512, 96);
    context.fillStyle = "#f5f7ff";
    context.font = "italic 900 34px Arial, sans-serif";
    context.fillText("NEBULA RACING", 94, 58);
    context.fillStyle = "#104aa5";
    context.fillRect(16, 16, 58, 16);
    context.fillStyle = "#d52b32";
    context.fillRect(16, 40, 58, 16);
    context.fillStyle = "#f4c43a";
    context.fillRect(16, 64, 58, 16);
  });
}

function makeLicensePlateTexture(text) {
  return makeCanvasTexture(256, 80, (context) => {
    context.fillStyle = "#f1f2ec";
    context.fillRect(0, 0, 256, 80);
    context.fillStyle = "#1c68b3";
    context.fillRect(0, 0, 34, 80);
    context.fillStyle = "#f1f2ec";
    context.font = "700 16px Arial, sans-serif";
    context.fillText("D", 12, 22);
    context.fillStyle = "#191b1d";
    context.font = "700 38px Arial, sans-serif";
    context.fillText(text, 45, 54);
    context.fillStyle = "#c27c24";
    context.beginPath();
    context.arc(74, 40, 8, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#0f1113";
    context.lineWidth = 3;
    context.strokeRect(2, 2, 252, 76);
  });
}

function makeAsphaltTexture(options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.fillStyle = options.base ?? "#17191b";
  context.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 6200; i += 1) {
    const shade = (options.fleckMin ?? 24) + Math.floor(Math.random() * (options.fleckRange ?? 38));
    context.fillStyle = `rgba(${shade}, ${shade + 2}, ${shade + 3}, ${0.22 + Math.random() * 0.18})`;
    context.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1);
  }

  context.globalAlpha = 0.55;
  for (let y = 6; y < 256; y += 22 + Math.random() * 20) {
    context.fillStyle = options.patchColor ?? "rgba(45, 48, 48, 0.3)";
    context.fillRect(Math.random() * 34, y, 170 + Math.random() * 70, 2 + Math.random() * 8);
  }

  context.globalAlpha = 1;
  context.strokeStyle = options.tireColor ?? "rgba(8, 9, 9, 0.2)";
  context.lineWidth = 4;
  for (const x of [91, 165]) {
    context.beginPath();
    for (let y = -8; y <= 264; y += 12) {
      const drift = Math.sin(y * 0.05 + x) * 1.8;
      if (y === -8) context.moveTo(x + drift, y);
      else context.lineTo(x + drift, y);
    }
    context.stroke();
  }

  context.strokeStyle = options.crackColor ?? "rgba(8, 8, 8, 0.28)";
  context.lineWidth = 1;
  for (let crack = 0; crack < 18; crack += 1) {
    let x = Math.random() * 256;
    let y = Math.random() * 256;
    context.beginPath();
    context.moveTo(x, y);
    const segments = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < segments; i += 1) {
      x += -10 + Math.random() * 20;
      y += 8 + Math.random() * 22;
      context.lineTo(x, y);
    }
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function makeRoadShoulderTexture(options = {}) {
  return makeCanvasTexture(256, 256, (context) => {
    context.fillStyle = options.dirt ?? "#6d6249";
    context.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 3600; i += 1) {
      const shade = 82 + Math.floor(Math.random() * 58);
      context.fillStyle = `rgba(${shade}, ${Math.max(50, shade - 22)}, ${Math.max(32, shade - 42)}, 0.22)`;
      context.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 4, 1 + Math.random() * 3);
    }

    context.fillStyle = options.grass ?? "#4f7741";
    for (let blade = 0; blade < 720; blade += 1) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      context.fillRect(x, y, 1, 2 + Math.random() * 5);
    }

    context.strokeStyle = "rgba(38, 34, 28, 0.32)";
    context.lineWidth = 1;
    for (let p = 0; p < 9; p += 1) {
      context.beginPath();
      const x = Math.random() * 256;
      context.moveTo(x, 0);
      context.lineTo(x + Math.sin(p) * 16, 256);
      context.stroke();
    }
  });
}

function makeGrassTexture(options = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.fillStyle = options.grass ?? "#78a95a";
  context.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 3200; i += 1) {
    const green = 110 + Math.floor(Math.random() * 62);
    context.fillStyle = `rgba(${green - 42}, ${green}, ${green - 54}, 0.28)`;
    context.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}
