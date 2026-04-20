export const POSTIT_DRAFT_SIZE = { w: 272, h: 240 };
export const IMAGE_DRAFT_SIZE = { w: 272, h: 240 };

export const GROUP_PADDING = 44;
export const GROUP_TOP_PADDING = 56;
export const GROUP_INNER_PAD_X = 28;
export const GROUP_INNER_PAD_BOTTOM = 28;
export const GROUP_DRAFT_GAP = 16;
export const GROUP_DRAFT_MIN_SIZE = { w: 196, h: 176 };

export function layoutDraftsInGroupGrid({ draftNodes, groupW, groupH }) {
  const list = Array.isArray(draftNodes) ? draftNodes : [];
  if (list.length === 0) return [];

  const innerTop = GROUP_TOP_PADDING + 18;
  const innerW = Math.max(0, groupW - GROUP_INNER_PAD_X * 2);
  const innerH = Math.max(0, groupH - innerTop - GROUP_INNER_PAD_BOTTOM);

  const count = list.length;
  const aspect = innerW > 0 && innerH > 0 ? innerW / innerH : 1;
  const idealCols = Math.ceil(Math.sqrt(count * aspect));
  const cols = Math.max(1, Math.min(count, idealCols || 1));
  const rows = Math.max(1, Math.ceil(count / cols));

  const cellW = innerW / cols;
  const cellH = innerH / rows;

  const maxW = Math.max(0, Math.floor(cellW - GROUP_DRAFT_GAP));
  const maxH = Math.max(0, Math.floor(cellH - GROUP_DRAFT_GAP));
  const minW = Math.min(GROUP_DRAFT_MIN_SIZE.w, maxW);
  const minH = Math.min(GROUP_DRAFT_MIN_SIZE.h, maxH);
  const targetW = Math.max(minW, Math.floor(Math.min(POSTIT_DRAFT_SIZE.w, maxW)));
  const targetH = Math.max(minH, Math.floor(Math.min(POSTIT_DRAFT_SIZE.h, maxH)));

  return list.map((n, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const x = GROUP_INNER_PAD_X + Math.round(col * cellW + (cellW - targetW) / 2);
    const y = innerTop + Math.round(row * cellH + (cellH - targetH) / 2);
    return {
      ...n,
      style: { ...(n.style || {}), width: targetW, height: targetH, zIndex: 60 },
      position: { x, y },
    };
  });
}

export function buildDraftBundleText(draftNodeList) {
  return (Array.isArray(draftNodeList) ? draftNodeList : [])
    .map((n, idx) => {
      if (n.type === "postitDraft") {
        const t = typeof n?.data?.text === "string" ? n.data.text.trim() : "";
        return t ? `Draft ${idx + 1} (Post-it): ${t}` : "";
      }
      if (n.type === "imageDraft") {
        const name = typeof n?.data?.fileName === "string" ? n.data.fileName.trim() : "";
        const caption = typeof n?.data?.caption === "string" ? n.data.caption.trim() : "";
        const parts = [];
        parts.push(`Draft ${idx + 1} (Image)`);
        if (name) parts.push(`file: ${name}`);
        if (caption) parts.push(`note: ${caption}`);
        if (!name && !caption) parts.push("uploaded image (no caption)");
        return parts.join(" | ");
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

export function layoutThinkingNodesInGroup(rfNodes, groupW) {
  const CATEGORY_ORDER = ["Problem", "Goal", "Insight", "Evidence", "Assumption", "Constraint", "Idea", "Option", "Risk", "Conflict", "Decision", "OpenQuestion"];
  const rowMap = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
  const colX = { Problem: 24, Solution: 320 };
  const baseY = 62;
  const rowGap = 178;
  const slotGap = 54;

  const byRowCol = new Map();
  (Array.isArray(rfNodes) ? rfNodes : []).forEach((n) => {
    const cat = normalizeNodeCategory(n?.data?.category);
    const phase = normalizeNodePhase(n?.data?.phase, cat);
    const row = rowMap.get(cat) ?? 2;
    const col = phase === "Solution" ? "Solution" : "Problem";
    const key = `${row}:${col}`;
    const arr = byRowCol.get(key) || [];
    arr.push(n);
    byRowCol.set(key, arr);
  });

  const maxColX = Math.max(colX.Problem, colX.Solution);
  const safeRight = Math.max(groupW - 260, maxColX);

  const out = [];
  byRowCol.forEach((arr, key) => {
    const [rowStr, col] = key.split(":");
    const row = Number(rowStr);
    arr.forEach((n, idx) => {
      const x = Math.min(colX[col] + idx * slotGap, safeRight);
      const y = baseY + row * rowGap;
      out.push({ ...n, position: { x, y } });
    });
  });
  return out;
}
import { normalizeNodeCategory, normalizeNodePhase } from "@/lib/thinkingMachine/nodeMeta";

