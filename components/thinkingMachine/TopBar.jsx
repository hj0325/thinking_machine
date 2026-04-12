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

  const isResearch = mode === "research";
  const isIdeation = mode === "design";
  const isDiverge = flow === "diverge";
  const isConverge = flow === "converge";

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
        <div className="pointer-events-auto w-[382px] justify-self-start">
          <div className="text-[13px] font-semibold uppercase tracking-[0.18em] text-slate-700/84">
            Thinking Machine
          </div>
          <div
            className="mt-1 text-[10px] font-medium text-slate-600/84"
            style={TOPBAR_META_TEXT_STYLE}
          >
            <div>Designed by K-Arts cciD</div>
            <div>Powered by OpenAI</div>
          </div>
          <div className="mt-2 h-px w-[144px] bg-slate-500/30" />
        </div>

        <div className="pointer-events-auto flex justify-center pt-0.5">
          <motion.div
            layout
            className="flex max-w-[420px] items-center gap-2 text-[14px] font-medium text-slate-700/88"
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

        <div className="w-[382px] translate-x-[7px] justify-self-end">
          <div className="pointer-events-auto flex w-full items-start justify-between">
            <div className="inline-flex rounded-full bg-white/80 px-1 py-0.5 shadow-sm border border-white/70">
              <button
                type="button"
                onClick={() => onCanvasModeChange?.("personal")}
                className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full transition ${
                  canvasMode === "personal"
                    ? "text-white"
                    : "text-slate-600 hover:bg-white"
                }`}
                style={canvasMode === "personal" ? { background: "linear-gradient(180deg, #3E5A8F 0%, #182338 100%)" } : undefined}
              >
                Personal
              </button>
              <button
                type="button"
                onClick={() => onCanvasModeChange?.("team")}
                className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full transition ${
                  canvasMode === "team" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-white"
                }`}
              >
                Team
              </button>
            </div>
            <div className="inline-flex rounded-full bg-white/80 px-1 py-0.5 shadow-sm border border-white/70">
              <button
                type="button"
                onClick={() => handleModeClick("research")}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition ${
                  isResearch ? "text-white" : "text-slate-600 hover:bg-white"
                }`}
                style={isResearch ? { background: "linear-gradient(180deg, #3E5A8F 0%, #182338 100%)" } : undefined}
              >
                Research
              </button>
              <button
                type="button"
                onClick={() => handleModeClick("design")}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition ${
                  isIdeation ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-white"
                }`}
              >
                Design
              </button>
            </div>
            <div className="inline-flex rounded-full bg-white/80 px-1 py-0.5 shadow-sm border border-white/70">
              <button
                type="button"
                onClick={() => handleFlowClick("diverge")}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition ${
                  isDiverge ? "text-white" : "text-slate-600 hover:bg-white"
                }`}
                style={isDiverge ? { background: "linear-gradient(180deg, #3E5A8F 0%, #182338 100%)" } : undefined}
              >
                Diverge
              </button>
              <button
                type="button"
                onClick={() => handleFlowClick("converge")}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full transition ${
                  isConverge ? "bg-amber-400 text-slate-900" : "text-slate-600 hover:bg-white"
                }`}
              >
                Converge
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
