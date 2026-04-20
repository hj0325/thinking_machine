import { startTransition, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { createProject as createProjectRequest, fetchProjects } from "@/lib/thinkingMachine/apiClient";
import { readCurrentUser } from "@/lib/thinkingMachine/clientUser";

const LOGIN_STORAGE_KEY = "isLoggedIn";

function formatDate(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function createProjectDraft() {
  return {
    title: "Untitled Project",
  };
}

export default function ProjectsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const isLoggedIn = typeof window !== "undefined" && window.localStorage.getItem(LOGIN_STORAGE_KEY) === "true";

    if (!isLoggedIn) {
      void router.replace("/");
      return;
    }

    const run = async () => {
      try {
        const nextProjects = await fetchProjects();
        startTransition(() => {
          setProjects(nextProjects);
          setIsLoading(false);
        });
      } catch {
        startTransition(() => {
          setProjects([]);
          setIsLoading(false);
        });
      }
    };
    void run();
  }, [router]);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const aTime = new Date(a?.updatedAt || 0).getTime();
      const bTime = new Date(b?.updatedAt || 0).getTime();
      return bTime - aTime;
    });
  }, [projects]);

  const handleCreateProject = async () => {
    const draftProject = createProjectDraft();
    const currentUser = readCurrentUser();
    const nextProject = await createProjectRequest({
      title: draftProject.title,
      actor: {
        ...currentUser,
        role: "owner",
      },
    });
    setProjects((prev) => [nextProject, ...prev]);
    void router.push(`/projects/${nextProject.id}`);
  };

  const handleOpenProject = (projectId) => {
    void router.push(`/projects/${projectId}`);
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#EFEFEF] text-slate-900">
        <div className="rounded-3xl border border-black/10 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Loading projects...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#EFEFEF] px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[12px] font-semibold uppercase tracking-[0.28em] text-sky-700">
              Thinking Machine
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em]">Projects</h1>
            <p className="mt-2 text-sm text-slate-600">
              Open an existing project or create a new one to continue.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateProject}
            className="rounded-2xl bg-[#9ED9BF] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-[#9ED9BF]"
          >
            Create New Project
          </button>
        </div>

        {sortedProjects.length === 0 ? (
          <div className="rounded-[28px] border border-black/10 bg-white px-8 py-14 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="text-lg font-semibold text-slate-900">No projects yet</div>
            <p className="mt-2 text-sm text-slate-600">
              Start your first project and we&apos;ll take you straight into it.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {sortedProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleOpenProject(project.id)}
                className="rounded-[28px] border border-black/10 bg-white p-5 text-left shadow-[0_24px_80px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                  Project
                </div>
                <div className="-translate-y-[8px] mt-3 line-clamp-2 text-xl font-semibold tracking-[-0.03em] text-slate-900">
                  {project.title || "Untitled Project"}
                </div>
                <div className="mt-6 text-xs text-slate-600">
                  Updated {formatDate(project.updatedAt)}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
