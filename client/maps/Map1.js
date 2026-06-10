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

function buildMonteAkinaControlPoints() {
  const points = [];

  pushPoint(points, -720, 940);
  pushPoint(points, -665, 835);
  pushPoint(points, -505, 735);
  pushPoint(points, 470, 720);
  pushArc(points, 470, 635, 85, 90, -90, 12);
  pushPoint(points, -540, 550);
  pushArc(points, -540, 465, 85, 90, 270, 12);
  pushPoint(points, 430, 380);
  pushArc(points, 430, 300, 80, 90, -90, 12);
  pushPoint(points, -460, 220);
  pushArc(points, -460, 140, 80, 90, 270, 12);
  pushPoint(points, 225, 60);
  pushArc(points, 225, -25, 85, 90, -90, 12);
  pushPoint(points, -520, -110);
  pushArc(points, -520, -200, 90, 90, 270, 14);
  pushPoint(points, 360, -290);
  pushArc(points, 360, -375, 85, 90, -90, 12);
  pushPoint(points, -260, -460);
  pushPoint(points, -120, -570);
  pushPoint(points, 80, -650);
  pushPoint(points, 280, -730);
  pushPoint(points, 520, -850);
  pushPoint(points, 700, -960);

  return points;
}

export const MAP_1 = {
  id: "map1",
  name: "Monte Akina",
  referenceName: "Monte Akina asphalt downhill rebuild",
  menuLabel: "Monte Akina",
  distanceLabel: "7.552 km",
  turnCount: 34,
  cornerLabel: "curved asphalt hairpins",
  environment: "mountain",
  loop: false,
  curveType: "centripetal",
  curveTension: 0.18,
  samples: 980,
  terrainSize: 3600,
  roadWidth: 8.8,
  shoulderWidth: 0,
  maxPixelRatio: 1.5,
  disableRoadShoulders: true,
  disableRaggedRoadEdge: true,
  spawnOffset: 3,
  minCompletionTime: 12000,
  checkpoints: [0.22, 0.46, 0.74],
  miniMapScale: 0.48,
  cornerRoundness: 0,
  mapGraphicDistanceMeters: 7552,
  sectionDistancesMeters: [1680, 1692, 1884, 2026],
  technicalSpecs: {
    length: "7.552 km",
    elevation: "500 meters",
    corners: "Smooth curved hairpins",
    surface: "Asphalt road with grass outside",
    difficulty: "Very High",
    type: "Technical downhill",
  },
  keyPoints: [
    { label: "1", name: "Upper asphalt approach", fraction: 0.12 },
    { label: "2", name: "Curved switchbacks", fraction: 0.32 },
    { label: "3", name: "Middle hairpin rhythm", fraction: 0.52 },
    { label: "4", name: "Lower forest sweeps", fraction: 0.74 },
    { label: "5", name: "Final downhill run", fraction: 0.9 },
  ],
  cornerMarkers: [
    { label: "1", fraction: 0.13 },
    { label: "2", fraction: 0.32 },
    { label: "3", fraction: 0.52 },
    { label: "4", fraction: 0.74 },
  ],
  asphalt: {
    procedural: true,
    base: "#202326",
    color: 0x222528,
    fleckMin: 18,
    fleckRange: 42,
    patchColor: "rgba(54, 58, 56, 0.32)",
    tireColor: "rgba(8, 9, 9, 0.2)",
    crackColor: "rgba(8, 8, 8, 0.22)",
    repeat: 66,
  },
  shoulder: {
    dirt: "#527a3f",
    grass: "#527a3f",
  },
  racingLine: {
    enabled: true,
    width: 0.34,
    amplitude: 1.05,
    frequency: 7,
    color: 0xe0322b,
    opacity: 0.52,
    surfaceLift: 0.012,
  },
  guardRails: {
    offset: 0.58,
    segmentStep: 4,
    minSegmentStep: 1,
    collisionMatchesVisual: true,
    postStep: 12,
    minRoadEdgeClearance: 0.22,
    localClearanceSamples: 3,
    segmentOverlap: 0.12,
    lowerRailScale: 0.98,
    maxClearancePush: 0,
    clearancePushSteps: [0],
    hairpinCurvatureThreshold: 0.12,
    bendCurvatureThreshold: 0.045,
    bendSegmentScale: 0.45,
    sides: { left: true, right: true },
  },
  vegetation: {
    treeStep: 8,
    treeDensity: 0.78,
    nearOffset: 10,
    farOffset: 44,
    colors: [0x21482e, 0x315f38, 0x55743e],
  },
  scenery: {
    rockStep: 22,
    signIndices: [34, 126, 232, 350, 486, 626, 724],
    cliffSide: -1,
    cliffEvery: 42,
    backdropTint: 0x75836b,
  },
  elevationAxis: { x: 0.2, z: -1 },
  elevationScale: 4.2,
  ridgeScale: 1.18,
  downhillProfile: {
    startElevation: 36,
    finishElevation: -22,
    realElevationMeters: 500,
    ridgeInfluence: 0.22,
    shoulderInfluence: 0.34,
    featureInfluence: 0.38,
    offRoadRippleScale: 0.42,
  },
  elevationBounds: { min: -26, max: 40 },
  sun: { x: -92, y: 125, z: -48 },
  fogDensity: 0.0034,
  controlPoints: buildMonteAkinaControlPoints(),
};
