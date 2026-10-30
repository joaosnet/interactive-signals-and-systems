// ============================================================================
// STAGE-3D.JS — Motor Gráfico 3D/2D Unificado de Alta Precisão (Canvas 2D + Three.js)
// ============================================================================

import { state } from './state.js';
import { renderMath } from './math-engine.js';
import { BUILTIN_CONV_PRESETS, BUILTIN_FOURIER_PRESETS } from './presets.js';
import { compileSignalExpr, detectSupportAndRegions, integrateSimpson } from './math-engine.js';

let canvasContainer = null;
let stageCanvas = null;
let ctx3d = null;
let camera = null;

// Orbit target and spherical parameters
export const camOrbit = {
  theta: -0.62,
  phi: 1.05,
  radius: 13.2,
  targetTheta: -0.62,
  targetPhi: 1.05,
  targetRadius: 13.2,
  autoOrient: true,
  target: { x: 1.2, y: 0.42, z: 1.6 }
};

export function setCameraPreset(presetName) {
  state.cameraPreset = presetName;
  camOrbit.autoOrient = true;

  if (state.activeModule === 'fourier') {
    if (presetName === '2d-time') {
      camOrbit.targetTheta = 0.0;
      camOrbit.targetPhi = Math.PI / 2;
      camOrbit.targetRadius = 11.5;
    } else if (presetName === '2d-spec') {
      camOrbit.targetTheta = -Math.PI / 2;
      camOrbit.targetPhi = Math.PI / 2;
      camOrbit.targetRadius = 12.0;
    } else if (presetName === 'top') {
      camOrbit.targetTheta = 0.0;
      camOrbit.targetPhi = 0.05;
      camOrbit.targetRadius = 13.5;
    } else {
      camOrbit.targetTheta = -0.58;
      camOrbit.targetPhi = 1.05;
      camOrbit.targetRadius = 13.2;
    }
  } else {
    if (presetName === '2d-time') {
      camOrbit.targetTheta = 0.0;
      camOrbit.targetPhi = Math.PI / 2;
      camOrbit.targetRadius = 12.0;
    } else if (presetName === '2d-spec') {
      camOrbit.targetTheta = -Math.PI / 2;
      camOrbit.targetPhi = Math.PI / 2;
      camOrbit.targetRadius = 12.2;
    } else if (presetName === 'top') {
      camOrbit.targetTheta = 0.0;
      camOrbit.targetPhi = 0.05;
      camOrbit.targetRadius = 13.8;
    } else {
      camOrbit.targetTheta = -0.62;
      camOrbit.targetPhi = 1.05;
      camOrbit.targetRadius = 13.2;
    }
  }
}

export function getEffectiveSignals() {
  let p = BUILTIN_CONV_PRESETS[state.presetKey];
  if (!p) {
    const foundCustom = state.customPresets.find(cp => cp.id === state.presetKey);
    if (foundCustom) {
      const fnX = compileSignalExpr(foundCustom.exprX);
      const fnH = compileSignalExpr(foundCustom.exprH);
      const auto = detectSupportAndRegions(fnX, fnH, foundCustom.exprX, foundCustom.exprH);
      p = {
        ...foundCustom,
        fnX,
        fnH,
        supportX: auto.supportX,
        supportH: auto.supportH,
        conv: (tVal) => integrateSimpson(fnX, fnH, tVal),
        regions: auto.regions
      };
    } else {
      const fnX = compileSignalExpr(state.exprX);
      const fnH = compileSignalExpr(state.exprH);
      const auto = detectSupportAndRegions(fnX, fnH, state.exprX, state.exprH);
      p = {
        id: 'custom_live',
        exprX: state.exprX,
        exprH: state.exprH,
        fnX,
        fnH,
        supportX: auto.supportX,
        supportH: auto.supportH,
        conv: (tVal) => integrateSimpson(fnX, fnH, tVal),
        regions: auto.regions
      };
    }
  }

  if (!state.isCommuted) {
    return {
      fixedSym: 'x',
      movingSym: 'h',
      fnFixed: p.fnX,
      fnMoving: p.fnH,
      supportFixed: p.supportX || [0, 3],
      supportMoving: p.supportH || [0, 3],
      conv: p.conv,
      regions: p.regions,
      preset: p
    };
  } else {
    return {
      fixedSym: 'h',
      movingSym: 'x',
      fnFixed: p.fnH,
      fnMoving: p.fnX,
      supportFixed: p.supportH || [0, 3],
      supportMoving: p.supportX || [0, 3],
      conv: p.conv,
      regions: p.regions,
      preset: p
    };
  }
}

export function getThemePalette() {
  if (state.theme === 'projector') {
    return {
      bgCss: '#ffffff',
      wallFill: 'rgba(241, 245, 249, 0.75)',
      wallBorder: 'rgba(15, 23, 42, 0.45)',
      gridMain: 'rgba(15, 23, 42, 0.32)',
      gridSub: 'rgba(100, 116, 139, 0.22)',
      axis: '#0f172a',
      tickText: '#0f172a',
      x1: '#00449e',
      x1Fill: 'rgba(0, 68, 158, 0.16)',
      x2: '#be123c',
      x2Fill: 'rgba(190, 18, 60, 0.16)',
      prod: '#6b21a8',
      prodFill: 'rgba(107, 33, 168, 0.42)',
      prodSliceFill: 'rgba(107, 33, 168, 0.16)',
      prodSliceStroke: 'rgba(107, 33, 168, 0.55)',
      conv: '#047857',
      convFill: 'rgba(4, 120, 87, 0.25)',
      activePlaneFill: 'rgba(0, 68, 158, 0.05)',
      activePlaneBorder: 'rgba(15, 23, 42, 0.35)',
      specStem: '#047857',
      specSphere: '#047857'
    };
  }
  if (state.theme === 'light') {
    return {
      bgCss: '#f1f5f9',
      wallFill: 'rgba(255, 255, 255, 0.65)',
      wallBorder: 'rgba(100, 116, 139, 0.3)',
      gridMain: 'rgba(71, 85, 105, 0.28)',
      gridSub: 'rgba(148, 163, 184, 0.22)',
      axis: '#1e293b',
      tickText: '#334155',
      x1: '#0284c7',
      x1Fill: 'rgba(2, 132, 199, 0.16)',
      x2: '#e11d48',
      x2Fill: 'rgba(225, 29, 72, 0.15)',
      prod: '#7e22ce',
      prodFill: 'rgba(126, 34, 206, 0.38)',
      prodSliceFill: 'rgba(126, 34, 206, 0.15)',
      prodSliceStroke: 'rgba(126, 34, 206, 0.45)',
      conv: '#059669',
      convFill: 'rgba(5, 150, 105, 0.22)',
      activePlaneFill: 'rgba(2, 132, 199, 0.05)',
      activePlaneBorder: 'rgba(100, 116, 139, 0.3)',
      specStem: '#059669',
      specSphere: '#059669'
    };
  }
  return {
    bgCss: '#090b10',
    wallFill: 'rgba(15, 23, 42, 0.45)',
    wallBorder: 'rgba(148, 163, 184, 0.2)',
    gridMain: 'rgba(148, 163, 184, 0.22)',
    gridSub: 'rgba(71, 85, 105, 0.22)',
    axis: '#94a3b8',
    tickText: '#94a3b8',
    x1: '#38bdf8',
    x1Fill: 'rgba(56, 189, 248, 0.16)',
    x2: '#fb7185',
    x2Fill: 'rgba(251, 113, 133, 0.16)',
    prod: '#c084fc',
    prodFill: 'rgba(168, 85, 247, 0.44)',
    prodSliceFill: 'rgba(168, 85, 247, 0.19)',
    prodSliceStroke: 'rgba(192, 132, 252, 0.55)',
    conv: '#10b981',
    convFill: 'rgba(16, 185, 129, 0.24)',
    activePlaneFill: 'rgba(56, 189, 248, 0.05)',
    activePlaneBorder: 'rgba(148, 163, 184, 0.24)',
    specStem: '#10b981',
    specSphere: '#38bdf8'
  };
}

