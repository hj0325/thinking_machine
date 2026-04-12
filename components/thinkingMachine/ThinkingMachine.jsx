"use client";

import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    useNodesState,
    useEdgesState,
    getViewportForBounds,
} from "reactflow";
import { AnimatePresence, motion } from "framer-motion";
import NodeMap from "./NodeMap";
import LeftCanvasTools from "./LeftCanvasTools";
import InputPanel from "./InputPanel";
import RightAgentDrawer from "./RightAgentDrawer";
import TopBar from "./TopBar";
import { toConnectorEdges } from "@/lib/thinkingMachine/connectorEdges";
import { toReactFlowNode } from "@/lib/thinkingMachine/reactflowTransforms";
import { computeNodeBounds, relayoutTopLevelThinkingNodes, shiftClusterRelativeToAnchor, shiftClusterRightOfExisting } from "@/lib/thinkingMachine/graphMerge";
import { analyze } from "@/lib/thinkingMachine/apiClient";
import { useAdminMode } from "@/components/thinkingMachine/hooks/useAdminMode";
import { useDrawerChat } from "@/components/thinkingMachine/hooks/useDrawerChat";
import { useDraftGrouping } from "@/components/thinkingMachine/hooks/useDraftGrouping";
import { useGhostDragToChat } from "@/components/thinkingMachine/hooks/useGhostDragToChat";
import {
    getReasoningModeProfile,
    getRoleMeta,
    getNextVisibility,
    getPreviousVisibility,
    normalizeReasoningStage,
    normalizeOwnerId,
    normalizeRelationLabel,
    normalizeVisibility,
} from "@/lib/thinkingMachine/nodeMeta";

const INITIAL_NODES = [];
const INITIAL_EDGES = [];
const ADMIN_MODE_STORAGE_KEY = "vtm-admin-mode-enabled";
const ADMIN_HINT_DISMISSED_KEY = "vtm-admin-shortcut-hint-dismissed";
const ADMIN_SHORTCUT_LABEL = "Ctrl/Cmd + Shift + A";
const PERSONAL_VISIBILITY = new Set(["private", "candidate"]);
const TEAM_VISIBILITY = new Set(["shared", "reviewed", "agreed"]);
const MOCK_CURRENT_USER_ID = "mock-user-1";
const MOCK_CURRENT_USER_ROLE = "owner";
const PROJECTS_STORAGE_KEY = "thinking-machine-projects";
const AUTO_REFRESH_MS = 15000;
const MAX_ACTIVITY_ITEMS = 24;
const AUTO_FIT_MAX_ZOOM = 1;

function mergeSuggestionUnique(prev, nextSuggestion) {
    if (!nextSuggestion) return prev;
    const key = `${String(nextSuggestion.category || "").toLowerCase()}::${String(nextSuggestion.title || "").trim().toLowerCase()}::${String(nextSuggestion.content || "").trim().toLowerCase()}`;
    const existingIndex = prev.findIndex((item) => {
        const existingKey = `${String(item?.category || "").toLowerCase()}::${String(item?.title || "").trim().toLowerCase()}::${String(item?.content || "").trim().toLowerCase()}`;
        return existingKey === key;
    });
    if (existingIndex === -1) return [nextSuggestion, ...prev];
    const clone = [...prev];
    clone.splice(existingIndex, 1);
    return [nextSuggestion, ...clone];
}

function getActivityStorageKey(projectId) {
    return `thinking-machine-activity-${projectId}`;
}

