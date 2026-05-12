import * as THREE from "three";
import * as CANNON from "cannon-es";

const canvas = document.querySelector("#gameCanvas");
const speedValue = document.querySelector("#speedValue");
const gearValue = document.querySelector("#gearValue");
const lapValue = document.querySelector("#lapValue");
const currentLapValue = document.querySelector("#currentLapValue");
const bestLapValue = document.querySelector("#bestLapValue");
const startButton = document.querySelector("#startButton");
const message = document.querySelector("#message");

const ROAD_WIDTH = 14;
const TRACK_RADIUS = 30;
const TRACK_HALF_STRAIGHT = 45;
const START_LINE_Z = -TRACK_HALF_STRAIGHT + 8;
const FIXED_TIME_STEP = 1 / 60;
const TERRAIN_SIZE = 560;
const TERRAIN_SEGMENTS = 280;
const TERRAIN_ELEMENT_SIZE = TERRAIN_SIZE / TERRAIN_SEGMENTS;
const WHEEL_RADIUS = 0.42;
const SUSPENSION_REST_LENGTH = 0.27;
const WHEEL_CONNECTION_Y = -0.16;
const START_X = TRACK_RADIUS;
const START_Z = START_LINE_Z - 2;
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
const START_GROUND_Y = getTrackElevation(START_X, START_Z);
const START_HEIGHT = START_GROUND_Y + WHEEL_RADIUS + SUSPENSION_REST_LENGTH - WHEEL_CONNECTION_Y + 0.02;
const START_POSITION = new CANNON.Vec3(START_X, START_HEIGHT, START_Z);
const TRACK_SURFACE_OFFSET = 0.065;
const MAX_FORWARD_SPEED = 200 / 3.6;
const MAX_REVERSE_SPEED = 16;
const HIGH_SPEED_UNDERSTEER_START = 190 / 3.6;
const STEERING_RESPONSE = 2.55;
const STEERING_RETURN_RESPONSE = 3.85;
const BASE_WHEEL_FRICTION_SLIP = 5.9;
const MIN_LAUNCH_TRACTION = 0.34;
const CENTER_OF_MASS = new CANNON.Vec3(0, 0, 0);
const DAMPER_SETTINGS = {
  compression: 14.5,
  rebound: 7.2,
  chassisPitchRoll: 1.2,
  heave: 0.82,
  bumpStopStart: 0.34,
  bumpStopStrength: 36,
};
const TUNED_MASS_DAMPER = {
  response: 14,
  heave: 0.28,
  pitch: 0.34,
  roll: 0.3,
};
const VISUAL_SUSPENSION = {
  stiffness: 340,
  damping: 42,
  heaveScale: 0.035,
  pitchScale: 0.08,
  rollScale: 0.09,
  brakeDive: 0.032,
  throttleSquat: 0.014,
  steeringRoll: 0.07,
  roadShake: 0,
  landingKick: 0.02,
  wheelResponse: 82,
  airborneResponse: 28,
  impactDecay: 34,
};

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x9fcbe6, 0.0048);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
camera.position.set(TRACK_RADIUS, 7, START_LINE_Z - 12);

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
    friction: 0.18,
    restitution: 0.32,
    contactEquationStiffness: 7e5,
    contactEquationRelaxation: 4,
  }),
);

const keys = new Set();
const wheelMeshes = [];
const trackPoints = createTrackPoints();
let paused = false;
let cameraMode = 0;
let steering = 0;
let driveInput = 0;
let tractionGrip = 1;
let tireSlip = 0;
let driftAmount = 0;
let driftScore = 0;
let driftLabelSprite = null;
const driftSmokeParticles = [];
const vehicleDynamics = {
  braking: false,
  throttle: false,
  reverse: false,
  grounded: false,
  signedSpeed: 0,
  preStepVelocityY: 0,
  airborneTime: 0,
  airborneFallSpeed: 0,
  lastGroundSlope: 0,
  lastSideSlope: 0,
  lastGroundedSpeed: 0,
  lastSteering: 0,
  lastForward: new CANNON.Vec3(0, 0, 1),
  lastRight: new CANNON.Vec3(1, 0, 0),
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
const carVisualMotion = {
  initialized: false,
  position: new THREE.Vector3(),
  quaternion: new THREE.Quaternion(),
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
}));
const tunedDamperState = {
  heave: 0,
  pitch: 0,
  roll: 0,
};
let previousZ = START_POSITION.z;
let lap = 0;
let lapStartedAt = performance.now();
let bestLap = null;
let lastLapStamp = 0;
let readyTimeout = null;
let pauseStartedAt = null;

setupLighting();
createWorld();
const { vehicle, chassisBody, carGroup } = createVehicle();
driftLabelSprite = createDriftLabelSprite();
scene.add(driftLabelSprite);
resetCar();
bindInput();
setupDebugTools();
animate();

function setupLighting() {
  scene.add(new THREE.HemisphereLight(0xbfe8ff, 0x44633d, 1.85));

  const sun = new THREE.DirectionalLight(0xfff4d2, 3.2);
  sun.position.set(-85, 120, -60);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -120;
  sun.shadow.camera.near = 20;
  sun.shadow.camera.far = 260;
  scene.add(sun);
}

function getTrackElevation(x, z) {
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
  const roadRipple = getSurfaceRipple(x, z) * startBlend;

  return THREE.MathUtils.clamp(
    (rollingGrade + northCrest + southDip + longRise + westDrop + eastCrest) * startBlend +
      jumpRamp +
      testArea +
      roadRipple,
    -0.85,
    2.4,
  );
}

function getTestAreaElevation(x, z) {
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

function projectOntoTerrain(vector, normal) {
  const dot = vector.dot(normal);
  const projected = new CANNON.Vec3(
    vector.x - normal.x * dot,
    vector.y - normal.y * dot,
    vector.z - normal.z * dot,
  );
  if (projected.dot(projected) < 0.0001) return vector.clone();
  projected.normalize();
  return projected;
}

function getSlopeAlong(direction, normal) {
  return -normal.dot(direction) / Math.max(normal.y, 0.22);
}

function updateTakeoffMemory(surfaceForward, surfaceRight, groundNormal, signedSpeed) {
  vehicleDynamics.lastGroundSlope = THREE.MathUtils.clamp(
    getSlopeAlong(surfaceForward, groundNormal),
    -0.55,
    0.55,
  );
  vehicleDynamics.lastSideSlope = THREE.MathUtils.clamp(
    getSlopeAlong(surfaceRight, groundNormal),
    -0.42,
    0.42,
  );
  vehicleDynamics.lastGroundedSpeed = signedSpeed;
  vehicleDynamics.lastSteering = steering;
  vehicleDynamics.lastForward.copy(surfaceForward);
  vehicleDynamics.lastRight.copy(surfaceRight);
}

function applyTakeoffDynamics(delta) {
  const speedFactor = THREE.MathUtils.clamp(Math.abs(vehicleDynamics.lastGroundedSpeed) / 42, 0, 1.35);
  const upwardSpeed = Math.max(0, chassisBody.velocity.y);
  const pitchAxis = new CANNON.Vec3(1, 0, 0);
  const rollAxis = new CANNON.Vec3(0, 0, 1);
  chassisBody.vectorToWorldFrame(pitchAxis, pitchAxis);
  chassisBody.vectorToWorldFrame(rollAxis, rollAxis);
  pitchAxis.normalize();
  rollAxis.normalize();

  const pitchImpulse = THREE.MathUtils.clamp(
    -vehicleDynamics.lastGroundSlope * (1.15 + speedFactor * 1.1) -
      upwardSpeed * 0.035 +
      vehicleDynamics.lastSteering * speedFactor * 0.1,
    -1.45,
    1.25,
  );
  const rollImpulse = THREE.MathUtils.clamp(
    vehicleDynamics.lastSideSlope * (0.95 + speedFactor * 0.85) +
      vehicleDynamics.lastSteering * speedFactor * 0.32,
    -1.05,
    1.05,
  );

  chassisBody.angularVelocity.x += pitchAxis.x * pitchImpulse + rollAxis.x * rollImpulse;
  chassisBody.angularVelocity.y += pitchAxis.y * pitchImpulse + rollAxis.y * rollImpulse;
  chassisBody.angularVelocity.z += pitchAxis.z * pitchImpulse + rollAxis.z * rollImpulse;

  const liftFromRamp = Math.max(0, vehicleDynamics.lastGroundSlope) * speedFactor * 0.22;
  chassisBody.velocity.y += Math.min(liftFromRamp, 0.28) * Math.max(delta * 60, 0.5);
}

function smoothstep(edge0, edge1, value) {
  const t = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function createWorld() {
  createSky();
  createGround();
  createTerrainBody();
  createTrack();
  createStartLine();
  createLowTrackWalls();
  createScenery();
  createBridgeRoutes();
  createGrandstands();
}

function createSky() {
  const skyGeometry = new THREE.SphereGeometry(520, 32, 18);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x74b9ee) },
      bottomColor: { value: new THREE.Color(0xe8f5ff) },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
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
  scene.add(sky);
}

