import React from 'react';
import type { PipeVisualState } from '../engine/stateDerivation';

interface WorkflowConnectorProps {
  fromStep: string;
  toStep: string;
  state: PipeVisualState;
  isRunningWorkflow: boolean;
}

export const WorkflowConnector: React.FC<WorkflowConnectorProps> = ({
  state,
  isRunningWorkflow,
}) => {
  // Dimensions for the S-curve connector gap
  const width = 64;
  const height = 200;
  const centerY = 100;
  
  // Wave path from left dot (x=8) to right dot (x=56)
  // Starts at center, dips downward slightly, curves up, and levels into right
  const startX = 6;
  const endX = width - 6;
  const midX = width / 2;
  const midY = centerY + 14; // gentle playful dip as seen in reference

  // S-curve path definition
  // M 6,100 C 20,126, 42,74, 58,100
  const pathD = `M ${startX} ${centerY} C 20 ${centerY + 24}, 44 ${centerY - 24}, ${endX} ${centerY}`;
  const halfPath1 = `M ${startX} ${centerY} C 18 ${centerY + 20}, 26 ${midY}, ${midX} ${midY}`;
  const halfPath2 = `M ${midX} ${midY} C 38 ${centerY - 20}, 46 ${centerY - 10}, ${endX} ${centerY}`;

  if (state === 'completed') {
    return (
      <div className="relative w-10 sm:w-11 xl:w-12 h-[188px] sm:h-[192px] flex items-center justify-center shrink-0">
        <svg
          className="w-full h-full overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main orange pipe line */}
          <path
            d={pathD}
            stroke="#F97316"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Animated active flow pulse if workflow is running */}
          {isRunningWorkflow && (
            <path
              d={pathD}
              stroke="#FFEDD5"
              strokeWidth="3"
              strokeDasharray="8 24"
              strokeLinecap="round"
              className="animate-[flowPulse_1.5s_linear_infinite]"
            />
          )}

          {/* Left anchor dot */}
          <circle cx={startX} cy={centerY} r="4.5" fill="#F97316" />

          {/* Midpoint accent dot matching reference */}
          <circle cx="24" cy={centerY + 16} r="4.5" fill="#F97316" />

          {/* Right anchor dot */}
          <circle cx={endX} cy={centerY} r="4.5" fill="#F97316" />
        </svg>
      </div>
    );
  }

  if (state === 'attention') {
    return (
      <div className="relative w-10 sm:w-11 xl:w-12 h-[188px] sm:h-[192px] flex items-center justify-center shrink-0">
        <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} fill="none">
          <path d={pathD} stroke="#B45309" strokeWidth="3" strokeDasharray="7 7" strokeLinecap="round" />
          <circle cx={startX} cy={centerY} r="4.5" fill="#B45309" />
          <circle cx={endX} cy={centerY} r="4.5" fill="#F7F4EE" stroke="#B45309" strokeWidth="2.5" />
        </svg>
      </div>
    );
  }

  if (state === 'active-transitional') {
    // Vectorize to Validate: starts orange, mid dot, then turns muted gray
    return (
      <div className="relative w-10 sm:w-11 xl:w-12 h-[188px] sm:h-[192px] flex items-center justify-center shrink-0">
        <svg
          className="w-full h-full overflow-visible"
          viewBox={`0 0 ${width} ${height}`}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* First half: orange */}
          <path
            d={halfPath1}
            stroke="#F97316"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Second half: muted gray */}
          <path
            d={halfPath2}
            stroke="#D1CDC7"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Left orange dot at Vectorize output */}
          <circle cx={startX} cy={centerY} r="4.5" fill="#F97316" />

          {/* Midpoint orange dot */}
          <circle cx={midX} cy={midY} r="4.5" fill="#F97316" />

          {/* Right muted gray hollow dot at Validate input */}
          <circle cx={endX} cy={centerY} r="4.5" fill="#F7F4EE" stroke="#D1CDC7" strokeWidth="2.5" />
        </svg>
      </div>
    );
  }

  // Waiting / Inactive state: muted gray pipe
  return (
    <div className="relative w-10 sm:w-11 xl:w-12 h-[188px] sm:h-[192px] flex items-center justify-center shrink-0">
      <svg
        className="w-full h-full overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Gray pipe line */}
        <path
          d={pathD}
          stroke="#D1CDC7"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Left anchor dot */}
        <circle cx={startX} cy={centerY} r="4.5" fill="#D1CDC7" />

        {/* Midpoint dot */}
        <circle cx="40" cy={centerY - 16} r="4.5" fill="#D1CDC7" />

        {/* Right anchor dot */}
        <circle cx={endX} cy={centerY} r="4.5" fill="#F7F4EE" stroke="#D1CDC7" strokeWidth="2.5" />
      </svg>
    </div>
  );
};
