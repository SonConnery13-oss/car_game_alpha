import * as CANNON from "cannon-es";

export const WHEEL_NAMES = ["FL", "FR", "RL", "RR"];

export const DRIVETRAIN_TYPES = {
  FWD: "fwd",
  RWD: "rwd",
  AWD: "awd",
};

const LOCAL_RIGHT = new CANNON.Vec3(1, 0, 0);
const LOCAL_UP = new CANNON.Vec3(0, 1, 0);
const LOCAL_DOWN = new CANNON.Vec3(0, -1, 0);
const LOCAL_FORWARD = new CANNON.Vec3(0, 0, 1);
const WORLD_UP = new CANNON.Vec3(0, 1, 0);
const EPSILON = 0.00001;

export const VEHICLE_PHYSICS_CONFIGS = {
  gt3: {
    mass: 1180,
    centerOfMassHeight: 0.38,
    wheelBase: 2.68,
    trackWidth: 1.66,
    tireRadius: 0.42,
    wheelInertia: 1.35,
    suspensionRestLength: 0.29,
    suspensionTravel: 0.145,
    springStiffness: 132000,
    damperStiffness: 12600,
    bumpStopStiffness: 290000,
    antiRollStiffness: 46000,
    tireGrip: 1.52,
    lateralGrip: 1.12,
    longitudinalGrip: 1.08,
    engineForce: 18200,
    brakeForce: 26000,
    brakeBias: 0.74,
    brakeResponse: 5.8,
    brakeReleaseResponse: 10.5,
    brakeCorneringTorqueScale: 0.58,
    rearBrakeCorneringTorqueScale: 0.22,
    rearBrakeStabilityScale: 0.28,
    brakeLateralReserve: 0.94,
    rearBrakeLateralReserve: 1,
    slideLateralDamping: 0.94,
    slideYawDamping: 1.72,
    brakeSlideStability: 1.28,
    accelerationResponse: 16,
    longitudinalForceResponse: 28,
    slipRatioDeadband: 0.018,
    maxSteerAngle: 0.52,
    steeringResponse: 2.55,
    steeringReturnResponse: 4.55,
    steerFadeStart: 5.5,
    steerFadeEnd: 34,
    minSteerScale: 0.36,
    rollingResistance: 0.016,
    airDrag: 0.46,
    downforce: 3.05,
    downforceLoadCap: 1.55,
    frontDownforceShare: 0.46,
    aeroGripEfficiency: 0.9,
    drivetrainType: DRIVETRAIN_TYPES.RWD,
    drivetrainEfficiency: 0.88,
    idleRpm: 950,
    maxRpm: 8000,
    upshiftRpm: 7600,
    downshiftRpm: 3300,
    gearRatios: [-3.18, 0, 3.35, 2.19, 1.61, 1.29, 1.08, 0.91],
    finalDrive: 3.89,
    clutch: { bite: 0.82, shiftTime: 0.18 },
    engineTorqueCurve: [
      [900, 210],
      [1800, 328],
      [3200, 482],
      [4800, 550],
      [6500, 518],
      [7800, 426],
    ],
    maxForwardSpeed: 200 / 3.6,
    maxReverseSpeed: 35 / 3.6,
    abs: true,
    absSlip: 0.72,
    inertia: { linearDamping: 0.018, angularDamping: 0.32 },
  },
  amg: {
    mass: 1450,
    centerOfMassHeight: 0.43,
    wheelBase: 2.63,
    trackWidth: 1.62,
    tireRadius: 0.42,
    wheelInertia: 1.58,
    suspensionRestLength: 0.3,
    suspensionTravel: 0.16,
    springStiffness: 124000,
    damperStiffness: 11800,
    bumpStopStiffness: 280000,
    antiRollStiffness: 42000,
    tireGrip: 1.42,
    lateralGrip: 1.06,
    longitudinalGrip: 1.04,
    engineForce: 19600,
    brakeForce: 27500,
    brakeBias: 0.72,
    brakeResponse: 5.4,
    brakeReleaseResponse: 9.8,
    brakeCorneringTorqueScale: 0.56,
    rearBrakeCorneringTorqueScale: 0.24,
    rearBrakeStabilityScale: 0.3,
    brakeLateralReserve: 0.95,
    rearBrakeLateralReserve: 1,
    slideLateralDamping: 0.98,
    slideYawDamping: 1.78,
    brakeSlideStability: 1.34,
    accelerationResponse: 15,
    longitudinalForceResponse: 26,
    slipRatioDeadband: 0.02,
    maxSteerAngle: 0.5,
    steeringResponse: 2.45,
    steeringReturnResponse: 4.45,
    steerFadeStart: 5.5,
    steerFadeEnd: 34,
    minSteerScale: 0.36,
    rollingResistance: 0.018,
    airDrag: 0.52,
    downforce: 2.65,
    downforceLoadCap: 1.45,
    frontDownforceShare: 0.45,
    aeroGripEfficiency: 0.9,
    drivetrainType: DRIVETRAIN_TYPES.RWD,
    drivetrainEfficiency: 0.87,
    idleRpm: 850,
    maxRpm: 7400,
    upshiftRpm: 7000,
    downshiftRpm: 2600,
    gearRatios: [-3.06, 0, 3.14, 2.18, 1.63, 1.29, 1.03, 0.84],
    finalDrive: 3.67,
    clutch: { bite: 0.78, shiftTime: 0.2 },
    engineTorqueCurve: [
      [850, 270],
      [1600, 467],
      [2800, 640],
      [4500, 726],
      [6200, 671],
      [7200, 529],
    ],
    maxForwardSpeed: 210 / 3.6,
    maxReverseSpeed: 35 / 3.6,
    abs: true,
    absSlip: 0.72,
    inertia: { linearDamping: 0.02, angularDamping: 0.34 },
  },
  ae86: {
    mass: 960,
    centerOfMassHeight: 0.46,
    wheelBase: 2.4,
    trackWidth: 1.48,
    tireRadius: 0.39,
    wheelInertia: 1.04,
    suspensionRestLength: 0.31,
    suspensionTravel: 0.18,
    springStiffness: 98000,
    damperStiffness: 9300,
    bumpStopStiffness: 210000,
    antiRollStiffness: 29000,
    tireGrip: 1.2,
    frontTireGripScale: 1.02,
    rearTireGripScale: 0.9,
    lateralGrip: 0.99,
    longitudinalGrip: 0.92,
    engineForce: 12600,
    brakeForce: 20500,
    brakeBias: 0.7,
    brakeResponse: 6.3,
    brakeReleaseResponse: 11.2,
    brakeCorneringTorqueScale: 0.62,
    rearBrakeCorneringTorqueScale: 0.34,
    rearBrakeStabilityScale: 0.44,
    brakeLateralReserve: 0.9,
    rearBrakeLateralReserve: 0.62,
    slideLateralDamping: 0.6,
    slideYawDamping: 0.86,
    brakeSlideStability: 0.38,
    brakeDrift: true,
    brakeDriftRearBrakeScale: 1.18,
    brakeDriftRearLateralScale: 0.64,
    brakeDriftYawAssist: 0.42,
    accelerationResponse: 20,
    longitudinalForceResponse: 34,
    driveInputRamp: 8.8,
    driveInputReleaseRamp: 9.4,
    slipRatioDeadband: 0.015,
    maxSteerAngle: 0.6,
    steeringResponse: 3.45,
    steeringReturnResponse: 5.8,
    steerFadeStart: 3.5,
    steerFadeEnd: 25,
    minSteerScale: 0.28,
    rollingResistance: 0.02,
    airDrag: 0.58,
    downforce: 0.55,
    downforceLoadCap: 0.48,
    frontDownforceShare: 0.43,
    aeroGripEfficiency: 0.62,
    drivetrainType: DRIVETRAIN_TYPES.RWD,
    drivetrainEfficiency: 0.86,
    idleRpm: 950,
    maxRpm: 7800,
    upshiftRpm: 7400,
    downshiftRpm: 3600,
    gearRatios: [-3.25, 0, 3.59, 2.02, 1.38, 1.0, 0.86],
    finalDrive: 4.3,
    clutch: { bite: 0.84, shiftTime: 0.16 },
    engineTorqueCurve: [
      [900, 96],
      [2400, 124],
      [4200, 151],
      [5600, 163],
      [6800, 151],
      [7600, 128],
    ],
    maxForwardSpeed: 172 / 3.6,
    maxReverseSpeed: 32 / 3.6,
    abs: false,
    absSlip: 0.86,
    inertia: { linearDamping: 0.022, angularDamping: 0.25 },
  },
  rx7fd: {
    mass: 1280,
    centerOfMassHeight: 0.39,
    wheelBase: 2.43,
    trackWidth: 1.58,
    tireRadius: 0.41,
    wheelInertia: 1.3,
    suspensionRestLength: 0.28,
    suspensionTravel: 0.145,
    springStiffness: 126000,
    damperStiffness: 12100,
    bumpStopStiffness: 278000,
    antiRollStiffness: 43000,
    tireGrip: 1.5,
    frontTireGripScale: 1.03,
    rearTireGripScale: 0.97,
    lateralGrip: 1.11,
    longitudinalGrip: 1.08,
    engineForce: 20500,
    brakeForce: 28600,
    brakeBias: 0.73,
    brakeResponse: 6.1,
    brakeReleaseResponse: 10.8,
    brakeCorneringTorqueScale: 0.56,
    rearBrakeCorneringTorqueScale: 0.26,
    rearBrakeStabilityScale: 0.3,
    brakeLateralReserve: 0.96,
    rearBrakeLateralReserve: 0.74,
    slideLateralDamping: 0.82,
    slideYawDamping: 1.22,
    brakeSlideStability: 0.58,
    brakeDrift: true,
    brakeDriftRearBrakeScale: 1.1,
    brakeDriftRearLateralScale: 0.78,
    brakeDriftYawAssist: 0.26,
    accelerationResponse: 18,
    longitudinalForceResponse: 30,
    driveInputRamp: 5.9,
    driveInputReleaseRamp: 8.1,
    slipRatioDeadband: 0.017,
    maxSteerAngle: 0.53,
    steeringResponse: 2.8,
    steeringReturnResponse: 5.0,
    steerFadeStart: 6.0,
    steerFadeEnd: 38,
    minSteerScale: 0.39,
    rollingResistance: 0.016,
    airDrag: 0.4,
    downforce: 2.55,
    downforceLoadCap: 1.38,
    frontDownforceShare: 0.46,
    aeroGripEfficiency: 0.88,
    drivetrainType: DRIVETRAIN_TYPES.RWD,
    drivetrainEfficiency: 0.88,
    idleRpm: 1000,
    maxRpm: 8800,
    upshiftRpm: 8400,
    downshiftRpm: 3900,
    gearRatios: [-3.45, 0, 3.48, 2.02, 1.39, 1.0, 0.76],
    finalDrive: 4.1,
    clutch: { bite: 0.8, shiftTime: 0.17 },
    engineTorqueCurve: [
      [1000, 150],
      [2600, 215],
      [4200, 304],
      [5900, 373],
      [7600, 350],
      [8600, 288],
    ],
    maxForwardSpeed: 232 / 3.6,
    maxReverseSpeed: 35 / 3.6,
    abs: true,
    absSlip: 0.7,
    inertia: { linearDamping: 0.017, angularDamping: 0.33 },
  },
  rx7fc: {
    mass: 1180,
    centerOfMassHeight: 0.43,
    wheelBase: 2.43,
    trackWidth: 1.53,
    tireRadius: 0.4,
    wheelInertia: 1.22,
    suspensionRestLength: 0.3,
    suspensionTravel: 0.165,
    springStiffness: 110000,
    damperStiffness: 10400,
    bumpStopStiffness: 244000,
    antiRollStiffness: 35000,
    tireGrip: 1.33,
    frontTireGripScale: 1.01,
    rearTireGripScale: 0.94,
    lateralGrip: 1.04,
    longitudinalGrip: 1.0,
    engineForce: 16400,
    brakeForce: 23600,
    brakeBias: 0.71,
    brakeResponse: 5.6,
    brakeReleaseResponse: 9.8,
    brakeCorneringTorqueScale: 0.58,
    rearBrakeCorneringTorqueScale: 0.3,
    rearBrakeStabilityScale: 0.38,
    brakeLateralReserve: 0.93,
    rearBrakeLateralReserve: 0.68,
    slideLateralDamping: 0.72,
    slideYawDamping: 1.06,
    brakeSlideStability: 0.48,
    brakeDrift: true,
    brakeDriftRearBrakeScale: 1.14,
    brakeDriftRearLateralScale: 0.72,
    brakeDriftYawAssist: 0.34,
    accelerationResponse: 15,
    longitudinalForceResponse: 24,
    driveInputRamp: 4.5,
    driveInputReleaseRamp: 7.2,
    slipRatioDeadband: 0.018,
    maxSteerAngle: 0.56,
    steeringResponse: 2.7,
    steeringReturnResponse: 4.7,
    steerFadeStart: 4.8,
    steerFadeEnd: 31,
    minSteerScale: 0.34,
    rollingResistance: 0.018,
    airDrag: 0.5,
    downforce: 1.28,
    downforceLoadCap: 0.9,
    frontDownforceShare: 0.44,
    aeroGripEfficiency: 0.75,
    drivetrainType: DRIVETRAIN_TYPES.RWD,
    drivetrainEfficiency: 0.87,
    idleRpm: 950,
    maxRpm: 8200,
    upshiftRpm: 7800,
    downshiftRpm: 3500,
    gearRatios: [-3.38, 0, 3.48, 2.02, 1.39, 1.0, 0.79],
    finalDrive: 4.1,
    clutch: { bite: 0.8, shiftTime: 0.19 },
    engineTorqueCurve: [
      [950, 118],
      [2400, 146],
      [3600, 204],
      [5200, 258],
      [6800, 247],
      [8000, 202],
    ],
    maxForwardSpeed: 204 / 3.6,
    maxReverseSpeed: 34 / 3.6,
    abs: false,
    absSlip: 0.82,
    inertia: { linearDamping: 0.02, angularDamping: 0.29 },
  },
};