export function updateCameraFromOrbit() {
  if (camOrbit.autoOrient) {
    camOrbit.theta += (camOrbit.targetTheta - camOrbit.theta) * 0.1;
    camOrbit.phi += (camOrbit.targetPhi - camOrbit.phi) * 0.1;
    camOrbit.radius += (camOrbit.targetRadius - camOrbit.radius) * 0.1;
  }

  const w = canvasContainer ? (canvasContainer.clientWidth || 384) : 384;
  const h = canvasContainer ? (canvasContainer.clientHeight || 260) : 260;
  const aspect = w / Math.max(h, 1);
  const responsiveScale = aspect < 0.85 ? 1.24 : aspect < 1.2 ? 1.08 : 0.95;
  const r = camOrbit.radius * responsiveScale;

  const sinPhi = Math.sin(camOrbit.phi);
  const cx = camOrbit.target.x + r * sinPhi * Math.sin(camOrbit.theta);
  const cy = camOrbit.target.y + r * Math.cos(camOrbit.phi);
  const cz = camOrbit.target.z + r * Math.cos(camOrbit.theta) * sinPhi;

  if (camera) {
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    camera.position.set(cx, cy, cz);
    camera.lookAt(camOrbit.target.x, camOrbit.target.y, camOrbit.target.z);
    camera.updateMatrixWorld();
  }
  return { cx, cy, cz };
}

export function projectPoint3D(x, y, z) {
  const w = canvasContainer ? (canvasContainer.clientWidth || 384) : 384;
  const h = canvasContainer ? (canvasContainer.clientHeight || 260) : 260;

  if (camera && window.THREE) {
    const v = new THREE.Vector3(x, y, z);
    const camDist = v.distanceTo(camera.position);
    v.project(camera);
    if (v.z > 1.05 || v.z < -1.05) return null;
    return {
      x: (v.x * 0.5 + 0.5) * w,
      y: (-v.y * 0.5 + 0.5) * h,
      depth: camDist
    };
  }

  const { cx, cy, cz } = updateCameraFromOrbit();
  const fx = camOrbit.target.x - cx;
  const fy = camOrbit.target.y - cy;
  const fz = camOrbit.target.z - cz;
  const flen = Math.hypot(fx, fy, fz) || 1;
  const fwd = { x: fx / flen, y: fy / flen, z: fz / flen };

  const rx = fwd.z;
  const rz = -fwd.x;
  const rlen = Math.hypot(rx, rz) || 1;
  const right = { x: -rx / rlen, y: 0, z: -rz / rlen };
  const up = {
    x: right.y * fwd.z - right.z * fwd.y,
    y: right.z * fwd.x - right.x * fwd.z,
    z: right.x * fwd.y - right.y * fwd.x
  };

  const dx = x - cx;
  const dy = y - cy;
  const dz = z - cz;
  const zCam = dx * fwd.x + dy * fwd.y + dz * fwd.z;
  if (zCam <= 0.2) return null;
  const xCam = dx * right.x + dy * right.y + dz * right.z;
  const yCam = dx * up.x + dy * up.y + dz * up.z;
  const fovScale = (h * 0.5) / Math.tan((38 * Math.PI) / 360);

  return {
    x: w * 0.5 + (xCam / zCam) * fovScale,
    y: h * 0.5 - (yCam / zCam) * fovScale,
    depth: zCam
  };
}

function draw3DLine(p1, p2, color, width = 1.5, dash = []) {
  const a = projectPoint3D(p1.x, p1.y, p1.z);
  const b = projectPoint3D(p2.x, p2.y, p2.z);
  if (!a || !b) return;
  ctx3d.save();
  ctx3d.beginPath();
  ctx3d.setLineDash(dash);
  ctx3d.moveTo(a.x, a.y);
  ctx3d.lineTo(b.x, b.y);
  ctx3d.strokeStyle = color;
  ctx3d.lineWidth = width;
  ctx3d.lineCap = 'round';
  ctx3d.stroke();
  ctx3d.restore();
}

let interactiveCurves2D = [];

function distToSegmentSq(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return (px - x1) * (px - x1) + (py - y1) * (py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  return (px - projX) * (px - projX) + (py - projY) * (py - projY);
}

function findHitSignalCurve(localX, localY, thresholdPx = 16) {
  const maxDistSq = thresholdPx * thresholdPx;
  let bestTarget = null;
  let bestDistSq = maxDistSq;
  for (let c = 0; c < interactiveCurves2D.length; c++) {
    const { target, pts2d } = interactiveCurves2D[c];
    for (let i = 0; i < pts2d.length - 1; i++) {
      const dSq = distToSegmentSq(localX, localY, pts2d[i].x, pts2d[i].y, pts2d[i + 1].x, pts2d[i + 1].y);
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        bestTarget = target;
      }
    }
  }
  return bestTarget;
}

