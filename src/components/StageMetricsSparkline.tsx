import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { Cpu, HardDrive } from 'lucide-react';
import { WorkflowStage } from '../types/workflow';

interface MetricPoint {
  timeOffset: number; // -30 to 0 seconds
  cpu: number; // percentage (0-100)
  memory: number; // megabytes
}

interface StageMetricsSparklineProps {
  stage: WorkflowStage;
  isRunningWorkflow: boolean;
}

// Generate realistic baseline profile based on stage identity and status
function generateInitialPoints(stage: WorkflowStage): MetricPoint[] {
  const points: MetricPoint[] = [];
  const isRunning = stage.status === 'running';
  const isCompleted = stage.status === 'completed';

  const baseCpu = isRunning ? 52 : isCompleted ? 8 : 2;
  const cpuVariance = isRunning ? 22 : isCompleted ? 3 : 1;
  const baseMem = isRunning ? 36 : isCompleted ? 18 : 6;
  const memVariance = isRunning ? 8 : isCompleted ? 2 : 0.5;

  for (let i = 29; i >= 0; i--) {
    const noise = Math.sin(i * 0.45) * 0.5 + (Math.random() - 0.5);
    const cpuVal = Math.min(Math.max(baseCpu + noise * cpuVariance, 1), 95);
    const memVal = Math.min(Math.max(baseMem + noise * memVariance, 4), 90);

    points.push({
      timeOffset: -i,
      cpu: Number(cpuVal.toFixed(1)),
      memory: Number(memVal.toFixed(1)),
    });
  }
  return points;
}