export class Wheel {
  constructor(index, config) {
    this.index = index;
    this.name = WHEEL_NAMES[index];
    this.isFront = index < 2;
    this.isLeft = index === 0 || index === 2;
    this.chassisConnectionPointLocal = new CANNON.Vec3();
    this.directionLocal = LOCAL_DOWN.clone();
    this.axleLocal = new CANNON.Vec3(-1, 0, 0);
    this.worldTransform = {
      position: new CANNON.Vec3(),
      quaternion: new CANNON.Quaternion(),
    };
    this.raycastResult = {
      hasHit: false,
      hitPointWorld: new CANNON.Vec3(),
      hitNormalWorld: WORLD_UP.clone(),
      distance: 0,
    };
    this.contactPointWorld = new CANNON.Vec3();
    this.contactPointRelative = new CANNON.Vec3();
    this.groundNormal = WORLD_UP.clone();
    this.configure(config);
    this.reset();
  }

  configure(config) {
    const halfTrack = config.trackWidth / 2;
    const halfWheelBase = config.wheelBase / 2;
    const x = this.isLeft ? -halfTrack : halfTrack;
    const z = this.isFront ? halfWheelBase : -halfWheelBase;

    this.radius = config.tireRadius;
    this.suspensionRestLength = config.suspensionRestLength;
    this.suspensionTravel = config.suspensionTravel;
    this.minSuspensionLength = Math.max(0.04, this.suspensionRestLength - this.suspensionTravel);
    this.maxSuspensionLength = this.suspensionRestLength + this.suspensionTravel;
    this.chassisConnectionPointLocal.set(x, config.wheelConnectionY ?? -0.16, z);
  }

