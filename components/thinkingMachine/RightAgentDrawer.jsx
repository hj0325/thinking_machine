"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, GitBranch, Loader2, Sparkles } from "lucide-react";
import {
  getConfidenceMeta,
  getNextVisibility,
  getPreviousVisibility,
  getSourceTypeMeta,
  getTypeMeta,
  getVisibilityMeta,
  normalizeNodeData,
} from "@/lib/thinkingMachine/nodeMeta";
import MetaPill from "@/components/thinkingMachine/ui/MetaPill";
import ContextMiniCard from "@/components/thinkingMachine/cards/ContextMiniCard";
import NodeDetailCard from "@/components/thinkingMachine/cards/NodeDetailCard";
import CandidateGraphCard from "@/components/thinkingMachine/cards/CandidateGraphCard";
import ActivityLogCard from "@/components/thinkingMachine/cards/ActivityLogCard";
const DRAWER_TOP_SAFE_ZONE = 4;

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
  onChatContextSelect,
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
    ? []
    : suggestions;
  const shouldShowContextPanel = contextItems.length > 0 || !isChat;
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
  const [loadingOverlayText, setLoadingOverlayText] = useState("");
  const [isLoadingOverlayExiting, setIsLoadingOverlayExiting] = useState(false);
  const [showDrawerHint, setShowDrawerHint] = useState(true);
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

  useEffect(() => {
    if (selectedNode) {
      setShowDrawerHint(false);
      return;
    }

    setShowDrawerHint(true);
  }, [selectedNode]);

  useEffect(() => {
    if (!isChatLoading && loadingOverlayText) {
      setIsLoadingOverlayExiting(true);
      const exitTimer = window.setTimeout(() => {
        setLoadingOverlayText("");
        setIsLoadingOverlayExiting(false);
      }, 240);

      return () => window.clearTimeout(exitTimer);
    }
  }, [isChatLoading, loadingOverlayText]);

  const handleChatSubmit = (event) => {
    event.preventDefault();
    const submittedText = String(chatInput || "").trim();
    if (submittedText && !isChatLoading) {
      setLoadingOverlayText(submittedText);
      setIsLoadingOverlayExiting(false);
    }
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
          {!selectedNode && showDrawerHint ? (
            <div className="pointer-events-none absolute inset-x-8 top-[62px] z-[11] flex justify-center">
              <div
                className="origin-top-center scale-[0.46] sm:scale-[0.485] lg:scale-[0.505]"
                style={{
                  width: "520px",
                  height: "58px",
                }}
              >
                <div
                  className="flex h-[58px] w-[520px] items-center gap-[7px] rounded-[30px] pl-[14px] pr-[19px]"
                  style={{
                    background: "#FFFFFF",
                    opacity: 0.85,
                    boxShadow: "0px 1px 10px rgba(33, 97, 5, 0.08)",
                  }}
                >
                  <div className="flex translate-x-[6px] items-center gap-[7px]">
                    <Sparkles className="h-[36px] w-[34px] shrink-0 text-[#FD9A00]" strokeWidth={1.8} />
                    <div
                      className="whitespace-nowrap"
                      style={{
                        width: "432px",
                        height: "34px",
                        fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
                        fontStyle: "normal",
                        fontWeight: 600,
                        fontSize: "18.8905px",
                        lineHeight: "180%",
                        color: "#758E71",
                      }}
                    >
                      Start with a thought, or select a node to extend it.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
          <div className="relative z-10 flex h-full min-h-0 flex-col justify-end px-6 pb-5 pt-[24px]">
            <div className="flex max-h-[89vh] min-h-0 flex-col gap-3">
            {shouldShowContextPanel ? (
              <div
                ref={contextScrollRef}
                className={`shrink-0 overflow-y-auto overflow-x-visible pl-0.5 pr-2 pb-3`}
                style={{ maxHeight: "26%", paddingTop: DRAWER_TOP_SAFE_ZONE, scrollbarWidth: "none" }}
              >
                <div className="mb-2 flex items-center justify-between px-0.5">
                  <div className="inline-flex rounded-full bg-white/80 p-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                    <button
                      type="button"
                      onClick={() => onToggleMode?.("tip")}
                      className={`rounded-full px-3 py-0.5 transition ${
                        isTip ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {copy.suggestionsTab}
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleMode?.("chat")}
                      className={`rounded-full px-3 py-0.5 transition ${
                        isChat ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {copy.workspaceTab}
                    </button>
                  </div>
                </div>
                {isTip ? (
                  <div className={`grid grid-cols-2 gap-2`}>
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
                        {copy.emptySuggestions}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/75 bg-white/42 px-3 py-2 text-[11px] text-slate-600 backdrop-blur-[8px]">
                    {copy.emptyChat}
                  </div>
                )}
              </div>
            ) : null}

            <div className={`${shouldShowContextPanel ? "-mt-px pt-[13px]" : "-mt-[518px] pt-[614px]"} -mr-[3.5px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-white/65 bg-[rgba(255,255,255,0.3)] px-3 pb-3 shadow-[0_10px_26px_rgba(0,0,0,0.10)] backdrop-blur-[12px]`}>

              <div className="min-h-0 flex-1 overflow-hidden px-3 py-2 text-sm text-slate-700">
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
                    ) : !isChat ? (
                      <div className="rounded-xl border border-dashed border-white/70 bg-white/35 px-3 py-2 text-xs text-slate-600">
                        {copy.emptySuggestionState}
                      </div>
                    ) : null}

                    <CandidateGraphCard
                      candidateGraph={candidateGraph}
                      candidateHint={candidateHint}
                      onCommit={onCommitCandidateNodes}
                      onCommitAsPrivate={onCommitCandidateNodesAsPrivate}
                      onDiscard={onDiscardCandidateNodes}
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

                    <div className="shrink-0 pt-0">
                      <form onSubmit={handleChatSubmit} className="-mx-[10px] mt-[15px] flex justify-center">
                        <div className="relative top-[7.5px] h-[115px] w-full">
                          <div className="absolute bottom-0 h-[95px] w-full rounded-[15px] bg-white shadow-[2px_2px_8px_rgba(172,172,172,0.2)]">
                          {loadingOverlayText ? (
                            <div
                              className={`pointer-events-none absolute inset-0 transition-opacity duration-200 ${
                                isLoadingOverlayExiting ? "opacity-0" : "opacity-100"
                              }`}
                              aria-hidden="true"
                            >
                              <input
                                value={loadingOverlayText}
                                readOnly
                                tabIndex={-1}
                                className="drawer-loading-gradient-text relative -top-[3px] h-full w-full rounded-[15px] border-none bg-transparent px-[18px] pb-[44px] pt-[0px] text-[13px] font-medium leading-[130%] outline-none"
                              />
                            </div>
                          ) : null}
                          <input
                            value={chatInput}
                            onChange={(event) => onChatInputChange?.(event.target.value)}
                            placeholder={selectedNode ? "Add a related thought..." : "Add a thought..."}
                            disabled={isChatLoading}
                            className={`relative -top-[3px] h-full w-full rounded-[15px] border-none bg-transparent px-[18px] pb-[44px] pt-[0px] text-[13px] font-medium leading-[130%] outline-none ${
                              loadingOverlayText
                                ? "text-transparent caret-transparent placeholder:text-transparent"
                                : "text-slate-700 placeholder:text-[#A4B2C6]"
                            }`}
                          />
                          <button
                            type="submit"
                            disabled={isChatLoading || !chatInput?.trim()}
                            className="absolute bottom-[10px] right-[10px] inline-flex h-[33px] w-[33px] items-center justify-center rounded-full border border-[rgba(97,129,95,0.53)] bg-[linear-gradient(136.99deg,rgba(199,255,232,0.2)_-0.49%,rgba(19,158,89,0.2)_142.16%),linear-gradient(0deg,rgba(147,205,186,0.2),rgba(147,205,186,0.2))] text-[rgba(52,89,46,0.75)] transition disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Send message"
                          >
                            <ArrowUp className="h-[18px] w-[18px]" strokeWidth={2.1} />
                          </button>
                        </div>
                        </div>
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
