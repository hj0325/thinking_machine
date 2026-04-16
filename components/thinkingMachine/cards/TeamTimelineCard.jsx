function formatTimestamp(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatTypeLabel(type) {
  const normalized = String(type || "").toLowerCase();
  if (normalized === "node_created") return "Created";
  if (normalized === "node_shared") return "Shared";
  if (normalized === "node_visibility_changed") return "Visibility";
  if (normalized === "conflict_created") return "Conflict";
  if (normalized === "stage_changed") return "Stage";
  return normalized.replace(/_/g, " ");
}

export default function TeamTimelineCard({
  items,
  selectedActivityId,
  onSelectActivity,
}) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-3 shadow-[0_16px_28px_rgba(15,23,42,0.10)] backdrop-blur-[14px]">
      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Timeline</div>
      {safeItems.length ? (
        <div className="mt-3 flex max-h-[280px] flex-col gap-2 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
          {safeItems.map((item) => {
            const isActive = item?.id === selectedActivityId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectActivity?.(item)}
                className={`rounded-2xl border px-3 py-2.5 text-left transition ${
                  isActive
                    ? "border-teal-300 bg-teal-50/80 shadow-[0_8px_18px_rgba(20,184,166,0.12)]"
                    : "border-slate-200/80 bg-white/90 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                      {formatTypeLabel(item.type)}
                    </div>
                    <div className="mt-1 line-clamp-1 text-[12px] font-semibold text-slate-800">
                      {item.nodeTitle || item.after?.title || "Untitled node"}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      {(item.userName || item.userId || "Unknown teammate")}
                      {item.nodeType ? ` · ${item.nodeType}` : ""}
                    </div>
                    {item.after?.content ? (
                      <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                        {item.after.content}
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-[10px] text-slate-400">{formatTimestamp(item.timestamp)}</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 text-[11px] text-slate-400">No team activity yet.</div>
      )}
    </div>
  );
}