function draw3DPolyline(pts3d, color, width = 2.2, dash = [], glow = false, hitTarget = null) {
  if (pts3d.length < 2) return;
  ctx3d.save();
  ctx3d.beginPath();
  ctx3d.setLineDash(dash);
  let started = false;
  const pts2d = hitTarget ? [] : null;
  for (let i = 0; i < pts3d.length; i++) {
    const p = projectPoint3D(pts3d[i].x, pts3d[i].y, pts3d[i].z);
    if (!p) continue;
    if (pts2d) pts2d.push(p);
    if (!started) {
      ctx3d.moveTo(p.x, p.y);
      started = true;
    } else {
      ctx3d.lineTo(p.x, p.y);
    }
  }
  if (pts2d && pts2d.length >= 2) {
    interactiveCurves2D.push({ target: hitTarget, pts2d });
  }
  ctx3d.strokeStyle = color;
  ctx3d.lineWidth = width;
  ctx3d.lineJoin = 'round';
  ctx3d.lineCap = 'round';
  if (glow) {
    ctx3d.shadowColor = color;
    ctx3d.shadowBlur = state.theme === 'dark' ? 14 : (state.theme === 'projector' ? 10 : 8);
  }
  ctx3d.stroke();
  ctx3d.restore();
}

function draw3DPolygon(pts3d, fillColor, strokeColor = null, strokeWidth = 1) {
  if (pts3d.length < 3) return;
  ctx3d.save();
  ctx3d.beginPath();
  let started = false;
  for (let i = 0; i < pts3d.length; i++) {
    const p = projectPoint3D(pts3d[i].x, pts3d[i].y, pts3d[i].z);
    if (!p) continue;
    if (!started) {
      ctx3d.moveTo(p.x, p.y);
      started = true;
    } else {
      ctx3d.lineTo(p.x, p.y);
    }
  }
  ctx3d.closePath();
  if (fillColor) {
    ctx3d.fillStyle = fillColor;
    ctx3d.fill();
  }
  if (strokeColor) {
    ctx3d.strokeStyle = strokeColor;
    ctx3d.lineWidth = strokeWidth;
    ctx3d.stroke();
  }
  ctx3d.restore();
}

function buildCurveAreaPolygon(curvePts) {
  if (curvePts.length < 2) return [];
  const first = curvePts[0];
  const last = curvePts[curvePts.length - 1];
  return [
    { x: first.x, y: 0, z: first.z },
    ...curvePts,
    { x: last.x, y: 0, z: last.z }
  ];
}

