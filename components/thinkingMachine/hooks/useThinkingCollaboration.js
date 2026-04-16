import { startTransition, useCallback, useEffect, useState } from "react";

const PROJECTS_STORAGE_KEY = "thinking-machine-projects";
const MAX_ACTIVITY_ITEMS = 24;

function getActivityStorageKey(projectId) {
  return `thinking-machine-activity-${projectId}`;
}

function readProjectsFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProjectsToStorage(projects) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
}

function readActivityLog(projectId) {
  if (typeof window === "undefined" || !projectId) return [];
  try {
    const raw = window.localStorage.getItem(getActivityStorageKey(projectId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeActivityLog(projectId, entries) {
  if (typeof window === "undefined" || !projectId) return;
  window.localStorage.setItem(getActivityStorageKey(projectId), JSON.stringify(entries.slice(0, MAX_ACTIVITY_ITEMS)));
}

export function useThinkingCollaboration({
  projectId,
  currentUserId,
  currentUserRole,
  autoRefreshMs = 15000,
} = {}) {
  const [projectLastUpdated, setProjectLastUpdated] = useState(null);
  const [activityLog, setActivityLog] = useState([]);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const refreshProjectCollaborationMeta = useCallback(() => {
    if (!projectId || typeof window === "undefined") return;
    const projects = readProjectsFromStorage();
    const matchedProject = projects.find((item) => item?.id === projectId) || null;
    const nextActivity = readActivityLog(projectId);
    startTransition(() => {
      setProjectLastUpdated(matchedProject?.updatedAt || null);
      setActivityLog(nextActivity);
      setLastRefreshedAt(new Date().toISOString());
    });
  }, [projectId]);

  const recordProjectActivity = useCallback(
    (actionType, payload = {}) => {
      if (!projectId || typeof window === "undefined") return;
      const timestamp = new Date().toISOString();
      const nextProjects = readProjectsFromStorage().map((project) =>
        project?.id === projectId ? { ...project, updatedAt: timestamp } : project
      );
      writeProjectsToStorage(nextProjects);

      const nextEntry = {
        id: `${actionType}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        type: actionType,
        timestamp,
        userId: currentUserId,
        userRole: currentUserRole,
        ...payload,
      };
      const nextActivity = [nextEntry, ...readActivityLog(projectId)].slice(0, MAX_ACTIVITY_ITEMS);
      writeActivityLog(projectId, nextActivity);
      refreshProjectCollaborationMeta();
    },
    [currentUserId, currentUserRole, projectId, refreshProjectCollaborationMeta]
  );

  useEffect(() => {
    refreshProjectCollaborationMeta();
  }, [refreshProjectCollaborationMeta]);

  useEffect(() => {
    if (!projectId) return undefined;
    const intervalId = window.setInterval(() => {
      refreshProjectCollaborationMeta();
    }, autoRefreshMs);
    return () => window.clearInterval(intervalId);
  }, [autoRefreshMs, projectId, refreshProjectCollaborationMeta]);

  return {
    projectLastUpdated,
    activityLog,
    lastRefreshedAt,
    refreshProjectCollaborationMeta,
    recordProjectActivity,
  };
}

