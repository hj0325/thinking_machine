import Link from "next/link";
import { useRouter } from "next/router";
import { startTransition, useEffect, useState } from "react";
import ThinkingMachine from "@/components/thinkingMachine/ThinkingMachine";

const LOGIN_STORAGE_KEY = "isLoggedIn";
const PROJECTS_STORAGE_KEY = "thinking-machine-projects";

function readProjects() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PROJECTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ProjectWorkspacePage() {
  const router = useRouter();
  const { id } = router.query;
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;

    const isLoggedIn = typeof window !== "undefined" && window.localStorage.getItem(LOGIN_STORAGE_KEY) === "true";
    if (!isLoggedIn) {
      void router.replace("/");
      return;
    }

    const projects = readProjects();
    const matchedProject = projects.find((item) => item?.id === id) || null;

    if (!matchedProject) {
      void router.replace("/projects");
      return;
    }

    startTransition(() => {
      setProject(matchedProject);
      setIsLoading(false);
    });
  }, [id, router, router.isReady]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#EFEFEF] text-slate-900">
        <div className="rounded-3xl border border-black/10 bg-white px-6 py-4 text-sm text-slate-600 shadow-sm">
          Loading workspace...
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#EFEFEF]">
      <ThinkingMachine
        projectId={String(project?.id || id || "")}
        initialProjectTitle={project?.title || "Untitled Project"}
        projectMetaHref="/projects"
        projectMetaLabel="Back to projects"
      />
    </main>
  );
}
