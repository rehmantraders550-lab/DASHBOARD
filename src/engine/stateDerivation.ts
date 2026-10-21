import {
  StaticPipelineDefinition,
  StaticNodeDefinition,
  RuntimeEvent,
  RuntimeTelemetry,
} from './workflowModel';
import { RuntimeSnapshot } from './runtimeAdapter';
import {
  WorkflowStage,
  StageStatus,
  WorkflowLogEntry,
  WorkflowDefinition,
} from '../types/workflow';

export type PipeVisualState = 'completed' | 'active-transitional' | 'waiting' | 'attention';

export interface DerivedPipe {
  id: string;
  fromStageId: string;
  toStageId: string;
  fromStep: string;
  toStep: string;
  state: PipeVisualState;
  hasActivePulse: boolean;
}

export interface DerivedWorkflowState {
  definition: StaticPipelineDefinition;
  currentTimeSeconds: number;
  isRunning: boolean;
  selectedStageId: string;
  stages: WorkflowStage[];
  pipes: DerivedPipe[];
  logs: WorkflowLogEntry[];
  activeStage: WorkflowStage;
  telemetry: RuntimeTelemetry;
  workflowAdapter: WorkflowDefinition;
}

/**
 * PURE STATE DERIVATION FUNCTION
 *
 * Implements the architecture:
 * Workflow Definition + Runtime Events + Execution State + Telemetry
 *                        ↓
 *              State Derivation Layer
 *                        ↓
 *             [Nodes, Pipes, Timeline]
 *                        ↓
 *                   Existing UI
 */