  reset() {
    this.isInContact = false;
    this.contact = false;
    this.suspensionLength = this.suspensionRestLength;
    this.compression = 0;
    this.compressionDistance = 0;
    this.previousCompressionDistance = 0;
    this.suspensionVelocity = 0;
    this.suspensionForce = 0;
    this.normalLoad = 0;
    this.steerAngle = 0;
    this.angularVelocity = 0;
    this.rotationAngle = 0;
    this.forwardSpeed = 0;
    this.lateralSpeed = 0;
    this.slipRatio = 0;
    this.slipAngle = 0;
    this.longitudinalGrip = 0;
    this.lateralGrip = 0;
    this.gripUsage = 0;
    this.longitudinalForce = 0;
    this.longitudinalForceState = 0;
    this.engineTorque = 0;
    this.brakeTorque = 0;
    this.absActive = false;
    this.locked = false;
    this.raycastResult.hasHit = false;
    this.raycastResult.distance = 0;
    this.raycastResult.hitPointWorld.set(0, 0, 0);
    this.raycastResult.hitNormalWorld.copy(WORLD_UP);
    this.contactPointWorld.set(0, 0, 0);
    this.contactPointRelative.set(0, 0, 0);
    this.groundNormal.copy(WORLD_UP);
  }
}

export class VehiclePhysics {
  constructor({
    world,
    chassisBody,
    config,
    getSurfaceGrip = () => 1,
    sampleGround = null,
    gravity = 9.81,
    raycastFilterMask = -1,
  }) {
    this.world = world;
    this.chassisBody = chassisBody;
    this.getSurfaceGrip = getSurfaceGrip;
    this.sampleGround = sampleGround;
    this.gravity = Math.abs(gravity);
    this.raycastFilterMask = raycastFilterMask;
    this.wheels = [0, 1, 2, 3].map((index) => new Wheel(index, config));
    this.wheelInfos = this.wheels;
    this.input = {
      steer: 0,
      throttle: 0,
      brake: 0,
      handbrake: false,
    };
    this.forward = LOCAL_FORWARD.clone();
    this.right = LOCAL_RIGHT.clone();
    this.up = LOCAL_UP.clone();
    this.previousForwardSpeed = 0;
    this.previousLateralSpeed = 0;
    this.configure(config);
    this.reset();
  }

  configure(config) {
    this.config = { ...config };
    this.drivenWheelIndices = getDrivenWheelIndices(this.config.drivetrainType);

    for (const wheel of this.wheels) {
      wheel.configure(this.config);
    }

    this.chassisBody.mass = this.config.mass;
    this.chassisBody.linearDamping = this.config.inertia?.linearDamping ?? 0.02;
    this.chassisBody.angularDamping = this.config.inertia?.angularDamping ?? 0.32;
    this.chassisBody.updateMassProperties();
  }

  reset() {
    this.rpm = this.config.idleRpm;
    this.gear = 1;
    this.clutch = 1;
    this.shiftTimer = 0;
    this.throttle = 0;
    this.brake = 0;
    this.brakePressure = 0;
    this.rawSteer = 0;
    this.steeringAngle = 0;
    this.driveInput = 0;
    this.grounded = false;
    this.groundedWheels = 0;
    this.contactRatio = 0;
    this.surfaceGrip = 1;
    this.signedSpeed = 0;
    this.lateralSpeed = 0;
    this.rawLongitudinalAcceleration = 0;
    this.rawLateralAcceleration = 0;
    this.longitudinalAcceleration = 0;
    this.lateralAcceleration = 0;
    this.frontGripUsage = 0;
    this.rearGripUsage = 0;
    this.averageSlip = 0;
    this.aeroDrag = 0;
    this.rollingResistance = 0;
    this.averageGroundNormal = WORLD_UP.clone();
    this.previousForwardSpeed = 0;
    this.previousLateralSpeed = 0;

    for (const wheel of this.wheels) {
      wheel.reset();
    }
  }

  setInputs(input) {
    this.input.steer = clamp(input.steer ?? 0, -1, 1);
    this.input.throttle = clamp(input.throttle ?? 0, 0, 1);
    this.input.brake = clamp(input.brake ?? 0, 0, 1);
    this.input.handbrake = Boolean(input.handbrake);
    this.rawSteer = this.input.steer;
  }

  updatePhysics(dt, input) {
    const safeDt = clamp(dt, 1 / 240, 1 / 30);
    this.setInputs(input);

    if (
      Math.abs(this.input.steer) > 0.01 ||
      this.input.throttle > 0.01 ||
      this.input.brake > 0.01 ||
      this.input.handbrake
    ) {
      this.chassisBody.wakeUp();
    }

    this.updateBodyFrame();
    this.updateTelemetry(safeDt);
    this.updateSteering(safeDt);
    this.updateGearbox(safeDt);
    this.updateSuspension(safeDt);
    this.updateGroundSummary();
    this.applyEngineForce(safeDt);
    this.applyBrakeForce(safeDt);
    this.updateTireForces(safeDt);
    this.applySlideStability(safeDt);
    this.applyAeroAndRollingResistance();
    this.updateGroundSummary();

    for (const wheel of this.wheels) {
      wheel.rotationAngle += wheel.angularVelocity * safeDt;
    }
  }

  updateBodyFrame() {
    this.chassisBody.quaternion.vmult(LOCAL_FORWARD, this.forward);
    this.chassisBody.quaternion.vmult(LOCAL_RIGHT, this.right);
    this.chassisBody.quaternion.vmult(LOCAL_UP, this.up);

    if (this.forward.lengthSquared() > EPSILON) this.forward.normalize();
    if (this.right.lengthSquared() > EPSILON) this.right.normalize();
    if (this.up.lengthSquared() > EPSILON) this.up.normalize();
  }

  updateTelemetry(dt) {
    const horizontalForward = projectOnPlane(this.forward, WORLD_UP);
    const horizontalRight = projectOnPlane(this.right, WORLD_UP);
    this.signedSpeed = this.chassisBody.velocity.dot(horizontalForward);
    this.lateralSpeed = this.chassisBody.velocity.dot(horizontalRight);
    this.rawLongitudinalAcceleration = clamp(
      (this.signedSpeed - this.previousForwardSpeed) / dt,
      -42,
      42,
    );
    this.rawLateralAcceleration = clamp(
      (this.lateralSpeed - this.previousLateralSpeed) / dt,
      -42,
      42,
    );

    const accelerationBlend = 1 - Math.exp(-(this.config.accelerationResponse ?? 16) * dt);
    this.longitudinalAcceleration +=
      (this.rawLongitudinalAcceleration - this.longitudinalAcceleration) * accelerationBlend;
    this.lateralAcceleration +=
      (this.rawLateralAcceleration - this.lateralAcceleration) * accelerationBlend;
    this.previousForwardSpeed = this.signedSpeed;
    this.previousLateralSpeed = this.lateralSpeed;
  }

