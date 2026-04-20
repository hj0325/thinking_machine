import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useGhostDragToChat({
  nodes,
  setNodes,
  baseOnNodesChange,
  setAttachedNodes,
  setActiveSuggestion,
  setDrawerMode,
  setIsDrawerOpen,
} = {}) {
  const [isChatDropActive, setIsChatDropActive] = useState(false);
  const [ghostDrag, setGhostDrag] = useState(null); // {x,y,count,phase:"dragging"|"dropping", targetX?, targetY?}

  const chatButtonRef = useRef(null);
  const chatDropZoneRef = useRef(null);
  const didAutoOpenOnDragRef = useRef(false);
  const dragOriginRef = useRef(null); // { ids: string[], positions: Map<id, {x,y}> }
  const isNodeDraggingRef = useRef(false);
  const restoreRafRef = useRef(null);
  const dragStartPointRef = useRef(null); // {x,y}
  const didShowGhostRef = useRef(false);
  const ghostCaptureRef = useRef(false);

  const makeAttachedContextId = (ids) => {
    const base = Array.isArray(ids) ? ids.join(",") : "";
    return `attached-${Date.now()}-${base.length}-${Math.random().toString(16).slice(2, 6)}`;
  };

  const buildAttachedNodesContext = (selected) => {
    const safeSelected = Array.isArray(selected) ? selected : [];
    const items = safeSelected
      .map((n) => ({
        id: n?.id,
        title: n?.data?.title,
        content: n?.data?.content,
        category: n?.data?.category,
        phase: n?.data?.phase,
        sourceType: n?.data?.sourceType,
        visibility: n?.data?.visibility,
        confidence: n?.data?.confidence,
      }))
      .filter((n) => typeof n.id === "string" && n.id && typeof n.title === "string" && n.title.trim().length > 0);

    return {
      id: makeAttachedContextId(items.map((i) => i.id)),
      type: "attachedNodes",
      title: items.length === 1 ? "Attached node" : `Attached nodes (${items.length})`,
      content: "Use these nodes as the primary context for this chat.",
      category: "Insight",
      phase: "Problem",
      sourceType: "mixed",
      visibility: "shared",
      confidence: "medium",
      attached_nodes: items,
    };
  };

  const getPointerClientPoint = (event) => {
    const e = event?.nativeEvent ?? event;
    const touch = e?.touches?.[0] || e?.changedTouches?.[0];
    if (touch) return { x: touch.clientX, y: touch.clientY };
    if (typeof e?.clientX === "number" && typeof e?.clientY === "number") return { x: e.clientX, y: e.clientY };
    return null;
  };

  const isPointNearChatButton = (pt) => {
    const el = chatButtonRef.current;
    if (!pt || !el?.getBoundingClientRect) return false;
    const rect = el.getBoundingClientRect();
    const pad = 28;
    const left = rect.left - pad;
    const right = rect.right + pad;
    const top = rect.top - pad;
    const bottom = rect.bottom + pad;
    return pt.x >= left && pt.x <= right && pt.y >= top && pt.y <= bottom;
  };

  const getChatDropZoneRect = () => {
    const el = chatDropZoneRef.current;
    if (!el?.getBoundingClientRect) return null;
    return el.getBoundingClientRect();
  };

  const isPointInRect = (pt, rect, pad = 0) => {
    if (!pt || !rect) return false;
    return pt.x >= rect.left - pad && pt.x <= rect.right + pad && pt.y >= rect.top - pad && pt.y <= rect.bottom + pad;
  };

  const isPointInChatRegion = (pt) => {
    if (!pt) return false;
    const width = typeof window !== "undefined" ? window.innerWidth : 0;
    if (!width) return false;
    // 오른쪽 영역 진입만으로도 Chat 모드가 자연스럽게 열리도록 넓게 잡음
    return pt.x >= width - 240;
  };

  const isPointInChatAttachZone = (pt) => {
    if (!pt) return false;
    if (isPointNearChatButton(pt)) return true;
    const rect = getChatDropZoneRect();
    // Drawer가 열려 있으면 실제 DropZone 전체(왼쪽 끝까지)를 인정
    if (rect && isPointInRect(pt, rect, 24)) return true;
    // Drawer가 닫혀 있거나 rect 측정이 어려운 상황에선 화면 오른쪽 영역으로 폴백
    return isPointInChatRegion(pt);
  };

  const isPointInChatDropZone = (pt) => {
    const rect = getChatDropZoneRect();
    if (rect) return isPointInRect(pt, rect, 24);
    // Drawer가 아직 열리지 않았을 때도 오른쪽 영역이면 드롭 허용
    return isPointInChatRegion(pt);
  };

  const getDropAnimationTarget = () => {
    const rect = getChatDropZoneRect();
    if (rect) return { x: rect.left + rect.width * 0.55, y: rect.top + 120 };
    const width = typeof window !== "undefined" ? window.innerWidth : 0;
    const height = typeof window !== "undefined" ? window.innerHeight : 0;
    return { x: Math.max(0, width - 180), y: Math.max(0, height * 0.35) };
  };

  const filteredOnNodesChange = useMemo(() => {
    return (changes) => {
      // 고스트 드래그 UX: 원본 노드는 드래그 중 위치가 바뀌지 않도록 position changes 무시
      // (ReactFlow 내부 드래그 종료 타이밍 이슈로 onNodeDragStop 이후에도 position change가 들어올 수 있어
      //  ghostCapture가 켜져있는 동안은 무조건 position을 차단한다.)
      if (ghostCaptureRef.current && Array.isArray(changes)) {
        const next = changes.filter((c) => c?.type !== "position");
        baseOnNodesChange?.(next);
        return;
      }
      baseOnNodesChange?.(changes);
    };
  }, [baseOnNodesChange]);

  const handleNodeDragUpdate = (event) => {
      const pt = getPointerClientPoint(event);
      const nearAttach = isPointInChatAttachZone(pt);
      setIsChatDropActive(Boolean(nearAttach));

      if (pt) {
        const start = dragStartPointRef.current;
        const dx = start ? pt.x - start.x : 0;
        const dy = start ? pt.y - start.y : 0;
        const dist2 = dx * dx + dy * dy;
        const movedEnough = dist2 >= 36; // 6px threshold

        const origin = dragOriginRef.current;
        const count = origin?.ids?.length || 1;
        // 고스트 드래그는 \"오른쪽(Chat) 첨부\" 제스처로 진입했을 때만 활성화
        if (!ghostCaptureRef.current && movedEnough && nearAttach) {
          ghostCaptureRef.current = true;
        }

        if (ghostCaptureRef.current && movedEnough) {
          didShowGhostRef.current = true;
          setGhostDrag((prev) => {
            if (prev?.phase === "dropping") return prev;
            return { x: pt.x, y: pt.y, count, phase: "dragging" };
          });
        }
      }

      // 원본 노드 위치 유지: 드래그 중에는 저장된 원점으로 계속 복원 (RAF로 부하 제한)
      const origin = dragOriginRef.current;
      if (ghostCaptureRef.current && origin?.positions && origin?.ids?.length && !restoreRafRef.current) {
        restoreRafRef.current = requestAnimationFrame(() => {
          restoreRafRef.current = null;
          const idSet = new Set(origin.ids);
          setNodes?.((prev) =>
            prev.map((n) => {
              if (!idSet.has(n.id)) return n;
              const pos = origin.positions.get(n.id);
              if (!pos) return n;
              if (n.position?.x === pos.x && n.position?.y === pos.y) return n;
              return { ...n, position: { x: pos.x, y: pos.y } };
            })
          );
        });
      }

      if (nearAttach && !didAutoOpenOnDragRef.current) {
        didAutoOpenOnDragRef.current = true;
        setDrawerMode?.("chat");
        setIsDrawerOpen?.(true);
      }
  };

  const handleNodeDragStart = useCallback(
    (event, node) => {
      didAutoOpenOnDragRef.current = false;
      isNodeDraggingRef.current = true;
      ghostCaptureRef.current = false;
      didShowGhostRef.current = false;
      const selectedNodes = (Array.isArray(nodes) ? nodes : []).filter((n) => n?.selected);
      const ids =
        node?.selected && selectedNodes.length ? selectedNodes.map((n) => n.id) : node?.id ? [node.id] : [];
      const positions = new Map();
      (Array.isArray(nodes) ? nodes : []).forEach((n) => {
        if (ids.includes(n.id)) positions.set(n.id, { x: n.position?.x ?? 0, y: n.position?.y ?? 0 });
      });
      dragOriginRef.current = { ids, positions };

      const pt = getPointerClientPoint(event);
      if (pt) dragStartPointRef.current = { x: pt.x, y: pt.y };
      // 고스트는 실제로 일정 거리 이상 움직였을 때만 보여준다 (클릭/탭 오작동 방지)
      setGhostDrag(null);
    },
    [nodes]
  );

  const handleNodeDragStop = (event, node) => {
      const wasCaptured = ghostCaptureRef.current;
      const pt = getPointerClientPoint(event);
      const shouldAttach = isPointInChatDropZone(pt);
      setIsChatDropActive(false);
      didAutoOpenOnDragRef.current = false;
      isNodeDraggingRef.current = false;
      dragStartPointRef.current = null;

      // 원본 노드 위치는 항상 원점으로 복원 (마지막 position change 방지)
      const origin = dragOriginRef.current;
      if (wasCaptured && origin?.positions && origin?.ids?.length) {
        const idSet = new Set(origin.ids);
        setNodes?.((prev) =>
          prev.map((n) => {
            if (!idSet.has(n.id)) return n;
            const pos = origin.positions.get(n.id);
            if (!pos) return n;
            if (n.position?.x === pos.x && n.position?.y === pos.y) return n;
            return { ...n, position: { x: pos.x, y: pos.y } };
          })
        );
      }

      // 드래그가 \"의도\"되지 않았거나(짧은 탭) 드롭존이 아니면 고스트만 정리
      if (!shouldAttach) {
        setGhostDrag(null);
        // 아주 짧은 딜레이로 끝자락 position change까지 흡수
        window.setTimeout(() => {
          ghostCaptureRef.current = false;
        }, 0);
        return;
      }

      const selectedNodes = (Array.isArray(nodes) ? nodes : []).filter((n) => n?.selected);
      const draggedNode = node ? (nodes.find((n) => n.id === node.id) || node) : null;
      const toAttach =
        draggedNode?.selected && selectedNodes.length ? selectedNodes : draggedNode ? [draggedNode] : [];
      if (toAttach.length === 0) return;

      const context = buildAttachedNodesContext(toAttach);
      setAttachedNodes?.(context.attached_nodes);
      setActiveSuggestion?.(context);
      setDrawerMode?.("chat");
      setIsDrawerOpen?.(true);

      // 고스트 흡수 애니메이션 (고스트가 실제로 표시된 경우에만)
      if (pt && didShowGhostRef.current) {
        const target = getDropAnimationTarget();
        setGhostDrag({
          x: pt.x,
          y: pt.y,
          count: context.attached_nodes.length,
          phase: "dropping",
          targetX: target.x,
          targetY: target.y,
        });
        window.setTimeout(() => setGhostDrag(null), 260);
      } else {
        setGhostDrag(null);
      }

      window.setTimeout(() => {
        ghostCaptureRef.current = false;
      }, 0);
  };

  useEffect(() => {
    if (!ghostDrag) return undefined;
    const clear = () => {
      setGhostDrag(null);
      setIsChatDropActive(false);
      isNodeDraggingRef.current = false;
      didAutoOpenOnDragRef.current = false;
      dragStartPointRef.current = null;
    };
    window.addEventListener("mouseup", clear);
    window.addEventListener("touchend", clear);
    window.addEventListener("touchcancel", clear);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("mouseup", clear);
      window.removeEventListener("touchend", clear);
      window.removeEventListener("touchcancel", clear);
      window.removeEventListener("blur", clear);
    };
  }, [ghostDrag]);

  return {
    isChatDropActive,
    ghostDrag,
    chatButtonRef,
    chatDropZoneRef,
    filteredOnNodesChange,
    handleNodeDragStart,
    handleNodeDragUpdate,
    handleNodeDragStop,
  };
}