export function updateScene3D() {
  if (!ctx3d || !stageCanvas) return;
  interactiveCurves2D = [];
  if (state.activeModule === 'fourier') {
    renderFourierScene3D();
    return;
  }

  const sig = getEffectiveSignals();
  const pal = getThemePalette();

  const w = canvasContainer.clientWidth || 384;
  const h = canvasContainer.clientHeight || 260;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (stageCanvas.width !== Math.floor(w * dpr) || stageCanvas.height !== Math.floor(h * dpr)) {
    stageCanvas.width = Math.floor(w * dpr);
    stageCanvas.height = Math.floor(h * dpr);
  }

  updateCameraFromOrbit();

  ctx3d.save();
  ctx3d.scale(dpr, dpr);
  ctx3d.fillStyle = pal.bgCss;
  ctx3d.fillRect(0, 0, w, h);

  const TAU_MIN = -3.5;
  const TAU_MAX = 6.0;
  const T_MIN = -2.0;
  const T_MAX = 6.0;
  let maxPeak = 1.1;
  let minPeak = 0.0;
  for (let s = TAU_MIN; s <= TAU_MAX; s += 0.25) {
    const vx = sig.fnFixed(s);
    const vh = sig.fnMoving(s);
    if (vx > maxPeak) maxPeak = vx;
    if (vh > maxPeak) maxPeak = vh;
    if (vx < minPeak) minPeak = vx;
    if (vh < minPeak) minPeak = vh;
  }
  const AMP_MAX = maxPeak > 1.25 ? Math.min(2.4, maxPeak + 0.25) : 1.35;
  const AMP_MIN = minPeak < -0.05 ? Math.max(-2.2, minPeak - 0.2) : 0.0;
  const WALL_TAU = 6.0;
  const SAMPLES = 220;
  const dTau = (TAU_MAX - TAU_MIN) / SAMPLES;
  const strokeScale = state.layers.thickStroke || state.theme === 'projector' ? 1.55 : 1.0;

  const maxTauStep1 = state.step === 1 ? state.tauSweep : TAU_MAX;
  const effectiveT = state.step >= 3 ? state.t : 0;
  const yNow = sig.conv(effectiveT);

  const isFocusActive = Boolean(state.focusHUDActive);
  const focusTarget = state.focusHUDTarget || 'x';
  const isFixedFocused = isFocusActive && ((!state.isCommuted && focusTarget === 'x') || (state.isCommuted && focusTarget === 'h'));
  const isMovingFocused = isFocusActive && ((!state.isCommuted && focusTarget === 'h') || (state.isCommuted && focusTarget === 'x'));
  const hudPulse = isFocusActive ? (1.0 + 0.22 * Math.sin(performance.now() * 0.007)) : 1.0;

  // 1. Paredes 3D e Grade
  if (state.layers.grid) {
    if (isFocusActive) ctx3d.globalAlpha = 0.35;
    // Parede Traseira
    draw3DPolygon(
      [
        { x: TAU_MIN, y: AMP_MIN, z: T_MAX },
        { x: TAU_MAX, y: AMP_MIN, z: T_MAX },
        { x: TAU_MAX, y: AMP_MAX, z: T_MAX },
        { x: TAU_MIN, y: AMP_MAX, z: T_MAX }
      ],
      pal.wallFill,
      pal.wallBorder,
      1
    );

    // Parede Lateral Direita (Resposta y(t))
    draw3DPolygon(
      [
        { x: WALL_TAU, y: AMP_MIN, z: T_MIN },
        { x: WALL_TAU, y: AMP_MIN, z: T_MAX },
        { x: WALL_TAU, y: AMP_MAX, z: T_MAX },
        { x: WALL_TAU, y: AMP_MAX, z: T_MIN }
      ],
      pal.wallFill,
      pal.wallBorder,
      1
    );

    // Linhas de Grade no Piso
    for (let tauG = -3; tauG <= 6; tauG += 1) {
      const isZero = tauG === 0;
      draw3DLine({ x: tauG, y: 0, z: T_MIN }, { x: tauG, y: 0, z: T_MAX }, isZero ? pal.axis : pal.gridMain, isZero ? 1.6 * strokeScale : 0.75);
      draw3DLine({ x: tauG, y: AMP_MIN, z: T_MAX }, { x: tauG, y: AMP_MAX, z: T_MAX }, pal.gridSub, 0.6);
    }
    for (let tG = -2; tG <= 6; tG += 1) {
      const isZero = tG === 0;
      draw3DLine({ x: TAU_MIN, y: 0, z: tG }, { x: TAU_MAX, y: 0, z: tG }, isZero ? pal.axis : pal.gridMain, isZero ? 1.6 * strokeScale : 0.75);
      draw3DLine({ x: WALL_TAU, y: AMP_MIN, z: tG }, { x: WALL_TAU, y: AMP_MAX, z: tG }, pal.gridSub, 0.6);
    }

    [-2.0, -1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5, 2.0].forEach((ampG) => {
      if (ampG < AMP_MIN || ampG > AMP_MAX) return;
      draw3DLine({ x: TAU_MIN, y: ampG, z: T_MAX }, { x: TAU_MAX, y: ampG, z: T_MAX }, pal.gridSub, 0.65);
      draw3DLine({ x: WALL_TAU, y: ampG, z: T_MIN }, { x: WALL_TAU, y: ampG, z: T_MAX }, pal.gridSub, 0.65);
    });

    draw3DLine({ x: 0, y: Math.min(-0.1, AMP_MIN), z: 0 }, { x: 0, y: AMP_MAX + 0.15, z: 0 }, pal.axis, 1.6 * strokeScale);
    if (isFocusActive) ctx3d.globalAlpha = 1.0;
  }

  // 2. Cascata 3D de Fatias Históricas
  if (state.step >= 3 && state.layers.waterfall) {
    if (isFocusActive) ctx3d.globalAlpha = 0.22;
    const numSlices = 14;
    const sliceStep = (T_MAX - T_MIN) / numSlices;
    const sliceTValues = [];
    for (let s = 0; s <= numSlices; s++) sliceTValues.push(T_MIN + s * sliceStep);

    sliceTValues.sort((tA, tB) => {
      const pA = projectPoint3D(1.0, 0.3, tA);
      const pB = projectPoint3D(1.0, 0.3, tB);
      return (pB ? pB.depth : 0) - (pA ? pA.depth : 0);
    });

    sliceTValues.forEach((tSlice) => {
      if (Math.abs(tSlice - effectiveT) < 0.18) return;
      const isReached = tSlice <= effectiveT + 0.05;

      const xCurve = [];
      const hCurve = [];
      const prodCurve = [];
      for (let i = 0; i <= SAMPLES; i += 2) {
        const tau = TAU_MIN + i * dTau;
        const xv = sig.fnFixed(tau);
        const hv = sig.fnMoving(tSlice - tau);
        xCurve.push({ x: tau, y: xv, z: tSlice });
        hCurve.push({ x: tau, y: hv, z: tSlice });
        prodCurve.push({ x: tau, y: xv * hv, z: tSlice });
      }

      draw3DPolyline(xCurve, pal.x1Fill, 0.9 * strokeScale);
      draw3DPolyline(hCurve, pal.x2Fill, 0.9 * strokeScale, [3, 3]);

      if (state.step === 4 && isReached) {
        draw3DPolygon(buildCurveAreaPolygon(prodCurve), pal.prodSliceFill, null);
        draw3DPolyline(prodCurve, pal.prodSliceStroke, 1.35 * strokeScale);
      }
    });
    if (isFocusActive) ctx3d.globalAlpha = 1.0;
  }

  // 3. Plano Ativo e Coreografia dos Passos 1 a 4
  const activeZ = state.step >= 3 ? effectiveT : 0.0;
  if (state.step >= 3) {
    if (isFocusActive) ctx3d.globalAlpha = 0.35;
    draw3DPolygon(
      [
        { x: TAU_MIN, y: 0, z: activeZ },
        { x: TAU_MAX, y: 0, z: activeZ },
        { x: TAU_MAX, y: AMP_MAX * 0.92, z: activeZ },
        { x: TAU_MIN, y: AMP_MAX * 0.92, z: activeZ }
      ],
      pal.activePlaneFill,
      pal.activePlaneBorder,
      1
    );
    if (isFocusActive) ctx3d.globalAlpha = 1.0;
  }

  // 3.1 Curva Fixa x(τ)
  const fixedTarget = state.isCommuted ? 'h' : 'x';
  const movingTarget = state.isCommuted ? 'x' : 'h';
  const fixedPts = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const tau = TAU_MIN + i * dTau;
    if (tau <= maxTauStep1) fixedPts.push({ x: tau, y: sig.fnFixed(tau), z: activeZ });
  }
  const fixedWidth = (isFixedFocused ? 4.2 * hudPulse : (isFocusActive ? 1.6 : 2.6)) * strokeScale;
  ctx3d.globalAlpha = isFixedFocused ? 1.0 : (isFocusActive ? 0.28 : 1.0);
  draw3DPolygon(buildCurveAreaPolygon(fixedPts), pal.x1Fill, null);
  draw3DPolyline(fixedPts, pal.x1, fixedWidth, [], isFixedFocused, fixedTarget);
  ctx3d.globalAlpha = 1.0;

  // 3.2 Curva Móvel
  if (state.step === 1) {
    const movZ = 1.4;
    const movPts = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const tau = TAU_MIN + i * dTau;
      if (tau <= maxTauStep1) movPts.push({ x: tau, y: sig.fnMoving(tau), z: movZ });
    }
    const movWidth = (isMovingFocused ? 4.2 * hudPulse : (isFocusActive ? 1.6 : 2.6)) * strokeScale;
    ctx3d.globalAlpha = isMovingFocused ? 1.0 : (isFocusActive ? 0.28 : 1.0);
    draw3DPolygon(buildCurveAreaPolygon(movPts), pal.x2Fill, null);
    draw3DPolyline(movPts, pal.x2, movWidth, [], isMovingFocused, movingTarget);
    ctx3d.globalAlpha = 1.0;

    const tauCur = state.tauSweep;
    const vf = sig.fnFixed(tauCur);
    const vm = sig.fnMoving(tauCur);
    draw3DLine({ x: tauCur, y: 0, z: 0 }, { x: tauCur, y: vf, z: 0 }, pal.conv, 2.2 * strokeScale);
    draw3DLine({ x: tauCur, y: 0, z: 0 }, { x: tauCur, y: 0, z: movZ }, pal.conv, 1.5 * strokeScale, [4, 3]);
    draw3DLine({ x: tauCur, y: 0, z: movZ }, { x: tauCur, y: vm, z: movZ }, pal.conv, 2.2 * strokeScale);
  } else if (state.step === 2) {
    const ghostPts = [];
    const rotatedPts = [];
    const cosA = Math.cos(state.flipAngle);
    const sinA = Math.sin(state.flipAngle);

    for (let i = 0; i <= SAMPLES; i++) {
      const tau = TAU_MIN + i * dTau;
      const hv = sig.fnMoving(tau);
      ghostPts.push({ x: tau, y: hv, z: 0.0 });
      rotatedPts.push({ x: tau * cosA, y: hv, z: tau * sinA * 0.75 });
    }
    draw3DPolygon(buildCurveAreaPolygon(ghostPts), pal.x2Fill, null);
    draw3DPolyline(ghostPts, pal.x2, 1.3 * strokeScale, [4, 4]);

    [1.5, 3.0].forEach((rArc) => {
      const arcPts = [];
      for (let k = 0; k <= 36; k++) {
        const ang = (state.flipAngle * k) / 36;
        arcPts.push({ x: rArc * Math.cos(ang), y: 0.05, z: rArc * Math.sin(ang) * 0.75 });
      }
      draw3DPolyline(arcPts, pal.x2, 1.5 * strokeScale, [3, 3]);
    });

    const rotWidth = (isMovingFocused ? 4.2 * hudPulse : (isFocusActive ? 1.6 : 2.8)) * strokeScale;
    ctx3d.globalAlpha = isMovingFocused ? 1.0 : (isFocusActive ? 0.28 : 1.0);
    draw3DPolygon(buildCurveAreaPolygon(rotatedPts), pal.x2Fill, null);
    draw3DPolyline(rotatedPts, pal.x2, rotWidth, [], isMovingFocused, movingTarget);
    ctx3d.globalAlpha = 1.0;
  } else {
    // Passos 3 e 4
    const shiftedPts = [];
    const prodPts = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const tau = TAU_MIN + i * dTau;
      const xv = sig.fnFixed(tau);
      const hv = sig.fnMoving(effectiveT - tau);
      shiftedPts.push({ x: tau, y: hv, z: activeZ });
      prodPts.push({ x: tau, y: xv * hv, z: activeZ });
    }

    const shiftWidth = (isMovingFocused ? 4.2 * hudPulse : (isFocusActive ? 1.6 : 2.5)) * strokeScale;
    ctx3d.globalAlpha = isMovingFocused ? 1.0 : (isFocusActive ? 0.28 : 1.0);
    draw3DPolygon(buildCurveAreaPolygon(shiftedPts), pal.x2Fill, null);
    draw3DPolyline(shiftedPts, pal.x2, shiftWidth, [], isMovingFocused, movingTarget);
    ctx3d.globalAlpha = 1.0;

    const [mA, mB] = sig.supportMoving;
    [effectiveT - mB, effectiveT - mA].forEach((edgeTau) => {
      if (Number.isFinite(edgeTau) && edgeTau >= TAU_MIN && edgeTau <= TAU_MAX) {
        draw3DLine({ x: edgeTau, y: -0.08, z: activeZ }, { x: edgeTau, y: 1.18, z: activeZ }, pal.x2, 1.4 * strokeScale, [4, 3]);
      }
    });

    if (isFocusActive) ctx3d.globalAlpha = 0.22;
    const prodPoly = buildCurveAreaPolygon(prodPts);
    draw3DPolygon(prodPoly, pal.prodFill, null);

    // Hachuras de Riemann
    for (let i = 0; i <= SAMPLES; i += 6) {
      const tau = TAU_MIN + i * dTau;
      const pv = sig.fnFixed(tau) * sig.fnMoving(effectiveT - tau);
      if (Math.abs(pv) > 0.015) {
        draw3DLine({ x: tau, y: 0, z: activeZ }, { x: tau, y: pv, z: activeZ }, pal.prod, 0.85 * strokeScale);
      }
    }
    draw3DPolyline(prodPts, pal.prod, 2.8 * strokeScale, [], true);
    if (isFocusActive) ctx3d.globalAlpha = 1.0;
  }

  // 4. Curva Resultante y(t) na parede lateral
  if (state.step === 4) {
    if (isFocusActive) ctx3d.globalAlpha = 0.22;
    const fullConvPts = [];
    for (let i = 0; i <= 100; i++) {
      const tc = T_MIN + (T_MAX - T_MIN) * (i / 100);
      fullConvPts.push({ x: WALL_TAU, y: sig.conv(tc), z: tc });
    }
    draw3DPolyline(fullConvPts, pal.gridMain, 1.2 * strokeScale, [3, 3]);

    const convPts = [];
    for (let i = 0; i <= 100; i++) {
      const tc = T_MIN + (effectiveT - T_MIN) * (i / 100);
      convPts.push({ x: WALL_TAU, y: sig.conv(tc), z: tc });
    }
    draw3DPolygon(buildCurveAreaPolygon(convPts), pal.convFill, null);
    draw3DPolyline(convPts, pal.conv, 3.2 * strokeScale, [], true);

    draw3DLine({ x: WALL_TAU, y: 0, z: effectiveT }, { x: WALL_TAU, y: yNow, z: effectiveT }, pal.conv, 2.0 * strokeScale);

    const pMarker = projectPoint3D(WALL_TAU, yNow, effectiveT);
    if (pMarker) {
      const pulseRadius = 7 + 2.5 * Math.sin(performance.now() * 0.008);
      ctx3d.beginPath();
      ctx3d.arc(pMarker.x, pMarker.y, pulseRadius, 0, Math.PI * 2);
      ctx3d.strokeStyle = pal.conv;
      ctx3d.lineWidth = 1.8;
      ctx3d.stroke();

      ctx3d.beginPath();
      ctx3d.arc(pMarker.x, pMarker.y, 4.8, 0, Math.PI * 2);
      ctx3d.fillStyle = pal.conv;
      ctx3d.fill();
    }
    if (isFocusActive) ctx3d.globalAlpha = 1.0;
  }

  ctx3d.restore();
  updateFloatingLabels(sig, effectiveT, yNow, WALL_TAU);
}