  updateSteering(dt) {
    const steerFadeStart = this.config.steerFadeStart ?? 10;
    const steerFadeEnd = this.config.steerFadeEnd ?? this.config.maxForwardSpeed;
    const minSteerScale = this.config.minSteerScale ?? 0.38;
    const speedFactor = smoothstep(steerFadeStart, steerFadeEnd, Math.abs(this.signedSpeed));
    const steerLimit = lerp(this.config.maxSteerAngle, this.config.maxSteerAngle * minSteerScale, speedFactor);
    const targetSteer = this.input.steer * steerLimit;
    const response =
      Math.abs(targetSteer) < Math.abs(this.steeringAngle)
        ? this.config.steeringReturnResponse ?? this.config.steeringResponse
        : this.config.steeringResponse;
    const blend = 1 - Math.exp(-response * dt);

    this.steeringAngle += (targetSteer - this.steeringAngle) * blend;

    for (const wheel of this.wheels) {
      // User input uses positive for left. In the car's local frame positive yaw
      // points the wheel to the right, so front-wheel visual/force yaw is inverted.
      wheel.steerAngle = wheel.isFront ? -this.steeringAngle : 0;
    }
  }

  updateGearbox(dt) {
    if (this.shiftTimer > 0) {
      this.shiftTimer = Math.max(0, this.shiftTimer - dt);
      this.clutch = Math.min(1, this.clutch + dt / Math.max(this.config.clutch.shiftTime, 0.01));
    }

    const wantsReverse = this.input.brake > 0.45 && this.signedSpeed < 1.2 && this.input.throttle < 0.05;
    if (wantsReverse) {
      this.gear = -1;
      this.clutch = 1;
    } else if (this.gear < 1 && this.input.throttle > 0.08) {
      this.gear = 1;
      this.clutch = 1;
    } else if (this.shiftTimer <= 0 && this.gear > 0) {
      const forwardGearCount = Math.max(1, this.config.gearRatios.length - 2);

      if (this.rpm > this.config.upshiftRpm && this.gear < forwardGearCount) {
        this.gear += 1;
        this.shiftTimer = this.config.clutch.shiftTime;
        this.clutch = this.config.clutch.bite;
      } else if (this.rpm < this.config.downshiftRpm && this.gear > 1 && this.input.throttle > 0.12) {
        this.gear -= 1;
        this.shiftTimer = this.config.clutch.shiftTime;
        this.clutch = this.config.clutch.bite;
      }
    }

    this.rpm = this.estimateEngineRpm();
  }

  updateSuspension(dt) {
    for (const wheel of this.wheels) {
      wheel.previousCompressionDistance = wheel.compressionDistance;
      this.raycastWheel(wheel);

      if (!wheel.isInContact) {
        wheel.suspensionLength = wheel.maxSuspensionLength;
        wheel.compressionDistance = 0;
        wheel.compression = 0;
        wheel.suspensionVelocity = (wheel.compressionDistance - wheel.previousCompressionDistance) / dt;
        wheel.suspensionForce = 0;
        wheel.normalLoad = 0;
        wheel.contact = false;
        continue;
      }

      // Suspension force is a real spring-damper pair:
      // spring force comes from how far the wheel is pushed above rest length,
      // while damping reacts to compression speed. Compression adds support;
      // rebound removes support so the body can pop back instead of floating.
      wheel.compressionDistance = Math.max(0, wheel.suspensionRestLength - wheel.suspensionLength);
      wheel.compression = clamp(wheel.compressionDistance / Math.max(wheel.suspensionTravel, EPSILON), 0, 1);
      wheel.suspensionVelocity = (wheel.compressionDistance - wheel.previousCompressionDistance) / dt;

      const springForce = wheel.compressionDistance * this.config.springStiffness;
      const dampingForce = wheel.suspensionVelocity * this.config.damperStiffness;
      const bumpStopCompression = Math.max(0, wheel.compressionDistance - wheel.suspensionTravel * 0.82);
      const bumpStopForce = bumpStopCompression * bumpStopCompression * this.config.bumpStopStiffness;
      const maxForce = this.config.mass * this.gravity * 3.8;
      const suspensionForce = clamp(springForce + dampingForce + bumpStopForce, 0, maxForce);

      wheel.suspensionForce = suspensionForce;
      wheel.normalLoad = suspensionForce;

      this.applyForceAtPoint(
        scaleVec(wheel.groundNormal, suspensionForce),
        wheel.contactPointRelative,
      );
    }

    this.applyAntiRollBar();
  }

  applyAntiRollBar() {
    const antiRollStiffness = this.config.antiRollStiffness ?? 0;
    if (antiRollStiffness <= 0) return;

    this.applyAntiRollAxle(this.wheels[0], this.wheels[1], antiRollStiffness);
    this.applyAntiRollAxle(this.wheels[2], this.wheels[3], antiRollStiffness * 0.88);
  }

  applyAntiRollAxle(leftWheel, rightWheel, stiffness) {
    if (!leftWheel.isInContact || !rightWheel.isInContact) return;

    // A sports car uses stiff anti-roll bars so the body does not lean until
    // the outside suspension is fully loaded. This is still force based: the
    // more compressed side receives upward support while the extended side is
    // pulled down, reducing rollover without locking the chassis rotation.
    const leftTravel = 1 - leftWheel.compression;
    const rightTravel = 1 - rightWheel.compression;
    const antiRollForce = clamp((leftTravel - rightTravel) * stiffness, -stiffness, stiffness);
    const axleNormal = addVec(leftWheel.groundNormal, rightWheel.groundNormal);

    if (axleNormal.lengthSquared() < EPSILON) axleNormal.copy(WORLD_UP);
    else axleNormal.normalize();

    this.applyForceAtPoint(scaleVec(axleNormal, -antiRollForce), leftWheel.contactPointRelative);
    this.applyForceAtPoint(scaleVec(axleNormal, antiRollForce), rightWheel.contactPointRelative);
  }

