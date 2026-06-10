function pushPoint(points, x, z) {
  const last = points[points.length - 1];
  if (last && Math.hypot(last[0] - x, last[1] - z) < 0.001) return;
  points.push([Number(x.toFixed(3)), Number(z.toFixed(3))]);
}

function pushArc(points, centerX, centerZ, radius, startDeg, endDeg, steps) {
  const start = (startDeg * Math.PI) / 180;
  const end = (endDeg * Math.PI) / 180;

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const angle = start + (end - start) * t;
    pushPoint(
      points,
      centerX + Math.cos(angle) * radius,
      centerZ + Math.sin(angle) * radius,
    );
  }
}

function buildIrohazakaControlPoints() {
  const points = [];

  pushPoint(points, -690, 940);
  pushPoint(points, -600, 805);
  pushPoint(points, -455, 705);
  pushPoint(points, -430, 620);
  pushPoint(points, 430, 620);
  pushArc(points, 430, 550, 70, 90, -90, 12);
  pushPoint(points, -430, 480);
  pushArc(points, -430, 410, 70, 90, 270, 12);
  pushPoint(points, 405, 340);
  pushArc(points, 405, 270, 70, 90, -90, 12);
  pushPoint(points, -405, 200);
  pushArc(points, -405, 130, 70, 90, 270, 12);
  pushPoint(points, 430, 60);
  pushArc(points, 430, -10, 70, 90, -90, 12);
  pushPoint(points, -390, -80);
  pushArc(points, -390, -150, 70, 90, 270, 12);
  pushPoint(points, 410, -220);
  pushArc(points, 410, -290, 70, 90, -90, 12);
  pushPoint(points, -430, -360);
  pushArc(points, -430, -430, 70, 90, 270, 12);
  pushPoint(points, 390, -500);
  pushArc(points, 390, -570, 70, 90, -90, 12);
  pushPoint(points, -335, -640);
  pushArc(points, -335, -710, 70, 90, 270, 12);
  pushPoint(points, -170, -795);
  pushPoint(points, 80, -855);
  pushPoint(points, 305, -815);
  pushPoint(points, 520, -730);

  return points;
}

export const MAP_2 = {
  id: "map2",
  name: "Paso Irohazaka",
  referenceName: "Paso Irohazaka curved asphalt hairpins",
  menuLabel: "Paso Irohazaka",
  distanceLabel: "5.116 km",
  turnCount: 28,
  cornerLabel: "curved hairpins",
  environment: "mountain",
  loop: false,
  curveType: "centripetal",
  curveTension: 0.18,
  samples: 920,
  terrainSize: 3600,
  roadWidth: 8.4,
  shoulderWidth: 0,
  maxPixelRatio: 1.5,
  disableRoadShoulders: true,
  disableRaggedRoadEdge: true,
  spawnOffset: 3,
  minCompletionTime: 10000,
  checkpoints: [0.34, 0.55, 0.76],
  miniMapScale: 0.44,
  cornerRoundness: 0,
  mapGraphicDistanceMeters: 5116,
  sectionDistancesMeters: [1320, 1332, 1240, 1224],
  technicalSpecs: {
    length: "5.116 km",
    elevation: "440 meters",
    corners: "Curved consecutive hairpins",
    surface: "Asphalt road with grass outside",
    difficulty: "Extreme",
    type: "Consecutive hairpins",
  },
  keyPoints: [
    { label: "1", name: "Long lower approach", fraction: 0.12 },
    { label: "2", name: "Central curved hairpins", fraction: 0.42 },
    { label: "3", name: "Nikko Viewpoint technical drop", fraction: 0.6 },
    { label: "4", name: "Right-side hairpin chain", fraction: 0.78 },
    { label: "5", name: "Final downhill run", fraction: 0.92 },
  ],
  cornerMarkers: [
    { label: "1", fraction: 0.12 },
    { label: "2", fraction: 0.42 },
    { label: "3", fraction: 0.62 },
    { label: "4", fraction: 0.82 },
  ],
  asphalt: {
    procedural: true,
    base: "#202326",
    color: 0x202326,
    fleckMin: 16,
    fleckRange: 44,
    patchColor: "rgba(58, 60, 56, 0.28)",
    tireColor: "rgba(6, 7, 7, 0.22)",
    crackColor: "rgba(7, 7, 7, 0.24)",
    repeat: 70,
  },
  shoulder: {
    dirt: "#4d7440",
    grass: "#4d7440",
  },
  racingLine: {
    enabled: true,
    width: 0.34,
    amplitude: 1,
    frequency: 8,
    color: 0xe0322b,
    opacity: 0.52,
    surfaceLift: 0.012,
  },
  guardRails: {
    offset: 0.56,
    segmentStep: 4,
    minSegmentStep: 1,
    collisionMatchesVisual: true,
    postStep: 12,
    minRoadEdgeClearance: 0.2,
    localClearanceSamples: 3,
    segmentOverlap: 0.1,
    lowerRailScale: 0.98,
    maxClearancePush: 0,
    clearancePushSteps: [0],
    hairpinCurvatureThreshold: 0.11,
    bendCurvatureThreshold: 0.04,
    bendSegmentScale: 0.45,
    sides: { left: true, right: true },
  },
  vegetation: {
    treeStep: 8,
    treeDensity: 0.72,
    nearOffset: 9,
    farOffset: 38,
    colors: [0x203f2a, 0x2d5635, 0x53713b],
  },
  scenery: {
    rockStep: 20,
    signIndices: [42, 146, 266, 402, 552, 720, 910],
    cliffSide: 1,
    cliffEvery: 38,
    backdropTint: 0x788166,
  },
  elevationAxis: { x: 0.84, z: -0.46 },
  elevationScale: 4.1,
  ridgeScale: 1.04,
  downhillProfile: {
    startElevation: 34,
    finishElevation: -22,
    realElevationMeters: 440,
    ridgeInfluence: 0.2,
    shoulderInfluence: 0.32,
    featureInfluence: 0.36,
    offRoadRippleScale: 0.4,
  },
  elevationBounds: { min: -26, max: 38 },
  sun: { x: -72, y: 118, z: -86 },
  fogDensity: 0.0036,
  controlPoints: buildIrohazakaControlPoints(),
};