function createGround() {
  const groundTexture = makeCityGroundTexture();
  groundTexture.repeat.set(54, 54);
  const geometry = createTerrainGeometry(TERRAIN_SIZE, TERRAIN_SEGMENTS, -0.035);

  const ground = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      map: groundTexture,
      color: 0x5c6265,
      roughness: 0.92,
    }),
  );
  ground.receiveShadow = true;
  scene.add(ground);
}

function createTerrainBody() {
  const data = [];
  const half = TERRAIN_SIZE / 2;

  for (let i = 0; i <= TERRAIN_SEGMENTS; i += 1) {
    data[i] = [];
    const x = -half + i * TERRAIN_ELEMENT_SIZE;

    for (let j = 0; j <= TERRAIN_SEGMENTS; j += 1) {
      const z = half - j * TERRAIN_ELEMENT_SIZE;
      data[i][j] = getTrackElevation(x, z);
    }
  }

  const heightfield = new CANNON.Heightfield(data, {
    elementSize: TERRAIN_ELEMENT_SIZE,
    minValue: -4,
    maxValue: 6,
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
  const asphaltTexture = makeAsphaltTexture();
  asphaltTexture.repeat.set(1, 30);

  const roadMaterial = new THREE.MeshStandardMaterial({
    map: asphaltTexture,
    color: 0x1d2022,
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
    color: 0xd92c24,
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
  createRacingLine();
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
    const next = trackPoints[(i + 1) % trackPoints.length];
    const previous = trackPoints[(i - 1 + trackPoints.length) % trackPoints.length];
    const normal = getTrackNormal(i);
    const tangent = next.clone().sub(previous).normalize();
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
    const next = trackPoints[(i + 1) % trackPoints.length];
    const previous = trackPoints[(i - 1 + trackPoints.length) % trackPoints.length];
    const tangent = next.clone().sub(previous).normalize();
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
    const point = trackPoints[index % trackPoints.length];
    const normal = getTrackNormal(index % trackPoints.length);
    const next = trackPoints[(index + 1) % trackPoints.length];
    const previous = trackPoints[(index - 1 + trackPoints.length) % trackPoints.length];
    const tangent = next.clone().sub(previous).normalize();
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
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9ddd8,
    roughness: 0.48,
    metalness: 0.12,
  });

  createLowWallLoop(ROAD_WIDTH / 2 + 1.05, wallMaterial);
  createLowWallLoop(-ROAD_WIDTH / 2 - 1.05, wallMaterial);
}

function createLowWallLoop(offset, material) {
  const segmentStep = 6;

  for (let i = 0; i < trackPoints.length; i += segmentStep) {
    const a = getOffsetTrackPoint(i, offset);
    const b = getOffsetTrackPoint((i + segmentStep) % trackPoints.length, offset);
    const midpoint = a.clone().add(b).multiplyScalar(0.5);

    if (shouldSkipTrackWallSegment(i, midpoint)) continue;
    createLowWallSegment(a, b, material, 0.52, 0.34, 1.05);
  }
}

function shouldSkipTrackWallSegment(index, midpoint) {
  const startPoint = trackPoints[0];
  const nearStartIndex = index < 22 || index > trackPoints.length - 22;
  const nearStartPosition = midpoint.distanceTo(startPoint) < 30;

  return (
    nearStartIndex ||
    nearStartPosition ||
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
  const point = trackPoints[index % trackPoints.length];
  const normal = getTrackNormal(index % trackPoints.length);
  const next = trackPoints[(index + 1) % trackPoints.length];
  const previous = trackPoints[(index - 1 + trackPoints.length) % trackPoints.length];
  const tangent = next.clone().sub(previous).normalize();
  const base = point.clone().addScaledVector(normal, side * (ROAD_WIDTH / 2 + 19));

  if (isNearTrack(base.x, base.y, ROAD_WIDTH + 6) || isNearTestArea(base.x, base.y, 8)) return;

  const yaw = Math.atan2(tangent.x, tangent.y);
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
  body.position.set(centerX, groundY + height / 2 + 0.03, centerZ);
  body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
  body.addShape(new CANNON.Box(new CANNON.Vec3(length / 2, height / 2, thickness / 2)));
  world.addBody(body);
}

function createStartLine() {
  const group = new THREE.Group();
  const stripeMaterialA = new THREE.MeshBasicMaterial({ color: 0xf7f7f2 });
  const stripeMaterialB = new THREE.MeshBasicMaterial({ color: 0x111416 });
  const startIndex = 0;
  const center = trackPoints[startIndex];
  const normal = getTrackNormal(startIndex);
  const next = trackPoints[(startIndex + 1) % trackPoints.length];
  const previous = trackPoints[(startIndex - 1 + trackPoints.length) % trackPoints.length];
  const tangent = next.clone().sub(previous).normalize();
  const yaw = Math.atan2(tangent.x, tangent.y);

  for (let i = 0; i < 8; i += 1) {
    const lateralOffset = -ROAD_WIDTH / 2 + ROAD_WIDTH / 16 + (i * ROAD_WIDTH) / 8;
    const position = center.clone().addScaledVector(normal, lateralOffset);
    const y = getTrackElevation(position.x, position.y) + TRACK_SURFACE_OFFSET + 0.14;
    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(ROAD_WIDTH / 8, 0.035, 1.05),
      i % 2 === 0 ? stripeMaterialA : stripeMaterialB,
    );
    stripe.position.set(position.x, y, position.y);
    stripe.rotation.y = yaw;
    stripe.renderOrder = 8;
    group.add(stripe);
  }

  scene.add(group);
}

function createScenery() {
  createTestArea();
  createCityBlocks();
  createStreetFurniture();
  createClouds();
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
      if (Math.abs(x) % 40 < 8 || Math.abs(z) % 40 < 8) continue;

      const seed = Math.abs(Math.sin(x * 12.9898 + z * 78.233));
      const width = 10 + Math.floor(seed * 5);
      const depth = 9 + Math.floor(((seed * 17) % 1) * 7);
      const height = 10 + Math.floor(((seed * 31) % 1) * 36);
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
    const base = point.clone().addScaledVector(normal, side * (ROAD_WIDTH / 2 + 3.1));
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
      const base = point.clone().addScaledVector(normal, side * (ROAD_WIDTH / 2 + 0.9));
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 8), bollardMaterial);
      post.position.set(base.x, getTrackElevation(base.x, base.y) + 0.31, base.y);
      post.castShadow = true;
      scene.add(post);
    }
  }

  const signPositions = [24, 96, 166, 230];
  for (const index of signPositions) {
    const point = trackPoints[index % trackPoints.length];
    const normal = getTrackNormal(index % trackPoints.length);
    const base = point.clone().addScaledVector(normal, ROAD_WIDTH / 2 + 4.4);
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

function createVehicle() {
  const chassisShape = new CANNON.Box(new CANNON.Vec3(1.05, 0.34, 2.05));
  const chassisBody = new CANNON.Body({
    mass: 850,
    material: carMaterial,
    angularDamping: 0.78,
    linearDamping: 0.1,
  });
  chassisBody.addShape(chassisShape);
  chassisBody.position.copy(START_POSITION);

  const vehicle = new CANNON.RaycastVehicle({
    chassisBody,
    indexRightAxis: 0,
    indexUpAxis: 1,
    indexForwardAxis: 2,
  });

  const wheelOptions = {
    radius: WHEEL_RADIUS,
    directionLocal: new CANNON.Vec3(0, -1, 0),
    suspensionStiffness: 215,
    suspensionRestLength: SUSPENSION_REST_LENGTH,
    frictionSlip: BASE_WHEEL_FRICTION_SLIP,
    dampingRelaxation: DAMPER_SETTINGS.rebound,
    dampingCompression: DAMPER_SETTINGS.compression,
    maxSuspensionForce: 170000,
    rollInfluence: 0.00028,
    axleLocal: new CANNON.Vec3(-1, 0, 0),
    maxSuspensionTravel: 0.16,
    customSlidingRotationalSpeed: -32,
    useCustomSlidingRotationalSpeed: true,
  };

  const wheelPositions = [
    new CANNON.Vec3(-0.92, WHEEL_CONNECTION_Y, 1.38),
    new CANNON.Vec3(0.92, WHEEL_CONNECTION_Y, 1.38),
    new CANNON.Vec3(-0.92, WHEEL_CONNECTION_Y, -1.38),
    new CANNON.Vec3(0.92, WHEEL_CONNECTION_Y, -1.38),
  ];

  for (const point of wheelPositions) {
    vehicle.addWheel({
      ...wheelOptions,
      chassisConnectionPointLocal: point,
    });
  }

  vehicle.addToWorld(world);

  const carGroup = createCarMesh();
  scene.add(carGroup);

  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x0c0d0f,
    roughness: 0.66,
    metalness: 0.08,
  });
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xc52d22,
    roughness: 0.32,
    metalness: 0.58,
  });
  const brakeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5bf29,
    roughness: 0.34,
    metalness: 0.24,
  });
  const hubMaterial = new THREE.MeshStandardMaterial({
    color: 0x1b1e22,
    roughness: 0.3,
    metalness: 0.64,
  });

  for (let i = 0; i < vehicle.wheelInfos.length; i += 1) {
    const wheel = new THREE.Group();
    const tireGeometry = new THREE.CylinderGeometry(0.43, 0.43, 0.34, 24);
    tireGeometry.rotateZ(Math.PI / 2);
    const rimGeometry = new THREE.CylinderGeometry(0.31, 0.31, 0.36, 28);
    rimGeometry.rotateZ(Math.PI / 2);
    const brakeGeometry = new THREE.CylinderGeometry(0.22, 0.22, 0.05, 24);
    brakeGeometry.rotateZ(Math.PI / 2);
    const hubGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.39, 16);
    hubGeometry.rotateZ(Math.PI / 2);

    const tire = new THREE.Mesh(tireGeometry, wheelMaterial);
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    const brake = new THREE.Mesh(brakeGeometry, brakeMaterial);
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    const visibleFaceOffset = i % 2 === 0 ? -0.19 : 0.19;

    rim.position.x = visibleFaceOffset * 0.42;
    brake.position.x = visibleFaceOffset * 0.72;
    hub.position.x = visibleFaceOffset * 0.46;
    tire.castShadow = true;
    rim.castShadow = true;
    brake.castShadow = true;
    hub.castShadow = true;

    for (let spokeIndex = 0; spokeIndex < 10; spokeIndex += 1) {
      const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.035, 0.42), rimMaterial);
      spoke.position.x = visibleFaceOffset;
      spoke.rotation.x = (spokeIndex / 10) * Math.PI * 2;
      spoke.castShadow = true;
      wheel.add(spoke);
    }

    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.24, 0.1), brakeMaterial);
    caliper.position.set(visibleFaceOffset * 1.06, 0.18, -0.08);
    caliper.castShadow = true;
    wheel.add(tire, brake, rim, hub, caliper);
    wheelMeshes.push(wheel);
    scene.add(wheel);
  }

  return { vehicle, chassisBody, carGroup };
}