// Renderizador da Cena 3D de Fourier com Parede de Espectro
export function renderFourierScene3D() {
  if (!ctx3d || !stageCanvas) return;
  const calc = state.fourierCalculated;
  if (!calc) return;
  const pal = getThemePalette();

  const w = canvasContainer.clientWidth || 384;
  const h = canvasContainer.clientHeight || 260;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (stageCanvas.width !== Math.floor(w * dpr) || stageCanvas.height !== Math.floor(h * dpr)) {
    stageCanvas.width = Math.floor(w * dpr);
    stageCanvas.height = Math.floor(h * dpr);
  }

  updateCameraFromOrbit();

  ctx3d.save();
  ctx3d.scale(dpr, dpr);
  ctx3d.fillStyle = pal.bgCss;
  ctx3d.fillRect(0, 0, w, h);

  const T0 = calc.T0;
  const tNow = state.t;
  const strokeScale = state.layers.thickStroke || state.theme === 'projector' ? 1.55 : 1.0;
  const cycles = state.waterfallCycles || 2;

  const T_MIN = -T0 * (cycles * 0.5);
  const T_MAX = T0 * (cycles * 0.5);
  const AMP_MAX = 1.35;
  const AMP_MIN = -1.25;
  const N_HARM = calc.harmonics.length;
  const Z_MAX = Math.max(4.0, N_HARM * 0.45 + 0.5);

  const isFocusActive = Boolean(state.focusHUDActive);
  const hudPulse = isFocusActive ? (1.0 + 0.22 * Math.sin(performance.now() * 0.007)) : 1.0;

  // 1. Parede Traseira e Piso da Caixa 3D
  if (state.layers.grid) {
    if (isFocusActive) ctx3d.globalAlpha = 0.35;
    draw3DPolygon(
      [
        { x: T_MIN, y: AMP_MIN, z: Z_MAX },
        { x: T_MAX, y: AMP_MIN, z: Z_MAX },
        { x: T_MAX, y: AMP_MAX, z: Z_MAX },
        { x: T_MIN, y: AMP_MAX, z: Z_MAX }
      ],
      pal.wallFill,
      pal.wallBorder,
      1
    );

    // Parede Lateral Direita (Espectro Discreto)
    if (state.layers.spectrumWall) {
      draw3DPolygon(
        [
          { x: T_MAX, y: 0, z: 0 },
          { x: T_MAX, y: 0, z: Z_MAX },
          { x: T_MAX, y: AMP_MAX, z: Z_MAX },
          { x: T_MAX, y: AMP_MAX, z: 0 }
        ],
        pal.wallFill,
        pal.wallBorder,
        1
      );
    }

    for (let tv = Math.ceil(T_MIN); tv <= Math.floor(T_MAX); tv += 1) {
      draw3DLine({ x: tv, y: 0, z: 0 }, { x: tv, y: 0, z: Z_MAX }, tv === 0 ? pal.axis : pal.gridMain, tv === 0 ? 1.6 * strokeScale : 0.75);
    }
    draw3DLine({ x: 0, y: AMP_MIN, z: 0 }, { x: 0, y: AMP_MAX + 0.15, z: 0 }, pal.axis, 1.5 * strokeScale);
    if (isFocusActive) ctx3d.globalAlpha = 1.0;
  }

  // 2. Sinal Original Periódico f(t) no plano frontal z = 0
  const origPts = [];
  const steps = 180;
  for (let i = 0; i <= steps; i++) {
    const tv = T_MIN + (i / steps) * (T_MAX - T_MIN);
    origPts.push({ x: tv, y: calc.fPeriodic(tv), z: 0 });
  }
  const origWidth = (isFocusActive ? 4.2 * hudPulse : 2.5) * strokeScale;
  draw3DPolyline(origPts, pal.x1, origWidth, [], isFocusActive, 'fourier');

  if (isFocusActive) ctx3d.globalAlpha = 0.28;

  // 3. Linha e Plano do Nível Médio DC a0 em z = 0
  draw3DLine({ x: T_MIN, y: calc.a0, z: 0 }, { x: T_MAX, y: calc.a0, z: 0 }, pal.prod, 1.8 * strokeScale, [4, 3]);

  // 4. Harmônicas Individuais ao Longo do Eixo de Profundidade z = n
  calc.harmonics.forEach((hItem, idx) => {
    const zPos = (idx + 1) * 0.45;
    const isHighlighted = state.highlightedHarmonic === hItem.n;
    const isDimmed = state.highlightedHarmonic !== null && !isHighlighted;
    const harmColor = isHighlighted ? '#f59e0b' : (isDimmed ? 'rgba(192, 132, 252, 0.25)' : pal.prod);
    const harmWidth = (isHighlighted ? 3.0 : 1.4) * strokeScale;

    const harmPts = [];
    for (let i = 0; i <= steps; i++) {
      const tv = T_MIN + (i / steps) * (T_MAX - T_MIN);
      const yVal = hItem.an * Math.cos(hItem.nw0 * tv) + hItem.bn * Math.sin(hItem.nw0 * tv);
      harmPts.push({ x: tv, y: yVal, z: zPos });
    }
    draw3DPolyline(harmPts, harmColor, harmWidth);

    // 5. Hastes do Espectro Discreto na Parede Lateral x = T_MAX
    if (state.layers.spectrumWall) {
      const stemHeight = state.fourierForm === 'exp' ? hItem.dnMagnitude : hItem.cn;
      const stemTop = { x: T_MAX, y: stemHeight, z: zPos };
      const stemColor = isHighlighted ? '#f59e0b' : pal.conv;
      draw3DLine({ x: T_MAX, y: 0, z: zPos }, stemTop, stemColor, (isHighlighted ? 3.2 : 2.2) * strokeScale);

      const dotProj = projectPoint3D(stemTop.x, stemTop.y, stemTop.z);
      if (dotProj) {
        ctx3d.beginPath();
        ctx3d.arc(dotProj.x, dotProj.y, (isHighlighted ? 5.5 : 3.8) * strokeScale, 0, Math.PI * 2);
        ctx3d.fillStyle = stemColor;
        ctx3d.fill();
        ctx3d.strokeStyle = '#ffffff';
        ctx3d.lineWidth = 1.2;
        ctx3d.stroke();
      }
    }
  });

  // Haste DC a0 na parede lateral
  if (state.layers.spectrumWall) {
    const dcHeight = Math.abs(calc.a0);
    draw3DLine({ x: T_MAX, y: 0, z: 0 }, { x: T_MAX, y: dcHeight, z: 0 }, pal.conv, 2.4 * strokeScale);
    const dcDot = projectPoint3D(T_MAX, dcHeight, 0);
    if (dcDot) {
      ctx3d.beginPath();
      ctx3d.arc(dcDot.x, dcDot.y, 4.0 * strokeScale, 0, Math.PI * 2);
      ctx3d.fillStyle = pal.conv;
      ctx3d.fill();
    }
  }

  // 6. Curva Reconstruída SN(t) no plano z = 0.1
  const recPts = [];
  for (let i = 0; i <= steps; i++) {
    const tv = T_MIN + (i / steps) * (T_MAX - T_MIN);
    recPts.push({ x: tv, y: calc.reconstruct(tv), z: 0.1 });
  }
  const reconColor = state.theme === 'projector' ? '#be123c' : '#10b981';
  draw3DPolyline(recPts, reconColor, 2.6 * strokeScale);

  // 7. Cursor Laser de Varredura Temporal t
  const recNow = calc.reconstruct(tNow);
  draw3DLine({ x: tNow, y: 0, z: 0.1 }, { x: tNow, y: recNow, z: 0.1 }, pal.conv, 2.0 * strokeScale);
  const ptRec = projectPoint3D(tNow, recNow, 0.1);
  if (ptRec) {
    ctx3d.fillStyle = pal.conv;
    ctx3d.beginPath();
    ctx3d.arc(ptRec.x, ptRec.y, 5.0 * strokeScale, 0, Math.PI * 2);
    ctx3d.fill();
    ctx3d.strokeStyle = '#ffffff';
    ctx3d.lineWidth = 1.5;
    ctx3d.stroke();
  }

  if (isFocusActive) ctx3d.globalAlpha = 1.0;

  ctx3d.restore();
  updateFloatingLabelsFourier(calc, tNow, Z_MAX);
}

