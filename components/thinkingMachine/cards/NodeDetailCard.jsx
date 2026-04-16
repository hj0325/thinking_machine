"use client";

import {
  getConfidenceMeta,
  getPreviousVisibility,
  getRoleMeta,
  getSourceTypeMeta,
  getTypeMeta,
  getVisibilityMeta,
  getVisibilityIndex,
  NODE_VISIBILITY_FLOW,
  normalizeNodeData,
} from "@/lib/thinkingMachine/nodeMeta";
import MetaPill from "@/components/thinkingMachine/ui/MetaPill";

function VisibilityStepper({ currentVisibility, onSetVisibility }) {
  const currentIndex = getVisibilityIndex(currentVisibility);

  return (
    <div className="mt-3">
      <div className="text-[11px] font-semibold text-slate-500">Sharing flow</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {NODE_VISIBILITY_FLOW.map((step, index) => {
          const meta = getVisibilityMeta(step);
          const isActive = index === currentIndex;
          const isReached = index <= currentIndex;
          return (
            <button
              key={step}
              type="button"
              onClick={() => onSetVisibility?.(step)}
              className={`rounded-full px-2 py-1 text-[10px] font-semibold transition ${
                isActive ? meta.className : isReached ? "bg-white text-slate-700" : "bg-slate-100/80 text-slate-400"
              }`}
            >
              {meta.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function NodeDetailCard({
  selectedNode,
  linkedNodes,
  currentUserRole,
  onPromote,
  onDemote,
  onShare,
  onSetVisibility,
  quickActions = [],
  modeLabel = "",
  onClearSelection,
}) {
  if (!selectedNode) return null;

  const data = normalizeNodeData(selectedNode.data || {});
  const typeMeta = getTypeMeta(data.category);
  const sourceMeta = getSourceTypeMeta(data.sourceType);
  const visibilityMeta = getVisibilityMeta(data.visibility);
  const confidenceMeta = getConfidenceMeta(data.confidence);
  const roleMeta = getRoleMeta(currentUserRole);
  const linked = Array.isArray(linkedNodes) ? linkedNodes : [];
  const canEdit = currentUserRole === "owner" || currentUserRole === "editor";

  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Selected node</div>
          <div className="mt-0.5 text-[11px] font-semibold text-slate-500">
            {data.phase === "Solution" ? "Solution side" : "Problem side"} · {data.category}
          </div>
        </div>
        <div className="flex items-start gap-1.5">
          <div className="flex flex-col items-end gap-1">
            <MetaPill className={`${typeMeta.tint} ${typeMeta.text}`}>{data.category}</MetaPill>
            <MetaPill className="bg-slate-900 text-white">
              {data.phase === "Solution" ? "Solution" : "Problem"}
            </MetaPill>
          </div>
          {onClearSelection ? (
            <button
              type="button"
              onClick={onClearSelection}
              className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-[10px] font-bold text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-700"
              aria-label="Clear selected node"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      <div className="font-heading text-sm font-semibold text-slate-800">
        {selectedNode.data?.title || "Untitled node"}
      </div>
      <div className="mt-1 rounded-xl bg-slate-50/80 px-2.5 py-1.5 text-[11px] leading-relaxed text-slate-700">
        {selectedNode.data?.content && selectedNode.data.content.trim().length > 0
          ? selectedNode.data.content
          : "Add one clear sentence that captures what this node is about."}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <MetaPill className={roleMeta.className}>{roleMeta.label}</MetaPill>
        <MetaPill className={sourceMeta.className}>{sourceMeta.label}</MetaPill>
        <MetaPill className={visibilityMeta.className}>{visibilityMeta.label}</MetaPill>
        <MetaPill className={confidenceMeta.className}>{confidenceMeta.label}</MetaPill>
      </div>
      {quickActions.length ? (
        <div className="mt-3 rounded-xl border border-slate-200/80 bg-slate-50/85 px-2.5 py-2">
          <div className="text-[11px] font-semibold text-slate-500">
            {modeLabel ? `${modeLabel} quick actions` : "Quick actions"}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {quickActions.map((item) => (
              <MetaPill key={item} className={`${getTypeMeta(item).tint} ${getTypeMeta(item).text}`}>
                {item}
              </MetaPill>
            ))}
          </div>
        </div>
      ) : null}
      <VisibilityStepper currentVisibility={data.visibility} onSetVisibility={canEdit ? onSetVisibility : undefined} />
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onDemote}
          disabled={!canEdit || getPreviousVisibility(data.visibility) === data.visibility}
          className="inline-flex items-center justify-center rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Demote
        </button>
        <button
          type="button"
          onClick={onPromote}
          disabled={!canEdit || getPreviousVisibility(data.visibility) === data.visibility}
          className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Promote
        </button>
        <button
          type="button"
          onClick={onShare}
          disabled={!canEdit || data.visibility === "shared" || data.visibility === "reviewed" || data.visibility === "agreed"}
          className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Share
        </button>
      </div>
      <div className="mt-3">
        <div className="text-[11px] font-semibold text-slate-500">Linked nodes</div>
        {linked.length ? (
          <div className="mt-2 flex flex-col gap-1.5">
            {linked.map((item) => (
              <div key={`${item.id}-${item.relation}-${item.direction}`} className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="line-clamp-1 text-[12px] font-semibold text-slate-700">{item.title}</div>
                  <MetaPill className="bg-white text-slate-500">{item.category}</MetaPill>
                </div>
                <div className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
                  {item.direction === "outgoing" ? "Outgoing" : "Incoming"} · {item.relation.replace(/_/g, " ")}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-1 text-[11px] text-slate-400">No linked nodes yet.</div>
        )}
      </div>
    </div>
  );
}

