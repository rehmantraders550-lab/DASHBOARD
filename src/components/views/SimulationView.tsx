import React, { useState } from 'react';
import { Play, Square, RotateCcw, SkipForward, ArrowRight, Sliders, AlertTriangle, RotateCw, Route, ShieldCheck } from 'lucide-react';
import { WorkflowDefinition, WorkflowStage } from '../../types/workflow';
import { RESILIENCE_SCENARIOS, ResilienceImpact, ResilienceScenarioKind } from '../../engine/resilience';

interface SimulationViewProps {
  workflow: WorkflowDefinition;
  stages: WorkflowStage[];
  resilienceImpacts: ResilienceImpact[];
  isRunning: boolean;
  onToggleRunning: () => void;
  currentTime: number;
  onStepForward: () => void;
  onReset: () => void;
  simSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onReturnToLiveMap: () => void;
  onInjectScenario: (scenario: ResilienceScenarioKind, stageId: string) => void;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  workflow, stages, resilienceImpacts, isRunning, onToggleRunning, currentTime,
  onStepForward, onReset, simSpeed, onChangeSpeed, onReturnToLiveMap, onInjectScenario,
}) => {
  const [targetStageId, setTargetStageId] = useState(stages[0]?.id || '');
  const activeImpact = resilienceImpacts[resilienceImpacts.length - 1];
  const target = stages.find((stage) => stage.id === targetStageId) || stages[0];

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#737373] uppercase">
            <Sliders className="w-4 h-4 text-[#F97316]" /><span>ORVIA RESILIENCE LAB</span>
          </div>
          <h1 className="font-editorial text-3xl font-normal text-[#242628] mt-1">Failure & Recovery Simulation</h1>
          <p className="text-sm text-[#737373] mt-0.5">Inject controlled runtime conditions and inspect their downstream impact.</p>
        </div>
        <button onClick={onReturnToLiveMap} className="flex items-center gap-2 px-4 py-2 bg-[#F97316] text-white hover:bg-[#EA580C] rounded-lg text-sm font-medium shadow-xs transition-colors self-start">
          <span>View on Live Map</span><ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E5E1DA] p-6 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={onToggleRunning} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white ${isRunning ? 'bg-[#242628]' : 'bg-[#F97316]'}`}>
            {isRunning ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isRunning ? 'Pause Simulation' : 'Run Simulation'}
          </button>
          <button onClick={onStepForward} className="flex items-center gap-2 px-4 py-2.5 bg-[#F9F7F3] border border-[#E5E1DA] rounded-lg text-sm"><SkipForward className="w-4 h-4" />Step +0.2s</button>
          <button onClick={onReset} className="flex items-center gap-2 px-4 py-2.5 bg-[#F9F7F3] border border-[#E5E1DA] rounded-lg text-sm text-[#737373]"><RotateCcw className="w-4 h-4" />Reset</button>
          <div className="flex items-center gap-1 bg-[#F9F7F3] p-1 border border-[#E5E1DA] rounded-lg ml-auto">
            {[0.5,1,2,4].map((speed)=><button key={speed} onClick={()=>onChangeSpeed(speed)} className={`px-2.5 py-1 rounded text-xs font-mono ${simSpeed===speed?'bg-[#242628] text-white':'text-[#737373]'}`}>{speed}x</button>)}
          </div>
        </div>

        <div className="pt-5 border-t border-[#EDE8E0]">
          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <label className="flex-1 text-xs font-semibold uppercase tracking-wider text-[#737373]">
              Target stage
              <select value={targetStageId} onChange={(e)=>setTargetStageId(e.target.value)} className="mt-2 w-full bg-[#F9F7F3] border border-[#E5E1DA] rounded-lg px-3 py-2.5 text-sm text-[#242628] normal-case">
                {stages.map((stage)=><option key={stage.id} value={stage.id}>{stage.stepNumber} — {stage.name}</option>)}
              </select>
            </label>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
            {RESILIENCE_SCENARIOS.map((scenario)=>(
              <button key={scenario.id} onClick={()=>target && onInjectScenario(scenario.id,target.id)} className="text-left p-4 rounded-xl border border-[#E5E1DA] bg-[#F9F7F3] hover:border-[#B45309] transition-colors">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#242628]">
                  {scenario.state==='recovered'?<ShieldCheck className="w-4 h-4 text-[#16A34A]" />:scenario.state==='retrying'?<RotateCw className="w-4 h-4 text-[#B45309]" />:scenario.state==='fallback'?<Route className="w-4 h-4 text-[#B45309]" />:<AlertTriangle className="w-4 h-4 text-[#B45309]" />}
                  {scenario.label}
                </div>
                <p className="text-xs text-[#737373] mt-1.5">{scenario.message}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E1DA] p-5">
          <span className="text-xs uppercase tracking-wider text-[#737373]">Virtual clock</span>
          <div className="font-mono text-2xl text-[#242628] mt-2">{currentTime.toFixed(2)}s</div>
          <div className="text-xs text-[#8E8B85] mt-1">{workflow.name}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E1DA] p-5">
          <span className="text-xs uppercase tracking-wider text-[#737373]">Active condition</span>
          <div className="font-semibold text-[#242628] mt-2">{activeImpact ? activeImpact.state.toUpperCase() : 'NORMAL'}</div>
          <div className="text-xs text-[#8E8B85] mt-1">{activeImpact ? stages.find(s=>s.id===activeImpact.stageId)?.name : 'No injected resilience condition'}</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#E5E1DA] p-5">
          <span className="text-xs uppercase tracking-wider text-[#737373]">Impact radius</span>
          <div className="font-mono text-2xl text-[#242628] mt-2">{activeImpact?.affectedStageIds.length || 0}</div>
          <div className="text-xs text-[#8E8B85] mt-1">{activeImpact?.affectedStageIds.length ? activeImpact.affectedStageIds.map(id=>stages.find(s=>s.id===id)?.name || id).join(' → ') : 'No downstream stages affected'}</div>
        </div>
      </div>
    </div>
  );
};
