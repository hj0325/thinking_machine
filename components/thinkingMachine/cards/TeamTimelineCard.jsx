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
    <div className="rounded-2xl border border-white/70 bg-white/82 p-3.5 shadow-[0_16px_28px_rgba(15,23,42,0.10)] backdrop-blur-[14px]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Timeline</div>
          <div className="mt-1 text-[11px] text-slate-500">Recent team changes that may shift the reasoning context.</div>
        </div>
        <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
          {safeItems.length}
        </div>
      </div>
      {safeItems.length ? (
        <div className="mt-3 flex max-h-[220px] flex-col gap-2 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
          {safeItems.map((item) => {
            const isActive = item?.id === selectedActivityId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectActivity?.(item)}
                className={`rounded-[18px] border px-3 py-3 text-left transition ${
                  isActive
                    ? "border-teal-300 bg-[linear-gradient(180deg,rgba(240,253,250,0.98)_0%,rgba(255,255,255,0.94)_100%)] shadow-[0_10px_22px_rgba(20,184,166,0.12)]"
                    : "border-slate-200/80 bg-white/90 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${isActive ? "bg-teal-400" : "bg-slate-300"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                          {formatTypeLabel(item.type)}
                        </div>
                        <div className="mt-1 line-clamp-1 text-[12px] font-semibold text-slate-800">
                          {item.nodeTitle || item.after?.title || "Untitled node"}
                        </div>
                      </div>
                      <div className="shrink-0 text-[10px] text-slate-400">{formatTimestamp(item.timestamp)}</div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">{item.userName || item.userId || "Unknown teammate"}</span>
                      {item.nodeType ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {item.nodeType}
                        </span>
                      ) : null}
                    </div>
                    {item.after?.content ? (
                      <div className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                        {item.after.content}
                      </div>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 rounded-xl bg-slate-50/90 px-3 py-2 text-[11px] text-slate-400">No team activity yet.</div>
      )}
    </div>
  );
}
