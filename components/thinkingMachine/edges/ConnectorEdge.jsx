"use client";

import { BaseEdge } from "reactflow";
import { getTypeMeta } from "@/lib/thinkingMachine/nodeMeta";

const DEFAULT_LINE_COLOR = "#AAF17B";
const DEFAULT_LINE_WIDTH = 1.65;
const DEFAULT_CLEARANCE = 20;
const OUTER_RADIUS = 7;
const MIN_CLEARANCE = 8;
const DEFAULT_LANE_GAP = 80;
const DEFAULT_CURVE_TENSION = 0.34;

function toFiniteNumber(value, fallback = 0) {
  return Number.isFinite(value) ? Number(value) : fallback;
}

function round(n) {
  return Number(n.toFixed(2));
}

function isSamePoint(a, b) {
  return a.x === b.x && a.y === b.y;
}

function compressPoints(points) {
  const compact = [];
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i];
    if (!compact.length || !isSamePoint(compact[compact.length - 1], p)) {
      compact.push(p);
    }
  }
  const out = [];
  for (let i = 0; i < compact.length; i += 1) {
    const prev = compact[i - 1];
    const curr = compact[i];
    const next = compact[i + 1];
    if (!prev || !next) {
      out.push(curr);
      continue;
    }
    const sameX = prev.x === curr.x && curr.x === next.x;
    const sameY = prev.y === curr.y && curr.y === next.y;
    if (!(sameX || sameY)) out.push(curr);
  }
  return out;
}

function manhattanLength(points) {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
  }
  return total;
}

function countBends(points) {
  return Math.max(0, points.length - 2);
}

function scorePath(points, { isForward, startX, endX, sourceY, targetY }) {
  const pts = compressPoints(points);
  if (pts.length < 2) return Number.POSITIVE_INFINITY;

  const length = manhattanLength(pts);
  const bends = countBends(pts);
  const bandTop = Math.min(sourceY, targetY);
  const bandBottom = Math.max(sourceY, targetY);
  let horizontalBacktrackPenalty = 0;
  let sideAttachPenalty = 0;
  let directionFlipPenalty = 0;
  let outsideBandPenalty = 0;
  let previousHorizontalSign = 0;

  for (let i = 1; i < pts.length; i += 1) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    if (dy !== 0 || dx === 0) continue;

    const sign = Math.sign(dx);
    if (isForward && sign < 0) {
      horizontalBacktrackPenalty += Math.abs(dx) * 10 + 500;
    }
    if (previousHorizontalSign !== 0 && sign !== previousHorizontalSign) {
      directionFlipPenalty += 120;
    }
    previousHorizontalSign = sign;

    const y = curr.y;
    if (y < bandTop) {
      outsideBandPenalty += (bandTop - y) * 6 + 80;
    } else if (y > bandBottom) {
      outsideBandPenalty += (y - bandBottom) * 6 + 80;
    }
  }

  const firstDx = pts[1].x - pts[0].x;
  if (firstDx < 0) {
    sideAttachPenalty += Math.abs(firstDx) * 12 + 800;
  }

  const lastDx = pts[pts.length - 1].x - pts[pts.length - 2].x;
  if (lastDx < 0) {
    sideAttachPenalty += Math.abs(lastDx) * 12 + 800;
  }

  const yValues = pts.map((p) => p.y);
  const ySpan = Math.max(...yValues) - Math.min(...yValues);
  const baselineYSpan = Math.abs(targetY - sourceY);
  const detourPenalty = Math.max(0, ySpan - baselineYSpan) * 2;

  const endGapPenalty = Math.abs(pts[0].x - startX) + Math.abs(pts[pts.length - 1].x - endX);

  return (
    length +
    bends * 72 +
    detourPenalty +
    horizontalBacktrackPenalty +
    sideAttachPenalty +
    directionFlipPenalty +
    outsideBandPenalty +
    endGapPenalty
  );
}