  updateTireForces(dt) {
    let frontGrip = 0;
    let rearGrip = 0;
    let slipSum = 0;

    for (const wheel of this.wheels) {
      wheel.longitudinalGrip = 0;
      wheel.lateralGrip = 0;
      wheel.gripUsage = 0;

      if (!wheel.isInContact || wheel.normalLoad <= 1) {
        wheel.slipRatio = 0;
        wheel.slipAngle = 0;
        wheel.forwardSpeed = 0;
        wheel.lateralSpeed = 0;
        wheel.longitudinalForce = 0;
        wheel.longitudinalForceState *= Math.exp(-dt * 30);
        wheel.angularVelocity *= Math.exp(-dt * 0.18);
        continue;
      }

      const groundNormal = wheel.groundNormal;
      const wheelForward = this.getWheelForward(wheel, groundNormal);
      const wheelRight = this.getWheelRight(wheelForward, groundNormal);
      const pointVelocity = this.getVelocityAtRelativePoint(wheel.contactPointRelative);

      wheel.forwardSpeed = pointVelocity.dot(wheelForward);
      wheel.lateralSpeed = pointVelocity.dot(wheelRight);
      wheel.slipRatio = this.calculateSlipRatio(wheel);
      wheel.slipAngle = this.calculateSlipAngle(wheel);

      // The load used by the tire is mostly the measured spring load. A small
      // acceleration-based transfer term makes the tire limit respond within
      // the same fixed step: throttle loads rear tires, braking loads fronts,
      // and lateral acceleration loads the outside pair.
      const transferLoad = this.calculateWeightTransferLoad(wheel);
      const transferInfluence =
        this.brakePressure > 0.05 && !wheel.isFront
          ? 0.08
          : this.brakePressure > 0.05
            ? 0.14
            : 0.16;
      const effectiveLoad = Math.max(
        wheel.normalLoad * 0.42,
        wheel.normalLoad + transferLoad * transferInfluence + this.getWheelAeroGripLoad(wheel),
      );
      const surfaceGrip = this.getSurfaceGrip(wheel.contactPointWorld.x, wheel.contactPointWorld.z);
      const axleGripScale = wheel.isFront ? this.config.frontTireGripScale ?? 1 : this.config.rearTireGripScale ?? 1;
      const axleLongitudinalScale = wheel.isFront
        ? this.config.frontLongitudinalGripScale ?? axleGripScale
        : this.config.rearLongitudinalGripScale ?? axleGripScale;
      const axleLateralScale = wheel.isFront
        ? this.config.frontLateralGripScale ?? axleGripScale
        : this.config.rearLateralGripScale ?? axleGripScale;
      const brakeDriftFactor = this.getBrakeDriftFactor(wheel);
      const brakeDriftLateralScale = wheel.isFront
        ? 1
        : lerp(1, this.config.brakeDriftRearLateralScale ?? 0.78, brakeDriftFactor);
      const availableLongitudinal =
        effectiveLoad * this.config.tireGrip * this.config.longitudinalGrip * axleLongitudinalScale * surfaceGrip;
      const availableLateral =
        effectiveLoad *
        this.config.tireGrip *
        this.config.lateralGrip *
        axleLateralScale *
        brakeDriftLateralScale *
        surfaceGrip;

      // Slip is converted through a grip curve, not a fixed friction clamp.
      // Near zero slip the slope is steep, so the car feels planted. Past the
      // peak, the curve falls away and the tire slides instead of snapping.
      const longitudinalCurve = this.tireGripCurve(Math.abs(wheel.slipRatio), "longitudinal");
      const lateralCurve = this.tireGripCurve(Math.abs(wheel.slipAngle), "lateral");
      let longitudinalForce =
        Math.sign(wheel.slipRatio) * availableLongitudinal * longitudinalCurve;
      let lateralForce =
        -Math.sign(wheel.slipAngle || wheel.lateralSpeed) * availableLateral * lateralCurve;

      const brakingCorneringReserve = this.getBrakingCorneringReserve(wheel);
      let longUsage = Math.abs(longitudinalForce) / Math.max(availableLongitudinal, 1);
      let latUsage = Math.abs(lateralForce) / Math.max(availableLateral, 1);
      let combinedUsage = Math.hypot(longUsage, latUsage);

      if (combinedUsage > 1) {
        const lateralPriority = Math.max(
          0,
          Math.min(Math.abs(lateralForce), availableLateral) * brakingCorneringReserve,
        );
        const remainingLongitudinal = Math.sqrt(
          Math.max(0, availableLongitudinal * availableLongitudinal - lateralPriority * lateralPriority),
        );
        const limitedLongitudinalForce = clamp(longitudinalForce, -remainingLongitudinal, remainingLongitudinal);
        const adjustedLongUsage = Math.abs(limitedLongitudinalForce) / Math.max(availableLongitudinal, 1);
        const adjustedCombinedUsage = Math.hypot(adjustedLongUsage, latUsage);

        longitudinalForce = limitedLongitudinalForce;
        if (adjustedCombinedUsage > 1) {
          lateralForce /= adjustedCombinedUsage;
        }

        longUsage = Math.abs(longitudinalForce) / Math.max(availableLongitudinal, 1);
        latUsage = Math.abs(lateralForce) / Math.max(availableLateral, 1);
        combinedUsage = Math.hypot(longUsage, latUsage);
      }

      longitudinalForce = this.smoothLongitudinalForce(wheel, longitudinalForce, availableLongitudinal, dt);
      longUsage = Math.abs(longitudinalForce) / Math.max(availableLongitudinal, 1);
      combinedUsage = Math.hypot(longUsage, latUsage);
      wheel.longitudinalForce = longitudinalForce;

      const force = addVec(
        scaleVec(wheelForward, longitudinalForce),
        scaleVec(wheelRight, lateralForce),
      );
      this.applyForceAtPoint(force, wheel.contactPointRelative);

      const reactionTorque = longitudinalForce * wheel.radius;
      wheel.angularVelocity -= (reactionTorque / Math.max(this.config.wheelInertia, EPSILON)) * dt;

      if (Math.abs(wheel.engineTorque) < 0.1 && Math.abs(wheel.brakeTorque) < 0.1) {
        const rollingTarget = wheel.forwardSpeed / Math.max(wheel.radius, EPSILON);
        wheel.angularVelocity += (rollingTarget - wheel.angularVelocity) * clamp(dt * 7.5, 0, 1);
      }

      wheel.angularVelocity *= Math.exp(-dt * 0.04);
      wheel.longitudinalGrip = longUsage;
      wheel.lateralGrip = latUsage;
      wheel.gripUsage = combinedUsage;
      wheel.locked =
        this.brake > 0.25 &&
        Math.abs(wheel.angularVelocity * wheel.radius) < Math.abs(wheel.forwardSpeed) * 0.22 &&
        Math.abs(wheel.forwardSpeed) > 5;

      slipSum += Math.min(1.8, Math.abs(wheel.slipRatio) + Math.abs(wheel.slipAngle) * 2.4);
      if (wheel.isFront) frontGrip += combinedUsage;
      else rearGrip += combinedUsage;
    }

    this.frontGripUsage = frontGrip / 2;
    this.rearGripUsage = rearGrip / 2;
    this.averageSlip = slipSum / this.wheels.length;
  }

  applyEngineForce(dt) {
    const reverseThrottle = this.gear < 0 ? this.input.brake : 0;
    const engineThrottle = this.gear < 0 ? reverseThrottle : this.input.throttle;
    const targetDriveInput = this.gear < 0 ? -reverseThrottle : engineThrottle;
    const ramp =
      targetDriveInput === 0
        ? this.config.driveInputReleaseRamp ?? 8.6
        : targetDriveInput < 0
          ? this.config.reverseInputRamp ?? 4.2
          : this.config.driveInputRamp ?? 6.2;
    const ratio = getGearRatio(this.config, this.gear) * this.config.finalDrive;
    const torqueFromCurve = sampleTorqueCurve(this.config.engineTorqueCurve, this.rpm);
    const speedFade = 1 - smoothstep(this.config.maxForwardSpeed * 0.92, this.config.maxForwardSpeed * 1.08, Math.abs(this.signedSpeed)) * 0.72;
    const drivenCount = Math.max(this.drivenWheelIndices.length, 1);
    const maxTorquePerWheel = (this.config.engineForce * this.config.tireRadius) / drivenCount;

    this.driveInput = approach(this.driveInput, targetDriveInput, ramp * dt);
    this.throttle = engineThrottle;

    for (const wheel of this.wheels) {
      wheel.engineTorque = 0;
    }

    if (Math.abs(this.driveInput) < 0.01 || ratio === 0) return;

    const totalWheelTorque =
      torqueFromCurve *
      ratio *
      this.config.drivetrainEfficiency *
      this.clutch *
      Math.abs(this.driveInput) *
      speedFade;
    const signedTorque = Math.sign(this.driveInput) * Math.abs(totalWheelTorque);
    const perWheelTorque = clamp(signedTorque / drivenCount, -maxTorquePerWheel, maxTorquePerWheel);

    for (const index of this.drivenWheelIndices) {
      const wheel = this.wheels[index];
      wheel.engineTorque = perWheelTorque;
      wheel.angularVelocity += (perWheelTorque / Math.max(this.config.wheelInertia, EPSILON)) * dt;
    }
  }

