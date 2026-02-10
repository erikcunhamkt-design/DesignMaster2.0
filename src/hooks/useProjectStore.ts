import { useState, useCallback } from 'react';
import { Project, ProjectConfig, defaultConfig } from '@/types/project';

const createProject = (name: string): Project => ({
  id: crypto.randomUUID(),
  name,
  config: { ...defaultConfig },
});

export function useProjectStore() {
  const [projects, setProjects] = useState<Project[]>([
    createProject('Projeto Alpha'),
  ]);
  const [activeProjectId, setActiveProjectId] = useState<string>(
    () => projects[0]?.id ?? ''
  );

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? projects[0];

  const addProject = useCallback(() => {
    const newProject = createProject(`Projeto ${projects.length + 1}`);
    setProjects((prev) => [...prev, newProject]);
    setActiveProjectId(newProject.id);
  }, [projects.length]);

  const removeProject = useCallback(
    (id: string) => {
      setProjects((prev) => {
        const next = prev.filter((p) => p.id !== id);
        if (next.length === 0) {
          const fresh = createProject('Projeto 1');
          setActiveProjectId(fresh.id);
          return [fresh];
        }
        if (activeProjectId === id) {
          setActiveProjectId(next[0].id);
        }
        return next;
      });
    },
    [activeProjectId]
  );

  const updateConfig = useCallback(
    (patch: Partial<ProjectConfig>) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === activeProjectId
            ? { ...p, config: { ...p.config, ...patch } }
            : p
        )
      );
    },
    [activeProjectId]
  );

  return {
    projects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    addProject,
    removeProject,
    updateConfig,
  };
}
