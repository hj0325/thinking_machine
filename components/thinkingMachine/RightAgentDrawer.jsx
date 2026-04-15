"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Check, GitBranch, Loader2, RefreshCcw, Send } from "lucide-react";
import {
  NODE_VISIBILITY_FLOW,
  getConfidenceMeta,
  getNextVisibility,
  getPreviousVisibility,
  getRoleMeta,
  getSourceTypeMeta,
  getTypeMeta,
  getVisibilityMeta,
  getVisibilityIndex,
  normalizeNodeData,
} from "@/lib/thinkingMachine/nodeMeta";
const DRAWER_TOP_SAFE_ZONE = 4;

function MetaPill({ children, className }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${className}`}>{children}</span>;
}

function ContextMiniCard({ item, isActive, onSelect }) {
  const normalized = normalizeNodeData(item);
  const colors = getTypeMeta(normalized.category);
  const sourceMeta = getSourceTypeMeta(normalized.sourceType);
  const visibilityMeta = getVisibilityMeta(normalized.visibility);

  return (
    <button
      type="button"
      className={`relative min-w-0 ${isActive ? "col-span-2" : ""} rounded-2xl border p-2.5 text-left shadow-[0_8px_18px_rgba(0,0,0,0.08)] backdrop-blur-[10px] transition ${
        isActive
          ? "border-teal-300 bg-white/72 ring-2 ring-teal-200"
          : "border-white/70 bg-white/50 hover:bg-white/60"
      }`}
      onClick={() => onSelect?.(item)}
      aria-label={`Select context card ${item?.title ?? ""}`}
    >
      <div className="mb-1 flex items-center gap-1.5 pr-2">
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

function NodeDetailCard({
  selectedNode,
  linkedNodes,
  currentUserRole,
  onPromote,
  onDemote,
  onShare,
  onSetVisibility,
  quickActions = [],
  modeLabel = "",
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
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Selected node</div>
        <MetaPill className={`${typeMeta.tint} ${typeMeta.text}`}>{data.category}</MetaPill>
      </div>
      <div className="font-heading text-sm font-semibold text-slate-800">{selectedNode.data?.title || "Untitled node"}</div>
      <div className="mt-1 text-xs leading-relaxed text-slate-600">{selectedNode.data?.content || "No content yet."}</div>
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
          disabled={!canEdit || getNextVisibility(data.visibility) === data.visibility}
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

function CandidateGraphCard({ candidateGraph, onCommit, onCommitAsPrivate, onDiscard, candidateHint }) {
  const candidateNodes = Array.isArray(candidateGraph?.nodes) ? candidateGraph.nodes : [];
  const candidateEdges = Array.isArray(candidateGraph?.edges) ? candidateGraph.edges : [];
  if (!candidateNodes.length) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">Candidate nodes</div>
          <div className="mt-1 text-[11px] text-amber-800/80">
            {candidateHint || "Nodes begin private. Mark them as candidate here, then share when ready."}
          </div>
        </div>
        <MetaPill className="bg-white text-amber-700">{candidateNodes.length} nodes</MetaPill>
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {candidateNodes.map((node) => {
          const data = normalizeNodeData(node.data || {});
          const typeMeta = getTypeMeta(data.category);
          const confidenceMeta = getConfidenceMeta(data.confidence);
          return (
            <div key={node.id} className="rounded-xl border border-amber-200/80 bg-white/85 px-2.5 py-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <MetaPill className={`${typeMeta.tint} ${typeMeta.text}`}>{data.category}</MetaPill>
                <MetaPill className="bg-amber-100 text-amber-700">Candidate</MetaPill>
                <MetaPill className={confidenceMeta.className}>{confidenceMeta.label}</MetaPill>
              </div>
              <div className="mt-1 text-[12px] font-semibold text-slate-800">{node.data?.title || "Untitled node"}</div>
              <div className="mt-1 text-[11px] leading-relaxed text-slate-600">{node.data?.content || "No content yet."}</div>
            </div>
          );
        })}
      </div>

      {candidateEdges.length ? (
        <div className="mt-3 rounded-xl border border-white/70 bg-white/70 px-2.5 py-2 text-[11px] text-slate-600">
          Relations: {candidateEdges.map((edge) => String(edge.label).replace(/_/g, " ")).join(", ")}
        </div>
      ) : null}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onCommitAsPrivate}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/80 bg-white/85 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white"
        >
          Keep private
        </button>
        <button
          type="button"
          onClick={onCommit}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-teal-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-600"
        >
          <Check className="h-3.5 w-3.5" />
          Add as candidate
        </button>
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center justify-center rounded-xl border border-white/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white"
        >
          Discard
        </button>
      </div>
    </div>
  );
}

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

const VISIBLE_ACTIVITY_TYPES = new Set([
  "node_shared",
  "conflict_created",
  "node_reviewed",
  "node_agreed",
  "decision_created",
]);

function shouldDisplayActivityItem(item) {
  if (!item || typeof item !== "object") return false;
  return VISIBLE_ACTIVITY_TYPES.has(String(item.type || "").toLowerCase());
}

function formatActivityTypeLabel(type) {
  const normalized = String(type || "").toLowerCase();
  if (normalized === "node_shared") return "Shared";
  if (normalized === "conflict_created") return "Conflict raised";
  if (normalized === "node_reviewed") return "Reviewed";
  if (normalized === "node_agreed") return "Agreed";
  if (normalized === "decision_created") return "Decision added";
  return String(type || "").replace(/_/g, " ");
}

function ActivityLogCard({ projectLastUpdated, lastRefreshedAt, activityLog, onRefresh }) {
  const items = (Array.isArray(activityLog) ? activityLog : []).filter(shouldDisplayActivityItem);

  return (
    <div className="rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Activity</div>
          <div className="mt-1 text-[11px] text-slate-500">
            Updated {formatTimestamp(projectLastUpdated)} · Refreshed {formatTimestamp(lastRefreshedAt)}
          </div>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1 rounded-full border border-white/80 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {items.length ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200/80 bg-white/68">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`px-3 py-2.5 ${index !== items.length - 1 ? "border-b border-slate-200/75" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    {formatActivityTypeLabel(item.type)}
                  </div>
                  <div className="mt-1 line-clamp-1 text-[12px] font-semibold text-slate-700">
                    {item.nodeTitle || "Untitled node"}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {item.nodeType ? `${item.nodeType} · ` : ""}
                    {item.userRole || "owner"} · {item.userId || "mock-user-1"}
                  </div>
                </div>
                <div className="shrink-0 pt-0.5 text-[10px] text-slate-400">{formatTimestamp(item.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-[11px] text-slate-400">No team-relevant activity yet in this project.</div>
      )}
    </div>
  );
}

