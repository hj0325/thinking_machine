"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { normalizeReasoningStage } from "@/lib/thinkingMachine/nodeMeta";
import TopBarProjectBreadcrumb from "@/components/thinkingMachine/layout/TopBarProjectBreadcrumb";
import TopBarAiModeToggle from "@/components/thinkingMachine/layout/TopBarAiModeToggle";
import TopBarCanvasModeToggle from "@/components/thinkingMachine/layout/TopBarCanvasModeToggle";

const TOPBAR_SIDE_SLOT_WIDTH = 382;
const TOPBAR_TEXT_STYLE = {
  fontFamily: '"Instrument Sans", sans-serif',
  lineHeight: "100%",
  letterSpacing: "-0.352px",
};

function parseStage(stage) {
  const value = normalizeReasoningStage(stage);
  const isDesign = value.startsWith("design-");
  const isConverge = value.endsWith("-converge");
  return {
    mode: isDesign ? "design" : "research",
    flow: isConverge ? "converge" : "diverge",
  };
}

export default function TopBar({
  stage = "research-diverge",
  onStageChange,
  projectTitle = "Thinking Machine",
  onProjectTitleChange,
  projectMetaHref = "/projects",
  projectMetaLabel = "Project workspace",
  canvasMode = "personal",
  onCanvasModeChange,
  drawerMode = "tip",
  onDrawerModeChange,
  isDrawerOpen = false,
}) {
  const { mode, flow } = parseStage(stage);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(projectTitle);

  useEffect(() => {
    setDraftTitle(projectTitle);
  }, [projectTitle]);

  const handleModeClick = (nextMode) => {
    if (!onStageChange) return;
    const nextStage = `${nextMode}-${flow}`;
    onStageChange(nextStage);
  };

  const handleFlowClick = (nextFlow) => {
    if (!onStageChange) return;
    const nextStage = `${mode}-${nextFlow}`;
    onStageChange(nextStage);
  };

  const isTipSelected = isDrawerOpen && drawerMode === "tip";
  const isChatSelected = isDrawerOpen && drawerMode === "chat";

  const commitTitle = () => {
    const nextTitle = draftTitle.trim() || "Untitled Project";
    setDraftTitle(nextTitle);
    onProjectTitleChange?.(nextTitle);
    setIsEditingTitle(false);
  };

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-[60] px-6 py-4">
      <div
        className="grid items-start"
        style={{ gridTemplateColumns: `${TOPBAR_SIDE_SLOT_WIDTH}px minmax(0, 1fr) ${TOPBAR_SIDE_SLOT_WIDTH}px` }}
      >
        <TopBarProjectBreadcrumb
          projectMetaHref={projectMetaHref}
          projectMetaLabel={projectMetaLabel}
          isEditingTitle={isEditingTitle}
          projectTitle={projectTitle}
          draftTitle={draftTitle}
          setDraftTitle={setDraftTitle}
          setIsEditingTitle={setIsEditingTitle}
          commitTitle={commitTitle}
        />

        <div />

        <div className="w-[382px] translate-x-[7px] justify-self-end">
          <div className="flex flex-col items-end gap-2">
            <TopBarAiModeToggle mode={mode} flow={flow} onModeClick={handleModeClick} onFlowClick={handleFlowClick} />
            <TopBarCanvasModeToggle canvasMode={canvasMode} onCanvasModeChange={onCanvasModeChange} />
          </div>
        </div>
      </div>
    </header>
  );
}
