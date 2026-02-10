import { useState } from 'react';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Topbar } from '@/components/layout/Topbar';
import { ProjectTabs } from '@/components/layout/ProjectTabs';
import { PreviewPanel } from '@/components/layout/PreviewPanel';
import { ConfiguratorPanel } from '@/components/configurator/ConfiguratorPanel';
import { useProjectStore } from '@/hooks/useProjectStore';

const Index = () => {
  const [activePage, setActivePage] = useState<'explorar' | 'criar' | 'galeria'>('criar');
  const {
    projects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    addProject,
    removeProject,
    updateConfig,
  } = useProjectStore();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar activePage={activePage} onNavigate={setActivePage} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onNewProject={addProject} />
        <ProjectTabs
          projects={projects}
          activeId={activeProjectId}
          onSelect={setActiveProjectId}
          onClose={removeProject}
          onAdd={addProject}
        />

        <div className="flex flex-1 overflow-hidden">
          {activePage === 'criar' && activeProject && (
            <>
              <ConfiguratorPanel
                config={activeProject.config}
                onUpdate={updateConfig}
              />
              <PreviewPanel state="aguardando" />
            </>
          )}

          {activePage === 'explorar' && (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <p className="text-sm">Explorar — Em breve</p>
            </div>
          )}

          {activePage === 'galeria' && (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              <p className="text-sm">Minha Galeria — Em breve</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