function setLabelMath(id, latex) {
  const el = document.getElementById(id);
  if (!el) return;
  const isEditable = id === 'lbl-x1' || (id === 'lbl-x2' && state.activeModule === 'convolution');
  const cacheKey = `${latex}|${isEditable}|${state.lang}`;
  if (el.dataset.lastLatex === cacheKey) return;
  el.dataset.lastLatex = cacheKey;

  if (isEditable) {
    el.innerHTML = `<span class="lbl-math-inner"></span><span class="lbl-edit-badge" aria-hidden="true"><svg class="w-2 h-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg></span>`;
    const mathSpan = el.querySelector('.lbl-math-inner');
    renderMath(mathSpan, latex, false);
    const isEn = state.lang === 'en';
    el.title = isEn ? 'Click to edit signal formula' : 'Clique para editar a fórmula deste sinal';
    el.classList.add('label-3d-editable');
  } else {
    el.classList.remove('label-3d-editable');
    el.removeAttribute('title');
    renderMath(el, latex, false);
  }
}

function hideAllFloatingLabels() {
  ['lbl-tau', 'lbl-t', 'lbl-z', 'lbl-x1', 'lbl-x2', 'lbl-conv', 'lbl-b1', 'lbl-b2'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.opacity = '0';
  });
}

function updateFloatingLabels(sig, effectiveT, yNow, WALL_X) {
  const livePill = document.getElementById('stage-live-pill');
  if (livePill) {
    const isEn = state.lang === 'en';
    if (state.step === 1) renderMath(livePill, `\\text{${isEn ? 'Step 1' : 'Passo 1'}} \\; (t \\to \\tau): \\; \\tau = ${state.tauSweep.toFixed(2)}`, false);
    else if (state.step === 2) renderMath(livePill, `\\text{${isEn ? 'Step 2' : 'Passo 2'}} \\; (\\theta = ${Math.round((state.flipAngle / Math.PI) * 180)}^\\circ)`, false);
    else if (state.step === 3) renderMath(livePill, `\\text{${isEn ? 'Step 3' : 'Passo 3'}} \\; (t = ${effectiveT.toFixed(2)})`, false);
    else renderMath(livePill, `y(${effectiveT.toFixed(2)}) = ${yNow.toFixed(4)}`, false);
  }

  if (!state.layers.labels) {
    hideAllFloatingLabels();
    return;
  }

  setLabelMath('lbl-tau', '\\tau');
  setLabelMath('lbl-t', 't');
  setLabelMath('lbl-z', '\\text{Amp}');
  setLabelMath('lbl-x1', `${sig.fixedSym}(\\tau)`);
  setLabelMath(
    'lbl-x2',
    state.step === 1
      ? `${sig.movingSym}(\\tau)`
      : state.step === 2
      ? `${sig.movingSym}(-\\tau)`
      : `${sig.movingSym}(t-\\tau)`
  );
  setLabelMath('lbl-conv', 'y(t)');

  const placeLabel = (id, x, y, z, visible = true) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!visible) { el.style.opacity = '0'; return; }
    const pt = projectPoint3D(x, y, z);
    const w = canvasContainer.clientWidth || 384;
    const h = canvasContainer.clientHeight || 260;
    if (!pt || pt.x < 15 || pt.x > w - 15 || pt.y < 15 || pt.y > h - 15) {
      el.style.opacity = '0';
      return;
    }
    el.style.opacity = '1';
    el.style.left = `${pt.x}px`;
    el.style.top = `${pt.y}px`;
  };

  const activeZ = state.step >= 3 ? effectiveT : 0.0;
  placeLabel('lbl-tau', 1.2, -0.22, -2.6, true);
  placeLabel('lbl-t', WALL_X + 0.85, -0.18, 2.2, true);
  placeLabel('lbl-z', -3.5, 1.48, 6.0, true);
  placeLabel('lbl-x1', 0.4, Math.max(0.7, sig.fnFixed(0.3)) + 0.25, activeZ, true);
  placeLabel('lbl-x2', effectiveT - 1.1, 1.18, state.step === 1 ? 1.4 : activeZ, true);
  placeLabel('lbl-conv', WALL_X, yNow + 0.28, effectiveT, state.step === 4);

  const [mA, mB] = sig.supportMoving;
  const showB1 = state.step >= 3 && Number.isFinite(mB);
  const showB2 = state.step >= 3 && Number.isFinite(mA);
  if (showB1) {
    const b1Val = effectiveT - mB;
    const elB1 = document.getElementById('lbl-b1');
    if (elB1) elB1.textContent = mB === 0 ? `t=${b1Val.toFixed(1)}` : `${-mB}+t=${b1Val.toFixed(1)}`;
    placeLabel('lbl-b1', b1Val, -0.2, activeZ, true);
  } else {
    placeLabel('lbl-b1', 0, 0, 0, false);
  }
  if (showB2) {
    const b2Val = effectiveT - mA;
    const elB2 = document.getElementById('lbl-b2');
    if (elB2) elB2.textContent = mA === 0 ? `t=${b2Val.toFixed(1)}` : `${-mA}+t=${b2Val.toFixed(1)}`;
    placeLabel('lbl-b2', b2Val, -0.2, activeZ, true);
  } else {
    placeLabel('lbl-b2', 0, 0, 0, false);
  }
}

