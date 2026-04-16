"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    useNodesState,
    useEdgesState,
    getViewportForBounds,
} from "reactflow";
import { AnimatePresence, motion } from "framer-motion";
import NodeMap from "./NodeMap";
import LeftTeamContextPanel from "./LeftTeamContextPanel";
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
import { fetchProjectGraph, saveProjectGraph, summarizeTeamContext, updateProject } from "@/lib/thinkingMachine/apiClient";
import { hydrateProjectEdges, hydrateProjectNodes, serializeProjectGraph } from "@/lib/thinkingMachine/projectGraph";
import { readCurrentUser } from "@/lib/thinkingMachine/clientUser";
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

function getNodeSnapshot(node, edges = []) {
    if (!node) return null;
    const linkedNodeIds = (Array.isArray(edges) ? edges : [])
        .filter((edge) => edge?.source === node.id || edge?.target === node.id)
        .map((edge) => (edge.source === node.id ? edge.target : edge.source))
        .filter(Boolean);
    return {
        id: node.id,
        title: node?.data?.title || "",
        content: node?.data?.content || "",
        category: node?.data?.category || "",
        phase: node?.data?.phase || "",
        visibility: normalizeVisibility(node?.data?.visibility),
        linkedNodeIds,
    };
}

function getRelatedNodeIds(nodeId, edges = []) {
    return (Array.isArray(edges) ? edges : [])
        .filter((edge) => edge?.source === nodeId || edge?.target === nodeId)
        .map((edge) => (edge.source === nodeId ? edge.target : edge.source))
        .filter(Boolean);
}

