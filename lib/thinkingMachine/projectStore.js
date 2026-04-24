import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  getDefaultMeetingMemory,
  sanitizeMeetingMemory,
} from "@/lib/thinkingMachine/meetingMemory";

const STORE_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "thinking-machine-store.json");
const MAX_ACTIVITY_ITEMS = 80;

const DEFAULT_STORE = {
  projects: {},
};

function nowIso() {
  return new Date().toISOString();
}

function sanitizeMember(member = {}) {
  const id = typeof member.id === "string" && member.id.trim() ? member.id.trim() : `user-${randomUUID()}`;
  const name = typeof member.name === "string" && member.name.trim() ? member.name.trim() : "Unknown teammate";
  const email = typeof member.email === "string" ? member.email.trim() : "";
  const picture = typeof member.picture === "string" ? member.picture.trim() : "";
  const role = typeof member.role === "string" && member.role.trim() ? member.role.trim() : "editor";
  return {
    id,
    name,
    email,
    picture,
    role,
    lastSeenAt: nowIso(),
  };
}

function sanitizeProject(project = {}) {
  return {
    id: project.id,
    title: typeof project.title === "string" && project.title.trim() ? project.title.trim() : "Untitled Project",
    createdAt: project.createdAt || nowIso(),
    updatedAt: project.updatedAt || nowIso(),
    graph: {
      nodes: Array.isArray(project?.graph?.nodes) ? project.graph.nodes : [],
      edges: Array.isArray(project?.graph?.edges) ? project.graph.edges : [],
      stage: typeof project?.graph?.stage === "string" ? project.graph.stage : "research-diverge",
      updatedAt: project?.graph?.updatedAt || project.updatedAt || nowIso(),
    },
    meetingMemory: sanitizeMeetingMemory(project?.meetingMemory || getDefaultMeetingMemory()),
    activity: Array.isArray(project.activity) ? project.activity.slice(0, MAX_ACTIVITY_ITEMS) : [],
    members: Array.isArray(project.members) ? project.members.map(sanitizeMember) : [],
  };
}

async function ensureStoreFile() {
  await fs.mkdir(STORE_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, JSON.stringify(DEFAULT_STORE, null, 2), "utf8");
  }
}

async function readStore() {
  await ensureStoreFile();
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = raw ? JSON.parse(raw) : DEFAULT_STORE;
    const projects = Object.fromEntries(
      Object.entries(parsed?.projects || {}).map(([projectId, project]) => [projectId, sanitizeProject(project)])
    );
    return { projects };
  } catch {
    return { ...DEFAULT_STORE };
  }
}

async function writeStore(store) {
  await ensureStoreFile();
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
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

async function mutateProject(projectId, updater) {
  const store = await readStore();
  const existing = sanitizeProject(store.projects[projectId] || { id: projectId });
  const nextProject = sanitizeProject(await updater(existing));
  store.projects[projectId] = nextProject;
  await writeStore(store);
  return nextProject;
}

export async function listProjects() {
  const store = await readStore();
  return Object.values(store.projects)
    .map(getProjectSummary)
    .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
}

export async function createProject({ title, actor } = {}) {
  const timestamp = nowIso();
  const id = randomUUID();
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
  const store = await readStore();
  store.projects[id] = project;
  await writeStore(store);
  return project;
}

export async function getProject(projectId) {
  if (!projectId) return null;
  const store = await readStore();
  const project = store.projects[projectId];
  return project ? sanitizeProject(project) : null;
}

export async function updateProject(projectId, patch = {}) {
  return mutateProject(projectId, async (project) => {
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

export async function registerProjectMember(projectId, member) {
  return mutateProject(projectId, async (project) => {
    upsertMember(project, member);
    return {
      ...project,
      updatedAt: nowIso(),
    };
  });
}

export async function getProjectMembers(projectId) {
  const project = await getProject(projectId);
  return project?.members || [];
}

export async function getProjectGraph(projectId) {
  const project = await getProject(projectId);
  if (!project) return null;
  return {
    project: getProjectSummary(project),
    graph: project.graph,
    meetingMemory: project.meetingMemory,
  };
}

export async function saveProjectGraph(projectId, graph = {}, actor) {
  const nextProject = await mutateProject(projectId, async (project) => {
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
      meetingMemory: sanitizeMeetingMemory(graph?.meetingMemory || project.meetingMemory || getDefaultMeetingMemory()),
    };
  });
  return {
    project: getProjectSummary(nextProject),
    graph: nextProject.graph,
    meetingMemory: nextProject.meetingMemory,
  };
}

export async function getProjectActivity(projectId) {
  const project = await getProject(projectId);
  return project?.activity || [];
}

export async function appendProjectActivity(projectId, activity = {}) {
  const nextProject = await mutateProject(projectId, async (project) => {
    if (activity.actor) upsertMember(project, activity.actor);
    const timestamp = nowIso();
    const entry = {
      id: activity.id || `activity-${randomUUID()}`,
      type: typeof activity.actionType === "string" && activity.actionType.trim()
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