function buildOrganicBezierPath(points, tension = DEFAULT_CURVE_TENSION) {
  const pts = compressPoints(points);
  if (!pts.length) return "";
  if (pts.length === 1) return `M ${round(pts[0].x)} ${round(pts[0].y)}`;

  const start = pts[0];
  const end = pts[pts.length - 1];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const spanX = Math.abs(dx);
  const controlDistance = Math.min(Math.max(spanX * (0.34 + tension * 0.12), 56), 168);
  const verticalEase = Math.min(Math.abs(dy) * 0.16, 36);
  const cp1x = start.x + controlDistance;
  const cp2x = end.x - controlDistance;
  const cp1y = start.y + (dy >= 0 ? verticalEase : -verticalEase) * 0.25;
  const cp2y = end.y - (dy >= 0 ? verticalEase : -verticalEase) * 0.25;

  return `M ${round(start.x)} ${round(start.y)} C ${round(cp1x)} ${round(cp1y)} ${round(cp2x)} ${round(cp2y)} ${round(end.x)} ${round(end.y)}`;
}

function buildOrthogonalPoints(sourceX, sourceY, targetX, targetY, clearance, laneGap) {
  const pathStartX = sourceX + OUTER_RADIUS;
  const pathEndX = targetX - OUTER_RADIUS;
  const effectiveClearance = Math.max(MIN_CLEARANCE, clearance);
  const startStubX = pathStartX + effectiveClearance;
  const endStubX = pathEndX - effectiveClearance;
  const isForward = pathEndX >= pathStartX;
  const laneTopY = Math.min(sourceY, targetY) - laneGap;
  const laneBottomY = Math.max(sourceY, targetY) + laneGap;
  const midBandY = (sourceY + targetY) / 2;
  const verticalGap = Math.abs(targetY - sourceY);
  const candidates = [];

  const startPoint = { x: pathStartX, y: sourceY };
  const endPoint = { x: pathEndX, y: targetY };

  if (isForward) {
    const midX = (pathStartX + pathEndX) / 2;
    candidates.push([
      startPoint,
      { x: midX, y: sourceY },
      { x: midX, y: targetY },
      endPoint,
    ]);
  }

  if (isForward && endStubX >= startStubX) {
    candidates.push([
      startPoint,
      { x: startStubX, y: sourceY },
      { x: startStubX, y: targetY },
      { x: endStubX, y: targetY },
      endPoint,
    ]);
  }

  // Prefer the corridor between cards first when vertical separation exists.
  if (verticalGap >= 8) {
    candidates.push([
      startPoint,
      { x: startStubX, y: sourceY },
      { x: startStubX, y: midBandY },
      { x: endStubX, y: midBandY },
      { x: endStubX, y: targetY },
      endPoint,
    ]);
  }

  candidates.push([
    startPoint,
    { x: startStubX, y: sourceY },
    { x: startStubX, y: laneTopY },
    { x: endStubX, y: laneTopY },
    { x: endStubX, y: targetY },
    endPoint,
  ]);

  candidates.push([
    startPoint,
    { x: startStubX, y: sourceY },
    { x: startStubX, y: laneBottomY },
    { x: endStubX, y: laneBottomY },
    { x: endStubX, y: targetY },
    endPoint,
  ]);

  let best = candidates[0];
  let bestScore = scorePath(best, {
    isForward,
    startX: pathStartX,
    endX: pathEndX,
    sourceY,
    targetY,
  });

  for (let i = 1; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const score = scorePath(candidate, {
      isForward,
      startX: pathStartX,
      endX: pathEndX,
      sourceY,
      targetY,
    });
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function getLabelAnchor(points, sourceX, sourceY, targetX, targetY) {
  const fallback = {
    x: (sourceX + targetX) / 2,
    y: (sourceY + targetY) / 2 - 18,
  };
  const pts = Array.isArray(points) ? points : [];
  if (pts.length < 2) return fallback;

  let longestHorizontal = null;
  for (let i = 1; i < pts.length; i += 1) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const dy = curr.y - prev.y;
    const dx = curr.x - prev.x;
    if (dy !== 0) continue;
    const width = Math.abs(dx);
    if (!longestHorizontal || width > longestHorizontal.width) {
      longestHorizontal = {
        width,
        x: (prev.x + curr.x) / 2,
        y: curr.y,
      };
    }
  }

  if (longestHorizontal) {
    return {
      x: longestHorizontal.x,
      y: longestHorizontal.y - 18,
    };
  }

  return fallback;
}

export default function ConnectorEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}) {
  const sourceOffsetY = toFiniteNumber(data?.sourceOffsetY, 0);
  const targetOffsetY = toFiniteNumber(data?.targetOffsetY, 0);
  const clearanceX = toFiniteNumber(data?.clearanceX, DEFAULT_CLEARANCE);
  const laneGap = toFiniteNumber(data?.laneGap, DEFAULT_LANE_GAP);
  // 선 색상은 항상 디자인 토큰(DEFAULT_LINE_COLOR)을 사용해
  // 코드 수정 시 기존 엣지도 즉시 색상이 갱신되도록 한다.
  const lineColor = DEFAULT_LINE_COLOR;
  const lineWidth = toFiniteNumber(data?.lineWidth, DEFAULT_LINE_WIDTH);
  const curveTension = toFiniteNumber(data?.curveTension, DEFAULT_CURVE_TENSION);

  const sy = sourceY + sourceOffsetY;
  const ty = targetY + targetOffsetY;
  const points = buildOrthogonalPoints(sourceX, sy, targetX, ty, clearanceX, laneGap);
  const path = buildOrganicBezierPath(points, curveTension);
  const startPoint = points[0] ?? { x: sourceX, y: sy };
  const endPoint = points[points.length - 1] ?? { x: targetX, y: ty };
  const label = typeof data?.label === "string" ? data.label.replace(/_/g, " ") : "";
  const labelAnchor = getLabelAnchor(points, sourceX, sy, targetX, ty);
  const labelX = labelAnchor.x;
  const labelY = labelAnchor.y;
  const sourceTypeMeta = getTypeMeta(data?.sourceCategory);
  const isSelected = Boolean(selected);
  const underlayStroke = isSelected ? "rgba(255, 255, 255, 0.24)" : "rgba(255, 255, 255, 0.12)";
  const primaryStroke = isSelected ? "rgba(255, 255, 255, 0.92)" : lineColor;
  const primaryWidth = isSelected ? lineWidth + 0.2 : lineWidth;
  const endpointRadius = isSelected ? 2.1 : 1.8;

  return (
    <g className={`tm-connector-edge ${isSelected ? "is-selected" : ""}`}>
      <BaseEdge
        path={path}
        style={{
          stroke: underlayStroke,
          strokeWidth: lineWidth + 2.2,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          opacity: isSelected ? 0.95 : 0.82,
          filter: "blur(0.35px)",
        }}
      />
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: primaryStroke,
          strokeWidth: primaryWidth,
          strokeLinecap: "round",
          strokeLinejoin: "round",
          opacity: isSelected ? 1 : 0.92,
          filter: isSelected
            ? "drop-shadow(0 1px 1px rgba(15, 23, 42, 0.10))"
            : "drop-shadow(0 1px 1px rgba(15, 23, 42, 0.08))",
        }}
      />
      <circle
        cx={startPoint.x}
        cy={startPoint.y}
        r={endpointRadius}
        fill={primaryStroke}
        stroke={isSelected ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.68)"}
        strokeWidth="0.85"
      />
      <circle
        cx={endPoint.x}
        cy={endPoint.y}
        r={endpointRadius}
        fill={primaryStroke}
        stroke={isSelected ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.68)"}
        strokeWidth="0.85"
      />
      {label ? (
        <foreignObject
          width={112}
          height={24}
          x={labelX - 56}
          y={labelY - 12}
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="rounded-full border border-white/40 px-2 py-1 text-[9px] font-semibold capitalize tracking-[-0.01em] text-slate-700 shadow-sm backdrop-blur-sm"
              style={{
                backgroundColor: `${sourceTypeMeta.color}${isSelected ? "D9" : "B3"}`,
                opacity: isSelected ? 0.98 : 0.92,
              }}
            >
              {label}
            </span>
          </div>
        </foreignObject>
      ) : null}
    </g>
  );
}
