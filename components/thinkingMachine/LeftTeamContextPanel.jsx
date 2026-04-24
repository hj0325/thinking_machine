"use client";

import { motion, AnimatePresence } from "framer-motion";
import TeamTimelineCard from "@/components/thinkingMachine/cards/TeamTimelineCard";
import AgentContextSummaryCard from "@/components/thinkingMachine/cards/AgentContextSummaryCard";
import MeetingMemoryCard from "@/components/thinkingMachine/cards/MeetingMemoryCard";

function MemberButton({ member, isActive, isCurrentUser, onClick }) {
  const initials = String(member?.name || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-[18px] border px-3 py-2.5 text-left transition ${
        isActive
          ? "border-teal-300 bg-[linear-gradient(180deg,rgba(240,253,250,0.98)_0%,rgba(255,255,255,0.94)_100%)] shadow-[0_10px_24px_rgba(45,212,191,0.12)]"
          : "border-slate-200/80 bg-white/92 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white shadow-sm">
        {initials || "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-[12px] font-semibold text-slate-800">
          {member?.name || "Unknown teammate"}
          {isCurrentUser ? " (You)" : ""}
        </div>
        <div className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-slate-400">{member?.role || "editor"}</div>
      </div>
    </button>
  );
}

export default function LeftTeamContextPanel({
  isOpen,
  teamMembers,
  activityItems,
  selectedMemberId,
  selectedActivityId,
  summary,
  isSummaryLoading,
  summaryError,
  meetingMemoryReadout,
  isMeetingMemoryLoading,
  currentUserId,
  onToggle,
  onSelectMember,
  onSelectActivity,
  onExplainContext,
  onFocusNode,
}) {
  const members = Array.isArray(teamMembers) ? teamMembers : [];
  const items = Array.isArray(activityItems) ? activityItems : [];

  return (
    <div className="pointer-events-none absolute left-5 top-[50px] z-[58]">
      <div className="pointer-events-auto relative">
        <button
          type="button"
          onClick={onToggle}
          className={`inline-flex h-[40px] w-[40px] items-center justify-center rounded-full border text-slate-700 backdrop-blur-[16px] transition ${
            isOpen
              ? "border-[#D7E2DB] bg-white/94 shadow-[0_12px_24px_rgba(15,23,42,0.12)]"
              : "border-white/85 bg-white/90 shadow-[0_10px_20px_rgba(15,23,42,0.09)] hover:bg-white"
          }`}
          aria-label={isOpen ? "Hide team context" : "Show team context"}
          title={isOpen ? "Hide team context" : "Show team context"}
        >
          <span className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.46)_0%,rgba(236,243,239,0.16)_100%)]" />
          <span className="relative flex h-[17px] w-[17px] items-center justify-center text-[#41526D]">
            <span className="absolute inset-0 rounded-[4px] border-[1.7px] border-current" />
            <span className="absolute bottom-[2px] left-1/2 top-[2px] w-0 -translate-x-1/2 border-l-[1.7px] border-current" />
          </span>
        </button>

        <AnimatePresence>
          {isOpen ? (
            <motion.div
              initial={{ opacity: 0, x: -16, y: 8 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, x: -16, y: 8 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 top-[52px] w-[348px]"
            >
              <div className="flex max-h-[calc(100vh-170px)] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-[rgba(244,248,245,0.9)] p-3.5 shadow-[0_18px_36px_rgba(88,116,104,0.10)] backdrop-blur-[18px]">
                <div className="shrink-0 rounded-[22px] border border-white/75 bg-white/80 px-3.5 py-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Team context</div>
                      <div className="mt-1 text-[12px] leading-relaxed text-slate-500">
                        Review teammate activity and ask the agent what likely changed in the project context.
                      </div>
                    </div>
                    <div className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                      {members.length} members
                    </div>
                  </div>
                </div>

                <div className="mt-3 shrink-0 rounded-[22px] border border-white/75 bg-white/82 p-3.5 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">Members</div>
                    <button
                      type="button"
                      onClick={() => onSelectMember?.(null)}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                    >
                      All
                    </button>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {members.length ? (
                      members.map((member) => (
                        <MemberButton
                          key={member.id}
                          member={member}
                          isActive={member.id === selectedMemberId}
                          isCurrentUser={member.id === currentUserId}
                          onClick={() => onSelectMember?.(member.id)}
                        />
                      ))
                    ) : (
                      <div className="rounded-xl bg-slate-50/90 px-3 py-2 text-[11px] text-slate-400">No teammates registered yet.</div>
                    )}
                  </div>
                </div>

                <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1" style={{ scrollbarWidth: "thin" }}>
                  <div className="flex flex-col gap-3">
                    <div className="min-h-0 flex-1">
                      <TeamTimelineCard
                        items={items}
                        selectedActivityId={selectedActivityId}
                        onSelectActivity={onSelectActivity}
                      />
                    </div>

                    <AgentContextSummaryCard
                      summary={summary}
                      isLoading={isSummaryLoading}
                      error={summaryError}
                      onExplain={onExplainContext}
                      onFocusNode={onFocusNode}
                    />
                    <MeetingMemoryCard
                      readout={meetingMemoryReadout}
                      isLoading={isMeetingMemoryLoading}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