function readProjectsFromStorage() {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeProjectsToStorage(projects) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

function readActivityLog(projectId) {
    if (typeof window === "undefined" || !projectId) return [];
    try {
        const raw = window.localStorage.getItem(getActivityStorageKey(projectId));
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeActivityLog(projectId, entries) {
    if (typeof window === "undefined" || !projectId) return;
    window.localStorage.setItem(getActivityStorageKey(projectId), JSON.stringify(entries.slice(0, MAX_ACTIVITY_ITEMS)));
}

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
    const [hasDrawerModeSelection, setHasDrawerModeSelection] = useState(false);
    const [stage, setStage] = useState("research-diverge");
    const [projectTitle, setProjectTitle] = useState(initialProjectTitle);
    const [canvasMode, setCanvasMode] = useState("personal");
    const [isCanvasInteractive, setIsCanvasInteractive] = useState(true);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [pendingChatCandidateGraph, setPendingChatCandidateGraph] = useState(null);
    const [projectLastUpdated, setProjectLastUpdated] = useState(null);
    const [activityLog, setActivityLog] = useState([]);
    const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

    const { isAdminMode, showAdminShortcutHint, dismissAdminShortcutHint } = useAdminMode({
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
    } = useDrawerChat({
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
        setHasDrawerModeSelection(true);
        handleDrawerModeToggle(nextMode);
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

    const hasThinkingGraph = useMemo(() => {
        return nodes.some((n) => n?.type === "thinkingNode" || n?.type === "ideaGroup");
    }, [nodes]);
    const currentRoleMeta = getRoleMeta(MOCK_CURRENT_USER_ROLE);

    const refreshProjectCollaborationMeta = useCallback(() => {
        if (!projectId || typeof window === "undefined") return;
        const projects = readProjectsFromStorage();
        const matchedProject = projects.find((item) => item?.id === projectId) || null;
        const nextActivity = readActivityLog(projectId);
        startTransition(() => {
            setProjectLastUpdated(matchedProject?.updatedAt || null);
            setActivityLog(nextActivity);
            setLastRefreshedAt(new Date().toISOString());
        });
    }, [projectId]);

    const recordProjectActivity = useCallback((actionType, payload = {}) => {
        if (!projectId || typeof window === "undefined") return;
        const timestamp = new Date().toISOString();
        const nextProjects = readProjectsFromStorage().map((project) =>
            project?.id === projectId ? { ...project, updatedAt: timestamp } : project
        );
        writeProjectsToStorage(nextProjects);

        const nextEntry = {
            id: `${actionType}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
            type: actionType,
            timestamp,
            userId: MOCK_CURRENT_USER_ID,
            userRole: MOCK_CURRENT_USER_ROLE,
            ...payload,
        };
        const nextActivity = [nextEntry, ...readActivityLog(projectId)].slice(0, MAX_ACTIVITY_ITEMS);
        writeActivityLog(projectId, nextActivity);
        refreshProjectCollaborationMeta();
    }, [projectId, refreshProjectCollaborationMeta]);

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

    useEffect(() => {
        refreshProjectCollaborationMeta();
    }, [refreshProjectCollaborationMeta]);

    useEffect(() => {
        if (!projectId) return undefined;
        const intervalId = window.setInterval(() => {
            refreshProjectCollaborationMeta();
        }, AUTO_REFRESH_MS);
        return () => window.clearInterval(intervalId);
    }, [projectId, refreshProjectCollaborationMeta]);

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
        const candidateNodes = incoming.map((n) => ({
            ...n,
            data: {
                ...n.data,
                ownerId: MOCK_CURRENT_USER_ID,
                editedBy: "You",
                visibility: "candidate",
            },
        }));
        const candidateEdges = incomingEdges.map((e) => ({
            ...e,
            label: normalizeRelationLabel(e?.label),
        }));
        setPendingChatCandidateGraph({
            nodes: candidateNodes,
            edges: candidateEdges,
        });
        setDrawerMode("chat");
        setIsDrawerOpen(true);
    }

    const handleCommitCandidateNodes = useCallback(() => {
        if (!pendingChatCandidateGraph) return;
        handleAddNodesFromChat(pendingChatCandidateGraph, { commitVisibility: "candidate" });
        setPendingChatCandidateGraph(null);
    }, [handleAddNodesFromChat, pendingChatCandidateGraph]);

    const handleCommitCandidateNodesAsPrivate = useCallback(() => {
        if (!pendingChatCandidateGraph) return;
        handleAddNodesFromChat(pendingChatCandidateGraph, { commitVisibility: "private" });
        setPendingChatCandidateGraph(null);
    }, [handleAddNodesFromChat, pendingChatCandidateGraph]);

    const handleDiscardCandidateNodes = useCallback(() => {
        setPendingChatCandidateGraph(null);
    }, []);

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
                setIsDrawerOpen(true);
            } else {
                setSelectedNodeId(null);
            }
        },
        [handleSelectionChange]
    );

    const selectedNode = useMemo(
        () => nodes.find((node) => node?.id === selectedNodeId && node?.type === "thinkingNode") || null,
        [nodes, selectedNodeId]
    );

    const visibleCanvasNodeIds = useMemo(() => {
        const visibleIds = new Set();

        const isThinkingNodeVisible = (node) => {
            const visibility = normalizeVisibility(node?.data?.visibility);
            const ownerId = normalizeOwnerId(node?.data?.ownerId);
            if (canvasMode === "personal") return ownerId === MOCK_CURRENT_USER_ID && PERSONAL_VISIBILITY.has(visibility);
            return TEAM_VISIBILITY.has(visibility);
        };

        nodes.forEach((node) => {
            if (!node?.id) return;

            if (node.type === "thinkingNode") {
                if (isThinkingNodeVisible(node)) {
                    visibleIds.add(node.id);
                    if (node.parentNode) visibleIds.add(node.parentNode);
                }
                return;
            }

            if (canvasMode === "personal" && (node.type === "postitDraft" || node.type === "imageDraft")) {
                visibleIds.add(node.id);
                if (node.parentNode) visibleIds.add(node.parentNode);
                return;
            }

            if (node.type === "ideaGroup") {
                const hasVisibleChildren = nodes.some((candidate) => candidate?.parentNode === node.id && visibleIds.has(candidate.id));
                if (hasVisibleChildren) visibleIds.add(node.id);
            }
        });

        nodes.forEach((node) => {
            if (node?.type === "ideaGroup") {
                const hasVisibleChildren = nodes.some((candidate) => candidate?.parentNode === node.id && visibleIds.has(candidate.id));
                if (hasVisibleChildren) visibleIds.add(node.id);
            }
        });

        return visibleIds;
    }, [canvasMode, nodes]);

    const canvasNodes = useMemo(
        () =>
            nodes
                .filter((node) => visibleCanvasNodeIds.has(node.id))
                .map((node) => ({
                    ...node,
                    className: [node.className || "", node.id === selectedNodeId ? "node-selected-focus" : ""]
                        .filter(Boolean)
                        .join(" "),
                })),
        [nodes, selectedNodeId, visibleCanvasNodeIds]
    );

    const canvasEdges = useMemo(
        () => edges.filter((edge) => visibleCanvasNodeIds.has(edge?.source) && visibleCanvasNodeIds.has(edge?.target)),
        [edges, visibleCanvasNodeIds]
    );

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

    const selectedNodeLinkedNodes = useMemo(() => {
        if (!selectedNode) return [];
        const nodeMap = new Map(nodes.map((node) => [node.id, node]));
        return edges
            .filter((edge) => edge?.source === selectedNode.id || edge?.target === selectedNode.id)
            .map((edge) => {
                const isOutgoing = edge.source === selectedNode.id;
                const linkedId = isOutgoing ? edge.target : edge.source;
                const linkedNode = nodeMap.get(linkedId);
                if (!linkedNode || linkedNode.type !== "thinkingNode") return null;
                return {
                    id: linkedNode.id,
                    title: linkedNode.data?.title || "Untitled node",
                    category: linkedNode.data?.category,
                    visibility: linkedNode.data?.visibility,
                    relation: normalizeRelationLabel(edge?.data?.label || edge?.label),
                    direction: isOutgoing ? "outgoing" : "incoming",
                };
            })
            .filter(Boolean);
    }, [edges, nodes, selectedNode]);

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

    const handleInputSubmit = useCallback(async ({ text, preferredType, selectedNode: inputContextNode } = {}) => {
        const rawText = typeof text === "string" ? text.trim() : "";
        if (!rawText) return;
        setIsAnalyzing(true);

        try {
            const contextualText = inputContextNode
                ? [
                    `Project: ${projectTitle}`,
                    `Selected node context: [${inputContextNode.data?.category}] ${inputContextNode.data?.title} - ${inputContextNode.data?.content || ""}`,
                    preferredType ? `Preferred new node type: ${preferredType}.` : "",
                    `User follow-up: ${rawText}`,
                  ].filter(Boolean).join("\n")
                : [projectTitle ? `Project: ${projectTitle}` : "", rawText].filter(Boolean).join("\n");

            const payload = {
                text: contextualText,
                history: nodes.map((n) => ({
                    id: n.id,
                    data: {
                        title: n.data.title,
                        category: n.data.category,
                        phase: n.data.phase,
                    },
                    position: n.position,
                })),
                stage,
            };

            const data = await analyze(payload);

            // 제안 노드(is_ai_generated=true)와 사용자 노드 분리
            const suggestionNodeData = data.nodes.find((n) => n.data.is_ai_generated);
            const userNodeDatas = data.nodes
                .filter((n) => !n.data.is_ai_generated)
                .map((n) => ({
                    ...n,
                    data: {
                        ...n.data,
                        ownerId: MOCK_CURRENT_USER_ID,
                        editedBy: "You",
                        visibility: "private",
                    },
                }));

            // e-suggest- 엣지에서 연결된 사용자 노드 ID 파악
            const suggestEdge = data.edges.find((e) => e.id.startsWith("e-suggest-"));
            const highlightedMainNodeId = suggestEdge ? suggestEdge.source : null;

            // 사용자 노드 → ReactFlow
            const rawNewNodes = userNodeDatas.map((n) => toReactFlowNode(n, highlightedMainNodeId));
            const enrichedNodes = inputContextNode
                ? shiftClusterRelativeToAnchor(inputContextNode, rawNewNodes)
                : nodes.length
                    ? shiftClusterRightOfExisting(nodes, rawNewNodes)
                    : rawNewNodes;
            const viewportTargets = inputContextNode ? [inputContextNode, ...enrichedNodes] : enrichedNodes;

            // 제안 노드 → SuggestionPanel
            if (suggestionNodeData) {
                const newSuggestion = {
                    id: `suggestion-${Date.now()}`,
                    title: suggestionNodeData.data.label,
                    content: suggestionNodeData.data.content,
                    category: suggestionNodeData.data.category,
                    phase: suggestionNodeData.data.phase,
                    sourceType: suggestionNodeData.data.sourceType,
                    visibility: suggestionNodeData.data.visibility,
                    confidence: suggestionNodeData.data.confidence,
                    ownerId: suggestionNodeData.data.ownerId,
                    relatedNodeId: highlightedMainNodeId,
                };
                setSuggestions((prev) => mergeSuggestionUnique(prev, newSuggestion));
                if (highlightedMainNodeId) {
                    setHighlightedNodeIds((prev) => new Set([...prev, highlightedMainNodeId]));
                }
            }

            // 엣지 처리 (e-suggest- 제외)
            const updatedExistingNodes = nodes.map((n) => ({
                ...n,
                className: highlightedNodeIds.has(n.id) ? 'node-highlighted' : (n.className || ''),
            }));
            const mergedNodes = [...updatedExistingNodes, ...enrichedNodes];
            const rawEdges = data.edges.filter((e) => !e.id.startsWith("e-suggest-"));
            const newReactFlowEdges = toConnectorEdges(rawEdges, mergedNodes, edges);
            const nextEdges = [...edges, ...newReactFlowEdges];
            const relaidNodes = relayoutTopLevelThinkingNodes(mergedNodes, nextEdges);
            const insertedIds = new Set(enrichedNodes.map((node) => node.id));
            const relaidViewportTargets = inputContextNode
                ? relaidNodes.filter((node) => node.id === inputContextNode.id || insertedIds.has(node.id))
                : relaidNodes.filter((node) => insertedIds.has(node.id));

            setNodes(relaidNodes);
            setEdges(nextEdges);
            animateViewportToNodes(relaidViewportTargets.length ? relaidViewportTargets : viewportTargets);
            userNodeDatas.forEach((node) => {
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

        } catch (error) {
            console.error("Failed to analyze input:", error);
            const serverMsg =
                error?.response?.data?.error ||
                error?.response?.data?.detail ||
                error?.message;
            alert(serverMsg ? `AI Agent error: ${serverMsg}` : "AI Agent error. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    }, [animateViewportToNodes, edges, highlightedNodeIds, nodes, projectTitle, recordProjectActivity, setEdges, setNodes, stage]);

    return (
        <div className="w-full h-screen relative flex flex-col overflow-hidden bg-slate-50">
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
                hasDrawerModeSelection={hasDrawerModeSelection}
            />

            {showAdminShortcutHint && (
                <div className="pointer-events-auto absolute left-1/2 top-14 z-[80] -translate-x-1/2">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/78 px-4 py-2 text-xs text-slate-700 shadow-lg backdrop-blur-md">
                        <span>
                            Press <span className="font-semibold">{ADMIN_SHORTCUT_LABEL}</span> to toggle Admin Mode.
                        </span>
                        <button
                            type="button"
                            className="rounded-full border border-slate-300/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-white"
                            onClick={dismissAdminShortcutHint}
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

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
                    </>
                )}

                <InputPanel
                    onSubmit={handleInputSubmit}
                    isAnalyzing={isAnalyzing}
                    selectedNode={selectedNode}
                    hasThinkingGraph={hasThinkingGraph}
                    suggestedTypes={composerSuggestedTypes}
                    hintText={composerHintText}
                    stage={reasoningModeProfile.label}
                    placeholderText={reasoningModeProfile.composerPlaceholder}
                    selectedNodePromptText={reasoningModeProfile.selectedNodePrompt}
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

                {hasThinkingGraph && (
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
                        onRefreshActivity={refreshProjectCollaborationMeta}
                        chatMessages={chatMessages}
                        chatInput={chatInput}
                        isChatLoading={isChatLoading}
                        isChatConverting={isChatConverting}
                        onChatInputChange={setChatInput}
                        onChatSubmit={handleDrawerChatSubmit}
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
                        attachedContext={
                            attachedNodes.length
                                ? {
                                    id: "attached-nodes",
                                    type: "attachedNodes",
                                    title: attachedNodes.length === 1 ? "Attached node" : `Attached nodes (${attachedNodes.length})`,
                                    content: "Use these nodes as the primary context for this chat.",
                                    category: "Insight",
                                    phase: "Problem",
                                    sourceType: "mixed",
                                    visibility: "shared",
                                    confidence: "medium",
                                    attached_nodes: attachedNodes,
                                }
                                : null
                        }
                        chatButtonRef={chatButtonRef}
                        chatDropZoneRef={chatDropZoneRef}
                        isChatDropActive={isChatDropActive}
                    />
                )}

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
