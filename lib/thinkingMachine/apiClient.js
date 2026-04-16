import axios from "axios";

export function toChatErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.response?.data?.detail ||
    "Sorry, something went wrong. Please try again."
  );
}

export async function analyze(payload) {
  const response = await axios.post("/api/analyze", payload);
  return response.data;
}

export async function chat(payload) {
  const response = await axios.post("/api/chat", payload);
  return response.data;
}

export async function chatToNodes(payload) {
  const response = await axios.post("/api/chat-to-nodes", payload);
  return response.data;
}

export async function fetchProjects() {
  const response = await axios.get("/api/projects");
  return response.data.projects || [];
}

export async function createProject(payload) {
  const response = await axios.post("/api/projects", payload);
  return response.data.project;
}

export async function fetchProject(projectId) {
  const response = await axios.get(`/api/projects/${projectId}`);
  return response.data.project;
}

export async function updateProject(projectId, payload) {
  const response = await axios.patch(`/api/projects/${projectId}`, payload);
  return response.data.project;
}

export async function fetchProjectGraph(projectId) {
  try {
    const response = await axios.get(`/api/projects/${projectId}/graph`);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      const timestamp = new Date().toISOString();
      return {
        project: {
          id: projectId,
          title: "Untitled Project",
          createdAt: timestamp,
          updatedAt: timestamp,
          members: [],
        },
        graph: {
          nodes: [],
          edges: [],
          stage: "research-diverge",
          updatedAt: timestamp,
        },
      };
    }
    throw error;
  }
}

export async function saveProjectGraph(projectId, payload) {
  const response = await axios.put(`/api/projects/${projectId}/graph`, payload);
  return response.data;
}

export async function fetchProjectActivity(projectId) {
  const response = await axios.get(`/api/projects/${projectId}/activity`);
  return response.data.activity || [];
}

export async function recordProjectActivity(projectId, payload) {
  const response = await axios.post(`/api/projects/${projectId}/activity`, payload);
  return response.data.entry;
}

export async function fetchProjectMembers(projectId) {
  const response = await axios.get(`/api/projects/${projectId}/members`);
  return response.data.members || [];
}

export async function registerProjectMember(projectId, payload) {
  const response = await axios.post(`/api/projects/${projectId}/members`, payload);
  return response.data.members || [];
}

export async function summarizeTeamContext(payload) {
  const response = await axios.post("/api/team-context", payload);
  return response.data;
}