function createCarMesh() {
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

function createTrackPoints() {
  const controlPoints = [
    new THREE.Vector3(TRACK_RADIUS, 0, START_LINE_Z),
    new THREE.Vector3(34, 0, 18),
    new THREE.Vector3(86, 0, 72),
    new THREE.Vector3(126, 0, 28),
    new THREE.Vector3(132, 0, -58),
    new THREE.Vector3(78, 0, -112),
    new THREE.Vector3(4, 0, -132),
    new THREE.Vector3(-82, 0, -106),
    new THREE.Vector3(-138, 0, -42),
    new THREE.Vector3(-130, 0, 46),
    new THREE.Vector3(-74, 0, 112),
    new THREE.Vector3(6, 0, 128),
    new THREE.Vector3(72, 0, 92),
    new THREE.Vector3(98, 0, 20),
    new THREE.Vector3(28, 0, -92),
  ];
  const curve = new THREE.CatmullRomCurve3(controlPoints, true, "catmullrom", 0.45);
  const sampled = curve.getSpacedPoints(360);
  const points = sampled.map((point) => new THREE.Vector2(point.x, point.z));

  if (points[points.length - 1].distanceTo(points[0]) < 0.001) {
    points.pop();
  }

  return points;
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
    const center = point.clone().addScaledVector(normal, centerOffset);

    if (previous) distance += center.distanceTo(previous);
    previous = center;

    for (let column = 0; column < columns; column += 1) {
      const t = column / (columns - 1);
      const lateralOffset = THREE.MathUtils.lerp(width / 2, -width / 2, t);
      const sample = center.clone().addScaledVector(normal, lateralOffset);

      vertices.push(sample.x, getTrackElevation(sample.x, sample.y) + y, sample.y);
      uvs.push(t, distance / 12);
    }
  }

  const count = trackPoints.length;
  for (let i = 0; i < count; i += 1) {
    const next = (i + 1) % count;

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
  const red = makeCurbGeometry(side, 0);
  const white = makeCurbGeometry(side, 1);

  const redMesh = new THREE.Mesh(
    red,
    new THREE.MeshBasicMaterial({ color: side > 0 ? 0xc9352c : 0xf4f4ec }),
  );
  const whiteMesh = new THREE.Mesh(
    white,
    new THREE.MeshBasicMaterial({ color: side > 0 ? 0xf4f4ec : 0xc9352c }),
  );
  scene.add(redMesh, whiteMesh);
}

function makeCurbGeometry(side, parity) {
  const vertices = [];
  const indices = [];

  for (let i = 0; i < trackPoints.length; i += 1) {
    if (Math.floor(i / 3) % 2 !== parity) continue;

    const next = (i + 1) % trackPoints.length;
    const normalA = getTrackNormal(i);
    const normalB = getTrackNormal(next);
    const a = trackPoints[i];
    const b = trackPoints[next];
    const innerOffset = side * (ROAD_WIDTH / 2 + 0.12);
    const outerOffset = side * (ROAD_WIDTH / 2 + 1.02);
    const v = vertices.length / 3;

    const p1 = a.clone().addScaledVector(normalA, innerOffset);
    const p2 = a.clone().addScaledVector(normalA, outerOffset);
    const p3 = b.clone().addScaledVector(normalB, innerOffset);
    const p4 = b.clone().addScaledVector(normalB, outerOffset);

    vertices.push(
      p1.x,
      getTrackElevation(p1.x, p1.y) + TRACK_SURFACE_OFFSET + 0.012,
      p1.y,
      p2.x,
      getTrackElevation(p2.x, p2.y) + TRACK_SURFACE_OFFSET + 0.012,
      p2.y,
      p3.x,
      getTrackElevation(p3.x, p3.y) + TRACK_SURFACE_OFFSET + 0.012,
      p3.y,
      p4.x,
      getTrackElevation(p4.x, p4.y) + TRACK_SURFACE_OFFSET + 0.012,
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

  for (let i = 0; i < trackPoints.length; i += segmentStep) {
    const a = getOffsetTrackPoint(i, offset);
    const b = getOffsetTrackPoint((i + segmentStep) % trackPoints.length, offset);
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
  body.position.set(centerX, groundY + height / 2 + 0.1, centerZ);
  body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
  body.addShape(new CANNON.Box(new CANNON.Vec3(length / 2, height / 2, thickness / 2)));
  world.addBody(body);
}

function getTrackNormal(index) {
  const previous = trackPoints[(index - 1 + trackPoints.length) % trackPoints.length];
  const next = trackPoints[(index + 1) % trackPoints.length];
  const tangent = next.clone().sub(previous).normalize();
  return new THREE.Vector2(-tangent.y, tangent.x);
}

function getOffsetTrackPoint(index, offset) {
  return trackPoints[index].clone().addScaledVector(getTrackNormal(index), offset);
}

function isNearTrack(x, z, margin) {
  const point = new THREE.Vector2(x, z);
  const marginSquared = margin * margin;

  for (const trackPoint of trackPoints) {
    if (point.distanceToSquared(trackPoint) < marginSquared) return true;
  }

  return false;
}

function isNearTestArea(x, z, margin = 0) {
  return (
    Math.abs(x - TEST_AREA.x) < TEST_AREA.width / 2 + margin &&
    Math.abs(z - TEST_AREA.z) < TEST_AREA.depth / 2 + margin
  );
}

function isNearBridgeAccess(x, z, margin = 0) {
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

function isNearOtherTrackBranch(point, index, margin) {
  const marginSquared = margin * margin;

  for (let i = 0; i < trackPoints.length; i += 6) {
    if (getWrappedIndexDistance(index, i, trackPoints.length) < 34) continue;
    if (point.distanceToSquared(trackPoints[i]) < marginSquared) return true;
  }

  return false;
}

function getWrappedIndexDistance(a, b, count) {
  const difference = Math.abs(a - b);
  return Math.min(difference, count - difference);
}

function bindInput() {
  window.addEventListener("keydown", (event) => {
    if (isDrivingKey(event.code)) event.preventDefault();
    keys.add(event.code);

    if (event.code === "KeyR") resetCar();
    if (event.code === "KeyC" && !event.repeat) cameraMode = (cameraMode + 1) % 2;
    if (event.code === "Enter" && !event.repeat) setPaused(!paused);
  });

  window.addEventListener("keyup", (event) => {
    keys.delete(event.code);
  });

  startButton.addEventListener("click", () => setPaused(!paused));

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  readyTimeout = window.setTimeout(() => {
    if (!paused) message.classList.remove("is-visible");
  }, 1200);
}

function setupDebugTools() {
  if (!new URLSearchParams(window.location.search).has("debug")) return;

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
    "ShiftLeft",
    "ShiftRight",
    "Enter",
  ].includes(code);
}

function updateControls(delta) {
  const forward = new CANNON.Vec3(0, 0, 1);
  chassisBody.vectorToWorldFrame(forward, forward);
  const rightVector = new CANNON.Vec3(1, 0, 0);
  chassisBody.vectorToWorldFrame(rightVector, rightVector);

  forward.y = 0;
  rightVector.y = 0;
  forward.normalize();
  rightVector.normalize();

  const wasGrounded = vehicleDynamics.grounded;
  const grounded = isVehicleGrounded();
  const groundNormal = getTerrainNormal(chassisBody.position.x, chassisBody.position.z);
  const surfaceForward = grounded ? projectOntoTerrain(forward, groundNormal) : forward;
  const surfaceRight = grounded ? projectOntoTerrain(rightVector, groundNormal) : rightVector;
  const signedSpeed = chassisBody.velocity.dot(surfaceForward);
  const speed = chassisBody.velocity.length();

  if (grounded) {
    updateTakeoffMemory(surfaceForward, surfaceRight, groundNormal, signedSpeed);
  } else if (wasGrounded) {
    applyTakeoffDynamics(delta);
  }

  const left = keys.has("KeyA") || keys.has("ArrowLeft");
  const right = keys.has("KeyD") || keys.has("ArrowRight");
  const throttle = keys.has("KeyW") || keys.has("ArrowUp");
  const reverse = keys.has("KeyS") || keys.has("ArrowDown");
  const handbrake = keys.has("Space");
  const driftKey = keys.has("ShiftLeft") || keys.has("ShiftRight");

  const absSpeed = Math.abs(signedSpeed);
  const speedSteerFactor = smoothstep(10, MAX_FORWARD_SPEED, absSpeed);
  const steerLimit = THREE.MathUtils.lerp(0.52, 0.18, speedSteerFactor);
  const rawSteerInput = (left ? 1 : 0) + (right ? -1 : 0);
  const targetSteer = rawSteerInput * steerLimit;
  const steerDemandChange = Math.abs(targetSteer - steering) / Math.max(steerLimit, 0.001);
  const steeringResponse =
    (targetSteer === 0 ? STEERING_RETURN_RESPONSE : STEERING_RESPONSE) *
    THREE.MathUtils.lerp(1, 0.84, speedSteerFactor);
  steering = THREE.MathUtils.lerp(steering, targetSteer, 1 - Math.exp(-steeringResponse * delta));

  const steeringLoad = Math.abs(steering) / Math.max(steerLimit, 0.001);
  const highSpeedSlip = smoothstep(HIGH_SPEED_UNDERSTEER_START, MAX_FORWARD_SPEED, absSpeed);
  const midSpeedSlip = smoothstep(34, HIGH_SPEED_UNDERSTEER_START, absSpeed);
  const driftTarget = driftKey && grounded && absSpeed > 5 ? 1 : 0;
  driftAmount = approach(driftAmount, driftTarget, (driftTarget > driftAmount ? 6.2 : 5.0) * delta);
  const targetSlip = THREE.MathUtils.clamp(
    steeringLoad * midSpeedSlip * 0.12 +
      steerDemandChange * midSpeedSlip * 0.08 +
      steeringLoad * highSpeedSlip * 0.16 +
      driftAmount * 0.08,
    0,
    0.42,
  );
  tireSlip = approach(tireSlip, targetSlip, (targetSlip > tireSlip ? 2.2 : 2.8) * delta);

  const lateralSpeedForDrift = chassisBody.velocity.dot(surfaceRight);
  const counterSteer = THREE.MathUtils.clamp(-lateralSpeedForDrift * 0.072 * driftAmount, -steerLimit * 0.92, steerLimit * 0.92);
  const frontSteer = steering * (1 - tireSlip * 0.18) + counterSteer;
  vehicle.setSteeringValue(frontSteer, 0);
  vehicle.setSteeringValue(frontSteer, 1);

  for (let i = 0; i < 4; i += 1) {
    vehicle.setBrake(0, i);
    vehicle.applyEngineForce(0, i);
  }

  let frontBrake = 0;
  let rearBrake = 0;
  const targetDriveInput = throttle ? 1 : reverse ? -0.55 : 0;
  const driveRamp = targetDriveInput === 0 ? 4.4 : 0.76;
  driveInput = approach(driveInput, targetDriveInput, driveRamp * delta);
  updateLaunchTraction(throttle, signedSpeed, delta);
  let braking = false;

  const maxDriveForce = 23500;
  const maxReverseForce = 6400;
  const maxWheelEngineForce = 7600;
  let centerDriveForce = 0;
  let wheelEngineForce = 0;

  if (driveInput > 0 && signedSpeed < MAX_FORWARD_SPEED) {
    const speedFade = THREE.MathUtils.lerp(
      1,
      0.5,
      THREE.MathUtils.clamp(Math.max(signedSpeed, 0) / MAX_FORWARD_SPEED, 0, 1),
    );
    centerDriveForce =
      maxDriveForce *
      0.46 *
      driveInput *
      speedFade *
      THREE.MathUtils.lerp(0.56, 1, tractionGrip);
    wheelEngineForce = -maxWheelEngineForce * driveInput * speedFade * (1 - tireSlip * 0.34);
  }

  if (reverse) {
    if (signedSpeed > 1.7) {
      frontBrake = Math.min(30, 13 + signedSpeed * 0.36);
      rearBrake = Math.min(24, 10 + signedSpeed * 0.28);
      driveInput = Math.min(driveInput, 0);
      braking = true;
    } else if (signedSpeed > -MAX_REVERSE_SPEED) {
      centerDriveForce = maxReverseForce * 0.25 * driveInput;
      wheelEngineForce = -maxWheelEngineForce * 0.5 * driveInput;
    }
  }

  if (!throttle && !reverse) {
    frontBrake = 0.22;
    rearBrake = 0.22;
  }

  if (handbrake) {
    rearBrake = 20;
  }

  vehicleDynamics.braking = braking;
  vehicleDynamics.throttle = throttle;
  vehicleDynamics.reverse = reverse;
  vehicleDynamics.grounded = grounded;
  vehicleDynamics.signedSpeed = signedSpeed;
  vehicleDynamics.airborneTime = grounded ? 0 : vehicleDynamics.airborneTime + delta;
  vehicleDynamics.airborneFallSpeed = grounded
    ? vehicleDynamics.airborneFallSpeed
    : Math.max(vehicleDynamics.airborneFallSpeed, -chassisBody.velocity.y);

  vehicle.setBrake(frontBrake, 0);
  vehicle.setBrake(frontBrake, 1);
  vehicle.setBrake(rearBrake, 2);
  vehicle.setBrake(rearBrake, 3);
  vehicle.applyEngineForce(wheelEngineForce * 0.18, 0);
  vehicle.applyEngineForce(wheelEngineForce * 0.18, 1);
  vehicle.applyEngineForce(wheelEngineForce * 0.82, 2);
  vehicle.applyEngineForce(wheelEngineForce * 0.82, 3);

  if (grounded) {
    applyCenteredDriveForce(surfaceForward, centerDriveForce);
    applyArcadeGrip(surfaceForward, surfaceRight, signedSpeed, delta);
    applyYawAssist(signedSpeed, delta);
    applyAntiWheelie(surfaceForward, groundNormal, signedSpeed, throttle, delta);
    applyBrakeAssist(surfaceForward, signedSpeed, delta, braking);
    applyAccelerationStability(throttle, signedSpeed, delta);
    applyDriftAssist(surfaceForward, surfaceRight, signedSpeed, delta);
    applyDamperStabilization(delta);

    const downForce = Math.min(speed * speed * 2.45, 4800);
    chassisBody.applyForce(
      new CANNON.Vec3(-groundNormal.x * downForce, -groundNormal.y * downForce, -groundNormal.z * downForce),
      CENTER_OF_MASS,
    );
  }

  applySpeedLimit(surfaceForward, signedSpeed);
  applyAirSafety(surfaceRight, surfaceForward, delta, grounded);

  if (chassisBody.position.y < -5) {
    resetCar();
  }
}

function approach(current, target, amount) {
  if (current < target) return Math.min(current + amount, target);
  if (current > target) return Math.max(current - amount, target);
  return target;
}

function updateLaunchTraction(throttle, signedSpeed, delta) {
  const launchIntensity = THREE.MathUtils.clamp(Math.abs(driveInput), 0, 1);
  const speedRecovery = THREE.MathUtils.clamp(Math.abs(signedSpeed) / 13, 0, 1);
  const hardLaunch = throttle && launchIntensity > 0.45 && Math.abs(signedSpeed) < 13;
  const targetGrip = hardLaunch
    ? THREE.MathUtils.lerp(MIN_LAUNCH_TRACTION, 0.82, speedRecovery)
    : 1;
  const rate = targetGrip < tractionGrip ? 6.5 : 0.55;

  tractionGrip = approach(tractionGrip, targetGrip, rate * delta);

  const wheelFriction = BASE_WHEEL_FRICTION_SLIP * THREE.MathUtils.lerp(0.46, 1, tractionGrip);
  for (let i = 0; i < vehicle.wheelInfos.length; i += 1) {
    const driftGripLoss = driftAmount * 0.5;
    const frontSlipLoss = i < 2 ? tireSlip * 0.1 : tireSlip * 0.04;
    const gripMultiplier = THREE.MathUtils.clamp(1 - driftGripLoss - frontSlipLoss, 0.42, 1);
    vehicle.wheelInfos[i].frictionSlip = wheelFriction * gripMultiplier;
  }
}

function isVehicleGrounded() {
  return vehicle.wheelInfos.some((wheel) => wheel.isInContact || wheel.raycastResult?.hasHit);
}

function applyCenteredDriveForce(forward, force) {
  if (Math.abs(force) < 1) return;

  chassisBody.applyForce(
    new CANNON.Vec3(forward.x * force, forward.y * force, forward.z * force),
    CENTER_OF_MASS,
  );
}

function applyArcadeGrip(forward, rightVector, signedSpeed, delta) {
  const lateralSpeed = chassisBody.velocity.dot(rightVector);
  const speedFactor = THREE.MathUtils.clamp(Math.abs(signedSpeed) / MAX_FORWARD_SPEED, 0, 1);
  const lateralGrip =
    THREE.MathUtils.clamp(delta * THREE.MathUtils.lerp(7.8, 5.3, speedFactor), 0, 0.4) *
    THREE.MathUtils.lerp(0.38, 1, tractionGrip) *
    (1 - tireSlip * 0.14);
  chassisBody.velocity.x -= rightVector.x * lateralSpeed * lateralGrip;
  chassisBody.velocity.y -= rightVector.y * lateralSpeed * lateralGrip;
  chassisBody.velocity.z -= rightVector.z * lateralSpeed * lateralGrip;

  const steeringSlide =
    steering *
    tireSlip *
    smoothstep(16, MAX_FORWARD_SPEED, Math.abs(signedSpeed)) *
    Math.abs(signedSpeed) *
    delta *
    0.07;
  chassisBody.velocity.x += rightVector.x * steeringSlide;
  chassisBody.velocity.z += rightVector.z * steeringSlide;

  if (Math.abs(signedSpeed) < 0.35 && Math.abs(driveInput) < 0.05) {
    chassisBody.velocity.x *= 0.94;
    chassisBody.velocity.z *= 0.94;
  }

  const rollingDrag = 0.024 + Math.min(Math.abs(signedSpeed) * 0.00145, 0.105);
  chassisBody.applyForce(
    new CANNON.Vec3(
      -forward.x * signedSpeed * rollingDrag * 850,
      -forward.y * signedSpeed * rollingDrag * 850,
      -forward.z * signedSpeed * rollingDrag * 850,
    ),
    CENTER_OF_MASS,
  );
}

function applyYawAssist(signedSpeed, delta) {
  const speedFactor = THREE.MathUtils.clamp(Math.abs(signedSpeed) / 14, 0, 1);
  const launchFactor = THREE.MathUtils.clamp(Math.abs(driveInput) * (1 - speedFactor), 0, 1);
  const direction = signedSpeed >= 0 ? 1 : -1;
  const reverseDirection = driveInput < -0.05 && Math.abs(signedSpeed) < 3 ? -1 : 1;
  const yawAssist =
    (speedFactor * 1.18 + launchFactor * 0.72) *
    THREE.MathUtils.lerp(0.72, 1, tractionGrip) *
    (1 - tireSlip * 0.12 + driftAmount * 0.58);
  chassisBody.angularVelocity.y += steering * yawAssist * direction * reverseDirection * delta * 1.32;
  chassisBody.angularVelocity.x *= 0.96;
  chassisBody.angularVelocity.z *= 0.96;
}

function applyAccelerationStability(throttle, signedSpeed, delta) {
  if (!throttle || driveInput < 0.08) return;

  const speedFactor = THREE.MathUtils.clamp(Math.max(signedSpeed, 0) / MAX_FORWARD_SPEED, 0, 1);
  const damping = THREE.MathUtils.clamp(delta * (3.2 + driveInput * 2.6) * (1 - speedFactor * 0.35), 0, 0.13);
  chassisBody.angularVelocity.x *= 1 - damping * 0.45;
  chassisBody.angularVelocity.z *= 1 - damping * 0.45;

  if (Math.abs(chassisBody.velocity.y) < 2.2) {
    chassisBody.velocity.y *= 1 - damping * 0.8;
  }
}

function applyDriftAssist(forward, rightVector, signedSpeed, delta) {
  if (driftAmount <= 0.02) return;

  const lateralSpeed = chassisBody.velocity.dot(rightVector);
  const steerDirection = Math.sign(steering || lateralSpeed || 1);
  const speedFactor = THREE.MathUtils.clamp(Math.abs(signedSpeed) / MAX_FORWARD_SPEED, 0, 1);
  const driftSpeed = THREE.MathUtils.clamp(Math.abs(signedSpeed) / 12, 0, 1);
  const naturalYawRate = steerDirection * driftAmount * driftSpeed * (0.95 + speedFactor * 1.65);
  const yawBlend = THREE.MathUtils.clamp(delta * (2.8 + speedFactor * 2.4), 0, 0.18);
  const sideSlipTarget = steerDirection * driftAmount * driftSpeed * (1.1 + speedFactor * 2.2);
  const sideSlipBlend = THREE.MathUtils.clamp(delta * 1.15, 0, 0.08);

  chassisBody.angularVelocity.y += (naturalYawRate - chassisBody.angularVelocity.y) * yawBlend;
  chassisBody.velocity.x += rightVector.x * (sideSlipTarget - lateralSpeed) * sideSlipBlend;
  chassisBody.velocity.z += rightVector.z * (sideSlipTarget - lateralSpeed) * sideSlipBlend;
  chassisBody.angularVelocity.x *= 1 - Math.min(delta * 1.8, 0.08);
  chassisBody.angularVelocity.z *= 1 - Math.min(delta * 1.8, 0.08);
}

function applyAntiWheelie(forward, groundNormal, signedSpeed, throttle, delta) {
  if (!throttle || driveInput < 0.15 || signedSpeed > 24) return;

  const speedFactor = THREE.MathUtils.clamp(Math.max(signedSpeed, 0) / 24, 0, 1);
  const launchLoad = driveInput * (1 - speedFactor);
  const frontPoint = new CANNON.Vec3(forward.x * 1.42, forward.y * 1.42, forward.z * 1.42);
  const noseForce = chassisBody.mass * 10.5 * launchLoad;

  chassisBody.applyForce(
    new CANNON.Vec3(-groundNormal.x * noseForce, -groundNormal.y * noseForce, -groundNormal.z * noseForce),
    frontPoint,
  );

  const pitchDamping = THREE.MathUtils.clamp(delta * launchLoad * 4.8, 0, 0.18);
  chassisBody.angularVelocity.x *= 1 - pitchDamping;
}

function applyBrakeAssist(forward, signedSpeed, delta, braking) {
  if (!braking) return;

  const brakeDeceleration = 5.2 + Math.min(Math.abs(signedSpeed) * 0.18, 9.5);
  const speedReduction = Math.min(Math.abs(signedSpeed), brakeDeceleration * delta);
  const direction = Math.sign(signedSpeed);

  chassisBody.velocity.x -= forward.x * direction * speedReduction;
  chassisBody.velocity.y -= forward.y * direction * speedReduction;
  chassisBody.velocity.z -= forward.z * direction * speedReduction;
}

function getGroundContactInfo() {
  const normal = new CANNON.Vec3();
  let groundedWheels = 0;
  let compression = 0;

  for (const wheel of vehicle.wheelInfos) {
    const raycast = wheel.raycastResult;
    const contact = wheel.isInContact || raycast?.hasHit;

    if (!contact) continue;

    groundedWheels += 1;
    compression += Math.max(0, SUSPENSION_REST_LENGTH - (wheel.suspensionLength ?? SUSPENSION_REST_LENGTH));

    if (raycast?.hitNormalWorld) {
      normal.x += raycast.hitNormalWorld.x;
      normal.y += raycast.hitNormalWorld.y;
      normal.z += raycast.hitNormalWorld.z;
    }
  }

  if (groundedWheels === 0 || normal.lengthSquared() < 0.0001 || normal.y < 0.18) {
    normal.copy(getTerrainNormal(chassisBody.position.x, chassisBody.position.z));
  } else {
    normal.normalize();
    const terrainNormal = getTerrainNormal(chassisBody.position.x, chassisBody.position.z);
    normal.x = normal.x * 0.74 + terrainNormal.x * 0.26;
    normal.y = normal.y * 0.74 + terrainNormal.y * 0.26;
    normal.z = normal.z * 0.74 + terrainNormal.z * 0.26;
    normal.normalize();
  }

  return {
    groundedWheels,
    contactRatio: groundedWheels / vehicle.wheelInfos.length,
    compression: groundedWheels > 0 ? compression / groundedWheels : 0,
    normal,
  };
}

function applyGroundConformity(delta, contactInfo) {
  if (contactInfo.groundedWheels === 0) return;

  const currentUp = new CANNON.Vec3(0, 1, 0);
  chassisBody.vectorToWorldFrame(currentUp, currentUp);
  currentUp.normalize();

  const desiredNormal = contactInfo.normal;
  const correctionAxis = crossCannonVectors(currentUp, desiredNormal);
  const axisLength = correctionAxis.length();

  if (axisLength < 0.0001) return;

  correctionAxis.scale(1 / axisLength, correctionAxis);
  const error = Math.asin(THREE.MathUtils.clamp(axisLength, -1, 1));
  const speedFactor = THREE.MathUtils.clamp(Math.abs(vehicleDynamics.signedSpeed) / MAX_FORWARD_SPEED, 0, 1);
  const contactGain = THREE.MathUtils.clamp(contactInfo.groundedWheels / 2, 0.35, 1);
  const response = THREE.MathUtils.lerp(13.5, 7.2, speedFactor) * contactGain;
  const damping = THREE.MathUtils.lerp(2.5, 1.25, speedFactor) * contactGain;
  const angularAlongAxis = chassisBody.angularVelocity.dot(correctionAxis);
  const correction = THREE.MathUtils.clamp((error * response - angularAlongAxis * damping) * delta, -0.18, 0.18);

  chassisBody.angularVelocity.x += correctionAxis.x * correction;
  chassisBody.angularVelocity.y += correctionAxis.y * correction;
  chassisBody.angularVelocity.z += correctionAxis.z * correction;
}

function crossCannonVectors(a, b) {
  return new CANNON.Vec3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  );
}

function applyDamperStabilization(delta) {
  const contactInfo = getGroundContactInfo();
  const groundedWheels = contactInfo.groundedWheels;
  if (groundedWheels === 0) return;

  const contactRatio = contactInfo.contactRatio;
  const groundY = getTrackElevation(chassisBody.position.x, chassisBody.position.z);
  const groundNormal = contactInfo.normal;
  const heightAboveGround = chassisBody.position.y - groundY;
  const pitchRollBlend = THREE.MathUtils.clamp(
    delta * DAMPER_SETTINGS.chassisPitchRoll * 3.2 * contactRatio,
    0,
    0.07,
  );
  const heaveBlend = THREE.MathUtils.clamp(delta * DAMPER_SETTINGS.heave * 5.6 * contactRatio, 0, 0.1);

  applyBumpStop(groundNormal, heightAboveGround, contactRatio);
  applyTunedMassDamper(delta, contactRatio);

  chassisBody.angularVelocity.x *= 1 - pitchRollBlend;
  chassisBody.angularVelocity.z *= 1 - pitchRollBlend;

  if (chassisBody.velocity.y > 0) {
    chassisBody.velocity.y *= 1 - heaveBlend;

    if (heightAboveGround > 1.25) {
      chassisBody.velocity.y *= 0.78;
    }
  } else if (groundedWheels >= 3) {
    chassisBody.velocity.y *= 1 - heaveBlend * 0.2;
  }
}

function applyBumpStop(groundNormal, heightAboveGround, contactRatio) {
  const compression = DAMPER_SETTINGS.bumpStopStart - heightAboveGround;
  if (compression <= 0) return;

  const force = compression * DAMPER_SETTINGS.bumpStopStrength * chassisBody.mass * contactRatio;
  chassisBody.applyForce(
    new CANNON.Vec3(groundNormal.x * force, groundNormal.y * force, groundNormal.z * force),
    CENTER_OF_MASS,
  );

  const normalSpeed = chassisBody.velocity.dot(groundNormal);
  if (normalSpeed < 0) {
    chassisBody.velocity.x -= groundNormal.x * normalSpeed * 0.62;
    chassisBody.velocity.y -= groundNormal.y * normalSpeed * 0.62;
    chassisBody.velocity.z -= groundNormal.z * normalSpeed * 0.62;
  }
}

function applyTunedMassDamper(delta, contactRatio) {
  const response = 1 - Math.exp(-TUNED_MASS_DAMPER.response * delta);

  tunedDamperState.heave += (chassisBody.velocity.y - tunedDamperState.heave) * response;
  tunedDamperState.pitch += (chassisBody.angularVelocity.x - tunedDamperState.pitch) * response;
  tunedDamperState.roll += (chassisBody.angularVelocity.z - tunedDamperState.roll) * response;

  const heaveCounter =
    (chassisBody.velocity.y - tunedDamperState.heave) * TUNED_MASS_DAMPER.heave * contactRatio;
  const pitchCounter =
    (chassisBody.angularVelocity.x - tunedDamperState.pitch) * TUNED_MASS_DAMPER.pitch * contactRatio;
  const rollCounter =
    (chassisBody.angularVelocity.z - tunedDamperState.roll) * TUNED_MASS_DAMPER.roll * contactRatio;

  chassisBody.velocity.y -= heaveCounter;
  chassisBody.angularVelocity.x -= pitchCounter;
  chassisBody.angularVelocity.z -= rollCounter;
}

function applySpeedLimit(forward, signedSpeed) {
  if (signedSpeed > MAX_FORWARD_SPEED) {
    const excess = signedSpeed - MAX_FORWARD_SPEED;
    chassisBody.velocity.x -= forward.x * excess;
    chassisBody.velocity.y -= forward.y * excess;
    chassisBody.velocity.z -= forward.z * excess;
  } else if (signedSpeed < -MAX_REVERSE_SPEED) {
    const excess = signedSpeed + MAX_REVERSE_SPEED;
    chassisBody.velocity.x -= forward.x * excess;
    chassisBody.velocity.y -= forward.y * excess;
    chassisBody.velocity.z -= forward.z * excess;
  }
}

function applyAirSafety(rightVector, forward, delta, grounded) {
  const lateralSpeed = chassisBody.velocity.dot(rightVector);
  const maxAirSideSpeed = 10;

  if (Math.abs(lateralSpeed) > maxAirSideSpeed) {
    const excess = lateralSpeed - Math.sign(lateralSpeed) * maxAirSideSpeed;
    chassisBody.velocity.x -= rightVector.x * excess;
    chassisBody.velocity.y -= rightVector.y * excess;
    chassisBody.velocity.z -= rightVector.z * excess;
  }

  if (grounded) return;

  const forwardSpeed = Math.max(0, chassisBody.velocity.dot(forward));
  const pitchRollDamping = THREE.MathUtils.clamp(delta * (0.72 + forwardSpeed * 0.006), 0, 0.055);
  const yawDamping = THREE.MathUtils.clamp(delta * 0.38, 0, 0.032);
  const maxAirAngularVelocity = 4.2;

  chassisBody.angularVelocity.x *= 1 - pitchRollDamping;
  chassisBody.angularVelocity.z *= 1 - pitchRollDamping;
  chassisBody.angularVelocity.y *= 1 - yawDamping;
  chassisBody.angularVelocity.x = THREE.MathUtils.clamp(
    chassisBody.angularVelocity.x,
    -maxAirAngularVelocity,
    maxAirAngularVelocity,
  );
  chassisBody.angularVelocity.z = THREE.MathUtils.clamp(
    chassisBody.angularVelocity.z,
    -maxAirAngularVelocity,
    maxAirAngularVelocity,
  );

  const airDownforce = Math.min(forwardSpeed * forwardSpeed * 1.45, 1800);
  chassisBody.applyForce(new CANNON.Vec3(0, -airDownforce, 0), CENTER_OF_MASS);
}

function stabilizeChassis(delta) {
  const groundY = getTrackElevation(chassisBody.position.x, chassisBody.position.z);
  const heightAboveRest = chassisBody.position.y - groundY;
  const contactInfo = getGroundContactInfo();
  const groundedWheels = contactInfo.groundedWheels;
  const contactRatio = contactInfo.contactRatio;
  const grounded = groundedWheels > 0;

  if (grounded) {
    const justLanded = contactRatio >= 0.5 && visualSuspension.contactRatio < 0.25;
    const landingSpeed = Math.max(
      0,
      -vehicleDynamics.preStepVelocityY,
      vehicleDynamics.airborneFallSpeed,
    );
    const airborneBounce = THREE.MathUtils.clamp(vehicleDynamics.airborneTime * 0.18, 0, 0.18);
    const chassisBounce = justLanded
      ? THREE.MathUtils.clamp(landingSpeed * 0.18 + airborneBounce, 0.08, 1.15)
      : 0;
    const bounceLimit = 0.55 + contactRatio * 0.34 + THREE.MathUtils.clamp(landingSpeed * 0.07, 0, 0.55);
    const angularDamping = 1 - THREE.MathUtils.clamp(0.045 * contactRatio, 0, 0.045);

    applyGroundConformity(delta, contactInfo);
    if (justLanded) {
      chassisBody.velocity.x += contactInfo.normal.x * chassisBounce;
      chassisBody.velocity.y += contactInfo.normal.y * chassisBounce;
      chassisBody.velocity.z += contactInfo.normal.z * chassisBounce;
      chassisBody.velocity.y = Math.min(Math.max(chassisBody.velocity.y, chassisBounce * 0.72), bounceLimit);
      chassisBody.angularVelocity.x += THREE.MathUtils.clamp(
        vehicleDynamics.lastGroundSlope * landingSpeed * 0.075,
        -0.38,
        0.38,
      );
      chassisBody.angularVelocity.z += THREE.MathUtils.clamp(
        -vehicleDynamics.lastSideSlope * landingSpeed * 0.065,
        -0.32,
        0.32,
      );
    } else {
      chassisBody.velocity.y = Math.min(chassisBody.velocity.y, bounceLimit);
      chassisBody.velocity.y *= 0.84;
    }
    chassisBody.angularVelocity.x *= angularDamping;
    chassisBody.angularVelocity.z *= angularDamping;

    if (justLanded) {
      vehicleDynamics.airborneFallSpeed = 0;
      vehicleDynamics.airborneTime = 0;
    }
  }

  if (heightAboveRest > 0.95 && chassisBody.velocity.y > 2.4) {
    chassisBody.velocity.y = 2.4;
  }

  if (heightAboveRest > 0.55) {
    const maxAngularVelocity = grounded ? 3.6 : 3.0;
    chassisBody.angularVelocity.x = THREE.MathUtils.clamp(
      chassisBody.angularVelocity.x,
      -maxAngularVelocity,
      maxAngularVelocity,
    );
    chassisBody.angularVelocity.z = THREE.MathUtils.clamp(
      chassisBody.angularVelocity.z,
      -maxAngularVelocity,
      maxAngularVelocity,
    );
  }

  if (chassisBody.position.y > groundY + 7) {
    resetCar();
  }
}

function updateVehicleMeshes(delta) {
  const targetPosition = new THREE.Vector3(
    chassisBody.position.x,
    chassisBody.position.y,
    chassisBody.position.z,
  );
  const targetQuaternion = new THREE.Quaternion(
    chassisBody.quaternion.x,
    chassisBody.quaternion.y,
    chassisBody.quaternion.z,
    chassisBody.quaternion.w,
  );
  const bodyBlend = 1 - Math.exp(-22 * delta);

  if (!carVisualMotion.initialized) {
    carVisualMotion.initialized = true;
    carVisualMotion.position.copy(targetPosition);
    carVisualMotion.quaternion.copy(targetQuaternion);
  }

  carVisualMotion.position.lerp(targetPosition, bodyBlend);
  carVisualMotion.quaternion.slerp(targetQuaternion, bodyBlend);
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
    const wheelBlend = 1 - Math.exp(-26 * delta);

    if (!wheelMeshMotion[i].initialized) {
      wheelMeshMotion[i].initialized = true;
      wheelMeshMotion[i].position.copy(targetWheelPosition);
      wheelMeshMotion[i].quaternion.copy(targetWheelQuaternion);
    }

    wheelMeshMotion[i].position.lerp(targetWheelPosition, wheelBlend);
    wheelMeshMotion[i].quaternion.slerp(targetWheelQuaternion, wheelBlend);
    wheelMeshes[i].position.copy(wheelMeshMotion[i].position);
    wheelMeshes[i].quaternion.copy(wheelMeshMotion[i].quaternion);
  }

  updateSuspensionVisual(delta);
  updateTunedMassVisual();
  emitDriftSmoke(delta);
  updateDriftSmoke(delta);
  updateDriftLabel(delta);
}

function emitDriftSmoke(delta) {
  if (driftAmount < 0.12 || !vehicleDynamics.grounded || Math.abs(vehicleDynamics.signedSpeed) < 7) return;

  const emissionChance = driftAmount * Math.min(Math.abs(vehicleDynamics.signedSpeed) / 26, 1) * delta * 30;
  if (Math.random() > emissionChance) return;

  for (const wheelIndex of [2, 3]) {
    const wheel = wheelMeshes[wheelIndex];
    if (!wheel) continue;

    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 6),
      new THREE.MeshBasicMaterial({
        color: 0xaeb2b1,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    );
    puff.position.copy(wheel.position);
    puff.position.y += 0.08;
    puff.scale.setScalar(0.55 + Math.random() * 0.25);
    puff.userData.life = 0.75;
    puff.userData.maxLife = 0.75;
    puff.userData.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.35,
      0.35 + Math.random() * 0.22,
      (Math.random() - 0.5) * 0.35,
    );
    driftSmokeParticles.push(puff);
    scene.add(puff);
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

  const dt = Math.max(delta, 1 / 120);
  const speedAbs = Math.abs(vehicleDynamics.signedSpeed);
  const highSpeedSuppression = THREE.MathUtils.lerp(0.58, 0.2, smoothstep(16, 70, speedAbs));
  const impactSuppression = THREE.MathUtils.lerp(0.55, 0.22, smoothstep(28, 78, speedAbs));
  const compression = vehicle.wheelInfos.map((wheel, index) => {
    const contact = wheel.isInContact || wheel.raycastResult?.hasHit;
    const suspensionLength = Number.isFinite(wheel.suspensionLength)
      ? wheel.suspensionLength
      : SUSPENSION_REST_LENGTH;
    const targetCompression = contact
      ? THREE.MathUtils.clamp(
          (SUSPENSION_REST_LENGTH - suspensionLength) / SUSPENSION_REST_LENGTH,
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
  const speedFactor = THREE.MathUtils.clamp(speedAbs / 34, 0, 1);
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
  const time = performance.now() * 0.001;
  const surfaceShake = getSurfaceRipple(chassisBody.position.x + 3.7, chassisBody.position.z - 2.1) * 0.58;
  const roadShake =
    contactRatio *
    roadShakeSpeedGain *
    VISUAL_SUSPENSION.roadShake *
    (surfaceShake + Math.sin(time * 24) * 0.44 + Math.sin(time * 47) * 0.28);
  const airborneSag = grounded ? 0 : -0.025;
  const targetHeave = -averageCompression * VISUAL_SUSPENSION.heaveScale + roadShake + airborneSag;
  const targetPitch =
    (frontCompression - rearCompression) * VISUAL_SUSPENSION.pitchScale +
    brakeDive +
    throttleSquat +
    THREE.MathUtils.clamp(chassisBody.angularVelocity.x * 0.018, -0.08, 0.08);
  const targetRoll =
    (leftCompression - rightCompression) * VISUAL_SUSPENSION.rollScale +
    steeringLean +
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
  const velocityKey = `${key}Velocity`;
  const displacement = target - state[key];
  state[velocityKey] += displacement * VISUAL_SUSPENSION.stiffness * delta;
  state[velocityKey] *= Math.exp(-VISUAL_SUSPENSION.damping * delta);
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
  const carPosition = carVisualMotion.initialized
    ? carVisualMotion.position.clone()
    : new THREE.Vector3(chassisBody.position.x, chassisBody.position.y, chassisBody.position.z);
  const carQuaternion = carVisualMotion.initialized
    ? carVisualMotion.quaternion.clone()
    : new THREE.Quaternion(
        chassisBody.quaternion.x,
        chassisBody.quaternion.y,
        chassisBody.quaternion.z,
        chassisBody.quaternion.w,
      );
  const rawForward = new THREE.Vector3(0, 0, 1).applyQuaternion(carQuaternion).normalize();
  const horizontalForward = new THREE.Vector3(rawForward.x, 0, rawForward.z);
  if (horizontalForward.lengthSq() < 0.0001) horizontalForward.set(0, 0, 1);
  horizontalForward.normalize();

  const up = new THREE.Vector3(0, 1, 0);
  const focusTarget = carPosition.clone();
  focusTarget.y = getTrackElevation(chassisBody.position.x, chassisBody.position.z) + 0.88;

  if (!cameraRig.initialized) {
    cameraRig.initialized = true;
    cameraRig.focus.copy(focusTarget);
    cameraRig.forward.copy(horizontalForward);
  }

  const speedFactor = THREE.MathUtils.clamp(Math.abs(vehicleDynamics.signedSpeed) / MAX_FORWARD_SPEED, 0, 1);
  const focusBlend = 1 - Math.exp(-(10.5 + speedFactor * 5.5) * delta);
  const forwardBlend = 1 - Math.exp(-(6.5 + speedFactor * 5.5) * delta);
  cameraRig.focus.lerp(focusTarget, focusBlend);
  cameraRig.forward.lerp(horizontalForward, forwardBlend).normalize();

  const target = cameraRig.focus.clone().add(up.clone().multiplyScalar(0.78));

  let desiredPosition;
  let lookTarget;

  if (cameraMode === 0) {
    const distance = THREE.MathUtils.lerp(8.4, 7.1, speedFactor);
    const height = THREE.MathUtils.lerp(4.25, 5.25, speedFactor);
    const lookAhead = THREE.MathUtils.lerp(10.5, 16.5, speedFactor);
    desiredPosition = target.clone().addScaledVector(cameraRig.forward, -distance).add(up.clone().multiplyScalar(height));
    lookTarget = target.clone().addScaledVector(cameraRig.forward, lookAhead).add(up.clone().multiplyScalar(0.15));
  } else {
    desiredPosition = target.clone().addScaledVector(cameraRig.forward, 0.85).add(up.clone().multiplyScalar(0.24));
    lookTarget = target.clone().addScaledVector(cameraRig.forward, 18).add(up.clone().multiplyScalar(0.08));
  }

  const positionBlend = 1 - Math.exp(-(cameraMode === 0 ? 6.4 + speedFactor * 4.8 : 9.5) * delta);
  const lookBlend = 1 - Math.exp(-(cameraMode === 0 ? 8.4 + speedFactor * 5.2 : 11.5) * delta);
  camera.position.lerp(desiredPosition, positionBlend);

  if (!cameraRig.lookTarget.lengthSq()) cameraRig.lookTarget.copy(lookTarget);
  cameraRig.lookTarget.lerp(lookTarget, lookBlend);
  camera.lookAt(cameraRig.lookTarget);
}

function updateLap() {
  const currentZ = chassisBody.position.z;
  const currentX = chassisBody.position.x;
  const now = performance.now();
  const insideStartGate =
    currentX > TRACK_RADIUS - ROAD_WIDTH / 2 - 1 && currentX < TRACK_RADIUS + ROAD_WIDTH / 2 + 1;

  if (previousZ < START_LINE_Z && currentZ >= START_LINE_Z && insideStartGate && now - lastLapStamp > 5000) {
    const lapTime = now - lapStartedAt;

    if (lapTime > 9000) {
      lap += 1;
      bestLap = bestLap === null ? lapTime : Math.min(bestLap, lapTime);
      lapStartedAt = now;
      lastLapStamp = now;
      flashMessage(`LAP ${lap}`);
    }
  }

  previousZ = currentZ;
}

function updateHud() {
  const kmh = Math.round(chassisBody.velocity.length() * 3.6);
  const elapsed = performance.now() - lapStartedAt;
  speedValue.textContent = String(Math.min(kmh, 999)).padStart(3, "0");
  lapValue.textContent = String(lap);
  currentLapValue.textContent = formatTime(elapsed);
  bestLapValue.textContent = bestLap === null ? "--.---" : formatTime(bestLap);
  gearValue.textContent = estimateGear(kmh);
}

function estimateGear(kmh) {
  const reverseInput = keys.has("KeyS") || keys.has("ArrowDown");
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

function resetCar() {
  chassisBody.position.copy(START_POSITION);
  chassisBody.quaternion.set(0, 0, 0, 1);
  chassisBody.velocity.set(0, 0, 0);
  chassisBody.angularVelocity.set(0, 0, 0);
  chassisBody.force.set(0, 0, 0);
  chassisBody.torque.set(0, 0, 0);

  for (let i = 0; i < vehicle.wheelInfos.length; i += 1) {
    vehicle.applyEngineForce(0, i);
    vehicle.setBrake(0, i);
  }

  vehicle.setSteeringValue(0, 0);
  vehicle.setSteeringValue(0, 1);
  previousZ = START_POSITION.z;
  steering = 0;
  driveInput = 0;
  tractionGrip = 1;
  tireSlip = 0;
  driftAmount = 0;
  driftScore = 0;
  if (driftLabelSprite) {
    driftLabelSprite.material.opacity = 0;
    driftLabelSprite.visible = false;
    driftLabelSprite.userData.lastText = "";
  }
  vehicleDynamics.braking = false;
  vehicleDynamics.throttle = false;
  vehicleDynamics.reverse = false;
  vehicleDynamics.grounded = false;
  vehicleDynamics.signedSpeed = 0;
  vehicleDynamics.preStepVelocityY = 0;
  vehicleDynamics.airborneTime = 0;
  vehicleDynamics.airborneFallSpeed = 0;
  vehicleDynamics.lastGroundSlope = 0;
  vehicleDynamics.lastSideSlope = 0;
  vehicleDynamics.lastGroundedSpeed = 0;
  vehicleDynamics.lastSteering = 0;
  vehicleDynamics.lastForward.set(0, 0, 1);
  vehicleDynamics.lastRight.set(1, 0, 0);
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
}

function setPaused(value) {
  if (paused === value) return;

  paused = value;
  startButton.classList.toggle("is-running", !paused);
  startButton.classList.toggle("is-paused", paused);

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

  function frame(time) {
    requestAnimationFrame(frame);

    if (lastTime === undefined) lastTime = time;
    const delta = Math.min((time - lastTime) / 1000, 0.06);
    lastTime = time;

    if (!paused) {
      updateControls(delta);
      vehicleDynamics.preStepVelocityY = chassisBody.velocity.y;
      world.step(FIXED_TIME_STEP, delta, 4);
      stabilizeChassis(delta);
      updateLap();
      updateHud();
    }

    updateVehicleMeshes(delta);
    updateCamera(delta);
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

function makeAsphaltTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.fillStyle = "#17191b";
  context.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 5400; i += 1) {
    const shade = 24 + Math.floor(Math.random() * 38);
    context.fillStyle = `rgba(${shade}, ${shade + 2}, ${shade + 3}, 0.3)`;
    context.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

function makeGrassTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  context.fillStyle = "#78a95a";
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