export const StageMetricsSparkline: React.FC<StageMetricsSparklineProps> = ({
  stage,
  isRunningWorkflow,
}) => {
  const [metricType, setMetricType] = useState<'cpu' | 'memory' | 'both'>('both');
  const [data, setData] = useState<MetricPoint[]>(() => generateInitialPoints(stage));
  const [hoveredPoint, setHoveredPoint] = useState<MetricPoint | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Reset or regenerate when stage changes
  useEffect(() => {
    setData(generateInitialPoints(stage));
  }, [stage.id, stage.status]);

  // Rolling real-time update when workflow is running
  useEffect(() => {
    if (!isRunningWorkflow || stage.status === 'waiting') return;

    const interval = setInterval(() => {
      setData((prev) => {
        const isRunning = stage.status === 'running';
        const baseCpu = isRunning ? 54 : 8;
        const cpuVariance = isRunning ? 20 : 3;
        const baseMem = isRunning ? 38 : 18;
        const memVariance = isRunning ? 7 : 2;

        const jitter = (Math.random() - 0.48) * 2;
        const newCpu = Math.min(Math.max(baseCpu + jitter * cpuVariance, 2), 94);
        const newMem = Math.min(Math.max(baseMem + jitter * memVariance, 5), 85);

        const updated = [...prev.slice(1)];
        // Re-index timeOffsets to -29...0
        const reindexed = updated.map((pt, idx) => ({
          ...pt,
          timeOffset: idx - 29,
        }));

        reindexed.push({
          timeOffset: 0,
          cpu: Number(newCpu.toFixed(1)),
          memory: Number(newMem.toFixed(1)),
        });

        return reindexed;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunningWorkflow, stage.status]);

  const currentPoint = data[data.length - 1] || { cpu: 0, memory: 0, timeOffset: 0 };
  const avgCpu = useMemo(() => (data.reduce((acc, p) => acc + p.cpu, 0) / data.length).toFixed(1), [data]);
  const avgMem = useMemo(() => (data.reduce((acc, p) => acc + p.memory, 0) / data.length).toFixed(1), [data]);

  // Dimensions
  const width = 290;
  const height = 80;
  const margin = { top: 8, right: 10, bottom: 18, left: 24 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // D3 Scales
  const xScale = useMemo(() => {
    return d3
      .scaleLinear()
      .domain([-29, 0])
      .range([0, innerWidth]);
  }, [innerWidth]);

  const yCpuScale = useMemo(() => {
    const maxVal = Math.max(d3.max(data, (d) => d.cpu) || 60, 40);
    return d3
      .scaleLinear()
      .domain([0, Math.min(maxVal * 1.15, 100)])
      .range([innerHeight, 0]);
  }, [data, innerHeight]);

  const yMemScale = useMemo(() => {
    const maxVal = Math.max(d3.max(data, (d) => d.memory) || 40, 20);
    return d3
      .scaleLinear()
      .domain([0, maxVal * 1.2])
      .range([innerHeight, 0]);
  }, [data, innerHeight]);

  // D3 Line & Area Generators
  const cpuLine = useMemo(() => {
    return d3
      .line<MetricPoint>()
      .x((d) => xScale(d.timeOffset))
      .y((d) => yCpuScale(d.cpu))
      .curve(d3.curveMonotoneX);
  }, [xScale, yCpuScale]);

  const cpuArea = useMemo(() => {
    return d3
      .area<MetricPoint>()
      .x((d) => xScale(d.timeOffset))
      .y0(innerHeight)
      .y1((d) => yCpuScale(d.cpu))
      .curve(d3.curveMonotoneX);
  }, [xScale, yCpuScale, innerHeight]);

  const memLine = useMemo(() => {
    return d3
      .line<MetricPoint>()
      .x((d) => xScale(d.timeOffset))
      .y((d) => yMemScale(d.memory))
      .curve(d3.curveMonotoneX);
  }, [xScale, yMemScale]);

  const memArea = useMemo(() => {
    return d3
      .area<MetricPoint>()
      .x((d) => xScale(d.timeOffset))
      .y0(innerHeight)
      .y1((d) => yMemScale(d.memory))
      .curve(d3.curveMonotoneX);
  }, [xScale, yMemScale, innerHeight]);

  const cpuPath = cpuLine(data) || '';
  const cpuAreaPath = cpuArea(data) || '';
  const memPath = memLine(data) || '';
  const memAreaPath = memArea(data) || '';

  const showCpu = metricType === 'cpu' || metricType === 'both';
  const showMem = metricType === 'memory' || metricType === 'both';

  return (
    <div className="space-y-2.5">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-[#242628] tracking-wider uppercase">
          Real-Time Metrics (30s)
        </h4>

        {/* View Toggle */}
        <div className="flex items-center bg-[#F9F7F3] p-0.5 rounded-md border border-[#E5E1DA] text-[10px] font-mono">
          <button
            onClick={() => setMetricType('cpu')}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              metricType === 'cpu'
                ? 'bg-white text-[#F97316] font-semibold shadow-2xs'
                : 'text-[#737373] hover:text-[#242628]'
            }`}
          >
            CPU
          </button>
          <button
            onClick={() => setMetricType('memory')}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              metricType === 'memory'
                ? 'bg-white text-[#2563EB] font-semibold shadow-2xs'
                : 'text-[#737373] hover:text-[#242628]'
            }`}
          >
            MEM
          </button>
          <button
            onClick={() => setMetricType('both')}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              metricType === 'both'
                ? 'bg-white text-[#242628] font-semibold shadow-2xs'
                : 'text-[#737373] hover:text-[#242628]'
            }`}
          >
            BOTH
          </button>
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#F9F7F3] border border-[#EBE7E0] rounded-lg p-2.5">
          <div className="flex items-center justify-between text-[11px] text-[#737373]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F97316]" />
              <span className="font-medium text-[#242628]">CPU Load</span>
            </div>
            <Cpu className="w-3.5 h-3.5 text-[#F97316]" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono text-base font-semibold text-[#242628] tabular-nums">
              {currentPoint.cpu}%
            </span>
            <span className="font-mono text-[10px] text-[#737373]">
              avg {avgCpu}%
            </span>
          </div>
        </div>

        <div className="bg-[#F9F7F3] border border-[#EBE7E0] rounded-lg p-2.5">
          <div className="flex items-center justify-between text-[11px] text-[#737373]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span className="font-medium text-[#242628]">Memory</span>
            </div>
            <HardDrive className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-mono text-base font-semibold text-[#242628] tabular-nums">
              {currentPoint.memory} <span className="text-[10px] font-normal">MB</span>
            </span>
            <span className="font-mono text-[10px] text-[#737373]">
              avg {avgMem}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Sparkline Container */}
      <div className="relative bg-[#F9F7F3] border border-[#EBE7E0] rounded-xl p-2.5 shadow-2xs overflow-hidden">
        {/* Hover info tooltip readout */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#737373] mb-1 px-1">
          <span>
            {hoveredPoint
              ? `T ${hoveredPoint.timeOffset}s: CPU ${hoveredPoint.cpu}%, MEM ${hoveredPoint.memory}MB`
              : 'Window: last 30s'}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-[#8E8B85]">
            Live Trace
          </span>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            {/* CPU Orange Gradient Fill */}
            <linearGradient id="cpuSparkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F97316" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
            </linearGradient>

            {/* Memory Blue Gradient Fill */}
            <linearGradient id="memSparkGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <g transform={`translate(${margin.left}, ${margin.top})`}>
            {/* Horizontal Grid lines */}
            <line
              x1="0"
              y1={innerHeight * 0.25}
              x2={innerWidth}
              y2={innerHeight * 0.25}
              stroke="#EDE8E0"
              strokeDasharray="2 3"
            />
            <line
              x1="0"
              y1={innerHeight * 0.75}
              x2={innerWidth}
              y2={innerHeight * 0.75}
              stroke="#EDE8E0"
              strokeDasharray="2 3"
            />
            <line
              x1="0"
              y1={innerHeight}
              x2={innerWidth}
              y2={innerHeight}
              stroke="#E5E1DA"
            />

            {/* X-axis ticks text */}
            <text x="0" y={innerHeight + 13} fontSize="9" fill="#8E8B85" fontFamily="monospace">
              -30s
            </text>
            <text
              x={innerWidth / 2}
              y={innerHeight + 13}
              fontSize="9"
              fill="#8E8B85"
              textAnchor="middle"
              fontFamily="monospace"
            >
              -15s
            </text>
            <text
              x={innerWidth}
              y={innerHeight + 13}
              fontSize="9"
              fill="#8E8B85"
              textAnchor="end"
              fontFamily="monospace"
            >
              Now
            </text>

            {/* Memory Area & Line */}
            {showMem && (
              <>
                <path d={memAreaPath} fill="url(#memSparkGradient)" />
                <path
                  d={memPath}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                {/* Memory end live dot */}
                <circle
                  cx={innerWidth}
                  cy={yMemScale(currentPoint.memory)}
                  r="3"
                  fill="#2563EB"
                />
              </>
            )}

            {/* CPU Area & Line */}
            {showCpu && (
              <>
                <path d={cpuAreaPath} fill="url(#cpuSparkGradient)" />
                <path
                  d={cpuPath}
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* CPU end live dot */}
                <circle
                  cx={innerWidth}
                  cy={yCpuScale(currentPoint.cpu)}
                  r="3.5"
                  fill="#F97316"
                  className={isRunningWorkflow ? 'animate-ping origin-center' : ''}
                  style={{ animationDuration: '2s' }}
                />
                <circle
                  cx={innerWidth}
                  cy={yCpuScale(currentPoint.cpu)}
                  r="3"
                  fill="#F97316"
                />
              </>
            )}

            {/* Interactive hover overlay columns */}
            {data.map((pt, idx) => {
              const x = xScale(pt.timeOffset);
              return (
                <rect
                  key={idx}
                  x={x - innerWidth / 60}
                  y="0"
                  width={innerWidth / 30}
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseEnter={() => setHoveredPoint(pt)}
                />
              );
            })}

            {/* Hover marker line if active */}
            {hoveredPoint && (
              <line
                x1={xScale(hoveredPoint.timeOffset)}
                y1="0"
                x2={xScale(hoveredPoint.timeOffset)}
                y2={innerHeight}
                stroke="#737373"
                strokeWidth="1"
                strokeDasharray="2 2"
                pointerEvents="none"
              />
            )}
          </g>
        </svg>
      </div>
    </div>
  );
};
