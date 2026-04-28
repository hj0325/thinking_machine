"use client";

import { useMemo } from "react";

export function useNodePorts({
  nodes,
  edges,
  highlightedNodeIds,
  draftHandlers,
  draftSubmittingIds,
  conflictByNodeId,
  openConflictNodeId,
  conflictExplainResultByNodeId,
  conflictExplainLoadingByNodeId,
  onToggleConflictPopover,
  onExplainConflict,
}) {
  const portVisibilityByNode = useMemo(() => {
    const map = new Map();
    edges.forEach((edge) => {
      if (edge?.source) {
        const current = map.get(edge.source) || { hasLeftPort: false, hasRightPort: false };
        current.hasRightPort = true;
        map.set(edge.source, current);
      }
      if (edge?.target) {
        const current = map.get(edge.target) || { hasLeftPort: false, hasRightPort: false };
        current.hasLeftPort = true;
        map.set(edge.target, current);
      }
    });
    return map;
  }, [edges]);

  const displayNodes = useMemo(() => {
    const hasHighlightSet = highlightedNodeIds instanceof Set;
    return nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        hasLeftPort: portVisibilityByNode.get(n.id)?.hasLeftPort || false,
        hasRightPort: portVisibilityByNode.get(n.id)?.hasRightPort || false,
        ...(n.type === "postitDraft"
          ? {
              onChangeText: draftHandlers?.onPostitChangeText,
              onSubmit: draftHandlers?.onDraftSubmit,
              isSubmitting: Boolean(draftSubmittingIds?.has?.(n.id)),
            }
          : {}),
        ...(n.type === "imageDraft"
          ? {
              onPickImage: draftHandlers?.onImagePick,
              onChangeCaption: draftHandlers?.onImageChangeCaption,
              onSubmit: draftHandlers?.onDraftSubmit,
              isSubmitting: Boolean(draftSubmittingIds?.has?.(n.id)),
            }
          : {}),
        ...(n.type === "ideaGroup"
          ? {
              onToggle: draftHandlers?.onToggleIdeaGroup,
            }
          : {}),
        ...(n.type === "thinkingNode"
          ? {
              nodeId: n.id,
              conflictLinkedNodeTitles: conflictByNodeId?.[n.id]?.linkedNodeTitles || [],
              conflictExplanation: conflictExplainResultByNodeId?.[n.id] || null,
              isConflictPopoverOpen: openConflictNodeId === n.id,
              isConflictExplainLoading: Boolean(conflictExplainLoadingByNodeId?.[n.id]),
              onToggleConflictPopover,
              onExplainConflict,
            }
          : {}),
      },
      className: [n.className || "", hasHighlightSet && highlightedNodeIds.has(n.id) ? "node-highlighted" : ""]
        .filter(Boolean)
        .join(" "),
    }));
  }, [
    conflictByNodeId,
    conflictExplainLoadingByNodeId,
    conflictExplainResultByNodeId,
    draftHandlers,
    draftSubmittingIds,
    highlightedNodeIds,
    nodes,
    onExplainConflict,
    onToggleConflictPopover,
    openConflictNodeId,
    portVisibilityByNode,
  ]);

  return { displayNodes };
}