function updateFloatingLabelsFourier(calc, tNow, Z_MAX) {
  const livePill = document.getElementById('stage-live-pill');
  if (livePill) {
    renderMath(livePill, `S_{${calc.harmonics.length}}(${tNow.toFixed(2)}) = ${calc.reconstruct(tNow).toFixed(4)} \\quad (\\eta = ${calc.efficiency.toFixed(1)}\\%)`, false);
  }

  if (!state.layers.labels) {
    hideAllFloatingLabels();
    return;
  }

  setLabelMath('lbl-tau', 't');
  setLabelMath('lbl-t', 'n\\omega_0');
  setLabelMath('lbl-z', '\\text{Amp}');
  setLabelMath('lbl-x1', 'f(t)');
  setLabelMath('lbl-x2', 'S_N(t)');
  setLabelMath('lbl-conv', state.fourierForm === 'exp' ? '|D_n|' : '|C_n|');

  const placeLabel = (id, x, y, z, visible = true) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!visible) { el.style.opacity = '0'; return; }
    const pt = projectPoint3D(x, y, z);
    const w = canvasContainer.clientWidth || 384;
    const h = canvasContainer.clientHeight || 260;
    if (!pt || pt.x < 15 || pt.x > w - 15 || pt.y < 15 || pt.y > h - 15) {
      el.style.opacity = '0';
      return;
    }
    el.style.opacity = '1';
    el.style.left = `${pt.x}px`;
    el.style.top = `${pt.y}px`;
  };

  const cycles = state.waterfallCycles || 2;
  const T_MAX = calc.T0 * (cycles * 0.5);
  placeLabel('lbl-tau', 1.8, -0.22, 0, true);
  placeLabel('lbl-t', 0.0, -0.2, Z_MAX * 0.7, true);
  placeLabel('lbl-z', -2.5, 1.45, 0, true);
  placeLabel('lbl-x1', 0.5, calc.fn(0.5) + 0.25, 0, true);
  placeLabel('lbl-x2', tNow, calc.reconstruct(tNow) + 0.25, 0.1, true);
  placeLabel('lbl-conv', T_MAX, 1.15, Z_MAX * 0.4, Boolean(state.layers.spectrumWall));
  placeLabel('lbl-b1', 0, 0, 0, false);
  placeLabel('lbl-b2', 0, 0, 0, false);
}

