import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNav, NavTab } from './components/TopNav';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { NodeInspector } from './components/NodeInspector';
import { CodeView } from './components/views/CodeView';
import { ExecutionView } from './components/views/ExecutionView';
import { DependenciesView } from './components/views/DependenciesView';
import { SimulationView } from './components/views/SimulationView';
import { INITIAL_WORKFLOWS } from './data/mockWorkflows';

export default function App() {
  const [workflows] = useState(INITIAL_WORKFLOWS);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string>('artwork-to-vector');
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('Live Map');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(1.4);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [selectedStageId, setSelectedStageId] = useState<string>('vectorize');
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId) || workflows[0];

  // Active stage for inspector
  const currentStage = activeWorkflow.stages.find((s) => s.id === selectedStageId) || activeWorkflow.stages[0];

  // Subtle live simulation timer
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.05 * simSpeed;
        // Loop gracefully or pause when reaching projected end
        if (next > 2.4) {
          return 1.4; // Loop back to 1.4s to maintain live view match
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, simSpeed]);

  const handleToggleRunning = () => {
    setIsRunning((prev) => !prev);
  };

  const handleResetSimulation = () => {
    setCurrentTime(1.4);
    setSelectedStageId('vectorize');
    setIsInspectorOpen(true);
  };

  const handleStepForward = () => {
    setCurrentTime((prev) => Math.min(prev + 0.2, 5.0));
  };

  const handleSelectStage = (stageId: string) => {
    setSelectedStageId(stageId);
    setIsInspectorOpen(true);
  };

  const handleSelectWorkflow = (wfId: string) => {
    setActiveWorkflowId(wfId);
    const targetWf = workflows.find((w) => w.id === wfId);
    if (targetWf) {
      setSelectedStageId(targetWf.selectedStageId || targetWf.stages[0].id);
      setCurrentTime(targetWf.currentTimeSeconds);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F4EE] text-[#242628]">
      {/* 1. Left Sidebar */}
      <Sidebar
        workflows={workflows}
        activeWorkflowId={activeWorkflowId}
        onSelectWorkflow={handleSelectWorkflow}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* 2. Top Navigation */}
        <TopNav
          activeTab={activeNavTab}
          onSelectTab={setActiveNavTab}
          isRunning={isRunning}
          onToggleRunning={handleToggleRunning}
          onResetSimulation={handleResetSimulation}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic Main Body Content */}
        {activeNavTab === 'Live Map' && (
          <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 sm:p-6 gap-6 min-w-0">
            {/* 3. Main Workflow Canvas */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F7F4EE]">
              <WorkflowCanvas
                workflow={activeWorkflow}
                selectedStageId={selectedStageId}
                onSelectStage={handleSelectStage}
                isRunningWorkflow={isRunning}
                currentTime={currentTime}
              />
            </div>

            {/* 4. Right Inspector */}
            {isInspectorOpen && (
              <NodeInspector
                stage={currentStage}
                onClose={() => setIsInspectorOpen(false)}
                isRunningWorkflow={isRunning}
                workflowName={activeWorkflow.name}
                workflowId={activeWorkflow.id}
                allLogs={activeWorkflow.logs}
              />
            )}
          </main>
        )}

        {activeNavTab === 'Code' && (
          <CodeView workflow={activeWorkflow} />
        )}

        {activeNavTab === 'Execution' && (
          <ExecutionView workflow={activeWorkflow} currentTime={currentTime} />
        )}

        {activeNavTab === 'Dependencies' && (
          <DependenciesView workflow={activeWorkflow} />
        )}

        {activeNavTab === 'Simulation' && (
          <SimulationView
            workflow={activeWorkflow}
            isRunning={isRunning}
            onToggleRunning={handleToggleRunning}
            currentTime={currentTime}
            onStepForward={handleStepForward}
            onReset={handleResetSimulation}
            simSpeed={simSpeed}
            onChangeSpeed={setSimSpeed}
            onReturnToLiveMap={() => setActiveNavTab('Live Map')}
          />
        )}
      </div>
    </div>
  );
}
