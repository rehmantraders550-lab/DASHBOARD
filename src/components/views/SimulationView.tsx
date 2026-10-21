import React from 'react';
import { Play, Square, RotateCcw, FastForward, SkipForward, ArrowRight, Sliders } from 'lucide-react';
import { WorkflowDefinition } from '../../types/workflow';

interface SimulationViewProps {
  workflow: WorkflowDefinition;
  isRunning: boolean;
  onToggleRunning: () => void;
  currentTime: number;
  onStepForward: () => void;
  onReset: () => void;
  simSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onReturnToLiveMap: () => void;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  workflow,
  isRunning,
  onToggleRunning,
  currentTime,
  onStepForward,
  onReset,
  simSpeed,
  onChangeSpeed,
  onReturnToLiveMap,
}) => {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#737373] uppercase">
            <Sliders className="w-4 h-4 text-[#F97316]" />
            <span>INTERACTIVE SIMULATION</span>
          </div>
          <h1 className="font-editorial text-3xl font-normal text-[#242628] mt-1">
            Pipeline Simulation Controller
          </h1>
          <p className="text-sm text-[#737373] mt-0.5">
            Test edge cases, simulate data backpressure, and step through workflow stages.
          </p>
        </div>

        <button
          onClick={onReturnToLiveMap}
          className="flex items-center gap-2 px-4 py-2 bg-[#F97316] text-white hover:bg-[#EA580C] rounded-lg text-sm font-medium shadow-xs transition-colors self-start"
        >
          <span>View on Live Map</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Control Console Card */}
      <div className="bg-white rounded-2xl border border-[#E5E1DA] p-6 shadow-xs space-y-6">
        <h3 className="font-editorial text-xl font-normal text-[#242628]">
          Simulation Controls
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={onToggleRunning}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs ${
              isRunning
                ? 'bg-[#242628] text-white hover:bg-[#343638]'
                : 'bg-[#F97316] text-white hover:bg-[#EA580C]'
            }`}
          >
            {isRunning ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Pause Simulation</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run Simulation</span>
              </>
            )}
          </button>

          {/* Step Forward */}
          <button
            onClick={onStepForward}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#F9F7F3] hover:bg-[#EDE8E0] text-[#242628] border border-[#E5E1DA] rounded-lg text-sm font-medium transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            <span>Step +0.2s</span>
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#F9F7F3] hover:bg-[#EDE8E0] text-[#737373] hover:text-[#242628] border border-[#E5E1DA] rounded-lg text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset (1.4s)</span>
          </button>

          {/* Speed Selectors */}
          <div className="flex items-center gap-1 bg-[#F9F7F3] p-1 border border-[#E5E1DA] rounded-lg ml-auto">
            <span className="text-xs text-[#8E8B85] px-2 font-mono">Speed:</span>
            {[0.5, 1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  simSpeed === spd
                    ? 'bg-[#242628] text-white'
                    : 'text-[#737373] hover:text-[#242628]'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Live Simulator Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#EDE8E0]">
          <div className="bg-[#F9F7F3] rounded-xl p-4 border border-[#EBE7E0]">
            <span className="text-xs text-[#737373] uppercase tracking-wider block">Current State</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] animate-pulse" />
              <span className="font-semibold text-sm text-[#242628]">Step 03 — Vectorize</span>
            </div>
            <span className="text-xs text-[#8E8B85] mt-1 block">Progress: 60% • 1,284 paths built</span>
          </div>

          <div className="bg-[#F9F7F3] rounded-xl p-4 border border-[#EBE7E0]">
            <span className="text-xs text-[#737373] uppercase tracking-wider block">Virtual Clock</span>
            <div className="font-mono text-xl font-semibold text-[#242628] mt-1">
              {currentTime.toFixed(2)}s
            </div>
            <span className="text-xs text-[#8E8B85] mt-1 block">Total pipeline duration: ~4.5s</span>
          </div>

          <div className="bg-[#F9F7F3] rounded-xl p-4 border border-[#EBE7E0]">
            <span className="text-xs text-[#737373] uppercase tracking-wider block">Active Buffer Pool</span>
            <div className="font-mono text-xl font-semibold text-[#242628] mt-1">
              12.4 MB in Flight
            </div>
            <span className="text-xs text-[#16A34A] mt-1 block font-medium">0 packet drops • Zero memory leak</span>
          </div>
        </div>
      </div>
    </div>
  );
};