export function init3DStage() {
  canvasContainer = document.getElementById('canvas-container');
  if (!canvasContainer) return;
  stageCanvas = document.createElement('canvas');
  ctx3d = stageCanvas.getContext('2d');
  canvasContainer.innerHTML = '';
  canvasContainer.appendChild(stageCanvas);

  if (window.THREE) {
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 150);
  }

  initPointerOrbitControls();
  window.addEventListener('resize', handleResize);
  handleResize();
}

function handleResize() {
  if (!canvasContainer || !stageCanvas) return;
  const w = canvasContainer.clientWidth || 384;
  const h = canvasContainer.clientHeight || 250;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  stageCanvas.width = Math.floor(w * dpr);
  stageCanvas.height = Math.floor(h * dpr);
  updateScene3D();
}

function initPointerOrbitControls() {
  let isDragging = false;
  let downX = 0;
  let downY = 0;
  let prevX = 0;
  let prevY = 0;
  let pinchDist = 0;

  // Clique direto nos rótulos 3D flutuantes de sinal (x(τ), h(t-τ), f(t))
  const lblX1 = document.getElementById('lbl-x1');
  const lblX2 = document.getElementById('lbl-x2');
  if (lblX1) {
    lblX1.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = state.activeModule === 'fourier' ? 'fourier' : (state.isCommuted ? 'h' : 'x');
      window.dispatchEvent(new CustomEvent('open-signal-hud', { detail: { target } }));
    });
  }
  if (lblX2) {
    lblX2.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.activeModule === 'fourier') {
        window.dispatchEvent(new CustomEvent('open-signal-hud', { detail: { target: 'fourier' } }));
      } else {
        const target = state.isCommuted ? 'x' : 'h';
        window.dispatchEvent(new CustomEvent('open-signal-hud', { detail: { target } }));
      }
    });
  }

  canvasContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    camOrbit.autoOrient = false;
    downX = e.clientX;
    downY = e.clientY;
    prevX = e.clientX;
    prevY = e.clientY;
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) {
      if (stageCanvas && e.target === stageCanvas) {
        const rect = stageCanvas.getBoundingClientRect();
        const hit = findHitSignalCurve(e.clientX - rect.left, e.clientY - rect.top);
        stageCanvas.style.cursor = hit ? 'pointer' : 'grab';
      }
      return;
    }
    const dx = e.clientX - prevX;
    const dy = e.clientY - prevY;
    prevX = e.clientX;
    prevY = e.clientY;
    camOrbit.theta -= dx * 0.007;
    camOrbit.phi = Math.max(0.04, Math.min(1.52, camOrbit.phi - dy * 0.007));
  });

  window.addEventListener('mouseup', (e) => {
    if (isDragging) {
      const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (moved < 6 && stageCanvas && e.target === stageCanvas) {
        const rect = stageCanvas.getBoundingClientRect();
        const hit = findHitSignalCurve(e.clientX - rect.left, e.clientY - rect.top);
        if (hit) {
          window.dispatchEvent(new CustomEvent('open-signal-hud', { detail: { target: hit } }));
        }
      }
    }
    isDragging = false;
  });

  canvasContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    camOrbit.autoOrient = false;
    camOrbit.radius = Math.max(4.5, Math.min(22.0, camOrbit.radius + e.deltaY * 0.006));
  }, { passive: false });

  canvasContainer.addEventListener('touchstart', (e) => {
    camOrbit.autoOrient = false;
    if (e.touches.length === 1) {
      isDragging = true;
      downX = e.touches[0].clientX;
      downY = e.touches[0].clientY;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      pinchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
  }, { passive: true });

  canvasContainer.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - prevX;
      const dy = e.touches[0].clientY - prevY;
      prevX = e.touches[0].clientX;
      prevY = e.touches[0].clientY;
      camOrbit.theta -= dx * 0.008;
      camOrbit.phi = Math.max(0.04, Math.min(1.52, camOrbit.phi - dy * 0.008));
    } else if (e.touches.length === 2 && pinchDist > 0) {
      const newDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      const delta = pinchDist - newDist;
      camOrbit.radius = Math.max(4.5, Math.min(22.0, camOrbit.radius + delta * 0.03));
      pinchDist = newDist;
    }
  }, { passive: true });

  canvasContainer.addEventListener('touchend', (e) => {
    if (isDragging && e.changedTouches && e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      const moved = Math.hypot(t.clientX - downX, t.clientY - downY);
      if (moved < 8 && stageCanvas) {
        const rect = stageCanvas.getBoundingClientRect();
        const hit = findHitSignalCurve(t.clientX - rect.left, t.clientY - rect.top, 22);
        if (hit) {
          window.dispatchEvent(new CustomEvent('open-signal-hud', { detail: { target: hit } }));
        }
      }
    }
    isDragging = false;
    pinchDist = 0;
  });
}
