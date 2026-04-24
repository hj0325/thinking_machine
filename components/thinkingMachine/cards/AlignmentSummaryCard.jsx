"use client";

import MetaPill from "@/components/thinkingMachine/ui/MetaPill";
import { getAlignmentVisualMeta } from "@/lib/thinkingMachine/reasoningAlignment";

function Section({ title, items = [] }) {
  if (!items.length) return null;

  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{title}</div>
      <div className="mt-2 flex flex-col gap-1.5">
        {items.map((item) => {
          const meta = getAlignmentVisualMeta(item.state);
          return (
            <div key={item.id} className="rounded-xl border border-slate-200/80 bg-white/82 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-semibold text-slate-700">{item.label}</div>
                <MetaPill className={meta.chipClassName}>{meta.label}</MetaPill>
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-slate-600">{item.summary}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AlignmentSummaryCard({
  selectedNode,
  summary,
}) {
  const counts = summary?.counts || {};
  const sections = summary?.sections || {};
  const totalSignals =
    (counts.aligned || 0) +
    (counts.partially_aligned || 0) +
    (counts.unresolved || 0) +
    (counts.in_tension || 0) +
    (counts.contradictory || 0);
  const divergingCount = (counts.in_tension || 0) + (counts.contradictory || 0);
  const alignedCount = (counts.aligned || 0) + (counts.partially_aligned || 0);

  return (
    <div className="rounded-2xl border border-white/70 bg-white/78 p-3 shadow-[0_14px_26px_rgba(15,23,42,0.08)] backdrop-blur-[14px]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Reasoning alignment</div>
          <div className="mt-1 text-[11px] text-slate-500">
            {selectedNode
              ? `Signals around ${selectedNode.data?.title || "the selected node"}.`
              : "Signals from the visible reasoning graph."}
          </div>
        </div>
        <MetaPill className="bg-slate-100 text-slate-600">
          {totalSignals} signals
        </MetaPill>
      </div>

      {totalSignals > 0 ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {alignedCount > 0 ? (
              <MetaPill className="bg-emerald-100 text-emerald-700">
                Shared direction {alignedCount}
              </MetaPill>
            ) : null}
            {(counts.unresolved || 0) > 0 ? (
              <MetaPill className="bg-slate-100 text-slate-600">
                Unresolved {(counts.unresolved || 0)}
              </MetaPill>
            ) : null}
            {divergingCount > 0 ? (
              <MetaPill className="bg-amber-100 text-amber-700">
                Diverging {divergingCount}
              </MetaPill>
            ) : null}
          </div>

          <Section title="Where reasoning is aligned" items={sections.aligned} />
          <Section title="Still unresolved" items={sections.unresolved} />
          <Section title="Diverging priorities" items={sections.diverging} />
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-slate-50/90 px-3 py-2 text-[11px] text-slate-500">
          Not enough reasoning signals yet. As the graph gains more links, this card will summarize shared direction, unresolved differences, and tension.
        </div>
      )}
    </div>
  );
}
