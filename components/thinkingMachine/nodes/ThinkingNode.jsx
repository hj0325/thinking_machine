"use client";

import { Handle, Position } from "reactflow";
import { getTypeMeta, normalizeNodeCategory, getSourceTypeMeta } from "@/lib/thinkingMachine/nodeMeta";

const HANDLE_STYLE = {
  top: 38,
  width: 1,
  height: 1,
  border: "none",
  background: "transparent",
  opacity: 0,
  pointerEvents: "none",
};

function getPortColor(category) {
  return getTypeMeta(normalizeNodeCategory(category)).color;
}

const FIVE_WH_LABELS = {
  Problem: "Why",
  Goal: "Why",
  Insight: "Why",
  Evidence: "When",
  Assumption: "Why",
  Constraint: "Where",
  Idea: "What",
  Option: "How",
  Risk: "What",
  Conflict: "Why",
  Decision: "How",
  OpenQuestion: "Why",
};

const LEGACY_5WH = new Set(["Who", "What", "When", "Where", "Why", "How"]);

function getFiveWhLabelFromData(data = {}) {
  const legacy = data.legacyCategory;
  if (typeof legacy === "string" && LEGACY_5WH.has(legacy)) return legacy;
  const normalized = normalizeNodeCategory(data.category);
  return FIVE_WH_LABELS[normalized] || "How";
}

function MetaChip({ label, className }) {
  if (!label) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold leading-none tracking-[-0.01em] ${className}`}
    >
      {label}
    </span>
  );
}

function AnchorPort({ side, color }) {
  const sideClass = side === "left" ? "left-[-5px]" : "right-[-5px]";

  return (
    <span
      className={`pointer-events-none absolute ${sideClass} top-[31px] z-[40] flex h-[14px] w-[14px] items-center justify-center rounded-full border border-white/55 bg-white/82 shadow-[0_4px_12px_rgba(15,23,42,0.08)] backdrop-blur-sm`}
      aria-hidden
    >
      <span
        className="absolute h-[8px] w-[8px] rounded-full opacity-30"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative h-[3px] w-[3px] rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 0 1px ${color}22` }}
      />
    </span>
  );
}

export default function ThinkingNode({ data = {} }) {
  const portColor = getPortColor(data.category);
  const hasLeftPort = Boolean(data.hasLeftPort);
  const hasRightPort = Boolean(data.hasRightPort);

  const sourceMeta = getSourceTypeMeta(data.sourceType);
  const fiveWhLabel = getFiveWhLabelFromData(data);
  const phaseLabel = data.phase === "Solution" ? "Solution" : "Problem";

  return (
    <div className="relative h-full w-full">
      <div className="flex h-full w-full flex-col">
        <div className="relative w-full rounded-[18px] border border-white/60 bg-white/30 px-3 pt-4 pb-4 shadow-[0_14px_32px_rgba(15,23,42,0.14)] backdrop-blur-[18px]">
          <div className="mb-3 text-center text-[11px] font-semibold" style={{ color: "#194312" }}>
            {data.category}
          </div>
          <div className="rounded-[16px] bg-white/96 px-3 py-3.5 shadow-[0_10px_24px_rgba(15,23,42,0.10)]">
            <div
              className="font-heading line-clamp-2 font-semibold tracking-[-0.02em]"
              style={{ color: "#759270", fontSize: 12, lineHeight: 1.2 }}
            >
              {data.title || "Untitled node"}
            </div>
            <div
              className="mt-1 font-node-body line-clamp-3 text-[#667085]"
              style={{ fontSize: 11, lineHeight: 1.34 }}
            >
              {data.content}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <MetaChip label={sourceMeta.label} className="bg-[#E3F3D9] text-[#194312]" />
              <MetaChip label={fiveWhLabel} className="bg-[#FFF4C9] text-[#92400E]" />
              <MetaChip label={phaseLabel} className="bg-[#FFE4DD] text-[#9B1C1C]" />
            </div>
          </div>
        </div>
      </div>

      {hasLeftPort ? <AnchorPort side="left" color={portColor} /> : null}
      {hasRightPort ? <AnchorPort side="right" color={portColor} /> : null}
      <Handle
        id="right-source"
        type="source"
        position={Position.Right}
        style={{ ...HANDLE_STYLE }}
        isConnectable={false}
      />
      <Handle
        id="left-target"
        type="target"
        position={Position.Left}
        style={{ ...HANDLE_STYLE }}
        isConnectable={false}
      />
    </div>
  );
}

