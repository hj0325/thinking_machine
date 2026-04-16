"use client";

import { normalizeNodeData, getSourceTypeMeta, getTypeMeta, getVisibilityMeta } from "@/lib/thinkingMachine/nodeMeta";

export default function ContextMiniCard({ item, isActive, onSelect }) {
  const normalized = normalizeNodeData(item);
  const colors = getTypeMeta(normalized.category);
  const sourceMeta = getSourceTypeMeta(normalized.sourceType);
  const visibilityMeta = getVisibilityMeta(normalized.visibility);

  return (
    <button
      type="button"
      className={`relative w-full min-w-0 overflow-hidden rounded-2xl border p-2.5 text-left shadow-[0_8px_18px_rgba(0,0,0,0.08)] backdrop-blur-[10px] transition ${
        isActive
          ? "border-teal-300 bg-white/72 ring-2 ring-teal-200"
          : "border-white/70 bg-white/50 hover:bg-white/60"
      }`}
      onClick={() => onSelect?.(item)}
      aria-label={`Select context card ${item?.title ?? ""}`}
    >
      <div className="mb-1 flex flex-wrap items-center gap-1.5 pr-2">
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${colors.tint} ${colors.text}`}>
          {normalized.category}
        </span>
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${sourceMeta.className}`}>
          {sourceMeta.label}
        </span>
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${visibilityMeta.className}`}>
          {visibilityMeta.label}
        </span>
      </div>
      <div className={`line-clamp-2 text-[11px] font-semibold leading-tight ${isActive ? colors.text : "text-slate-700"}`}>
        {item.title}
      </div>
      <div className="mt-1 line-clamp-2 text-[10px] leading-tight text-slate-500">{item.content}</div>
    </button>
  );
}