export default function RightAgentDrawer({
  isOpen,
  mode,
  suggestions,
  onToggleMode,
  activeSuggestion,
  selectedNode,
  linkedNodes,
  candidateGraph,
  currentUserRole = "owner",
  projectLastUpdated,
  activityLog,
  lastRefreshedAt,
  chatMessages,
  chatInput,
  isChatLoading,
  isChatConverting,
  onChatInputChange,
  onChatSubmit,
  onChatConvertToNodes,
  onCommitCandidateNodes,
  onCommitCandidateNodesAsPrivate,
  onDiscardCandidateNodes,
  onPromoteSelectedNode,
  onDemoteSelectedNode,
  onSetNodeVisibility,
  onRefreshActivity,
  onChatContextSelect,
  attachedContext,
  modeLabel,
  candidateHint,
  selectedNodeQuickActions,
  uiLanguage = "en",
  chatButtonRef,
  chatDropZoneRef,
  isChatDropActive,
}) {
  const isTip = mode === "tip";
  const isChat = mode === "chat";
  const contextItems = isChat
    ? [...(attachedContext ? [attachedContext] : [])]
    : suggestions;
  const hasTipSignal = suggestions.length > 0;
  const activeMeta = normalizeNodeData(activeSuggestion || {});
  const categoryColors = getTypeMeta(activeMeta.category);
  const confidenceMeta = getConfidenceMeta(activeMeta.confidence);
  const sourceMeta = getSourceTypeMeta(activeMeta.sourceType);
  const visibilityMeta = getVisibilityMeta(activeMeta.visibility);
  const drawerFieldBaseFade =
    "linear-gradient(169.55deg, rgba(199, 251, 201, 0.3) 9.44%, rgba(179, 236, 236, 0.3) 97.4%)";
  const drawerFieldRadialAlpha = "none";
  const drawerFieldLemonStrip = "none";
  const drawerFieldEdgeOverlay = "none";
  const chatBottomRef = useRef(null);
  const contextScrollRef = useRef(null);
  const panelScrollRef = useRef(null);
  const copy = uiLanguage === "ko"
    ? {
        emptyChat: "노드를 선택해 오른쪽으로 드래그한 뒤 놓으면 채팅 컨텍스트로 첨부됩니다.",
        emptySuggestions: "제안 카드를 선택해 에이전트와 reasoning 흐름을 확장하세요.",
        emptyWorkspace: "노드 컨텍스트를 첨부해 워크스페이스 대화를 시작하세요.",
        emptySuggestionState: "제안을 선택해 구조를 검토하거나 확장하세요.",
        suggestionsTab: "Suggestions",
        workspaceTab: "Workspace",
      }
    : {
        emptyChat: "Select a node, drag it to the right, and drop it to attach it as chat context.",
        emptySuggestions: "Select a suggestion card to expand the reasoning flow with the agent.",
        emptyWorkspace: "Attach node context to begin the workspace conversation.",
        emptySuggestionState: "Select a suggestion to inspect, challenge, or extend the reasoning.",
        suggestionsTab: "Suggestions",
        workspaceTab: "Workspace",
      };

  useEffect(() => {
    if (!isOpen || !isChat) return;
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading, isOpen, isChat]);

  useEffect(() => {
    contextScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    panelScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [mode, activeSuggestion?.id]);

  const handleChatSubmit = (event) => {
    event.preventDefault();
    onChatSubmit?.();
  };

  return (
    <div className="pointer-events-none absolute bottom-0 right-0 top-0 z-[45] overflow-visible">
      <div className="relative flex h-full w-[365px] transform-gpu sm:w-[385px] lg:w-[397px]">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[0] w-[96px]"
          aria-hidden
          style={{ background: drawerFieldLemonStrip }}
        />
        <motion.div
          ref={chatDropZoneRef}
          className={`relative h-full w-[365px] overflow-hidden rounded-none pointer-events-auto opacity-100 sm:w-[385px] lg:w-[397px] ${
            isChat && isChatDropActive ? "ring-4 ring-teal-300/40" : ""
          }`}
          aria-hidden={false}
          initial={{ x: 44, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 44, opacity: 0 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: `${drawerFieldRadialAlpha}, ${drawerFieldBaseFade}`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-16"
            aria-hidden
            style={{ background: drawerFieldEdgeOverlay }}
          />
          <div className="relative z-10 flex h-full min-h-0 flex-col justify-end px-6 pb-5 pl-9 pr-6 pt-[24px]">
            <div className="flex max-h-[89vh] min-h-0 flex-col gap-3">
            <div
              ref={contextScrollRef}
              className={`grid ${isChat ? "grid-cols-1" : "grid-cols-2"} shrink-0 gap-2 overflow-y-auto overflow-x-visible pl-0.5 pr-2 pb-3`}
              style={{ maxHeight: "24%", paddingTop: DRAWER_TOP_SAFE_ZONE, scrollbarWidth: "none" }}
            >
              {contextItems.length > 0 ? (
                contextItems.map((item) => (
                  <ContextMiniCard
                    key={item.id}
                    item={item}
                    isActive={activeSuggestion?.id === item.id}
                    onSelect={onChatContextSelect}
                  />
                ))
              ) : (
                <div className="col-span-2 rounded-2xl border border-dashed border-white/75 bg-white/42 px-3 py-2 text-[11px] text-slate-600 backdrop-blur-[8px]">
                  {isChat
                    ? copy.emptyChat
                    : copy.emptySuggestions}
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-white/65 bg-white/32 p-3 shadow-[0_10px_26px_rgba(0,0,0,0.10)] backdrop-blur-[12px]">
              <div className="mb-3 flex items-center border-b border-white/65 pb-2">
                <div className="inline-flex rounded-full border border-white/80 bg-white/76 p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => onToggleMode("tip")}
                    className={`relative rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      isTip ? "text-white" : "text-slate-600 hover:bg-white"
                    }`}
                    style={isTip ? { background: "linear-gradient(180deg, #3E5A8F 0%, #182338 100%)" } : undefined}
                  >
                    {copy.suggestionsTab}
                    {hasTipSignal ? (
                      <span
                        className={`ml-1.5 inline-block h-1.5 w-1.5 rounded-full ${isTip ? "bg-white/80" : "bg-fuchsia-400"}`}
                        aria-hidden
                      />
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleMode("chat")}
                    ref={chatButtonRef}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      isChat ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-white"
                    } ${isChatDropActive ? "ring-2 ring-teal-300/70" : ""}`}
                  >
                    {copy.workspaceTab}
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/60 bg-white/25 px-3 py-2 text-sm text-slate-700 backdrop-blur-[12px]">
                <div className="flex h-full min-h-0 flex-col">
                  <div
                    ref={panelScrollRef}
                    className="min-h-0 flex-1 overflow-y-auto pr-1"
                    style={{ scrollbarWidth: "none" }}
                  >
                    <div className="flex flex-col gap-2 pb-2">
                    <NodeDetailCard
                      selectedNode={selectedNode}
                      linkedNodes={linkedNodes}
                      currentUserRole={currentUserRole}
                      modeLabel={modeLabel}
                      quickActions={selectedNodeQuickActions}
                      onPromote={onPromoteSelectedNode}
                      onDemote={onDemoteSelectedNode}
                      onShare={() => onSetNodeVisibility?.(selectedNode?.id, "shared")}
                      onSetVisibility={(nextVisibility) => onSetNodeVisibility?.(selectedNode?.id, nextVisibility)}
                    />

                    {activeSuggestion ? (
                      <div className={`-mx-1 rounded-xl border ${categoryColors.border} ${categoryColors.tint} px-2.5 py-2`}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <div className={`text-[10px] font-bold uppercase tracking-wider ${categoryColors.text}`}>
                            {activeMeta.category}
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${sourceMeta.className}`}>
                            {sourceMeta.label}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${visibilityMeta.className}`}>
                            {visibilityMeta.label}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${confidenceMeta.className}`}>
                            {confidenceMeta.label}
                          </span>
                        </div>
                        <div className="font-heading mt-1 line-clamp-1 text-xs font-semibold text-slate-800">
                          {activeSuggestion.title}
                        </div>
                        {activeSuggestion?.type === "attachedNodes" && Array.isArray(activeSuggestion?.attached_nodes) && (
                          <div className="mt-2 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" style={{ scrollbarWidth: "none" }}>
                            {activeSuggestion.attached_nodes.map((n) => (
                              <span
                                key={n.id}
                                className="inline-flex shrink-0 max-w-full items-center gap-1 rounded-full border border-white/70 bg-white/70 px-2 py-0.5 text-[10px] text-slate-700"
                                title={n?.content || n?.title || ""}
                              >
                                <span className="font-semibold">{n?.title || "Node"}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-white/70 bg-white/35 px-3 py-2 text-xs text-slate-600">
                        {isChat
                          ? copy.emptyWorkspace
                          : copy.emptySuggestionState}
                      </div>
                    )}

                    <CandidateGraphCard
                      candidateGraph={candidateGraph}
                      candidateHint={candidateHint}
                      onCommit={onCommitCandidateNodes}
                      onCommitAsPrivate={onCommitCandidateNodesAsPrivate}
                      onDiscard={onDiscardCandidateNodes}
                    />

                    <ActivityLogCard
                      projectLastUpdated={projectLastUpdated}
                      lastRefreshedAt={lastRefreshedAt}
                      activityLog={activityLog}
                      onRefresh={onRefreshActivity}
                    />

                    <div className="flex flex-col gap-2">
                        {chatMessages.length === 0 && !isChatLoading && activeSuggestion && (
                          <div className="text-center text-xs text-slate-500">AI is preparing a response...</div>
                        )}
                        {chatMessages.map((msg, index) => (
                          <div
                            key={`${msg.role}-${index}`}
                            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                                msg.role === "user"
                                  ? "rounded-br-sm bg-indigo-500 text-white"
                                  : "rounded-bl-sm border border-white/70 bg-white/70 text-slate-700"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="inline-flex items-center gap-1.5 rounded-xl rounded-bl-sm border border-white/70 bg-white/72 px-2.5 py-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                              <span className="text-xs text-slate-500">Thinking...</span>
                            </div>
                          </div>
                        )}
                        <div ref={chatBottomRef} />
                    </div>
                    </div>
                  </div>

                    <div className="shrink-0 border-t border-white/65 pt-2">
                      <form onSubmit={handleChatSubmit} className="flex items-center gap-1.5">
                        <input
                          value={chatInput}
                          onChange={(event) => onChatInputChange?.(event.target.value)}
                          placeholder={selectedNode ? "Add a related thought..." : "Add a thought..."}
                          disabled={isChatLoading}
                          className="min-w-0 flex-1 rounded-xl border border-white/70 bg-white/82 px-3 py-2 text-xs text-slate-700 outline-none placeholder:text-slate-400 focus:border-teal-300"
                        />
                        <button
                          type="submit"
                          disabled={isChatLoading || !chatInput?.trim()}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500 text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Send message"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </form>

                      {activeSuggestion && chatMessages.length >= 2 && (
                        <button
                          type="button"
                          onClick={onChatConvertToNodes}
                          disabled={isChatConverting}
                          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-2 text-xs font-semibold text-white transition hover:from-indigo-600 hover:to-purple-600 disabled:opacity-55"
                        >
                          {isChatConverting ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Creating nodes...
                            </>
                          ) : (
                            <>
                              <GitBranch className="h-3 w-3" />
                              Convert to node candidates
                            </>
                          )}
                        </button>
                      )}
                    </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
