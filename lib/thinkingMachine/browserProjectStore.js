"use client";

const STORE_KEY = "thinking-machine-browser-store-v1";
const MAX_ACTIVITY_ITEMS = 80;

const DEFAULT_STORE = {
  projects: {},
};

function nowIso() {
  return new Date().toISOString();
}

function generateId(prefix = "id") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function readStore() {
  if (!canUseStorage()) return { ...DEFAULT_STORE };
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return { ...DEFAULT_STORE };
    const parsed = JSON.parse(raw);
    return {
      projects: parsed?.projects && typeof parsed.projects === "object" ? parsed.projects : {},
    };
  } catch {
    return { ...DEFAULT_STORE };
  }
}

function writeStore(store) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function sanitizeMember(member = {}) {
  const id = typeof member.id === "string" && member.id.trim() ? member.id.trim() : generateId("user");
  return {
    id,
    name: typeof member.name === "string" && member.name.trim() ? member.name.trim() : "Unknown teammate",
    email: typeof member.email === "string" ? member.email.trim() : "",
    picture: typeof member.picture === "string" ? member.picture.trim() : "",
    role: typeof member.role === "string" && member.role.trim() ? member.role.trim() : "editor",
    lastSeenAt: nowIso(),
  };
}

function sanitizeProject(project = {}) {
  const timestamp = nowIso();
  return {
    id: project.id || generateId("project"),
    title: typeof project.title === "string" && project.title.trim() ? project.title.trim() : "Untitled Project",
    createdAt: project.createdAt || timestamp,
    updatedAt: project.updatedAt || timestamp,
    graph: {
      nodes: Array.isArray(project?.graph?.nodes) ? project.graph.nodes : [],
      edges: Array.isArray(project?.graph?.edges) ? project.graph.edges : [],
      stage: typeof project?.graph?.stage === "string" ? project.graph.stage : "research-diverge",
      updatedAt: project?.graph?.updatedAt || project.updatedAt || timestamp,
    },
    activity: Array.isArray(project.activity) ? project.activity.slice(0, MAX_ACTIVITY_ITEMS) : [],
    members: Array.isArray(project.members) ? project.members.map(sanitizeMember) : [],
  };
}

function getProjectSummary(project) {
  return {
    id: project.id,
    title: project.title,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    members: project.members,
  };
}

function upsertMember(project, member, preferredRole) {
  const safeMember = sanitizeMember({
    ...member,
    role: preferredRole || member?.role || (project.members.length === 0 ? "owner" : "editor"),
  });
  const index = project.members.findIndex((item) => item.id === safeMember.id);
  if (index === -1) {
    project.members.unshift(safeMember);
    return safeMember;
  }
  project.members[index] = {
    ...project.members[index],
    ...safeMember,
    role: project.members[index].role || safeMember.role,
    lastSeenAt: nowIso(),
  };
  return project.members[index];
}

function mutateProject(projectId, updater) {
  const store = readStore();
  const existing = sanitizeProject(store.projects[projectId] || { id: projectId });
  const nextProject = sanitizeProject(updater(existing));
  store.projects[projectId] = nextProject;
  writeStore(store);
  return nextProject;
}

export function listBrowserProjects() {
  const store = readStore();
  return Object.values(store.projects)
    .map((project) => getProjectSummary(sanitizeProject(project)))
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
}

export function createBrowserProject({ title, actor } = {}) {
  const timestamp = nowIso();
  const id = generateId("project");
  const member = sanitizeMember({ ...actor, role: "owner" });
  const project = sanitizeProject({
    id,
    title,
    createdAt: timestamp,
    updatedAt: timestamp,
    graph: {
      nodes: [],
      edges: [],
      stage: "research-diverge",
      updatedAt: timestamp,
    },
    activity: [],
    members: [member],
  });
  const store = readStore();
  store.projects[id] = project;
  writeStore(store);
  return project;
}

export function getBrowserProject(projectId) {
  if (!projectId) return null;
  const store = readStore();
  const project = store.projects[projectId];
  return project ? sanitizeProject(project) : null;
}

export function updateBrowserProject(projectId, patch = {}) {
  return mutateProject(projectId, (project) => {
    if (patch.actor) upsertMember(project, patch.actor);
    const timestamp = nowIso();
    return {
      ...project,
      title: typeof patch.title === "string" && patch.title.trim() ? patch.title.trim() : project.title,
      updatedAt: timestamp,
      graph: {
        ...project.graph,
        updatedAt: project.graph?.updatedAt || timestamp,
      },
    };
  });
}

export function getBrowserProjectGraph(projectId) {
  const project = getBrowserProject(projectId);
  if (!project) return null;
  return {
    project: getProjectSummary(project),
    graph: project.graph,
  };
}

export function saveBrowserProjectGraph(projectId, graph = {}, actor) {
  const nextProject = mutateProject(projectId, (project) => {
    if (actor) upsertMember(project, actor);
    const timestamp = nowIso();
    return {
      ...project,
      updatedAt: timestamp,
      graph: {
        nodes: Array.isArray(graph.nodes) ? graph.nodes : [],
        edges: Array.isArray(graph.edges) ? graph.edges : [],
        stage: typeof graph.stage === "string" ? graph.stage : project.graph?.stage || "research-diverge",
        updatedAt: timestamp,
      },
    };
  });
  return {
    project: getProjectSummary(nextProject),
    graph: nextProject.graph,
  };
}

export function getBrowserProjectActivity(projectId) {
  const project = getBrowserProject(projectId);
  return project?.activity || [];
}

export function appendBrowserProjectActivity(projectId, activity = {}) {
  const nextProject = mutateProject(projectId, (project) => {
    if (activity.actor) upsertMember(project, activity.actor);
    const timestamp = nowIso();
    const entry = {
      id: activity.id || generateId("activity"),
      type:
        typeof activity.actionType === "string" && activity.actionType.trim()
          ? activity.actionType.trim()
          : typeof activity.type === "string" && activity.type.trim()
            ? activity.type.trim()
            : "activity",
      timestamp,
      stage: typeof activity.stage === "string" ? activity.stage : project.graph?.stage || "research-diverge",
      userId: activity?.actor?.id || activity.userId || "unknown-user",
      userName: activity?.actor?.name || activity.userName || "Unknown teammate",
      userRole: activity?.actor?.role || activity.userRole || "editor",
      nodeId: activity.nodeId || null,
      nodeTitle: activity.nodeTitle || "",
      nodeType: activity.nodeType || "",
      before: activity.before || null,
      after: activity.after || null,
      relatedNodeIds: Array.isArray(activity.relatedNodeIds) ? activity.relatedNodeIds.filter(Boolean) : [],
      metadata: activity.metadata && typeof activity.metadata === "object" ? activity.metadata : {},
    };
    return {
      ...project,
      updatedAt: timestamp,
      activity: [entry, ...project.activity].slice(0, MAX_ACTIVITY_ITEMS),
    };
  });
  return nextProject.activity[0] || null;
}

export function getBrowserProjectMembers(projectId) {
  const project = getBrowserProject(projectId);
  return project?.members || [];
}

export function registerBrowserProjectMember(projectId, member) {
  const nextProject = mutateProject(projectId, (project) => {
    upsertMember(project, member);
    return {
      ...project,
      updatedAt: nowIso(),
    };
  });
  return nextProject.members;
}
