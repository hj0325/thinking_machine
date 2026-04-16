import { useCallback } from "react";
import { analyze } from "@/lib/thinkingMachine/apiClient";
import { toConnectorEdges } from "@/lib/thinkingMachine/connectorEdges";
import { toReactFlowNode } from "@/lib/thinkingMachine/reactflowTransforms";
import {
  relayoutTopLevelThinkingNodes,
  shiftClusterRelativeToAnchor,
  shiftClusterRightOfExisting,
} from "@/lib/thinkingMachine/graphMerge";
import { normalizeRelationLabel, normalizeVisibility } from "@/lib/thinkingMachine/nodeMeta";

function getNodeSnapshot(node, edges = []) {
  if (!node) return null;
  return {
    id: node.id,
    title: node?.data?.title || "",
    content: node?.data?.content || "",
    category: node?.data?.category || "",
    phase: node?.data?.phase || "",
    visibility: normalizeVisibility(node?.data?.visibility),
    linkedNodeIds: (Array.isArray(edges) ? edges : [])
      .filter((edge) => edge?.source === node.id || edge?.target === node.id)
      .map((edge) => (edge.source === node.id ? edge.target : edge.source))
      .filter(Boolean),
  };
}

function mergeSuggestionUnique(prev, nextSuggestion) {
  if (!nextSuggestion) return prev;
  const key = `${String(nextSuggestion.category || "").toLowerCase()}::${String(nextSuggestion.title || "")
    .trim()
    .toLowerCase()}::${String(nextSuggestion.content || "").trim().toLowerCase()}`;
  const existingIndex = prev.findIndex((item) => {
    const existingKey = `${String(item?.category || "").toLowerCase()}::${String(item?.title || "")
      .trim()
      .toLowerCase()}::${String(item?.content || "").trim().toLowerCase()}`;
    return existingKey === key;
  });
  if (existingIndex === -1) return [nextSuggestion, ...prev];
  const clone = [...prev];
  clone.splice(existingIndex, 1);
  return [nextSuggestion, ...clone];
}

export function useThinkingAiAnalyze({
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
  currentUserName = "You",
}) {
  const handleInputSubmit = useCallback(
    async ({ text, preferredType, selectedNode: inputContextNode } = {}) => {
      const rawText = typeof text === "string" ? text.trim() : "";
      if (!rawText) return;
      setIsAnalyzing(true);

      try {
        const contextualText = inputContextNode
          ? [
              `Project: ${projectTitle}`,
              `Selected node context: [${inputContextNode.data?.category}] ${inputContextNode.data?.title} - ${
                inputContextNode.data?.content || ""
              }`,
              preferredType ? `Preferred new node type: ${preferredType}.` : "",
              `User follow-up: ${rawText}`,
            ]
              .filter(Boolean)
              .join("\n")
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

        const suggestionNodeData = data.nodes.find((n) => n.data.is_ai_generated);
        const userNodeDatas = data.nodes
          .filter((n) => !n.data.is_ai_generated)
          .map((n) => ({
            ...n,
            data: {
              ...n.data,
              ownerId: currentUserId,
              editedBy: currentUserName,
              visibility: "private",
            },
          }));

        const suggestEdge = data.edges.find((e) => e.id.startsWith("e-suggest-"));
        const highlightedMainNodeId = suggestEdge ? suggestEdge.source : null;

        const rawNewNodes = userNodeDatas.map((n) => toReactFlowNode(n, highlightedMainNodeId));
        const enrichedNodes = inputContextNode
          ? shiftClusterRelativeToAnchor(inputContextNode, rawNewNodes)
          : nodes.length
          ? shiftClusterRightOfExisting(nodes, rawNewNodes)
          : rawNewNodes;
        const viewportTargets = inputContextNode ? [inputContextNode, ...enrichedNodes] : enrichedNodes;

        if (suggestionNodeData) {
          const newSuggestion = {
            id: `suggestion-${Date.now()}`,
            title: suggestionNodeData.data.label,
            content: suggestionNodeData.data.content,
            category: suggestionNodeData.data.category,
            phase: suggestionNodeData.data.phase,
            sourceType: suggestionNodeData.data.sourceType,
            visibility: normalizeVisibility(suggestionNodeData.data.visibility),
            confidence: suggestionNodeData.data.confidence,
            ownerId: suggestionNodeData.data.ownerId,
            relatedNodeId: highlightedMainNodeId,
          };
          setSuggestions((prev) => mergeSuggestionUnique(prev, newSuggestion));
          if (highlightedMainNodeId) {
            setHighlightedNodeIds((prev) => new Set([...prev, highlightedMainNodeId]));
          }
        }

        const updatedExistingNodes = nodes.map((n) => ({
          ...n,
          className: n.className || "",
        }));
        const mergedNodes = [...updatedExistingNodes, ...enrichedNodes];
        const rawEdges = data.edges.filter((e) => !e.id.startsWith("e-suggest-"));
        const newReactFlowEdges = toConnectorEdges(
          rawEdges.map((e) => ({
            ...e,
            label: normalizeRelationLabel(e?.label),
          })),
          mergedNodes,
          edges
        );
        const nextEdges = [...edges, ...newReactFlowEdges];
        const relaidNodes = relayoutTopLevelThinkingNodes(mergedNodes, nextEdges);
        const insertedIds = new Set(enrichedNodes.map((node) => node.id));
        const relaidViewportTargets = inputContextNode
          ? relaidNodes.filter((node) => node.id === inputContextNode.id || insertedIds.has(node.id))
          : relaidNodes.filter((node) => insertedIds.has(node.id));

        setNodes(relaidNodes);
        setEdges(nextEdges);
        animateViewportToNodes(relaidViewportTargets.length ? relaidViewportTargets : viewportTargets);
        setDrawerMode("tip");
        setIsDrawerOpen(true);
        userNodeDatas.forEach((node) => {
          const targetNode = relaidNodes.find((item) => item.id === node.id);
          const snapshot = getNodeSnapshot(targetNode, nextEdges);
          void recordProjectActivity("node_created", {
            nodeId: node.id,
            nodeTitle: node?.data?.label,
            nodeType: node?.data?.category,
            before: null,
            after: snapshot,
            relatedNodeIds: snapshot?.linkedNodeIds || [],
            stage,
          });
          if (node?.data?.category === "Conflict") {
            void recordProjectActivity("conflict_created", {
              nodeId: node.id,
              nodeTitle: node?.data?.label,
              nodeType: node?.data?.category,
              before: null,
              after: snapshot,
              relatedNodeIds: snapshot?.linkedNodeIds || [],
              stage,
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
    },
    [
      animateViewportToNodes,
      currentUserId,
      currentUserName,
      edges,
      nodes,
      projectTitle,
      recordProjectActivity,
      setDrawerMode,
      setEdges,
      setHighlightedNodeIds,
      setIsAnalyzing,
      setIsDrawerOpen,
      setNodes,
      setSuggestions,
      stage,
    ]
  );

  return { handleInputSubmit };
}

