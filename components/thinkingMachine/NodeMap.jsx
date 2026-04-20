"use client";

import { useMemo } from "react";
import ReactFlow, {
    Background,
    ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import ThinkingNode from "./nodes/ThinkingNode";
import PostitDraftNode from "./nodes/PostitDraftNode";
import ImageDraftNode from "./nodes/ImageDraftNode";
import IdeaGroupNode from "./nodes/IdeaGroupNode";
import ConnectorEdge from "./edges/ConnectorEdge";
import { useNodePorts } from "@/components/thinkingMachine/hooks/useNodePorts";

export default function NodeMap({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    highlightedNodeIds,
    onNodeDragStart,
    onNodeDrag,
    onNodeDragStop,
    onInit,
    onSelectionChange,
    selectionBoxEnabled = false,
    isCanvasInteractive = true,
    draftHandlers,
    draftSubmittingIds,
    canvasStage = "research-diverge",
}) {

    const nodeTypes = useMemo(
        () => ({
            thinkingNode: ThinkingNode,
            postitDraft: PostitDraftNode,
            imageDraft: ImageDraftNode,
            ideaGroup: IdeaGroupNode,
        }),
        []
    );
    const edgeTypes = useMemo(() => ({ connectorEdge: ConnectorEdge }), []);

    const { displayNodes } = useNodePorts({
        nodes,
        edges,
        highlightedNodeIds,
        draftHandlers,
        draftSubmittingIds,
    });

    return (
        <div className="tm-canvas-bg h-full w-full" data-stage={canvasStage}>
            <ReactFlow
                nodes={displayNodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStart={onNodeDragStart}
                onNodeDrag={onNodeDrag}
                onNodeDragStop={onNodeDragStop}
                onInit={onInit}
                onSelectionChange={onSelectionChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                className="reactflow-canvas-pan tm-canvas-flow z-10"
                minZoom={0.2}
                maxZoom={1}
                nodesDraggable={isCanvasInteractive}
                nodesConnectable={isCanvasInteractive}
                elementsSelectable={isCanvasInteractive}
                zoomOnScroll={isCanvasInteractive}
                zoomOnPinch={isCanvasInteractive}
                panOnScroll={isCanvasInteractive}
                // Default interaction: empty-space drag pan (touchpad friendly).
                // Hold Shift to enable box selection for drafts.
                panOnDrag={isCanvasInteractive ? (selectionBoxEnabled ? [1, 2] : true) : false}
                selectionOnDrag={isCanvasInteractive && selectionBoxEnabled}
            >
                <Background gap={20} color="#FFFFFF4D" />
            </ReactFlow>
        </div>
    );
}
