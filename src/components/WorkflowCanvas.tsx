import React, { useState } from 'react';
import { ChevronRight, Search, Maximize2, Minimize2, ChevronDown, Sparkles } from 'lucide-react';
import { WorkflowDefinition } from '../types/workflow';
import { DerivedPipe } from '../engine/stateDerivation';
import type { RuntimeSourceMode } from '../engine/runtimeAdapter';
import { WorkflowCard } from './WorkflowCard';
import { WorkflowConnector } from './WorkflowConnectors';
import { ExecutionTimeline } from './ExecutionTimeline';
import { EventLog } from './EventLog';

interface WorkflowCanvasProps {
  workflow: WorkflowDefinition;
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
  isRunningWorkflow: boolean;
  currentTime: number;
  pipes?: DerivedPipe[];
  runtimeMode: RuntimeSourceMode;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow,
  selectedStageId,
  onSelectStage,
  isRunningWorkflow,
  currentTime,
  pipes,
  runtimeMode,
}) => {
  const [bottomTab, setBottomTab] = useState<'Timeline' | 'Logs'>('Timeline');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLiveAutoFollow, setIsLiveAutoFollow] = useState(true);

  const toggleZoom = () => {
    if (zoomLevel === 100) setZoomLevel(110);
    else if (zoomLevel === 110) setZoomLevel(90);
    else setZoomLevel(100);
  };

  // State Derivation Layer: dynamically derive connector state from node execution states
  const getConnectorState = (index: number): DerivedPipe['state'] => {
    if (pipes && pipes[index]) {
      return pipes[index].state;
    }
    const current = workflow.stages[index];
    const next = workflow.stages[index + 1];
    if (!next) return 'waiting';

    if (current.status === 'completed' && next.status === 'completed') {
      return 'completed';
    }
    if (current.status === 'completed' && next.status === 'running') {
      return 'completed';
    }
    if (current.status === 'running' && next.status === 'waiting') {
      return 'active-transitional';
    }
    if (current.status === 'completed' && next.status === 'waiting') {
      return 'active-transitional';
    }
    return 'waiting';
  };

  return (
    <div
      className={`flex-1 min-h-0 flex flex-col gap-8 p-4 sm:p-6 lg:p-8 overflow-y-auto ${
        isFullscreen ? 'fixed inset-0 z-50 bg-[#F7F4EE] overflow-auto' : ''
      }`}
    >
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          {/* Breadcrumb / Tag */}
          <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#737373] uppercase">
            <ChevronRight className="w-3.5 h-3.5 text-[#F97316] stroke-[2.5]" />
            <span>WORKFLOW</span>
          </div>

          {/* Major Title */}
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#242628] tracking-tight leading-tight mt-1">
            {workflow.name}
          </h1>

          {/* Subtitle */}
          <p className="text-sm text-[#737373] mt-1 font-sans">
            {workflow.description}
          </p>
        </div>

        {/* Top Right Controls: Zoom & Fullscreen */}
        <div className="flex items-center self-start bg-white border border-[#E5E1DA] rounded-lg px-2.5 py-1.5 shadow-2xs gap-2">
          <button
            onClick={toggleZoom}
            className="flex items-center gap-1.5 text-xs font-mono text-[#595C60] hover:text-[#242628] transition-colors"
            title="Toggle zoom level"
          >
            <Search className="w-3.5 h-3.5 text-[#8E8B85]" />
            <span>{zoomLevel}%</span>
          </button>
          <div className="w-px h-3.5 bg-[#EDE8E0]" />
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="text-[#8E8B85] hover:text-[#242628] transition-colors p-0.5"
            title={isFullscreen ? 'Exit fullscreen' : 'Expand view'}
            aria-label="Toggle fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Main Workflow Pipeline Canvas */}
      <div className="w-full shrink-0 overflow-x-auto overflow-y-hidden px-2 pt-6 pb-6 [scrollbar-gutter:stable]">
        <div
          className="flex items-center justify-start xl:justify-center min-w-max mx-auto transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
        >
          {workflow.stages.map((stage, index) => {
            const isSelected = stage.id === selectedStageId;
            const hasNext = index < workflow.stages.length - 1;

            return (
              <React.Fragment key={stage.id}>
                {/* Workflow Card */}
                <WorkflowCard
                  stage={stage}
                  isSelected={isSelected}
                  onSelect={() => onSelectStage(stage.id)}
                  isRunningWorkflow={isRunningWorkflow}
                />

                {/* S-curve Connector Pipe */}
                {hasNext && (
                  <WorkflowConnector
                    fromStep={stage.stepNumber}
                    toStep={workflow.stages[index + 1].stepNumber}
                    state={getConnectorState(index)}
                    isRunningWorkflow={isRunningWorkflow}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Bottom Timeline & Logs Card */}
      <div className="shrink-0 bg-white rounded-2xl border border-[#E5E1DA] p-5 shadow-xs transition-all">
        {/* Card Header with Tabs & Live pill */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EDE8E0]">
          {/* Tabs */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setBottomTab('Timeline')}
              className={`relative pb-2.5 text-sm font-medium transition-colors ${
                bottomTab === 'Timeline'
                  ? 'text-[#242628] font-semibold'
                  : 'text-[#8E8B85] hover:text-[#242628]'
              }`}
            >
              Timeline
              {bottomTab === 'Timeline' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F97316] rounded-full" />
              )}
            </button>

            <button
              onClick={() => setBottomTab('Logs')}
              className={`relative pb-2.5 text-sm font-medium transition-colors ${
                bottomTab === 'Logs'
                  ? 'text-[#242628] font-semibold'
                  : 'text-[#8E8B85] hover:text-[#242628]'
              }`}
            >
              Logs
              {bottomTab === 'Logs' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F97316] rounded-full" />
              )}
            </button>
          </div>

          {/* Live Indicator Pill */}
          <button
            onClick={() => setIsLiveAutoFollow(!isLiveAutoFollow)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F9F7F3] border border-[#E5E1DA] hover:bg-[#F2EFE9] text-xs font-medium text-[#242628] transition-colors"
            title="Toggle Live sync tracking"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveAutoFollow && isRunningWorkflow
                  ? 'bg-[#F97316] animate-pulse'
                  : 'bg-[#9CA3AF]'
              }`}
            />
            <span>{runtimeMode === 'RECORDED' ? 'Replay' : 'Simulation'}</span>
            <ChevronDown className="w-3 h-3 text-[#8E8B85]" />
          </button>
        </div>

        {/* Tab Body */}
        <div className="pt-4">
          {bottomTab === 'Timeline' ? (
            <ExecutionTimeline
              stages={workflow.stages}
              currentTime={currentTime}
              maxSeconds={workflow.maxTimelineSeconds}
              onSelectStage={onSelectStage}
              selectedStageId={selectedStageId}
            />
          ) : (
            <EventLog logs={workflow.logs} />
          )}
        </div>
      </div>
    </div>
  );
};
