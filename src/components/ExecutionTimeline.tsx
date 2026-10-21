import React from 'react';
import { WorkflowStage } from '../types/workflow';

interface ExecutionTimelineProps {
  stages: WorkflowStage[];
  currentTime: number;
  maxSeconds?: number;
  onSelectStage: (stageId: string) => void;
  selectedStageId: string;
}

export const ExecutionTimeline: React.FC<ExecutionTimelineProps> = ({
  stages,
  currentTime,
  maxSeconds = 5.5,
  onSelectStage,
  selectedStageId,
}) => {
  const ticks = [0, 1, 2, 3, 4, 5];

  // Percentage position calculator helper
  const getPercent = (seconds: number) => {
    return Math.min(Math.max((seconds / maxSeconds) * 100, 0), 100);
  };

  const currentMarkerPercent = getPercent(currentTime);

  return (
    <div className="w-full select-none overflow-x-auto py-2">
      <div className="min-w-[540px]">
        {/* Time axis header */}
        <div className="relative flex items-center mb-2 pl-24 pr-4">
          <div className="relative w-full h-6">
            {ticks.map((tick) => (
              <span
                key={tick}
                className="absolute text-xs font-mono text-[#8E8B85] -translate-x-1/2"
                style={{ left: `${getPercent(tick)}%` }}
              >
                {tick}s
              </span>
            ))}

            {/* Current execution time label on the marker */}
            <div
              className="absolute -top-1 -translate-x-1/2 transition-all duration-150 ease-out z-20"
              style={{ left: `${currentMarkerPercent}%` }}
            >
              <span className="text-xs font-mono font-semibold text-[#F97316] bg-white px-1 rounded-sm shadow-2xs">
                {currentTime.toFixed(1)}s
              </span>
            </div>
          </div>
        </div>

        {/* Timeline body with rows and vertical grid lines */}
        <div className="relative pl-24 pr-4 py-1">
          {/* Background vertical grid lines */}
          <div className="absolute inset-y-0 left-24 right-4 pointer-events-none">
            {ticks.map((tick) => (
              <div
                key={tick}
                className="absolute top-0 bottom-0 border-l border-[#EDE8E0]"
                style={{ left: `${getPercent(tick)}%` }}
              />
            ))}

            {/* Vertical orange live marker line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#F97316] transition-all duration-150 ease-out z-10 pointer-events-none"
              style={{ left: `${currentMarkerPercent}%` }}
            />
          </div>

          {/* Rows for each stage */}
          <div className="space-y-3 relative z-0">
            {stages.map((stage) => {
              const isSelected = stage.id === selectedStageId;
              const { start, duration, projectedEnd } = stage.timeline;
              const leftPercent = getPercent(start);
              const isRunning = stage.status === 'running';
              const isCompleted = stage.status === 'completed';
              const isWaiting = stage.status === 'waiting';

              return (
                <div
                  key={stage.id}
                  onClick={() => onSelectStage(stage.id)}
                  className={`group flex items-center h-7 rounded-md cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#FFF8F3]/60' : 'hover:bg-[#F9F7F3]'
                  }`}
                >
                  {/* Row label */}
                  <div className="absolute left-0 w-24 text-xs font-sans font-medium text-[#242628] truncate pr-2">
                    <span className={isSelected ? 'text-[#F97316] font-semibold' : ''}>
                      {stage.name}
                    </span>
                  </div>

                  {/* Gantt Bar Container */}
                  <div className="relative w-full h-full flex items-center">
                    {/* Completed Stage Bar */}
                    {isCompleted && (
                      <div
                        className="absolute h-5 bg-[#F97316] rounded-sm transition-all shadow-2xs hover:brightness-105"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${getPercent(duration)}%`,
                        }}
                      />
                    )}

                    {/* Running Stage Bar (Vectorize): solid orange up to current marker + lighter projected extension */}
                    {isRunning && (
                      <>
                        {/* Solid executed segment */}
                        <div
                          className="absolute h-5 bg-[#F97316] rounded-l-sm transition-all shadow-2xs z-2"
                          style={{
                            left: `${leftPercent}%`,
                            width: `${Math.max(getPercent(currentTime) - leftPercent, 4)}%`,
                          }}
                        />
                        {/* Projected remaining segment */}
                        {projectedEnd && (
                          <div
                            className="absolute h-5 bg-[#FFD7BA] rounded-r-sm transition-all z-1"
                            style={{
                              left: `${getPercent(currentTime)}%`,
                              width: `${Math.max(getPercent(projectedEnd) - getPercent(currentTime), 2)}%`,
                            }}
                          />
                        )}
                      </>
                    )}

                    {/* Waiting / Scheduled Stage Bar (Gray projected bar) */}
                    {isWaiting && (
                      <div
                        className="absolute h-5 bg-[#D5D0C8] rounded-sm transition-all opacity-85 hover:opacity-100"
                        style={{
                          left: `${leftPercent}%`,
                          width: `${getPercent(duration)}%`,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
