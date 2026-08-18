import { useEffect, useState } from "react";
import { findProject, projectModules } from "./catalog/discover-projects";
import LandingPage from "./shell/LandingPage";
import ProjectFrame from "./shell/ProjectFrame";

function projectIdFromPath(pathname: string): string | undefined {
  const match = pathname.match(/^\/projects\/([^/]+)\/?$/);
  return match?.[1];
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const projectId = projectIdFromPath(pathname);
  const project = projectId ? findProject(projectId) : undefined;

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openProject = (id: string) => {
    window.history.pushState({}, "", `/projects/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPathname(`/projects/${id}`);
  };

  const goHome = () => {
    window.history.pushState({}, "", "/");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setPathname("/");
  };

  if (project) {
    return <ProjectFrame project={project} onBack={goHome} />;
  }

  return <LandingPage projects={projectModules} onOpenProject={openProject} />;
}