  smoothLongitudinalForce(wheel, targetForce, availableLongitudinal, dt) {
    const sameDirection =
      Math.abs(wheel.longitudinalForceState) < 1 ||
      Math.sign(wheel.longitudinalForceState) === Math.sign(targetForce);
    const response = (this.config.longitudinalForceResponse ?? 28) * (sameDirection ? 1 : 1.75);
    const blend = 1 - Math.exp(-response * dt);

    wheel.longitudinalForceState += (targetForce - wheel.longitudinalForceState) * blend;
    wheel.longitudinalForceState = clamp(
      wheel.longitudinalForceState,
      -availableLongitudinal,
      availableLongitudinal,
    );

    return wheel.longitudinalForceState;
  }

  applyBrakeForce(dt) {
    const brakePedal = this.gear < 0 && this.signedSpeed < 2.2 ? 0 : this.input.brake;
    const brakeResponse =
      brakePedal > this.brakePressure
        ? this.config.brakeResponse ?? 6
        : this.config.brakeReleaseResponse ?? 10;
    this.brakePressure = approach(this.brakePressure, brakePedal, brakeResponse * dt);
    this.brake = this.brakePressure;

    for (const wheel of this.wheels) {
      const axleShare = wheel.isFront
        ? this.config.brakeBias
        : (1 - this.config.brakeBias) * this.getRearBrakeStabilityScale(wheel);
      const corneringBrakeScale = this.getCorneringBrakeScale(wheel);
      let brakeTorque = this.config.brakeForce * this.config.tireRadius * this.brakePressure * axleShare * 0.5 * corneringBrakeScale;

      if (this.input.handbrake && !wheel.isFront) {
        brakeTorque = Math.max(brakeTorque, this.config.brakeForce * this.config.tireRadius * 0.36);
      }

      if (this.config.abs && brakeTorque > 0 && Math.abs(wheel.forwardSpeed) > 5 && wheel.slipRatio < -this.config.absSlip) {
        const lockSeverity = clamp((-wheel.slipRatio - this.config.absSlip) / 0.75, 0, 1);
        brakeTorque *= lerp(0.58, 0.28, lockSeverity);
        wheel.absActive = true;
      } else {
        wheel.absActive = false;
      }

      wheel.brakeTorque = brakeTorque;
      if (brakeTorque <= 0) continue;

      const wheelSign = Math.sign(wheel.angularVelocity || wheel.forwardSpeed || this.signedSpeed || 1);
      const angularDelta = (brakeTorque / Math.max(this.config.wheelInertia, EPSILON)) * dt;

      if (Math.abs(wheel.angularVelocity) <= angularDelta) {
        wheel.angularVelocity = 0;
      } else {
        wheel.angularVelocity -= wheelSign * angularDelta;
      }
    }
  }

  getRearBrakeStabilityScale(wheel) {
    if (wheel.isFront || this.brakePressure <= 0.01 || this.input.handbrake) return 1;

    const speedDemand = smoothstep(6, 28, Math.abs(wheel.forwardSpeed || this.signedSpeed));
    const brakeDemand = smoothstep(0.12, 0.9, this.brakePressure);
    const lateralDemand = clamp(
      Math.abs(wheel.slipAngle) / 0.28 + Math.abs(wheel.lateralSpeed) / 18,
      0,
      1,
    );
    const lockDemand = smoothstep(0.18, this.config.absSlip ?? 0.72, -wheel.slipRatio);
    const stabilityDemand = Math.max(lateralDemand, lockDemand * 0.85) * speedDemand * brakeDemand;

    if (this.config.brakeDrift) {
      return lerp(1, this.config.brakeDriftRearBrakeScale ?? 1.08, stabilityDemand);
    }

    return lerp(1, this.config.rearBrakeStabilityScale ?? 0.5, stabilityDemand);
  }

  getCorneringBrakeScale(wheel) {
    if (this.brakePressure <= 0.01 || !wheel.isInContact) return 1;

    const lateralDemand = clamp(Math.abs(wheel.slipAngle) / 0.42, 0, 1);
    const speedDemand = smoothstep(5, 24, Math.abs(wheel.forwardSpeed));
    const blend = lateralDemand * speedDemand;
    const corneringScale = wheel.isFront
      ? this.config.brakeCorneringTorqueScale ?? 0.65
      : this.config.rearBrakeCorneringTorqueScale ??
        this.config.brakeCorneringTorqueScale ??
        0.65;

    return lerp(1, corneringScale, blend);
  }

  getBrakingCorneringReserve(wheel) {
    if (this.brakePressure <= 0.03 || !wheel.isInContact) return 0;

    const lateralDemand = clamp(Math.abs(wheel.slipAngle) / 0.34, 0, 1);
    const brakeDemand = smoothstep(0.08, 0.85, this.brakePressure);
    const speedDemand = smoothstep(5, 24, Math.abs(wheel.forwardSpeed || this.signedSpeed));
    const reserveDemand = Math.max(lateralDemand, (wheel.isFront ? 0.1 : 0.22) * speedDemand);
    const reserve = wheel.isFront
      ? this.config.brakeLateralReserve ?? 0.82
      : this.config.rearBrakeLateralReserve ??
        this.config.brakeLateralReserve ??
        0.82;

    return clamp(reserve * reserveDemand * brakeDemand, 0, 0.98);
  }

  getBrakeDriftFactor(wheel) {
    if (!this.config.brakeDrift || wheel.isFront || this.input.handbrake) return 0;

    const brakeDemand = smoothstep(0.12, 0.86, this.brakePressure);
    const speedDemand = smoothstep(7, 28, Math.abs(wheel.forwardSpeed || this.signedSpeed));
    const steerDemand = smoothstep(
      0.04,
      Math.max(this.config.maxSteerAngle ?? 0.5, 0.1),
      Math.abs(this.steeringAngle),
    );
    const lateralDemand = smoothstep(0.8, 7.5, Math.abs(wheel.lateralSpeed));

    return clamp(brakeDemand * speedDemand * lerp(0.34, 1, Math.max(steerDemand, lateralDemand)), 0, 1);
  }

  applySlideStability(dt) {
    if (this.groundedWheels <= 0) return;

    const horizontalRight = projectOnPlane(this.right, WORLD_UP);
    const lateralSpeed = this.chassisBody.velocity.dot(horizontalRight);
    const slipFactor =
      smoothstep(0.18, 0.92, this.averageSlip) *
      smoothstep(5, 28, Math.abs(this.signedSpeed));
    if (slipFactor <= 0.001) return;

    const brakeBlend = smoothstep(0.05, 0.85, this.brakePressure);
    const stabilityGain = this.config.brakeDrift
      ? lerp(1, this.config.brakeSlideStability ?? 0.55, brakeBlend)
      : 1 + brakeBlend * (this.config.brakeSlideStability ?? 0.65);
    const lateralDamping = (this.config.slideLateralDamping ?? 0.7) * stabilityGain;
    const lateralForce = -lateralSpeed * this.config.mass * lateralDamping * slipFactor * this.contactRatio;

    if (Math.abs(lateralForce) > 1) {
      this.applyForceAtPoint(scaleVec(horizontalRight, lateralForce), new CANNON.Vec3());
    }

    const yawDamping = (this.config.slideYawDamping ?? 1.2) * stabilityGain * slipFactor * this.contactRatio;
    this.chassisBody.angularVelocity.y *= Math.exp(-yawDamping * dt);

    if (this.config.brakeDrift && brakeBlend > 0.02 && Math.abs(this.steeringAngle) > 0.015) {
      const speedDemand = smoothstep(7, 28, Math.abs(this.signedSpeed));
      const steerDirection = Math.sign(this.steeringAngle);
      this.chassisBody.angularVelocity.y +=
        steerDirection * (this.config.brakeDriftYawAssist ?? 0.25) * brakeBlend * speedDemand * this.contactRatio * dt;
    }
  }