export function deriveWorkflowState(
  definition: StaticPipelineDefinition,
  runtime: RuntimeSnapshot,
  selectedStageId: string
): DerivedWorkflowState {
  const { currentTimeSeconds, isRunning, events } = runtime;
  // 1. Derive Node States based on definition and virtual execution clock
  // Completion truth comes from elapsed runtime events, not planned timestamps.
  const completedStageIds = new Set(
    events
      .filter(
        (evt: RuntimeEvent) =>
          evt.type === 'STAGE_COMPLETE' &&
          evt.stageId &&
          evt.timestampOffset <= currentTimeSeconds
      )
      .map((evt: RuntimeEvent) => evt.stageId as string)
  );

  const derivedStages: WorkflowStage[] = definition.nodes.map((node: StaticNodeDefinition) => {
    const plannedStart = node.plannedStart;
    const plannedEnd = node.plannedStart + node.expectedDuration;

    let status: StageStatus = 'waiting';
    let duration = 'Waiting';
    let progressPercent = 0;

    const dependenciesSatisfied = node.dependsOn.every((dependencyId) =>
      completedStageIds.has(dependencyId)
    );
    const inputReady = node.dependsOn.length === 0 || dependenciesSatisfied;
    const nodeCompleted = completedStageIds.has(node.id);

    if (nodeCompleted) {
      status = 'completed';
      duration = `${node.expectedDuration.toFixed(1)}s`;
      progressPercent = 100;
    } else if (inputReady && currentTimeSeconds >= plannedStart && currentTimeSeconds < plannedEnd) {
      status = 'running';
      const elapsed = Math.max(currentTimeSeconds - plannedStart, 0.1);
      duration = `${elapsed.toFixed(1)}s`;
      progressPercent = Math.min(
        Math.max(Math.round((elapsed / node.expectedDuration) * 100), 5),
        99
      );
    } else {
      status = 'waiting';
      duration = 'Waiting';
      progressPercent = 0;
    }

    // Input readiness is dependency-truth based, never array-position based.
    const input = {
      name: node.inputTemplate.name,
      size: inputReady ? node.inputTemplate.size : 'Pending',
      type: node.inputTemplate.type,
    };

    // Derive outputs
    const output = {
      statusText:
        status === 'completed'
          ? node.outputTemplate.name
          : status === 'running'
          ? node.outputTemplate.runningStatusText || 'Processing...'
          : node.dependsOn.length > 0
          ? `Waiting for ${node.dependsOn
              .map((dependencyId) => definition.nodes.find((candidate) => candidate.id === dependencyId)?.name || dependencyId)
              .join(', ')}...`
          : 'Waiting for input...',
      isProcessing: status === 'running',
      name: status === 'completed' ? node.outputTemplate.name : undefined,
      size: status === 'completed' ? node.outputTemplate.size : undefined,
    };

    // Filter runtime events up to current clock
    const nodeEvents = events
      .filter((evt: RuntimeEvent) => evt.stageId === node.id && evt.timestampOffset <= currentTimeSeconds)
      .map((evt: RuntimeEvent) => ({
        timestamp: evt.wallClockTime,
        message: evt.message,
      }));

    // If no events have elapsed yet for waiting node, show initialization trace
    const recentEvents =
      nodeEvents.length > 0
        ? nodeEvents
        : [
            {
              timestamp: '14:21:05',
              message: `${node.name} harness ready and registered in DAG`,
            },
          ];

    return {
      id: node.id,
      stepNumber: node.stepNumber,
      name: node.name,
      visualType: node.visualType,
      status,
      duration,
      durationSeconds: status === 'completed' ? node.expectedDuration : Math.max(currentTimeSeconds - plannedStart, 0),
      progressPercent,
      description: node.description,
      input,
      output,
      dependencies: node.dependencies,
      recentEvents,
      timeline: {
        start: node.plannedStart,
        duration: node.expectedDuration,
        projectedEnd: plannedEnd,
      },
    };
  });

  // 2. Derive Pipe States from adjacent upstream/downstream nodes
  const derivedPipes: DerivedPipe[] = [];
  for (let i = 0; i < derivedStages.length - 1; i++) {
    const upstream = derivedStages[i];
    const downstream = derivedStages[i + 1];

    let state: PipeVisualState = 'waiting';
    let hasActivePulse = false;

    if (upstream.status === 'completed' && downstream.status === 'completed') {
      state = 'completed';
      hasActivePulse = false;
    } else if (upstream.status === 'completed' && downstream.status === 'running') {
      // Data is actively streaming from completed upstream into currently running downstream
      state = 'completed';
      hasActivePulse = isRunning;
    } else if (upstream.status === 'running' && downstream.status === 'waiting') {
      // Upstream is running, downstream waiting for payload
      state = 'active-transitional';
      hasActivePulse = isRunning;
    } else if (upstream.status === 'completed' && downstream.status === 'waiting') {
      // Upstream done, handoff in flight
      state = 'active-transitional';
      hasActivePulse = isRunning;
    } else {
      state = 'waiting';
      hasActivePulse = false;
    }

    derivedPipes.push({
      id: `pipe_${upstream.id}_to_${downstream.id}`,
      fromStageId: upstream.id,
      toStageId: downstream.id,
      fromStep: upstream.stepNumber,
      toStep: downstream.stepNumber,
      state,
      hasActivePulse,
    });
  }

  // 3. Derive Chronological Execution Logs up to current clock
  const derivedLogs: WorkflowLogEntry[] = events
    .filter((evt: RuntimeEvent) => evt.timestampOffset <= currentTimeSeconds)
    .map((evt: RuntimeEvent) => ({
      id: evt.id,
      timestamp: evt.wallClockTime,
      level: evt.level,
      stage: evt.stageId
        ? definition.nodes.find((n: StaticNodeDefinition) => n.id === evt.stageId)?.name || evt.stageId
        : 'System',
      message: evt.message,
    }));

  // Find active selected stage
  const activeStage =
    derivedStages.find((s) => s.id === selectedStageId) || derivedStages[0];

  // 4. Telemetry is supplied by the runtime source.
  // State derivation does not fabricate measurements.
  const telemetry: RuntimeTelemetry = runtime.telemetry || {
    workerThreads: 0,
    activeMemoryMb: 0,
    peakMemoryLimitMb: 0,
    cacheHitRatio: 0,
    bufferDropCount: 0,
  };

  // Provide a clean backward-compatible adapter for existing UI components
  const workflowAdapter: WorkflowDefinition = {
    id: definition.id,
    name: definition.name,
    category: definition.category,
    description: definition.description,
    currentTimeSeconds,
    maxTimelineSeconds: definition.maxTimelineSeconds,
    isRunning,
    selectedStageId: activeStage.id,
    stages: derivedStages,
    logs: derivedLogs,
    codeDefinition: definition.codeDefinition,
  };

  return {
    definition,
    currentTimeSeconds,
    isRunning,
    selectedStageId: activeStage.id,
    stages: derivedStages,
    pipes: derivedPipes,
    logs: derivedLogs,
    activeStage,
    telemetry,
    workflowAdapter,
  };
}
