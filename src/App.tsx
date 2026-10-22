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
import { STATIC_PIPELINES } from './engine/pipelineDefinitions';
import { deriveWorkflowState } from './engine/stateDerivation';
import { simulatedRuntimeSource, RecordedRuntimeEventSource } from './engine/runtimeAdapter';
import type { RecordedRuntimeTrace, RuntimeSourceMode } from './engine/runtimeAdapter';
import { OperationsPanel } from './components/OperationsPanel';
import { createResilienceEvent, RESILIENCE_SCENARIOS, ResilienceScenarioKind } from './engine/resilience';
import type { RuntimeEvent } from './engine/workflowModel';

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
  const [injectedEvents, setInjectedEvents] = useState<RuntimeEvent[]>([]);
  const [utilityPage, setUtilityPage] = useState<'Integrations' | 'Settings' | null>(null);
  const [recordedTrace, setRecordedTrace] = useState<RecordedRuntimeTrace | null>(null);
  const [runtimeMode, setRuntimeMode] = useState<RuntimeSourceMode>('SIMULATED');

  // 1. Static Workflow Definition Lookup
  const activePipelineDef =
    STATIC_PIPELINES.find((p) => p.id === activeWorkflowId) || STATIC_PIPELINES[0];

  // 2. NORMALIZED RUNTIME ADAPTER
  // Simulated today; recorded/live providers can implement the same contract.
  const runtimeSource = runtimeMode === 'RECORDED' && recordedTrace
    ? new RecordedRuntimeEventSource(recordedTrace)
    : simulatedRuntimeSource;
  const runtimeSnapshot = runtimeSource.getSnapshot(activePipelineDef, currentTime, isRunning);
  runtimeSnapshot.injectedEvents = injectedEvents;

  // 3. STATE DERIVATION LAYER
  // Workflow Definition + normalized RuntimeSnapshot -> UI state
  const derived = deriveWorkflowState(
    activePipelineDef,
    runtimeSnapshot,
    selectedStageId
  );

  const activeWorkflow = derived.workflowAdapter;
  const currentStage = derived.activeStage;

  // Real-time execution clock driver
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.05 * simSpeed;
        // Loop gracefully or pause when reaching projected pipeline end
        const playbackEnd = runtimeMode === 'RECORDED' && recordedTrace
          ? Math.max(activePipelineDef.maxTimelineSeconds, ...recordedTrace.events.map(event => event.timestampOffset))
          : activePipelineDef.maxTimelineSeconds;
        if (next > playbackEnd) {
          return runtimeMode === 'RECORDED' ? 0 : activePipelineDef.defaultTimeSeconds;
        }
        return Number(next.toFixed(2));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, simSpeed, activePipelineDef, runtimeMode, recordedTrace]);

  const handleToggleRunning = () => {
    setIsRunning((prev) => !prev);
  };

  const handleResetSimulation = () => {
    setCurrentTime(activePipelineDef.defaultTimeSeconds || 1.4);
    setSelectedStageId(activePipelineDef.nodes[2]?.id || activePipelineDef.nodes[0].id);
    setIsInspectorOpen(true);
    setInjectedEvents([]);
  };

  const handleInjectScenario = (scenarioId: ResilienceScenarioKind, stageId: string) => {
    const scenario = RESILIENCE_SCENARIOS.find((item) => item.id === scenarioId);
    if (!scenario) return;
    setInjectedEvents((previous) => [
      ...previous,
      createResilienceEvent(scenario, stageId, currentTime),
    ]);
    setSelectedStageId(stageId);
    setIsRunning(false);
  };

  const handleStepForward = () => {
    setCurrentTime((prev) => Math.min(Number((prev + 0.2).toFixed(2)), activePipelineDef.maxTimelineSeconds));
  };

  const handleSelectStage = (stageId: string) => {
    setSelectedStageId(stageId);
    setIsInspectorOpen(true);
  };

  const handleSelectWorkflow = (wfId: string) => {
    setUtilityPage(null);
    setActiveWorkflowId(wfId);
    setRuntimeMode('SIMULATED');
    setRecordedTrace(null);
    const targetPipeline = STATIC_PIPELINES.find((p) => p.id === wfId);
    if (targetPipeline) {
      setCurrentTime(targetPipeline.defaultTimeSeconds || 1.0);
      setSelectedStageId(targetPipeline.nodes[0].id);
      setInjectedEvents([]);
    }
  };

  const handleLoadTrace = (trace: RecordedRuntimeTrace) => {
    setRecordedTrace(trace);
    setRuntimeMode('RECORDED');
    setInjectedEvents([]);
    setCurrentTime(0);
    setSelectedStageId(activePipelineDef.nodes[0].id);
    setIsRunning(false);
    setUtilityPage(null);
    setActiveNavTab('Live Map');
  };

  const handleUseSimulation = () => {
    setRuntimeMode('SIMULATED');
    setRecordedTrace(null);
    setInjectedEvents([]);
    setCurrentTime(activePipelineDef.defaultTimeSeconds);
    setIsRunning(false);
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
        onSelectUtilityPage={setUtilityPage}
        activeUtilityPage={utilityPage}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        {/* 2. Top Navigation */}
        <TopNav
          activeTab={activeNavTab}
          onSelectTab={(tab) => { setActiveNavTab(tab); setUtilityPage(null); }}
          isRunning={isRunning}
          runtimeMode={runtimeMode}
          onToggleRunning={handleToggleRunning}
          onResetSimulation={handleResetSimulation}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        {/* Dynamic Main Body Content */}
        {utilityPage && (
          <OperationsPanel
            page={utilityPage}
            definition={activePipelineDef}
            runtimeMode={runtimeMode}
            simSpeed={simSpeed}
            onChangeSpeed={setSimSpeed}
            onLoadTrace={handleLoadTrace}
            onUseSimulation={handleUseSimulation}
            onReset={handleResetSimulation}
            onNavigateToMap={() => { setUtilityPage(null); setActiveNavTab('Live Map'); }}
          />
        )}
        {!utilityPage && activeNavTab === 'Live Map' && (
          <main className="flex-1 flex flex-col lg:flex-row overflow-hidden p-4 sm:p-6 gap-6 min-w-0">
            {/* 3. Main Workflow Canvas */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F7F4EE]">
              <WorkflowCanvas
                workflow={activeWorkflow}
                selectedStageId={selectedStageId}
                onSelectStage={handleSelectStage}
                isRunningWorkflow={isRunning}
                currentTime={currentTime}
                pipes={derived.pipes}
                runtimeMode={runtimeMode}
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
                runtimeSourceMode={runtimeSnapshot.mode}
              />
            )}
          </main>
        )}

        {!utilityPage && activeNavTab === 'Code' && (
          <CodeView workflow={activeWorkflow} />
        )}

        {!utilityPage && activeNavTab === 'Execution' && (
          <ExecutionView workflow={activeWorkflow} currentTime={currentTime} telemetry={derived.telemetry} runtimeMode={runtimeMode} />
        )}

        {!utilityPage && activeNavTab === 'Dependencies' && (
          <DependenciesView workflow={activeWorkflow} />
        )}

        {!utilityPage && activeNavTab === 'Simulation' && (
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
            stages={activeWorkflow.stages}
            resilienceImpacts={derived.resilienceImpacts}
            onInjectScenario={handleInjectScenario}
          />
        )}
      </div>
    </div>
  );
}
