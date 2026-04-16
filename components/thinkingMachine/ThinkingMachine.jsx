"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    useNodesState,
    useEdgesState,
    getViewportForBounds,
} from "reactflow";
import { AnimatePresence, motion } from "framer-motion";
import NodeMap from "./NodeMap";
import LeftCanvasTools from "./LeftCanvasTools";
import RightAgentDrawer from "./RightAgentDrawer";
import TopBar from "./TopBar";
import { toConnectorEdges } from "@/lib/thinkingMachine/connectorEdges";
import { toReactFlowNode } from "@/lib/thinkingMachine/reactflowTransforms";
import { computeNodeBounds, relayoutTopLevelThinkingNodes, shiftClusterRightOfExisting } from "@/lib/thinkingMachine/graphMerge";
import { useAdminMode } from "@/hooks/useAdminMode";
import { useDraftGrouping } from "@/components/thinkingMachine/hooks/useDraftGrouping";
import { useGhostDragToChat } from "@/components/thinkingMachine/hooks/useGhostDragToChat";
import { useThinkingCollaboration } from "@/components/thinkingMachine/hooks/useThinkingCollaboration";
import { useThinkingGraphState } from "@/components/thinkingMachine/hooks/useThinkingGraphState";
import { useThinkingAiAnalyze } from "@/components/thinkingMachine/hooks/useThinkingAiAnalyze";
import { useRightDrawerChat } from "@/components/thinkingMachine/hooks/useRightDrawerChat";
import {
    getReasoningModeProfile,
    getRoleMeta,
    getNextVisibility,
    getPreviousVisibility,
    normalizeReasoningStage,
    normalizeRelationLabel,
    normalizeVisibility,
} from "@/lib/thinkingMachine/nodeMeta";

const INITIAL_NODES = [];
const INITIAL_EDGES = [];
const ADMIN_MODE_STORAGE_KEY = "vtm-admin-mode-enabled";
const ADMIN_HINT_DISMISSED_KEY = "vtm-admin-shortcut-hint-dismissed";
const MOCK_CURRENT_USER_ID = "mock-user-1";
const MOCK_CURRENT_USER_ROLE = "owner";
const AUTO_FIT_MAX_ZOOM = 1;

function cubicOut(t) {
    return 1 - Math.pow(1 - t, 3);
}

