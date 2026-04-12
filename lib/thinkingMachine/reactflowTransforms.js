import {
  getConfidenceMeta,
  getSourceTypeMeta,
  getTypeMeta,
  getVisibilityCardMeta,
  getVisibilityMeta,
  normalizeNodeData,
} from "@/lib/thinkingMachine/nodeMeta";

export const NODE_CARD_TOKENS = {
  width: 250,
  minHeight: 130,
  radius: "22px",
  imageRadius: "16px",
  borderWidth: "1px",
  paddingX: "12px",
  paddingTop: "12px",
  paddingBottom: "11px",
  contentGap: "8px",
  chipFontSize: "10px",
  chipPaddingX: "8px",
  chipPaddingY: "5px",
  metaFontSize: "9px",
  metaPaddingX: "7px",
  metaPaddingY: "4px",
  titleFontSize: "13px",
  bodyFontSize: "11px",
};

export function extractNodeImageUrl(rawData) {
  const candidates = [
    rawData?.image_url,
    rawData?.imageUrl,
    rawData?.image,
    rawData?.image_src,
    rawData?.imageSrc,
  ];
  return candidates.find((v) => typeof v === "string" && v.trim().length > 0) || null;
}

function Chip({ label }) {
  const backgroundColor = getTypeMeta(label).color;
  return (
    <span
      className="inline-flex items-center justify-center gap-1 rounded-full font-semibold leading-none tracking-[-0.01em] text-[#111111]"
      style={{
        backgroundColor,
        fontSize: NODE_CARD_TOKENS.chipFontSize,
        paddingInline: NODE_CARD_TOKENS.chipPaddingX,
        paddingBlock: NODE_CARD_TOKENS.chipPaddingY,
      }}
    >
      {label}
    </span>
  );
}

function MetaChip({ label, className }) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold leading-none tracking-[-0.01em] ${className}`}
      style={{
        fontSize: NODE_CARD_TOKENS.metaFontSize,
        paddingInline: NODE_CARD_TOKENS.metaPaddingX,
        paddingBlock: NODE_CARD_TOKENS.metaPaddingY,
      }}
    >
      {label}
    </span>
  );
}

// 노드 데이터에서 JSX label 빌드 (재사용)
export function buildNodeLabel(nodeData) {
  const typeMeta = getTypeMeta(nodeData.category);
  const visibilityMeta = getVisibilityMeta(nodeData.visibility);
  const confidenceMeta = getConfidenceMeta(nodeData.confidence);
  const sourceMeta = getSourceTypeMeta(nodeData.sourceType);

  return (
    <div
      className="flex h-full w-full flex-col items-start text-left"
      style={{
        gap: NODE_CARD_TOKENS.contentGap,
        paddingInline: NODE_CARD_TOKENS.paddingX,
        paddingTop: NODE_CARD_TOKENS.paddingTop,
        paddingBottom: NODE_CARD_TOKENS.paddingBottom,
      }}
    >
      <div className="flex w-full flex-wrap items-center gap-1.5">
        <Chip label={nodeData.category} />
        {nodeData.legacyCategory && nodeData.legacyCategory !== nodeData.category ? (
          <span
            className="inline-flex items-center rounded-full bg-slate-100 font-semibold leading-none text-slate-500"
            style={{
              fontSize: NODE_CARD_TOKENS.metaFontSize,
              paddingInline: NODE_CARD_TOKENS.metaPaddingX,
              paddingBlock: NODE_CARD_TOKENS.metaPaddingY,
            }}
          >
            Legacy {nodeData.legacyCategory}
          </span>
        ) : null}
      </div>
      <div
        className="font-heading line-clamp-2 font-bold tracking-[-0.02em]"
        style={{ color: typeMeta.color, fontSize: NODE_CARD_TOKENS.titleFontSize, lineHeight: 1.18 }}
      >
        {nodeData.title || "Untitled node"}
      </div>
      <div
        className="font-node-body line-clamp-3 text-[#666666]"
        style={{ fontSize: NODE_CARD_TOKENS.bodyFontSize, lineHeight: 1.34 }}
      >
        {nodeData.content}
      </div>
      {nodeData.imageUrl && (
        <div
          className="h-[112px] w-full overflow-hidden bg-[#F3F4F6]"
          style={{ borderRadius: NODE_CARD_TOKENS.imageRadius }}
        >
          <img
            src={nodeData.imageUrl}
            alt={`${nodeData.title || "Node"} visual`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-1">
        <MetaChip label={sourceMeta.label} className={sourceMeta.className} />
        <MetaChip label={confidenceMeta.label} className={confidenceMeta.className} />
        <span
          className="inline-flex items-center rounded-full bg-slate-100 font-semibold leading-none text-slate-500"
          style={{
            fontSize: NODE_CARD_TOKENS.metaFontSize,
            paddingInline: NODE_CARD_TOKENS.metaPaddingX,
            paddingBlock: NODE_CARD_TOKENS.metaPaddingY,
          }}
        >
          {visibilityMeta.label}
        </span>
      </div>
    </div>
  );
}

export function buildNodeStyle(nodeData) {
  const visibilityCardMeta = getVisibilityCardMeta(nodeData.visibility);
  return {
    background: "linear-gradient(251.08deg, rgba(245, 228, 167, 0.6) 11.64%, rgba(154, 196, 255, 0.6) 103.5%)",
    border: "1.5px solid #819EBC",
    borderRadius: "14px",
    padding: "0",
    width: NODE_CARD_TOKENS.width,
    minHeight: NODE_CARD_TOKENS.minHeight,
    display: "flex",
    flexDirection: "column",
    overflow: "visible",
    boxShadow: visibilityCardMeta.boxShadow,
    zIndex: 20,
  };
}

export function toReactFlowNode(n, highlightedId) {
  const normalizedData = normalizeNodeData(n.data);
  const nodeData = {
    title: n.data.label,
    content: n.data.content,
    phase: normalizedData.phase,
    category: normalizedData.category,
    ownerId: normalizedData.ownerId,
    editedBy: normalizedData.editedBy,
    sourceType: normalizedData.sourceType,
    visibility: normalizedData.visibility,
    confidence: normalizedData.confidence,
    legacyCategory:
      typeof n.data?.category === "string" && n.data.category !== normalizedData.category
        ? n.data.category
        : null,
    imageUrl: extractNodeImageUrl(n.data),
    is_ai_suggestion: false,
  };
  const rfNode = {
    id: n.id,
    type: "thinkingNode",
    position: n.position,
    className: `tm-node-shell ${n.id === highlightedId ? "node-highlighted" : ""}`.trim(),
    data: { ...nodeData },
    style: buildNodeStyle(nodeData),
  };
  // ReactFlow node renderer expects `data.label` to be renderable content (JSX).
  // Keep the raw text in `data.content` for AI + exports.
  rfNode.data.label = buildNodeLabel(nodeData);
  return rfNode;
}
