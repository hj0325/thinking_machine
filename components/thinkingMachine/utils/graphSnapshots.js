import { normalizeVisibility } from "@/lib/thinkingMachine/nodeMeta";

export function getNodeSnapshot(node, edges = []) {
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

export function getRelatedNodeIds(nodeId, edges = []) {
  return (Array.isArray(edges) ? edges : [])
    .filter((edge) => edge?.source === nodeId || edge?.target === nodeId)
    .map((edge) => (edge.source === nodeId ? edge.target : edge.source))
    .filter(Boolean);
}