  applyAeroAndRollingResistance() {
    const velocity = this.chassisBody.velocity;
    const speed = velocity.length();
    this.aeroDrag = 0;
    this.rollingResistance = 0;

    if (speed > 0.05) {
      this.aeroDrag = this.config.airDrag * speed * speed;
      this.applyForceAtPoint(scaleVec(velocity, -this.aeroDrag / speed), new CANNON.Vec3());
    }

    if (this.groundedWheels > 0) {
      const horizontalVelocity = new CANNON.Vec3(velocity.x, 0, velocity.z);
      const horizontalSpeed = horizontalVelocity.length();

      if (horizontalSpeed > 0.05) {
        this.rollingResistance =
          this.config.mass * this.gravity * this.config.rollingResistance * this.contactRatio;
        this.applyForceAtPoint(
          scaleVec(horizontalVelocity, -this.rollingResistance / horizontalSpeed),
          new CANNON.Vec3(),
        );
      }

      const downforce = this.getAeroDownforce(speed);
      if (downforce > 1) {
        const frontShare = clamp(this.config.frontDownforceShare ?? 0.5, 0.25, 0.75);
        const frontPoint = this.localOffsetToRelative(new CANNON.Vec3(0, 0, this.config.wheelBase * 0.46));
        const rearPoint = this.localOffsetToRelative(new CANNON.Vec3(0, 0, -this.config.wheelBase * 0.46));

        this.applyForceAtPoint(scaleVec(this.averageGroundNormal, -downforce * frontShare), frontPoint);
        this.applyForceAtPoint(scaleVec(this.averageGroundNormal, -downforce * (1 - frontShare)), rearPoint);
      }
    }
  }

  getAeroDownforce(speed = this.chassisBody.velocity.length()) {
    const coefficient = this.config.downforce ?? 0;
    const loadCap = this.config.downforceLoadCap ?? 0.85;
    return Math.min(coefficient * speed * speed * 22, this.config.mass * this.gravity * loadCap);
  }

  getWheelAeroGripLoad(wheel) {
    if (this.groundedWheels <= 0 || !wheel.isInContact) return 0;

    const frontShare = clamp(this.config.frontDownforceShare ?? 0.5, 0.25, 0.75);
    const axleShare = wheel.isFront ? frontShare : 1 - frontShare;
    const efficiency = this.config.aeroGripEfficiency ?? 0.85;
    return this.getAeroDownforce() * axleShare * 0.5 * efficiency;
  }

  applyForceAtPoint(force, point) {
    this.chassisBody.applyForce(force, point);
  }

  calculateSlipRatio(wheel) {
    const tireSurfaceSpeed = wheel.angularVelocity * wheel.radius;
    const referenceSpeed = Math.max(Math.abs(wheel.forwardSpeed), 4.5);
    const rawSlip = clamp((tireSurfaceSpeed - wheel.forwardSpeed) / referenceSpeed, -3, 3);
    const deadband = this.config.slipRatioDeadband ?? 0.018;
    const absSlip = Math.abs(rawSlip);

    if (absSlip <= deadband) return 0;
    return Math.sign(rawSlip) * (absSlip - deadband);
  }

  calculateSlipAngle(wheel) {
    return clamp(Math.atan2(wheel.lateralSpeed, Math.abs(wheel.forwardSpeed) + 0.85), -1.2, 1.2);
  }

  tireGripCurve(slip, mode = "lateral") {
    const peakSlip = mode === "longitudinal" ? 0.11 : 0.105;
    const normalizedSlip = slip / peakSlip;

    if (normalizedSlip <= 1) {
      return Math.sin(normalizedSlip * Math.PI * 0.5);
    }

    const falloff = Math.exp(-(normalizedSlip - 1) * 0.38);
    return clamp(0.54 + 0.46 * falloff, 0.54, 1);
  }

  calculateWeightTransferLoad(wheel) {
    const longitudinalTransfer =
      (this.config.mass * this.longitudinalAcceleration * this.config.centerOfMassHeight) /
      Math.max(this.config.wheelBase, EPSILON);
    const lateralTransfer =
      (this.config.mass * this.lateralAcceleration * this.config.centerOfMassHeight) /
      Math.max(this.config.trackWidth, EPSILON);

    let load = wheel.isFront ? -longitudinalTransfer * 0.5 : longitudinalTransfer * 0.5;
    load += wheel.isLeft ? -lateralTransfer * 0.5 : lateralTransfer * 0.5;
    return clamp(load, -this.config.mass * this.gravity * 0.38, this.config.mass * this.gravity * 0.38);
  }

  raycastWheel(wheel) {
    const connectionWorld = this.localPointToWorld(wheel.chassisConnectionPointLocal);
    const downWorld = this.localVectorToWorld(LOCAL_DOWN);
    const rayLength = wheel.maxSuspensionLength + wheel.radius;
    const rayEnd = addVec(connectionWorld, scaleVec(downWorld, rayLength));
    const result = new CANNON.RaycastResult();
    const hasHit = this.world.raycastClosest(
      connectionWorld,
      rayEnd,
      {
        skipBackfaces: true,
        collisionFilterMask: this.raycastFilterMask,
      },
      result,
    );

    if (hasHit && result.body !== this.chassisBody && result.hitNormalWorld.y > 0.18) {
      this.acceptWheelHit(wheel, connectionWorld, result.hitPointWorld, result.hitNormalWorld);
      return;
    }

    if (this.sampleGround) {
      const fallback = this.sampleGround(connectionWorld.x, connectionWorld.z);
      const denom = -downWorld.y;

      if (fallback && denom > 0.08) {
        const distance = (connectionWorld.y - fallback.height) / denom;
        if (distance >= 0 && distance <= rayLength) {
          const point = addVec(connectionWorld, scaleVec(downWorld, distance));
          this.acceptWheelHit(wheel, connectionWorld, point, fallback.normal);
          return;
        }
      }
    }

    wheel.isInContact = false;
    wheel.contact = false;
    wheel.raycastResult.hasHit = false;
    wheel.raycastResult.distance = rayLength;
    wheel.groundNormal.copy(WORLD_UP);
  }

