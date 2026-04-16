"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUp, GitBranch, Image as ImageIcon, Loader2, Sparkles, StickyNote } from "lucide-react";
import {
  getConfidenceMeta,
  getSourceTypeMeta,
  getTypeMeta,
  getVisibilityMeta,
  normalizeReasoningStage,
  normalizeNodeData,
} from "@/lib/thinkingMachine/nodeMeta";
import ContextMiniCard from "@/components/thinkingMachine/cards/ContextMiniCard";
import NodeDetailCard from "@/components/thinkingMachine/cards/NodeDetailCard";
import CandidateGraphCard from "@/components/thinkingMachine/cards/CandidateGraphCard";
const DRAWER_TOP_SAFE_ZONE = 4;

function parseStage(stage) {
  const value = normalizeReasoningStage(stage);
  const isDesign = value.startsWith("design-");
  const isConverge = value.endsWith("-converge");
  return {
    mode: isDesign ? "design" : "research",
    flow: isConverge ? "converge" : "diverge",
  };
}

export default function RightAgentDrawer({
  isOpen,
  mode,
  stage = "research-diverge",
  suggestions,
  onStageChange,
  activeSuggestion,
  selectedNode,
  linkedNodes,
  candidateGraph,
  currentUserRole = "owner",
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
  canvasMode = "personal",
  onCanvasModeChange,
  chatButtonRef,
  chatDropZoneRef,
  isChatDropActive,
  onClearSelectedNode,
  onAddPostit,
  onAddImage,
  showDrawerHint = true,
}) {
  const isTip = mode === "tip";
  const isChat = mode === "chat";
  const { mode: thinkingMode, flow: thinkingFlow } = parseStage(stage);
  const suggestionItems = Array.isArray(suggestions) ? suggestions : [];
  const shouldShowContextPanel = suggestionItems.length > 0;
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
  const [canScrollSuggestionsLeft, setCanScrollSuggestionsLeft] = useState(false);
  const [canScrollSuggestionsRight, setCanScrollSuggestionsRight] = useState(false);
  const shouldShowDrawerHint = showDrawerHint && !selectedNode;
  const copy = uiLanguage === "ko"
    ? {
        emptyChat: "노드를 선택해 오른쪽으로 드래그한 뒤 놓으면 채팅 컨텍스트로 첨부됩니다.",
        emptySuggestions: "제안 카드를 선택해 에이전트와 reasoning 흐름을 확장하세요.",
        emptyWorkspace: "노드 컨텍스트를 첨부해 워크스페이스 대화를 시작하세요.",
        emptySuggestionState: "제안을 선택해 구조를 검토하거나 확장하세요.",
        suggestionsTab: "Suggestions",
        workspaceTab: "Workspace",
        note: "노트",
        image: "이미지",
      }
    : {
        emptyChat: "Select a node, drag it to the right, and drop it to attach it as chat context.",
        emptySuggestions: "Select a suggestion card to expand the reasoning flow with the agent.",
        emptyWorkspace: "Attach node context to begin the workspace conversation.",
        emptySuggestionState: "Select a suggestion to inspect, challenge, or extend the reasoning.",
        suggestionsTab: "Suggestions",
        workspaceTab: "Workspace",
        note: "Note",
        image: "Image",
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
    const el = contextScrollRef.current;
    if (!el) return;

    const updateScrollButtons = () => {
      const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth);
      setCanScrollSuggestionsLeft(el.scrollLeft > 6);
      setCanScrollSuggestionsRight(el.scrollLeft < maxScrollLeft - 6);
    };

    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [suggestionItems.length]);

  useEffect(() => {
    if (!isChatLoading && loadingOverlayText) {
      const exitStartTimer = window.setTimeout(() => {
        setIsLoadingOverlayExiting(true);
      }, 0);
      const exitTimer = window.setTimeout(() => {
        setLoadingOverlayText("");
        setIsLoadingOverlayExiting(false);
      }, 240);

      return () => {
        window.clearTimeout(exitStartTimer);
        window.clearTimeout(exitTimer);
      };
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

  const handleSuggestionScroll = (direction) => {
    const el = contextScrollRef.current;
    if (!el) return;
    const delta = Math.max(168, Math.floor(el.clientWidth * 0.72));
    el.scrollBy({
      left: direction === "left" ? -delta : delta,
      behavior: "smooth",
    });
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
          <div
            className={`pointer-events-none absolute inset-x-8 top-[62px] z-[11] flex justify-center transition-all duration-300 ${
              shouldShowDrawerHint ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
            }`}
            aria-hidden={!shouldShowDrawerHint}
          >
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
          <div className="relative z-10 flex h-full min-h-0 flex-col px-5 pb-4 pt-4">
            <div className="mb-2 flex justify-end pr-1">
              <div className="pointer-events-auto inline-flex items-center rounded-[14px] border border-white/80 bg-white/72 p-[2px] shadow-[0_7px_18px_rgba(76,108,90,0.10)] backdrop-blur-[14px]">
                <button
                  type="button"
                  onClick={() => onCanvasModeChange?.("personal")}
                  className={`inline-flex h-6 min-w-[62px] items-center justify-center rounded-[12px] px-2.5 text-[10px] font-semibold transition ${
                    canvasMode === "personal"
                      ? "bg-[#7BA592] text-white shadow-[0_3px_8px_rgba(123,165,146,0.20)]"
                      : "text-[#839083]"
                  }`}
                >
                  Personal
                </button>
                <button
                  type="button"
                  onClick={() => onCanvasModeChange?.("team")}
                  className={`inline-flex h-6 min-w-[50px] items-center justify-center rounded-[12px] px-2.5 text-[10px] font-semibold transition ${
                    canvasMode === "team"
                      ? "bg-[#7BA592] text-white shadow-[0_3px_8px_rgba(123,165,146,0.20)]"
                      : "text-[#A2ABA1]"
                  }`}
                >
                  Team
                </button>
              </div>
            </div>

            {shouldShowContextPanel ? (
              <div className="relative shrink-0 pb-3" style={{ paddingTop: DRAWER_TOP_SAFE_ZONE }}>
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 z-[2] w-10"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(235, 247, 241, 0.92) 0%, rgba(228, 245, 238, 0.62) 52%, rgba(228, 245, 238, 0) 100%)",
                  }}
                />
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 z-[2] w-10"
                  style={{
                    background:
                      "linear-gradient(270deg, rgba(235, 247, 241, 0.92) 0%, rgba(228, 245, 238, 0.62) 52%, rgba(228, 245, 238, 0) 100%)",
                  }}
                />

                <button
                  type="button"
                  onClick={() => handleSuggestionScroll("left")}
                  disabled={!canScrollSuggestionsLeft}
                  className="pointer-events-auto absolute left-0 top-1/2 z-[3] inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/82 text-slate-600 shadow-[0_6px_14px_rgba(0,0,0,0.08)] transition disabled:cursor-default disabled:opacity-35"
                  aria-label="Scroll suggestions left"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleSuggestionScroll("right")}
                  disabled={!canScrollSuggestionsRight}
                  className="pointer-events-auto absolute right-0 top-1/2 z-[3] inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/82 text-slate-600 shadow-[0_6px_14px_rgba(0,0,0,0.08)] transition disabled:cursor-default disabled:opacity-35"
                  aria-label="Scroll suggestions right"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                <div
                  ref={contextScrollRef}
                  className="overflow-x-auto overflow-y-hidden px-8"
                  style={{ scrollbarWidth: "none" }}
                >
                  <div className="flex min-w-max gap-3 pr-2">
                    {suggestionItems.map((item) => (
                      <div key={item.id} className="w-[168px] shrink-0">
                        <ContextMiniCard
                          item={item}
                          isActive={activeSuggestion?.id === item.id}
                          onSelect={onChatContextSelect}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-white/70 bg-[rgba(255,255,255,0.34)] px-3.5 pb-3 pt-4 shadow-[0_14px_28px_rgba(88,116,104,0.09)] backdrop-blur-[16px]">
              <div className="min-h-0 flex-1 overflow-hidden text-sm text-slate-700">
                <div className="flex h-full min-h-0 flex-col">
                  <div
                    ref={panelScrollRef}
                    className="min-h-0 flex-1 overflow-y-auto px-1"
                    style={{ scrollbarWidth: "none" }}
                  >
                    <div className="flex flex-col gap-3 pb-2">
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
                        onClearSelection={onClearSelectedNode}
                      />

                      {activeSuggestion ? (
                        <div className={`rounded-[14px] border ${categoryColors.border} ${categoryColors.tint} px-3 py-3`}>
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
                            <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
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
                              className={`max-w-[88%] rounded-[14px] px-3.5 py-2.5 text-xs leading-relaxed shadow-[0_6px_14px_rgba(0,0,0,0.04)] ${
                                msg.role === "user"
                                  ? "rounded-br-[8px] bg-[#7BA592] text-white"
                                  : "rounded-bl-[8px] border border-white/80 bg-white/78 text-slate-700"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="inline-flex items-center gap-1.5 rounded-[14px] rounded-bl-[8px] border border-white/80 bg-white/78 px-3 py-2">
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                              <span className="text-xs text-slate-500">Thinking...</span>
                            </div>
                          </div>
                        )}
                        <div ref={chatBottomRef} />
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pt-3">
                    <div className="mb-2 flex items-center gap-2 px-1">
                      <button
                        type="button"
                        onClick={onAddPostit}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/78 text-slate-600 shadow-[0_6px_14px_rgba(0,0,0,0.07)] transition hover:bg-white"
                        aria-label={copy.note}
                        title={copy.note}
                      >
                        <StickyNote className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={onAddImage}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/80 bg-white/78 text-slate-600 shadow-[0_6px_14px_rgba(0,0,0,0.07)] transition hover:bg-white"
                        aria-label={copy.image}
                        title={copy.image}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <form onSubmit={handleChatSubmit} className="space-y-2">
                      <div
                        ref={chatButtonRef}
                        className="relative overflow-hidden rounded-[16px] border border-white/85 bg-white/88 px-4 pb-11 pt-3 shadow-[0_8px_18px_rgba(126,154,138,0.10)]"
                      >
                        {loadingOverlayText ? (
                          <div
                            className={`pointer-events-none absolute inset-x-4 top-3 bottom-12 transition-opacity duration-200 ${
                              isLoadingOverlayExiting ? "opacity-0" : "opacity-100"
                            }`}
                            aria-hidden="true"
                          >
                            <div className="drawer-loading-gradient-text h-full w-full overflow-hidden whitespace-pre-wrap break-words text-[13px] font-medium leading-[1.45]">
                              {loadingOverlayText}
                            </div>
                          </div>
                        ) : null}
                        <textarea
                          value={chatInput}
                          onChange={(event) => onChatInputChange?.(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              handleChatSubmit(event);
                            }
                          }}
                          placeholder={selectedNode ? "Add a related thought..." : "Add a thought..."}
                          disabled={isChatLoading}
                          rows={2}
                          className={`min-h-[68px] w-full resize-none border-none bg-transparent pr-11 text-[13px] font-medium leading-[1.45] outline-none ${
                            loadingOverlayText
                              ? "text-transparent caret-transparent placeholder:text-transparent"
                              : "text-slate-700 placeholder:text-[#A4B2C6]"
                          }`}
                        />
                        <button
                          type="submit"
                          disabled={isChatLoading || !chatInput?.trim()}
                          className="absolute bottom-3.5 right-3.5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(97,129,95,0.35)] bg-[linear-gradient(136.99deg,rgba(199,255,232,0.28)_-0.49%,rgba(19,158,89,0.24)_142.16%),linear-gradient(0deg,rgba(147,205,186,0.2),rgba(147,205,186,0.2))] shadow-[0_6px_14px_rgba(61,107,79,0.10)] transition disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Send message"
                        >
                          <ArrowUp className="h-4 w-4 text-[#5A8054]" strokeWidth={2.1} />
                        </button>
                      </div>
                    </form>

                    {activeSuggestion && chatMessages.length >= 2 && (
                      <button
                        type="button"
                        onClick={onChatConvertToNodes}
                        disabled={isChatConverting}
                        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-[12px] bg-gradient-to-r from-indigo-500 to-purple-500 px-3 py-2.5 text-xs font-semibold text-white transition hover:from-indigo-600 hover:to-purple-600 disabled:opacity-55"
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

            <div className="mt-2 flex justify-center pb-1 pt-2">
              <div className="pointer-events-auto inline-flex w-full max-w-[318px] items-center rounded-[16px] border border-white/80 bg-white/74 p-[3px] shadow-[0_8px_18px_rgba(83,108,90,0.09)] backdrop-blur-[14px]">
                <button
                  type="button"
                  onClick={() => onStageChange?.("research-diverge")}
                  className={`inline-flex h-6 flex-1 items-center justify-center rounded-[12px] px-2 text-[9px] font-semibold transition ${
                    thinkingMode === "research"
                      ? "bg-[#EDEDE5] text-[#60656F]"
                      : "text-[#8A9099]"
                  }`}
                >
                  Research
                </button>
                <button
                  type="button"
                  onClick={() => onStageChange?.("design-diverge")}
                  className={`inline-flex h-6 flex-1 items-center justify-center rounded-[12px] px-2 text-[9px] font-semibold transition ${
                    thinkingMode === "design"
                      ? "bg-[#F7C8C0] text-[#FFFFFF]"
                      : "text-[#8A9099]"
                  }`}
                >
                  Design
                </button>
                <button
                  type="button"
                  onClick={() => onStageChange?.(`${thinkingMode}-diverge`)}
                  className={`inline-flex h-6 flex-1 items-center justify-center rounded-[12px] px-2 text-[9px] font-semibold transition ${
                    thinkingFlow === "diverge"
                      ? "bg-[#7BA592] text-[#FFFFFF]"
                      : "text-[#8A9099]"
                  }`}
                >
                  Diverge
                </button>
                <button
                  type="button"
                  onClick={() => onStageChange?.(`${thinkingMode}-converge`)}
                  className={`inline-flex h-6 flex-1 items-center justify-center rounded-[12px] px-2 text-[9px] font-semibold transition ${
                    thinkingFlow === "converge"
                      ? "bg-[#B8C6B5] text-[#FFFFFF]"
                      : "text-[#8A9099]"
                  }`}
                >
                  Converge
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
