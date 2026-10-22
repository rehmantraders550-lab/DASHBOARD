import React from 'react';
import { Activity, Cpu, HardDrive, Zap, CheckCircle2, Clock } from 'lucide-react';
import { WorkflowDefinition } from '../../types/workflow';
import type { RuntimeTelemetry } from '../../engine/workflowModel';
import type { RuntimeSourceMode } from '../../engine/runtimeAdapter';

interface ExecutionViewProps {
  workflow: WorkflowDefinition;
  currentTime: number;
  telemetry: RuntimeTelemetry;
  runtimeMode: RuntimeSourceMode;
}

export const ExecutionView: React.FC<ExecutionViewProps> = ({ workflow, currentTime, telemetry, runtimeMode }) => {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#737373] uppercase">
          <Activity className="w-4 h-4 text-[#F97316]" />
          <span>OPERATIONAL TELEMETRY</span>
        </div>
        <h1 className="font-editorial text-3xl font-normal text-[#242628] mt-1">
          Execution Metrics
        </h1>
        <p className="text-sm text-[#737373] mt-0.5">
          {runtimeMode === 'SIMULATED' ? 'Simulated resource estimates' : 'Recorded event data'} for {workflow.name}. Not a live compute monitor.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#E5E1DA] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span>Elapsed Runtime</span>
            <Clock className="w-4 h-4 text-[#F97316]" />
          </div>
          <div className="font-mono text-2xl font-semibold text-[#242628] mt-2">
            {currentTime.toFixed(1)}s
          </div>
          <div className="text-[11px] text-[#737373] mt-1">
            Configured demonstration timeline: {workflow.maxTimelineSeconds.toFixed(1)}s
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E1DA] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span>Memory Pool</span>
            <HardDrive className="w-4 h-4 text-[#F97316]" />
          </div>
          <div className="font-mono text-2xl font-semibold text-[#242628] mt-2">
            {telemetry.activeMemoryMb.toFixed(1)} MB
          </div>
          <div className="text-[11px] text-[#737373] mt-1">
            Configured limit: {telemetry.peakMemoryLimitMb} MB
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E1DA] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span>Worker Thread Load</span>
            <Cpu className="w-4 h-4 text-[#F97316]" />
          </div>
          <div className="font-mono text-2xl font-semibold text-[#242628] mt-2">
            {telemetry.workerThreads} thread{telemetry.workerThreads === 1 ? '' : 's'}
          </div>
          <div className="text-[11px] text-[#737373] mt-1">
            {runtimeMode === 'SIMULATED' ? 'Estimated activity, not measured' : 'Trace-supplied activity'}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E1DA] p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#737373]">
            <span>Cache Hit Rate</span>
            <Zap className="w-4 h-4 text-[#F97316]" />
          </div>
          <div className="font-mono text-2xl font-semibold text-[#242628] mt-2">
            {telemetry.cacheHitRatio.toFixed(1)}%
          </div>
          <div className="text-[11px] text-[#16A34A] mt-1 font-medium">
            {runtimeMode === 'SIMULATED' ? 'Simulated cache ratio' : 'Reported by trace'}
          </div>
        </div>
      </div>

      {/* Stage Breakdown Table */}
      <div className="bg-white rounded-2xl border border-[#E5E1DA] p-6 shadow-xs">
        <h3 className="font-editorial text-xl font-normal text-[#242628] mb-4">
          Stage Latency &amp; Resource Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-[#EDE8E0] text-[#737373] uppercase tracking-wider text-[11px]">
                <th className="pb-3 font-semibold">Stage</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Duration</th>
                <th className="pb-3 font-semibold">Input Size</th>
                <th className="pb-3 font-semibold">Output Size</th>
                <th className="pb-3 font-semibold">Memory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFEA]">
              {workflow.stages.map((stg) => (
                <tr key={stg.id} className="hover:bg-[#F9F7F3] transition-colors">
                  <td className="py-3.5 font-medium text-[#242628]">
                    <span className="font-mono text-[#8E8B85] mr-2">{stg.stepNumber}</span>
                    {stg.name}
                  </td>
                  <td className="py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        stg.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : stg.status === 'running'
                          ? 'bg-orange-50 text-orange-700'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {stg.status}
                    </span>
                  </td>
                  <td className="py-3.5 font-mono text-[#242628]">{stg.duration}</td>
                  <td className="py-3.5 font-mono text-[#737373]">{stg.input.size}</td>
                  <td className="py-3.5 font-mono text-[#737373]">
                    {stg.output.size || (stg.status === 'running' ? 'Calculating...' : 'Pending')}
                  </td>
                  <td className="py-3.5 font-mono text-[#737373]">
                    {stg.status === 'completed'
                      ? '18.4 MB'
                      : stg.status === 'running'
                      ? '34.8 MB'
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