  acceptWheelHit(wheel, connectionWorld, hitPointWorld, hitNormalWorld) {
    const distance = distanceBetween(connectionWorld, hitPointWorld);
    const suspensionLength = clamp(
      distance - wheel.radius,
      wheel.minSuspensionLength,
      wheel.maxSuspensionLength,
    );

    wheel.isInContact = distance <= wheel.maxSuspensionLength + wheel.radius + 0.02;
    wheel.contact = wheel.isInContact;
    wheel.suspensionLength = suspensionLength;
    wheel.contactPointWorld.copy(hitPointWorld);
    hitPointWorld.vsub(this.chassisBody.position, wheel.contactPointRelative);
    wheel.groundNormal.copy(hitNormalWorld);
    if (wheel.groundNormal.lengthSquared() < EPSILON) wheel.groundNormal.copy(WORLD_UP);
    wheel.groundNormal.normalize();

    wheel.raycastResult.hasHit = wheel.isInContact;
    wheel.raycastResult.hitPointWorld.copy(hitPointWorld);
    wheel.raycastResult.hitNormalWorld.copy(wheel.groundNormal);
    wheel.raycastResult.distance = distance;
  }

  getWheelForward(wheel, groundNormal) {
    const steer = wheel.steerAngle;
    const localForward = new CANNON.Vec3(Math.sin(steer), 0, Math.cos(steer));
    const worldForward = this.localVectorToWorld(localForward);
    return projectOnPlane(worldForward, groundNormal);
  }

  getWheelRight(wheelForward, groundNormal) {
    const right = crossVec(groundNormal, wheelForward);
    if (right.lengthSquared() < EPSILON) return this.right.clone();
    right.normalize();
    return right;
  }

  getVelocityAtRelativePoint(relativePoint) {
    const angularVelocity = this.chassisBody.angularVelocity;
    const rotationalVelocity = crossVec(angularVelocity, relativePoint);
    return addVec(this.chassisBody.velocity, rotationalVelocity);
  }

  updateGroundSummary() {
    const normal = new CANNON.Vec3();
    let groundedWheels = 0;
    let compression = 0;

    for (const wheel of this.wheels) {
      if (!wheel.isInContact) continue;
      groundedWheels += 1;
      compression += wheel.compression;
      normal.vadd(wheel.groundNormal, normal);
    }

    if (groundedWheels > 0 && normal.lengthSquared() > EPSILON) {
      normal.normalize();
      this.averageGroundNormal.copy(normal);
    } else {
      this.averageGroundNormal.copy(WORLD_UP);
    }

    this.groundedWheels = groundedWheels;
    this.contactRatio = groundedWheels / this.wheels.length;
    this.grounded = groundedWheels > 0;
    this.averageCompression = groundedWheels > 0 ? compression / groundedWheels : 0;
  }

  getGroundContactInfo() {
    return {
      groundedWheels: this.groundedWheels,
      contactRatio: this.contactRatio,
      compression: this.averageCompression ?? 0,
      normal: this.averageGroundNormal.clone(),
    };
  }

  updateWheelTransform(index) {
    const wheel = this.wheels[index];
    const connectionWorld = this.localPointToWorld(wheel.chassisConnectionPointLocal);
    const downWorld = this.localVectorToWorld(LOCAL_DOWN);
    const center = addVec(connectionWorld, scaleVec(downWorld, wheel.suspensionLength));

    const steerQuat = new CANNON.Quaternion();
    const rollQuat = new CANNON.Quaternion();
    const localQuat = new CANNON.Quaternion();

    steerQuat.setFromAxisAngle(LOCAL_UP, wheel.steerAngle);
    rollQuat.setFromAxisAngle(LOCAL_RIGHT, wheel.rotationAngle);
    steerQuat.mult(rollQuat, localQuat);
    this.chassisBody.quaternion.mult(localQuat, wheel.worldTransform.quaternion);
    wheel.worldTransform.position.copy(center);
  }

  estimateEngineRpm() {
    const ratio = Math.abs(getGearRatio(this.config, this.gear) * this.config.finalDrive);
    const driven = this.drivenWheelIndices.length ? this.drivenWheelIndices : [0, 1, 2, 3];
    const averageWheelRpm =
      driven.reduce((sum, index) => sum + Math.abs(this.wheels[index].angularVelocity), 0) /
      driven.length *
      (60 / (Math.PI * 2));
    const reverseThrottle = this.gear < 0 ? this.input.brake : 0;
    const engineThrottle = this.gear < 0 ? reverseThrottle : this.input.throttle;
    const roadCoupledRpm = averageWheelRpm * ratio;
    const freeRevRpm = this.config.idleRpm + engineThrottle * (this.config.maxRpm - this.config.idleRpm) * 0.7;
    const target =
      this.gear === 0 || ratio === 0
        ? freeRevRpm
        : Math.max(this.config.idleRpm, roadCoupledRpm + engineThrottle * 260);
    const blend = this.gear === 0 ? 0.24 : 0.18;
    return clamp(this.rpm + (target - this.rpm) * blend, this.config.idleRpm, this.config.maxRpm + 220);
  }

  localPointToWorld(localPoint) {
    const worldPoint = new CANNON.Vec3();
    this.chassisBody.quaternion.vmult(localPoint, worldPoint);
    worldPoint.vadd(this.chassisBody.position, worldPoint);
    return worldPoint;
  }

  localVectorToWorld(localVector) {
    const worldVector = new CANNON.Vec3();
    this.chassisBody.quaternion.vmult(localVector, worldVector);
    if (worldVector.lengthSquared() > EPSILON) worldVector.normalize();
    return worldVector;
  }

  localOffsetToRelative(localPoint) {
    const relativePoint = new CANNON.Vec3();
    this.chassisBody.quaternion.vmult(localPoint, relativePoint);
    return relativePoint;
  }
}

export function getVehiclePhysicsConfig(carId) {
  return VEHICLE_PHYSICS_CONFIGS[carId] ?? VEHICLE_PHYSICS_CONFIGS.gt3;
}

export function getDrivenWheelIndices(drivetrainType) {
  if (drivetrainType === DRIVETRAIN_TYPES.FWD) return [0, 1];
  if (drivetrainType === DRIVETRAIN_TYPES.AWD) return [0, 1, 2, 3];
  return [2, 3];
}

export function sampleTorqueCurve(points, rpm) {
  if (!points?.length) return 0;
  if (rpm <= points[0][0]) return points[0][1];

  for (let i = 1; i < points.length; i += 1) {
    const [nextRpm, nextTorque] = points[i];
    const [previousRpm, previousTorque] = points[i - 1];

    if (rpm <= nextRpm) {
      const t = (rpm - previousRpm) / Math.max(nextRpm - previousRpm, 1);
      return previousTorque + (nextTorque - previousTorque) * t;
    }
  }

  return points[points.length - 1][1];
}

export function getGearRatio(config, gear) {
  if (gear < 0) return config.gearRatios[0] ?? -3;
  return config.gearRatios[gear + 1] ?? 0;
}

export function getGearLabel(gear) {
  if (gear < 0) return "R";
  if (gear === 0) return "N";
  return String(gear);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function approach(current, target, amount) {
  if (current < target) return Math.min(current + amount, target);
  if (current > target) return Math.max(current - amount, target);
  return target;
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / Math.max(edge1 - edge0, EPSILON), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

function addVec(a, b) {
  return new CANNON.Vec3(a.x + b.x, a.y + b.y, a.z + b.z);
}

function scaleVec(vector, scalar) {
  return new CANNON.Vec3(vector.x * scalar, vector.y * scalar, vector.z * scalar);
}

function crossVec(a, b) {
  return new CANNON.Vec3(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x,
  );
}

function projectOnPlane(vector, normal) {
  const dot = vector.dot(normal);
  const projected = new CANNON.Vec3(
    vector.x - normal.x * dot,
    vector.y - normal.y * dot,
    vector.z - normal.z * dot,
  );

  if (projected.lengthSquared() < EPSILON) return LOCAL_FORWARD.clone();
  projected.normalize();
  return projected;
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