export default function ThinkingMachine({
    projectId = "",
    initialProjectTitle = "Thinking Machine",
    projectMetaHref = "/projects",
    projectMetaLabel = "Back to projects",
    currentUser: initialCurrentUser = null,
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
    const [hasStartedInput, setHasStartedInput] = useState(false);
    const [currentUser, setCurrentUser] = useState(initialCurrentUser || null);
    const [isGraphHydrating, setIsGraphHydrating] = useState(true);
    const [selectedTeamMemberId, setSelectedTeamMemberId] = useState(null);
    const [selectedActivityEventId, setSelectedActivityEventId] = useState(null);
    const [teamContextSummary, setTeamContextSummary] = useState(null);
    const [isTeamContextLoading, setIsTeamContextLoading] = useState(false);
    const [teamContextError, setTeamContextError] = useState("");
    const [isTeamContextPanelOpen, setIsTeamContextPanelOpen] = useState(false);
    const lastSavedGraphRef = useRef("");
    const lastSyncedTitleRef = useRef(initialProjectTitle);

    const { isAdminMode } = useAdminMode({
        storageKey: ADMIN_MODE_STORAGE_KEY,
        hintDismissedKey: ADMIN_HINT_DISMISSED_KEY,
    });

    useEffect(() => {
        if (initialCurrentUser) {
            setCurrentUser(initialCurrentUser);
            return;
        }
        if (typeof window !== "undefined") {
            setCurrentUser(readCurrentUser());
        }
    }, [initialCurrentUser]);

    const currentUserId = currentUser?.id || MOCK_CURRENT_USER_ID;
    const currentUserName = currentUser?.name || "You";
    const currentUserRole = currentUser?.role || MOCK_CURRENT_USER_ROLE;
    const currentUserEmail = currentUser?.email || "";
    const currentUserPicture = currentUser?.picture || "";

    // AI 제안 패널
    const [suggestions, setSuggestions] = useState([]);
    const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState(() => new Set());
    const [highlightedNodeIds, setHighlightedNodeIds] = useState(new Set());
    const nodeContextSuggestions = useMemo(() => {
        return [...nodes]
            .filter((node) => node?.type === "thinkingNode" && node?.id)
            .reverse()
            .map((node) => ({
                id: `node-context-${node.id}`,
                nodeId: node.id,
                _source: "node-context",
                type: "attachedNodes",
                title: node?.data?.title || "",
                content: node?.data?.content || "",
                category: node?.data?.category,
                phase: node?.data?.phase,
                sourceType: node?.data?.sourceType,
                visibility: node?.data?.visibility,
                confidence: node?.data?.confidence || "medium",
                attached_nodes: [
                    {
                        id: node.id,
                        title: node?.data?.title || "",
                        content: node?.data?.content || "",
                        category: node?.data?.category,
                        phase: node?.data?.phase,
                    },
                ],
            }));
    }, [nodes]);
    const drawerSuggestions = useMemo(() => {
        const combined = [...suggestions, ...nodeContextSuggestions];
        return combined.filter((item) => item?.id && !dismissedSuggestionIds.has(item.id));
    }, [dismissedSuggestionIds, nodeContextSuggestions, suggestions]);
    const unseenSuggestions = useMemo(
        () => drawerSuggestions,
        [drawerSuggestions]
    );

    // Chat state (Drawer Chat primary + optional legacy dialog fallback)
    const [, setAttachedNodes] = useState([]); // [{id,title,content,category,phase,sourceType,visibility,confidence}]
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
        suggestions: unseenSuggestions,
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

    const handleDrawerSuggestionSelect = useCallback((item) => {
        if (!item) return;
        if (item?.id && item?._source !== "node-auto") {
            setDismissedSuggestionIds((prev) => {
                const next = new Set(prev);
                next.add(item.id);
                return next;
            });
        }
        handleDrawerContextSelect(item);
    }, [handleDrawerContextSelect]);

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
        toggleIdeaGroupMode,
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
        currentUserId,
        currentUserName,
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

    const {
        projectLastUpdated,
        activityLog,
        teamMembers,
        currentMember,
        lastRefreshedAt,
        recordProjectActivity,
        refreshProjectCollaborationMeta,
    } = useThinkingCollaboration({
        projectId,
        currentUserId,
        currentUserRole,
        currentUserName,
        currentUserEmail,
        currentUserPicture,
    });
    const effectiveCurrentUserRole = currentMember?.role || currentUserRole;
    const currentRoleMeta = getRoleMeta(effectiveCurrentUserRole);
    const normalizedStage = useMemo(() => normalizeReasoningStage(stage), [stage]);

    const handleFlowInit = (instance) => {
        reactFlowRef.current = instance;
    };

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

    useEffect(() => {
        let cancelled = false;
        const hydrateGraph = async () => {
            if (!projectId) {
                setIsGraphHydrating(false);
                return;
            }
            try {
                const payload = await fetchProjectGraph(projectId);
                if (cancelled) return;
                const hydratedNodes = hydrateProjectNodes(payload?.graph?.nodes || []);
                const hydratedEdges = hydrateProjectEdges(payload?.graph?.edges || []);
                const nextStage = payload?.graph?.stage || "research-diverge";
                setNodes(hydratedNodes);
                setEdges(hydratedEdges);
                setStage(nextStage);
                if (payload?.project?.title) {
                    setProjectTitle(payload.project.title);
                    lastSyncedTitleRef.current = payload.project.title;
                }
                setHasStartedInput(hydratedNodes.some((node) => node?.type === "thinkingNode"));
                lastSavedGraphRef.current = JSON.stringify(
                    serializeProjectGraph(hydratedNodes, hydratedEdges, nextStage)
                );
            } catch (error) {
                console.error("Failed to hydrate project graph:", error);
            } finally {
                if (!cancelled) setIsGraphHydrating(false);
            }
        };
        void hydrateGraph();
        return () => {
            cancelled = true;
        };
    }, [projectId, setEdges, setNodes]);

    useEffect(() => {
        if (!projectId || !currentUserId || isGraphHydrating) return undefined;
        const timeoutId = window.setTimeout(async () => {
            const serialized = serializeProjectGraph(nodes, edges, normalizedStage);
            const nextKey = JSON.stringify(serialized);
            if (nextKey === lastSavedGraphRef.current) return;
            try {
                await saveProjectGraph(projectId, {
                    ...serialized,
                    actor: {
                        id: currentUserId,
                        name: currentUserName,
                        email: currentUserEmail,
                        picture: currentUserPicture,
                        role: effectiveCurrentUserRole,
                    },
                });
                lastSavedGraphRef.current = nextKey;
            } catch (error) {
                console.error("Failed to persist graph:", error);
            }
        }, 450);
        return () => window.clearTimeout(timeoutId);
    }, [
        currentUserEmail,
        currentUserId,
        currentUserName,
        currentUserPicture,
        edges,
        effectiveCurrentUserRole,
        isGraphHydrating,
        nodes,
        normalizedStage,
        projectId,
    ]);

    useEffect(() => {
        if (!projectId || !currentUserId || isGraphHydrating) return undefined;
        const nextTitle = String(projectTitle || "").trim() || "Untitled Project";
        if (nextTitle === lastSyncedTitleRef.current) return undefined;
        const timeoutId = window.setTimeout(async () => {
            try {
                await updateProject(projectId, {
                    title: nextTitle,
                    actor: {
                        id: currentUserId,
                        name: currentUserName,
                        email: currentUserEmail,
                        picture: currentUserPicture,
                        role: effectiveCurrentUserRole,
                    },
                });
                lastSyncedTitleRef.current = nextTitle;
                await refreshProjectCollaborationMeta();
            } catch (error) {
                console.error("Failed to sync project title:", error);
            }
        }, 350);
        return () => window.clearTimeout(timeoutId);
    }, [
        currentUserEmail,
        currentUserId,
        currentUserName,
        currentUserPicture,
        effectiveCurrentUserRole,
        isGraphHydrating,
        projectId,
        projectTitle,
        refreshProjectCollaborationMeta,
    ]);

    const handleStageChange = useCallback((nextStage) => {
        const safeStage = normalizeReasoningStage(nextStage);
        if (safeStage === normalizedStage) return;
        setStage(safeStage);
        void recordProjectActivity("stage_changed", {
            nodeTitle: safeStage,
            nodeType: "Stage",
            before: { stage: normalizedStage },
            after: { stage: safeStage },
            relatedNodeIds: [],
            metadata: {
                reason: "Canvas reasoning stage changed",
            },
            stage: safeStage,
        });
    }, [normalizedStage, recordProjectActivity]);

    // 채팅 대화에서 노드+엣지 추가
    const handleAddNodesFromChat = useCallback((data, { commitVisibility = "shared" } = {}) => {
        const incoming = Array.isArray(data?.nodes) ? data.nodes : [];
        const incomingEdges = Array.isArray(data?.edges) ? data.edges : [];
        const normalizedIncoming = incoming.map((n) => ({
            ...n,
            data: {
                ...n.data,
                ownerId: currentUserId,
                editedBy: currentUserName,
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
            const targetNode = relaidNodes.find((item) => item.id === node.id);
            const relatedNodeIds = getRelatedNodeIds(node.id, nextEdges);
            void recordProjectActivity("node_created", {
                nodeId: node.id,
                nodeTitle: node?.data?.label,
                nodeType: node?.data?.category,
                before: null,
                after: getNodeSnapshot(targetNode, nextEdges),
                relatedNodeIds,
                stage: normalizedStage,
            });
            if (node?.data?.category === "Conflict") {
                void recordProjectActivity("conflict_created", {
                    nodeId: node.id,
                    nodeTitle: node?.data?.label,
                    nodeType: node?.data?.category,
                    before: null,
                    after: getNodeSnapshot(targetNode, nextEdges),
                    relatedNodeIds,
                    stage: normalizedStage,
                });
            }
        });
    }, [animateViewportToNodes, currentUserId, currentUserName, edges, nodes, normalizedStage, recordProjectActivity, setEdges, setNodes]);

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
                        ownerId: currentUserId,
                        editedBy: currentUserName,
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

    const handleSetNodeVisibility = useCallback((nodeId, nextVisibility) => {
        const normalizedNext = normalizeVisibility(nextVisibility);
        let previousVisibility = null;
        let nextNodeTitle = "";
        let nextNodeType = "";
        let beforeSnapshot = null;
        let afterSnapshot = null;
        const relatedNodeIds = getRelatedNodeIds(nodeId, edges);
        setNodes((prevNodes) =>
            prevNodes.map((node) => {
                if (node.id !== nodeId || node.type !== "thinkingNode") return node;
                previousVisibility = normalizeVisibility(node.data?.visibility);
                nextNodeTitle = node.data?.title || "";
                nextNodeType = node.data?.category || "";
                beforeSnapshot = getNodeSnapshot(node, edges);
                const updated = {
                    ...node,
                    data: {
                        ...node.data,
                        ownerId: currentUserId,
                        editedBy: currentUserName,
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
                afterSnapshot = getNodeSnapshot({ ...updated, ...rebuilt }, edges);
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
        void recordProjectActivity("node_visibility_changed", {
            nodeId,
            nodeTitle: nextNodeTitle,
            nodeType: nextNodeType,
            before: beforeSnapshot,
            after: afterSnapshot,
            relatedNodeIds,
            stage: normalizedStage,
        });
        if (normalizedNext === "shared" && previousVisibility !== "shared") {
            void recordProjectActivity("node_shared", {
                nodeId,
                nodeTitle: nextNodeTitle,
                nodeType: nextNodeType,
                before: beforeSnapshot,
                after: afterSnapshot,
                relatedNodeIds,
                stage: normalizedStage,
            });
        }
    }, [currentUserId, currentUserName, edges, normalizedStage, recordProjectActivity, setNodes]);

    const handleNodeSelectionChange = useCallback(
        ({ nodes: selectedNodes = [] } = {}) => {
            handleSelectionChange?.({ nodes: selectedNodes });
            const firstThinkingNode = selectedNodes.find((node) => node?.type === "thinkingNode");
            if (firstThinkingNode?.id) {
                setSelectedNodeId(firstThinkingNode.id);
                setDrawerMode("chat");
                setIsDrawerOpen(true);
            }
            // 캔버스 빈 공간을 클릭해도 선택만 해제되고,
            // 마지막으로 본 노드 컨텍스트와 AI 의견은 그대로 유지되도록
            // 선택 노드를 강제로 null 로 리셋하지 않는다.
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
        currentUserId,
    });

    useEffect(() => {
        if (selectedNodeId && !visibleCanvasNodeIds.has(selectedNodeId)) {
            const clearSelectionTimer = window.setTimeout(() => {
                setSelectedNodeId((currentId) => (currentId === selectedNodeId ? null : currentId));
            }, 0);
            return () => window.clearTimeout(clearSelectionTimer);
        }
    }, [selectedNodeId, visibleCanvasNodeIds]);

    // 선택된 노드를 기반으로 AI 의견이 항상 Workspace 상단에 보이도록
    // 자동 attachedNodes suggestion 을 만든다.
    useEffect(() => {
        if (!selectedNode) return;
        // 사용자가 명시적으로 선택한 제안(activeSuggestion)이 있으면 건드리지 않는다.
        if (activeSuggestion && activeSuggestion._source !== "node-auto") return;
        if (activeSuggestion && activeSuggestion._source === "node-auto" && activeSuggestion.nodeId === selectedNode.id) {
            return;
        }

        const autoSuggestion = {
            id: `node-auto-${selectedNode.id}`,
            nodeId: selectedNode.id,
            _source: "node-auto",
            type: "attachedNodes",
            title: selectedNode.data?.title || "",
            content: selectedNode.data?.content || "",
            category: selectedNode.data?.category,
            phase: selectedNode.data?.phase,
            attached_nodes: [
                {
                    id: selectedNode.id,
                    title: selectedNode.data?.title || "",
                    content: selectedNode.data?.content || "",
                    category: selectedNode.data?.category,
                    phase: selectedNode.data?.phase,
                },
            ],
        };

        const syncDrawerTimer = window.setTimeout(() => {
            setActiveSuggestion(autoSuggestion);
            setDrawerMode("chat");
            setIsDrawerOpen(true);
        }, 0);

        return () => window.clearTimeout(syncDrawerTimer);
    }, [activeSuggestion, selectedNode, setActiveSuggestion, setDrawerMode, setIsDrawerOpen]);

    const handlePromoteSelectedNode = useCallback(() => {
        if (!selectedNodeId || !selectedNode) return;
        handleSetNodeVisibility(selectedNodeId, getNextVisibility(selectedNode.data?.visibility));
    }, [handleSetNodeVisibility, selectedNode, selectedNodeId]);

    const handleDemoteSelectedNode = useCallback(() => {
        if (!selectedNodeId || !selectedNode) return;
        handleSetNodeVisibility(selectedNodeId, getPreviousVisibility(selectedNode.data?.visibility));
    }, [handleSetNodeVisibility, selectedNode, selectedNodeId]);

    const handleClearSelectedNode = useCallback(() => {
        setSelectedNodeId(null);
        setActiveSuggestion(null);
    }, [setActiveSuggestion]);

    const pendingCandidatePreview = useMemo(() => {
        if (!pendingChatCandidateGraph) return null;
        return {
            ...pendingChatCandidateGraph,
            nodes: pendingChatCandidateGraph.nodes.map((node) => toReactFlowNode(node, null)),
        };
    }, [pendingChatCandidateGraph]);

    const reasoningModeProfile = useMemo(() => getReasoningModeProfile(normalizedStage), [normalizedStage]);
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
        currentUserId,
        currentUserName,
    });

    // 우측 Drawer 하단 입력창 동작:
    // - 기본(컨텍스트 없음)일 때: 사용자 입력을 기반으로 /api/analyze 를 호출해 새 노드 + 제안 생성
    // - 제안 카드/attachedNodes 컨텍스트가 있을 때: 해당 컨텍스트를 anchor 로 /api/chat 경로를 사용
    const handleRightDrawerSubmit = useCallback(async () => {
        const trimmedText = chatInput.trim();
        if (!trimmedText) return;
        setHasStartedInput(true);

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

    const filteredTeamActivity = useMemo(() => {
        const items = Array.isArray(activityLog) ? activityLog : [];
        if (!selectedTeamMemberId) return items;
        return items.filter((item) => item?.userId === selectedTeamMemberId);
    }, [activityLog, selectedTeamMemberId]);

    const selectedActivityItem = useMemo(
        () => filteredTeamActivity.find((item) => item?.id === selectedActivityEventId) || null,
        [filteredTeamActivity, selectedActivityEventId]
    );

    const focusNodesByIds = useCallback((nodeIds = []) => {
        const ids = Array.from(new Set((Array.isArray(nodeIds) ? nodeIds : []).filter(Boolean)));
        if (!ids.length) return;
        setCanvasMode("team");
        setHighlightedNodeIds(new Set(ids));
        const targetNodes = nodes.filter((node) => ids.includes(node.id));
        if (targetNodes.length) {
            animateViewportToNodes(targetNodes);
            const firstTarget = targetNodes.find((node) => node?.type === "thinkingNode");
            if (firstTarget?.id) {
                setSelectedNodeId(firstTarget.id);
                setDrawerMode("chat");
                setIsDrawerOpen(true);
            }
        }
    }, [animateViewportToNodes, nodes]);

    const handleSelectTeamMember = useCallback((memberId) => {
        setSelectedTeamMemberId(memberId);
        setSelectedActivityEventId(null);
        setTeamContextSummary(null);
        setTeamContextError("");
    }, []);

    const handleSelectActivity = useCallback((item) => {
        if (!item) return;
        setSelectedActivityEventId(item.id);
        if (item?.userId) setSelectedTeamMemberId(item.userId);
        setTeamContextSummary(null);
        setTeamContextError("");
        focusNodesByIds([item.nodeId, ...(item.relatedNodeIds || [])]);
    }, [focusNodesByIds]);

    const handleExplainTeamContext = useCallback(async () => {
        const eventScope = selectedActivityItem
            ? [selectedActivityItem]
            : filteredTeamActivity.slice(0, 8);
        const relatedNodeIds = Array.from(
            new Set(
                eventScope.flatMap((item) => [item?.nodeId, ...((Array.isArray(item?.relatedNodeIds) ? item.relatedNodeIds : []))])
                    .filter(Boolean)
            )
        );
        const relatedNodes = nodes
            .filter((node) => relatedNodeIds.includes(node.id))
            .map((node) => ({
                id: node.id,
                title: node?.data?.title || "",
                content: node?.data?.content || "",
                category: node?.data?.category,
                phase: node?.data?.phase,
            }));

        setIsTeamContextLoading(true);
        setTeamContextError("");
        try {
            const member = teamMembers.find((item) => item?.id === selectedTeamMemberId) || null;
            const result = await summarizeTeamContext({
                projectId,
                projectTitle,
                memberId: member?.id || null,
                memberName: member?.name || "",
                memberRole: member?.role || "",
                activityEvents: eventScope,
                relatedNodes,
                stage: normalizedStage,
            });
            setTeamContextSummary(result);
            if (Array.isArray(result?.keyNodeIds) && result.keyNodeIds.length) {
                focusNodesByIds(result.keyNodeIds);
            }
        } catch (error) {
            setTeamContextError(
                error?.response?.data?.error ||
                error?.message ||
                "Failed to summarize the team context."
            );
        } finally {
            setIsTeamContextLoading(false);
        }
    }, [filteredTeamActivity, focusNodesByIds, nodes, normalizedStage, projectId, projectTitle, selectedActivityItem, selectedTeamMemberId, teamMembers]);

    const handleToggleTeamContextPanel = useCallback(() => {
        setIsTeamContextPanelOpen((prev) => !prev);
    }, []);

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
                onStageChange={handleStageChange}
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
                <LeftTeamContextPanel
                    isOpen={isTeamContextPanelOpen}
                    teamMembers={teamMembers}
                    activityItems={filteredTeamActivity}
                    selectedMemberId={selectedTeamMemberId}
                    selectedActivityId={selectedActivityEventId}
                    summary={teamContextSummary}
                    isSummaryLoading={isTeamContextLoading}
                    summaryError={teamContextError}
                    currentUserId={currentUserId}
                    onToggle={handleToggleTeamContextPanel}
                    onSelectMember={handleSelectTeamMember}
                    onSelectActivity={handleSelectActivity}
                    onExplainContext={handleExplainTeamContext}
                    onFocusNode={(nodeId) => focusNodesByIds([nodeId])}
                />
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
                                onToggleIdeaGroup: toggleIdeaGroupMode,
                            }}
                            draftSubmittingIds={draftSubmittingIds}
                            canvasStage={stage}
                        />

                    </>
                )}

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
                            stage={normalizedStage}
                            suggestions={unseenSuggestions}
                            onStageChange={handleStageChange}
                            activeSuggestion={activeSuggestion}
                            selectedNode={selectedNode}
                            linkedNodes={selectedNodeLinkedNodes}
                            candidateGraph={pendingCandidatePreview}
                            currentUserRole={effectiveCurrentUserRole}
                            projectLastUpdated={projectLastUpdated}
                            activityLog={activityLog}
                            lastRefreshedAt={lastRefreshedAt}
                            chatMessages={chatMessages}
                            chatInput={chatInput}
                            isChatLoading={isAnalyzing || isChatLoading}
                            isChatConverting={isChatConverting}
                            onChatInputChange={(value) => {
                                if (String(value || "").trim().length > 0) {
                                    setHasStartedInput(true);
                                }
                                setChatInput(value);
                            }}
                            onChatSubmit={handleRightDrawerSubmit}
                            onChatConvertToNodes={handleDrawerChatConvertToNodes}
                            onCommitCandidateNodes={handleCommitCandidateNodes}
                            onCommitCandidateNodesAsPrivate={handleCommitCandidateNodesAsPrivate}
                            onDiscardCandidateNodes={handleDiscardCandidateNodes}
                            onPromoteSelectedNode={handlePromoteSelectedNode}
                            onDemoteSelectedNode={handleDemoteSelectedNode}
                            onSetNodeVisibility={handleSetNodeVisibility}
                            onChatContextSelect={handleDrawerSuggestionSelect}
                            modeLabel={reasoningModeProfile.label}
                            candidateHint={reasoningModeProfile.candidateHint}
                            selectedNodeQuickActions={reasoningModeProfile.selectedNodeActions}
                            uiLanguage="en"
                            canvasMode={canvasMode}
                            onCanvasModeChange={setCanvasMode}
                            chatButtonRef={chatButtonRef}
                            chatDropZoneRef={chatDropZoneRef}
                            isChatDropActive={isChatDropActive}
                            onClearSelectedNode={handleClearSelectedNode}
                            onAddPostit={createPostitDraft}
                            onAddImage={createImageDraft}
                            showDrawerHint={!hasStartedInput && !nodes.some((node) => node?.type === "thinkingNode")}
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
