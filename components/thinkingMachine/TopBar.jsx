"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { normalizeReasoningStage } from "@/lib/thinkingMachine/nodeMeta";

const TOPBAR_SIDE_SLOT_WIDTH = 382;
const TOPBAR_TEXT_STYLE = {
  fontFamily: '"Instrument Sans", sans-serif',
  lineHeight: "100%",
  letterSpacing: "-0.352px",
};
const TOPBAR_META_TEXT_STYLE = {
  fontFamily: '"Instrument Sans", sans-serif',
  lineHeight: "130%",
  letterSpacing: "-0.176px",
};
const TOPBAR_CENTER_TEXT_STYLE = {
  fontFamily: '"Instrument Sans", sans-serif',
  lineHeight: "110%",
  letterSpacing: "-0.32px",
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
        <div className="pointer-events-auto flex w-[382px] justify-self-start pt-0.5">
          <motion.div
            layout
            className="flex w-full max-w-[420px] items-center gap-2 text-[14px] font-medium text-slate-700/88"
            style={TOPBAR_CENTER_TEXT_STYLE}
            transition={{ layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
          >
              <Link
                href={projectMetaHref}
                className="inline-flex shrink-0 transition hover:text-slate-900"
                style={TOPBAR_CENTER_TEXT_STYLE}
              >
                {projectMetaLabel}
              </Link>
              <span className="text-slate-400/80">/</span>
              <div className="min-w-0 flex-1">
                {isEditingTitle ? (
                  <motion.input
                    layout="position"
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    onBlur={commitTitle}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commitTitle();
                      }
                      if (event.key === "Escape") {
                        setDraftTitle(projectTitle || "Untitled Project");
                        setIsEditingTitle(false);
                      }
                    }}
                    autoFocus
                    className="w-full border-none bg-transparent px-0 py-0 text-[14px] font-medium text-slate-800 outline-none shadow-none"
                    style={TOPBAR_CENTER_TEXT_STYLE}
                    aria-label="Project title"
                    transition={{ layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
                  />
                ) : (
                  <motion.button
                    layout="position"
                    type="button"
                    onClick={() => setIsEditingTitle(true)}
                    className="max-w-full truncate text-left text-[14px] font-medium text-slate-700/88 transition hover:text-slate-900"
                    style={TOPBAR_CENTER_TEXT_STYLE}
                    aria-label="Edit project title"
                    title="Rename project"
                    transition={{ layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } }}
                  >
                    {projectTitle || "Untitled Project"}
                  </motion.button>
                )}
              </div>
          </motion.div>
        </div>

        <div />

        <div className="w-[382px] translate-x-[7px] justify-self-end">
          <div className="flex flex-col items-end gap-2">
            <div className="pointer-events-auto flex w-full items-start justify-end">
              <div
                className="inline-flex h-[27px] items-center rounded-[25px] px-[6px] shadow-[0.5px_1px_5px_rgba(0,0,0,0.1)]"
                style={{ background: "#F6F6F2" }}
              >
                <span
                  className="mr-2 text-[10px] font-semibold text-[#929B94]"
                  style={TOPBAR_META_TEXT_STYLE}
                >
                  AI mode
                </span>
                <button
                  type="button"
                  onClick={() => handleModeClick("research")}
                  className="inline-flex h-[22px] w-[70px] items-center justify-center rounded-[25px] transition"
                  style={{
                    background: mode === "research" ? "#1F2937" : "transparent",
                    fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
                    fontStyle: "normal",
                    fontWeight: 700,
                    fontSize: "10.3838px",
                    lineHeight: "180%",
                    color: mode === "research" ? "#FFFFFF" : "#4B5563",
                  }}
                >
                  Research
                </button>
                <button
                  type="button"
                  onClick={() => handleModeClick("design")}
                  className="ml-[2px] inline-flex h-[22px] w-[64px] items-center justify-center rounded-[25px] transition"
                  style={{
                    background: mode === "design" ? "#1F2937" : "transparent",
                    fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
                    fontStyle: "normal",
                    fontWeight: 700,
                    fontSize: "10.3838px",
                    lineHeight: "180%",
                    color: mode === "design" ? "#FFFFFF" : "#4B5563",
                  }}
                >
                  Design
                </button>
                <span className="mx-1 text-[10px] text-slate-400">·</span>
                <button
                  type="button"
                  onClick={() => handleFlowClick("diverge")}
                  className="inline-flex h-[22px] w-[72px] items-center justify-center rounded-[25px] transition"
                  style={{
                    background: flow === "diverge" ? "#2563EB" : "transparent",
                    fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
                    fontStyle: "normal",
                    fontWeight: 700,
                    fontSize: "10.3838px",
                    lineHeight: "180%",
                    color: flow === "diverge" ? "#FFFFFF" : "#4B5563",
                  }}
                >
                  Diverge
                </button>
                <button
                  type="button"
                  onClick={() => handleFlowClick("converge")}
                  className="ml-[2px] inline-flex h-[22px] w-[80px] items-center justify-center rounded-[25px] transition"
                  style={{
                    background: flow === "converge" ? "#2563EB" : "transparent",
                    fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
                    fontStyle: "normal",
                    fontWeight: 700,
                    fontSize: "10.3838px",
                    lineHeight: "180%",
                    color: flow === "converge" ? "#FFFFFF" : "#4B5563",
                  }}
                >
                  Converge
                </button>
              </div>
            </div>

            <div className="pointer-events-auto flex w-full items-start justify-end">
              <div
                className="inline-flex h-[27px] w-[130px] items-center rounded-[25px] px-[3px] shadow-[0.5px_1px_5px_rgba(0,0,0,0.1)]"
                style={{ background: "#F6F6F2" }}
              >
                <button
                  type="button"
                  onClick={() => onCanvasModeChange?.("personal")}
                  className="inline-flex h-[22px] w-[64px] items-center justify-center rounded-[25px] transition"
                  style={{
                    background: canvasMode === "personal" ? "#7BA592" : "transparent",
                    fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
                    fontStyle: "normal",
                    fontWeight: 700,
                    fontSize: "10.3838px",
                    lineHeight: "180%",
                    color: canvasMode === "personal" ? "#FFFFFF" : "#929B94",
                  }}
                >
                  Personal
                </button>
                <button
                  type="button"
                  onClick={() => onCanvasModeChange?.("team")}
                  className="inline-flex h-[22px] w-[60px] items-center justify-center rounded-[25px] transition"
                  style={{
                    background: canvasMode === "team" ? "#7BA592" : "transparent",
                    fontFamily: '"Pretendard Variable", "Instrument Sans", sans-serif',
                    fontStyle: "normal",
                    fontWeight: 700,
                    fontSize: "10.3838px",
                    lineHeight: "180%",
                    color: canvasMode === "team" ? "#FFFFFF" : "#929B94",
                  }}
                >
                  Team
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