export default function ThinkingMachine({
    projectId = "",
    initialProjectTitle = "Thinking Machine",
    projectMetaHref = "/projects",
    projectMetaLabel = "Back to projects",
}) {
    const [nodes, setNodes, baseOnNodesChange] = useNodesState(INITIAL_NODES);
    const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(true);
    const [drawerMode, setDrawerMode] = useState("tip");
    const [stage, setStage] = useState("research-diverge");
    const [projectTitle, setProjectTitle] = useState(initialProjectTitle);
    const [canvasMode, setCanvasMode] = useState("personal");
    const [isCanvasInteractive, setIsCanvasInteractive] = useState(true);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [pendingChatCandidateGraph, setPendingChatCandidateGraph] = useState(null);

    const { isAdminMode } = useAdminMode({
        storageKey: ADMIN_MODE_STORAGE_KEY,
        hintDismissedKey: ADMIN_HINT_DISMISSED_KEY,
    });

    // AI 제안 패널
    const [suggestions, setSuggestions] = useState([]);
    const [highlightedNodeIds, setHighlightedNodeIds] = useState(new Set());

    // Chat state (Drawer Chat primary + optional legacy dialog fallback)
    const [attachedNodes, setAttachedNodes] = useState([]); // [{id,title,content,category,phase,sourceType,visibility,confidence}]
    const reactFlowRef = useRef(null);

    const {
        activeSuggestion,
        setActiveSuggestion,
        chatMessages,
        chatInput,
        setChatInput,
        isChatLoading,
        isChatConverting,
        handleDrawerModeToggle,
        handleDrawerChatSubmit,
        handleDrawerChatConvertToNodes,
        handleDrawerContextSelect,
    } = useRightDrawerChat({
        suggestions,
        nodes,
        onPreviewNodesFromChat: handlePreviewNodesFromChat,
        isDrawerOpen,
        setIsDrawerOpen,
        drawerMode,
        setDrawerMode,
        stage,
    });

    const handleDrawerModeChange = useCallback((nextMode) => {
        handleDrawerModeToggle(nextMode);
        setIsDrawerOpen(true);
    }, [handleDrawerModeToggle]);

    const {
        selectedDraftIds,
        showDraftConvertPrompt,
        setShowDraftConvertPrompt,
        draftConvertIdsRef,
        selectionBoxEnabled,
        draftSubmittingIds,
        createPostitDraft,
        createImageDraft,
        handlePostitChangeText,
        handleImageChangeCaption,
        handleImagePick,
        handleDraftSubmit,
        handleSelectionChange,
        convertDraftsToGroup,
    } = useDraftGrouping({
        nodes,
        edges,
        setNodes,
        setEdges,
        isAnalyzing,
        setIsAnalyzing,
        setSuggestions,
        reactFlowRef,
        stage,
    });

    const {
        isChatDropActive,
        ghostDrag,
        chatButtonRef,
        chatDropZoneRef,
        filteredOnNodesChange,
        handleNodeDragStart,
        handleNodeDragUpdate,
        handleNodeDragStop,
    } = useGhostDragToChat({
        nodes,
        setNodes,
        baseOnNodesChange,
        setAttachedNodes,
        setActiveSuggestion,
        setDrawerMode,
        setIsDrawerOpen,
    });

    const currentRoleMeta = getRoleMeta(MOCK_CURRENT_USER_ROLE);

    const {
        projectLastUpdated,
        activityLog,
        lastRefreshedAt,
        recordProjectActivity,
    } = useThinkingCollaboration({
        projectId,
        currentUserId: MOCK_CURRENT_USER_ID,
        currentUserRole: MOCK_CURRENT_USER_ROLE,
    });

    const handleFlowInit = (instance) => {
        reactFlowRef.current = instance;
    };

    const handleZoomIn = useCallback(() => {
        reactFlowRef.current?.zoomIn?.({ duration: 220 });
    }, []);

    const handleZoomOut = useCallback(() => {
        reactFlowRef.current?.zoomOut?.({ duration: 220 });
    }, []);

    const handleFitCanvas = useCallback(() => {
        reactFlowRef.current?.fitView?.({ duration: 320, padding: 0.18, maxZoom: 1 });
    }, []);

    const handleToggleCanvasInteractive = useCallback(() => {
        setIsCanvasInteractive((prev) => !prev);
    }, []);

    const animateViewportToNodes = useCallback((targetNodes) => {
        const inst = reactFlowRef?.current;
        const bounds = computeNodeBounds(targetNodes);
        if (!inst || !bounds) return;
        const canvasElement = document.querySelector(".tm-canvas-flow");
        const viewportWidth = canvasElement?.clientWidth ?? window.innerWidth;
        const viewportHeight = canvasElement?.clientHeight ?? window.innerHeight;
        if (typeof inst.setViewport === "function") {
            requestAnimationFrame(() => {
                const nextViewport = getViewportForBounds(
                    {
                        x: bounds.minX - 72,
                        y: bounds.minY - 72,
                        width: Math.max(260, bounds.maxX - bounds.minX) + 144,
                        height: Math.max(220, bounds.maxY - bounds.minY) + 144,
                    },
                    viewportWidth,
                    viewportHeight,
                    0.2,
                    AUTO_FIT_MAX_ZOOM,
                    0.18
                );
                nextViewport.zoom = Math.min(nextViewport.zoom, AUTO_FIT_MAX_ZOOM);
                inst.setViewport(nextViewport, {
                    duration: 700,
                    ease: cubicOut,
                });
            });
        }
    }, []);

    // 채팅 대화에서 노드+엣지 추가
    const handleAddNodesFromChat = useCallback((data, { commitVisibility = "shared" } = {}) => {
        const incoming = Array.isArray(data?.nodes) ? data.nodes : [];
        const incomingEdges = Array.isArray(data?.edges) ? data.edges : [];
        const normalizedIncoming = incoming.map((n) => ({
            ...n,
            data: {
                ...n.data,
                ownerId: MOCK_CURRENT_USER_ID,
                editedBy: "You",
                visibility: normalizeVisibility(n?.data?.visibility === "candidate" ? commitVisibility : n?.data?.visibility),
            },
        }));
        const rawNewNodes = normalizedIncoming.map((n) => toReactFlowNode(n, null));
        const seededNodes = nodes.length ? shiftClusterRightOfExisting(nodes, rawNewNodes) : rawNewNodes;
        const mergedNodes = [...nodes, ...seededNodes];
        const nextEdges = [...edges, ...toConnectorEdges(incomingEdges, mergedNodes, edges)];
        const relaidNodes = relayoutTopLevelThinkingNodes(mergedNodes, nextEdges);
        const insertedIds = new Set(seededNodes.map((node) => node.id));

        setNodes(relaidNodes);
        setEdges(nextEdges);
        animateViewportToNodes(relaidNodes.filter((node) => insertedIds.has(node.id)));
        normalizedIncoming.forEach((node) => {
            recordProjectActivity("node_created", {
                nodeId: node.id,
                nodeTitle: node?.data?.label,
                nodeType: node?.data?.category,
            });
            if (node?.data?.category === "Conflict") {
                recordProjectActivity("conflict_created", {
                    nodeId: node.id,
                    nodeTitle: node?.data?.label,
                });
            }
        });
    }, [animateViewportToNodes, edges, nodes, recordProjectActivity, setEdges, setNodes]);

    function handlePreviewNodesFromChat(data) {
        const incoming = Array.isArray(data?.nodes) ? data.nodes : [];
        const incomingEdges = Array.isArray(data?.edges) ? data.edges : [];
        if (!incoming.length) return;

        // 대화 결과를 별도 후보 카드 없이 바로 그래프에 반영
        handleAddNodesFromChat(
            {
                nodes: incoming.map((n) => ({
                    ...n,
                    data: {
                        ...n.data,
                        ownerId: MOCK_CURRENT_USER_ID,
                        editedBy: "You",
                        visibility: "candidate",
                    },
                })),
                edges: incomingEdges.map((e) => ({
                    ...e,
                    label: normalizeRelationLabel(e?.label),
                })),
            },
            { commitVisibility: "candidate" }
        );

        // 대화 기반 노드 생성 후에는 다시 입력 모드로 되돌아가도록 컨텍스트 초기화
        setActiveSuggestion(null);
        setPendingChatCandidateGraph(null);
    }

    const handleCommitCandidateNodes = useCallback(() => {
        if (!pendingChatCandidateGraph) return;
        handleAddNodesFromChat(pendingChatCandidateGraph, { commitVisibility: "candidate" });
        setPendingChatCandidateGraph(null);
        // 대화 기반 후보 노드를 그래프에 반영한 뒤에는 다시 기본 입력 모드로 돌아가도록 컨텍스트 초기화
        setActiveSuggestion(null);
    }, [handleAddNodesFromChat, pendingChatCandidateGraph, setActiveSuggestion]);

    const handleCommitCandidateNodesAsPrivate = useCallback(() => {
        if (!pendingChatCandidateGraph) return;
        handleAddNodesFromChat(pendingChatCandidateGraph, { commitVisibility: "private" });
        setPendingChatCandidateGraph(null);
        setActiveSuggestion(null);
    }, [handleAddNodesFromChat, pendingChatCandidateGraph, setActiveSuggestion]);

    const handleDiscardCandidateNodes = useCallback(() => {
        setPendingChatCandidateGraph(null);
        setActiveSuggestion(null);
    }, [setActiveSuggestion]);

    const syncVisibilityChangeMock = useCallback((nodeId, nextVisibility) => {
        void nodeId;
        void nextVisibility;
        // TODO: Replace this local-only mock with multi-user sync/persistence when collaboration is introduced.
    }, []);

    const handleSetNodeVisibility = useCallback((nodeId, nextVisibility) => {
        const normalizedNext = normalizeVisibility(nextVisibility);
        let previousVisibility = null;
        let nextNodeTitle = "";
        let nextNodeType = "";
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== nodeId || node.type !== "thinkingNode") return node;
                previousVisibility = normalizeVisibility(node.data?.visibility);
                nextNodeTitle = node.data?.title || "";
                nextNodeType = node.data?.category || "";
                const updated = {
                    ...node,
                    data: {
                        ...node.data,
                        ownerId: MOCK_CURRENT_USER_ID,
                        editedBy: "You",
                        visibility: normalizedNext,
                    },
                };
                const rebuilt = toReactFlowNode({
                    id: updated.id,
                    position: updated.position,
                    data: {
                        label: updated.data?.title,
                        content: updated.data?.content,
                        category: updated.data?.category,
                        phase: updated.data?.phase,
                        ownerId: updated.data?.ownerId,
                        editedBy: updated.data?.editedBy,
                        sourceType: updated.data?.sourceType,
                        visibility: updated.data?.visibility,
                        confidence: updated.data?.confidence,
                    },
                }, null);
                return {
                    ...updated,
                    ...rebuilt,
                    parentNode: updated.parentNode,
                    extent: updated.extent,
                    hidden: updated.hidden,
                    selected: updated.selected,
                };
            })
        );
        if (normalizedNext === "shared" && previousVisibility !== "shared") {
            recordProjectActivity("node_shared", {
                nodeId,
                nodeTitle: nextNodeTitle,
                nodeType: nextNodeType,
            });
        }
        syncVisibilityChangeMock(nodeId, normalizedNext);
    }, [recordProjectActivity, setNodes, syncVisibilityChangeMock]);

    const handleNodeSelectionChange = useCallback(
        ({ nodes: selectedNodes = [] } = {}) => {
            handleSelectionChange?.({ nodes: selectedNodes });
            const firstThinkingNode = selectedNodes.find((node) => node?.type === "thinkingNode");
            if (firstThinkingNode?.id) {
                setSelectedNodeId(firstThinkingNode.id);
                setDrawerMode("chat");
                setIsDrawerOpen(true);
            } else {
                setSelectedNodeId(null);
            }
        },
        [handleSelectionChange]
    );

    const {
        hasThinkingGraph,
        selectedNode,
        visibleCanvasNodeIds,
        canvasNodes,
        canvasEdges,
        selectedNodeLinkedNodes,
    } = useThinkingGraphState({
        nodes,
        edges,
        selectedNodeId,
        canvasMode,
        currentUserId: MOCK_CURRENT_USER_ID,
    });

    useEffect(() => {
        if (selectedNodeId && !visibleCanvasNodeIds.has(selectedNodeId)) {
            setSelectedNodeId(null);
        }
    }, [selectedNodeId, visibleCanvasNodeIds]);

    const handlePromoteSelectedNode = useCallback(() => {
        if (!selectedNodeId || !selectedNode) return;
        handleSetNodeVisibility(selectedNodeId, getNextVisibility(selectedNode.data?.visibility));
    }, [handleSetNodeVisibility, selectedNode, selectedNodeId]);

    const handleDemoteSelectedNode = useCallback(() => {
        if (!selectedNodeId || !selectedNode) return;
        handleSetNodeVisibility(selectedNodeId, getPreviousVisibility(selectedNode.data?.visibility));
    }, [handleSetNodeVisibility, selectedNode, selectedNodeId]);

    const pendingCandidatePreview = useMemo(() => {
        if (!pendingChatCandidateGraph) return null;
        return {
            ...pendingChatCandidateGraph,
            nodes: pendingChatCandidateGraph.nodes.map((node) => toReactFlowNode(node, null)),
        };
    }, [pendingChatCandidateGraph]);

    const normalizedStage = useMemo(() => normalizeReasoningStage(stage), [stage]);
    const reasoningModeProfile = useMemo(() => getReasoningModeProfile(normalizedStage), [normalizedStage]);
    const composerSuggestedTypes = useMemo(() => {
        const modeBias = reasoningModeProfile.nodeBias || [];
        if (!selectedNode) {
            return modeBias.slice(0, 4);
        }
        const category = selectedNode.data?.category;
        const contextualMap = {
            Problem: ["Evidence", "Insight", "Risk", "Constraint"],
            Goal: ["Idea", "Option", "Constraint", "Risk"],
            Insight: ["Evidence", "Idea", "OpenQuestion", "Risk"],
            Evidence: ["Insight", "Conflict", "Risk", "OpenQuestion"],
            Idea: ["Option", "Evidence", "Risk", "Constraint"],
            Decision: ["Evidence", "Constraint", "Risk", "OpenQuestion"],
        };
        const base = contextualMap[category] || ["Insight", "Evidence", "Idea", "Risk"];
        return [...new Set([...modeBias, ...base])].slice(0, 5);
    }, [reasoningModeProfile.nodeBias, selectedNode]);

    const composerHintText = useMemo(() => {
        if (selectedNode) {
            return reasoningModeProfile.selectedNodePrompt;
        }
        return reasoningModeProfile.composerHint;
    }, [reasoningModeProfile, selectedNode]);

    const { handleInputSubmit } = useThinkingAiAnalyze({
        nodes,
        edges,
        stage,
        projectTitle,
        setNodes,
        setEdges,
        setSuggestions,
        setHighlightedNodeIds,
        setDrawerMode,
        setIsDrawerOpen,
        recordProjectActivity,
        animateViewportToNodes,
        setIsAnalyzing,
        currentUserId: MOCK_CURRENT_USER_ID,
    });

    // 우측 Drawer 하단 입력창 동작:
    // - 기본(컨텍스트 없음)일 때: 사용자 입력을 기반으로 /api/analyze 를 호출해 새 노드 + 제안 생성
    // - 제안 카드/attachedNodes 컨텍스트가 있을 때: 해당 컨텍스트를 anchor 로 /api/chat 경로를 사용
    const handleRightDrawerSubmit = useCallback(async () => {
        const trimmedText = chatInput.trim();
        if (!trimmedText) return;

        if (!activeSuggestion && !isAnalyzing) {
            await handleInputSubmit({
                text: trimmedText,
                selectedNode,
            });
            setChatInput("");
            return;
        }

        await handleDrawerChatSubmit();
    }, [activeSuggestion, chatInput, handleDrawerChatSubmit, handleInputSubmit, isAnalyzing, selectedNode, setChatInput]);

    return (
        <div className="w-full h-screen relative flex flex-col overflow-hidden bg-slate-50">
            <div
                className="pointer-events-none absolute bottom-7 left-6 z-[20] flex h-[24.5px] w-[157px] items-center whitespace-nowrap"
                style={{
                    fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
                    fontStyle: "normal",
                    fontWeight: 600,
                    fontSize: "13.59805px",
                    lineHeight: "180%",
                    letterSpacing: "0.14em",
                    color: "#4B5D7B",
                }}
            >
                THINKING MACHINE
            </div>
            <TopBar
                stage={normalizedStage}
                onStageChange={setStage}
                projectTitle={projectTitle}
                onProjectTitleChange={setProjectTitle}
                projectMetaHref={projectMetaHref}
                projectMetaLabel="Project workspace"
                canvasMode={canvasMode}
                onCanvasModeChange={setCanvasMode}
                drawerMode={drawerMode}
                onDrawerModeChange={handleDrawerModeChange}
                isDrawerOpen={isDrawerOpen}
            />

            <header className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-end items-center bg-transparent pointer-events-none">
                <div className="flex gap-2 pointer-events-auto">
                    {isAdminMode && (
                        <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/76 px-3 py-2 text-xs text-slate-700 shadow-lg backdrop-blur-md">
                            <span className="rounded-full bg-slate-800/90 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                                Admin Mode
                            </span>
                            <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-800">
                                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                Autonomous Agent Active
                            </span>
                            <span className="text-slate-400">|</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${currentRoleMeta.className}`}>
                                {currentRoleMeta.label}
                            </span>
                            <span>Nodes {canvasNodes.length}</span>
                            <span>Suggestions {suggestions.length}</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 w-full h-full relative">
                {!hasThinkingGraph ? (
                    <div className="tm-canvas-bg h-full w-full" data-stage={stage}>
                        <div className="absolute inset-0 z-[5]" />
                    </div>
                ) : (
                    <>
                        <NodeMap
                            nodes={canvasNodes}
                            edges={canvasEdges}
                            onNodesChange={filteredOnNodesChange}
                            onEdgesChange={onEdgesChange}
                            highlightedNodeIds={highlightedNodeIds}
                            onNodeDragStart={handleNodeDragStart}
                            onNodeDrag={handleNodeDragUpdate}
                            onNodeDragStop={handleNodeDragStop}
                            onInit={handleFlowInit}
                            onSelectionChange={handleNodeSelectionChange}
                            selectionBoxEnabled={selectionBoxEnabled}
                            isCanvasInteractive={isCanvasInteractive}
                            draftHandlers={{
                                onPostitChangeText: handlePostitChangeText,
                                onImagePick: handleImagePick,
                                onImageChangeCaption: handleImageChangeCaption,
                                onDraftSubmit: handleDraftSubmit,
                            }}
                            draftSubmittingIds={draftSubmittingIds}
                            canvasStage={stage}
                        />

                    </>
                )}

                <LeftCanvasTools
                    onAddPostit={createPostitDraft}
                    onAddImage={createImageDraft}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onFitView={handleFitCanvas}
                    onToggleInteractive={handleToggleCanvasInteractive}
                    isInteractive={isCanvasInteractive}
                    uiLanguage="en"
                />

                {showDraftConvertPrompt && (
                    <div className="pointer-events-none absolute inset-x-0 top-20 z-[75] flex justify-center">
                        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/70 bg-white/72 px-4 py-2 text-[12px] font-semibold text-slate-700 shadow-[0_12px_26px_rgba(0,0,0,0.14)] backdrop-blur-[12px]">
                            <span>
                                Convert {selectedDraftIds.length} drafts into nodes?
                            </span>
                            <button
                                type="button"
                                onClick={() => void convertDraftsToGroup(draftConvertIdsRef.current)}
                                className="inline-flex items-center justify-center rounded-full bg-teal-500 px-3 py-1 text-[12px] font-semibold text-white transition hover:bg-teal-600 disabled:opacity-55"
                                disabled={isAnalyzing}
                                aria-label="Confirm convert drafts"
                            >
                                ✓
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowDraftConvertPrompt(false)}
                                className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/70 px-3 py-1 text-[12px] font-semibold text-slate-600 transition hover:bg-white/80"
                                aria-label="Cancel convert drafts"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                <AnimatePresence>
                    {isDrawerOpen ? (
                        <RightAgentDrawer
                            isOpen={isDrawerOpen}
                            mode={drawerMode}
                            suggestions={suggestions}
                            onToggleMode={handleDrawerModeChange}
                            activeSuggestion={activeSuggestion}
                            selectedNode={selectedNode}
                            linkedNodes={selectedNodeLinkedNodes}
                            candidateGraph={pendingCandidatePreview}
                            currentUserRole={MOCK_CURRENT_USER_ROLE}
                            projectLastUpdated={projectLastUpdated}
                            activityLog={activityLog}
                            lastRefreshedAt={lastRefreshedAt}
                            chatMessages={chatMessages}
                            chatInput={chatInput}
                            isChatLoading={isAnalyzing || isChatLoading}
                            isChatConverting={isChatConverting}
                            onChatInputChange={setChatInput}
                            onChatSubmit={handleRightDrawerSubmit}
                            onChatConvertToNodes={handleDrawerChatConvertToNodes}
                            onCommitCandidateNodes={handleCommitCandidateNodes}
                            onCommitCandidateNodesAsPrivate={handleCommitCandidateNodesAsPrivate}
                            onDiscardCandidateNodes={handleDiscardCandidateNodes}
                            onPromoteSelectedNode={handlePromoteSelectedNode}
                            onDemoteSelectedNode={handleDemoteSelectedNode}
                            onSetNodeVisibility={handleSetNodeVisibility}
                            onChatContextSelect={handleDrawerContextSelect}
                            modeLabel={reasoningModeProfile.label}
                            candidateHint={reasoningModeProfile.candidateHint}
                            selectedNodeQuickActions={reasoningModeProfile.selectedNodeActions}
                            uiLanguage="en"
                            chatButtonRef={chatButtonRef}
                            chatDropZoneRef={chatDropZoneRef}
                            isChatDropActive={isChatDropActive}
                        />
                    ) : null}
                </AnimatePresence>

                <AnimatePresence>
                    {ghostDrag && (
                        <motion.div
                            key="ghost-drag"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{
                                opacity: ghostDrag.phase === "dropping" ? 0 : 0.55,
                                scale: ghostDrag.phase === "dropping" ? 0.72 : 1,
                                x: (ghostDrag.phase === "dropping" ? ghostDrag.targetX : ghostDrag.x) - 90,
                                y: (ghostDrag.phase === "dropping" ? ghostDrag.targetY : ghostDrag.y) - 40,
                            }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", damping: 26, stiffness: 420 }}
                            className="pointer-events-none fixed left-0 top-0 z-[90]"
                            style={{ width: 180, height: 80 }}
                        >
                            <div
                                className="h-full w-full rounded-[26px] border border-white/70 bg-white/35 shadow-[0_16px_38px_rgba(0,0,0,0.14)] backdrop-blur-[10px]"
                                aria-hidden
                            >
                                <div className="flex h-full w-full items-center justify-center px-4 text-[12px] font-semibold text-slate-800/80">
                                    {ghostDrag.count > 1 ? `${ghostDrag.count} nodes` : "1 node"}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </main>
        </div>
    );
}
