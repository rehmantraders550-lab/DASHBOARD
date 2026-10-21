import {
  RuntimeEvent,
  RuntimeTelemetry,
  StaticPipelineDefinition,
} from './workflowModel';

export type RuntimeSourceMode = 'SIMULATED' | 'RECORDED' | 'LIVE';

export interface RuntimeSnapshot {
  mode: RuntimeSourceMode;
  pipelineId: string;
  currentTimeSeconds: number;
  isRunning: boolean;
  events: RuntimeEvent[];
  telemetry?: RuntimeTelemetry;
}

export interface RuntimeEventSource {
  readonly mode: RuntimeSourceMode;
  getSnapshot(
    definition: StaticPipelineDefinition,
    currentTimeSeconds: number,
    isRunning: boolean
  ): RuntimeSnapshot;
}

/**
 * First normalized runtime provider.
 * It exposes the existing deterministic fixture stream through the same
 * contract that recorded traces and live ORVIA execution will implement.
 */

export interface RecordedRuntimeTrace {
  pipelineId: string;
  events: RuntimeEvent[];
  telemetry?: RuntimeTelemetry;
}

function assertTraceMatchesDefinition(
  trace: RecordedRuntimeTrace,
  definition: StaticPipelineDefinition
): void {
  if (trace.pipelineId !== definition.id) {
    throw new Error(
      `Recorded trace pipeline "${trace.pipelineId}" does not match definition "${definition.id}".`
    );
  }

  const nodeIds = new Set(definition.nodes.map((node) => node.id));
  const unknownStageIds = trace.events
    .map((event) => event.stageId)
    .filter((stageId): stageId is string => typeof stageId === 'string' && !nodeIds.has(stageId));

  if (unknownStageIds.length > 0) {
    throw new Error(
      `Recorded trace contains unknown stage IDs: ${[...new Set(unknownStageIds)].join(', ')}`
    );
  }
}

export class RecordedRuntimeEventSource implements RuntimeEventSource {
  readonly mode: RuntimeSourceMode = 'RECORDED';

  constructor(private readonly trace: RecordedRuntimeTrace) {}

  getSnapshot(
    definition: StaticPipelineDefinition,
    currentTimeSeconds: number,
    isRunning: boolean
  ): RuntimeSnapshot {
    assertTraceMatchesDefinition(this.trace, definition);

    return {
      mode: this.mode,
      pipelineId: definition.id,
      currentTimeSeconds,
      isRunning,
      events: this.trace.events
        .filter((event) => event.timestampOffset <= currentTimeSeconds)
        .sort((a, b) => a.timestampOffset - b.timestampOffset),
      telemetry: this.trace.telemetry,
    };
  }
}

export interface LiveRuntimeTransport {
  readonly pipelineId: string;
  getEvents(): readonly RuntimeEvent[];
  getTelemetry(): RuntimeTelemetry | undefined;
  getCurrentTimeSeconds(): number;
  isRunning(): boolean;
}

export class LiveRuntimeEventSource implements RuntimeEventSource {
  readonly mode: RuntimeSourceMode = 'LIVE';

  constructor(private readonly transport: LiveRuntimeTransport) {}

  getSnapshot(
    definition: StaticPipelineDefinition,
    _currentTimeSeconds: number,
    _isRunning: boolean
  ): RuntimeSnapshot {
    if (this.transport.pipelineId !== definition.id) {
      throw new Error(
        `Live runtime pipeline "${this.transport.pipelineId}" does not match definition "${definition.id}".`
      );
    }

    const nodeIds = new Set(definition.nodes.map((node) => node.id));
    const events = [...this.transport.getEvents()].sort(
      (a, b) => a.timestampOffset - b.timestampOffset
    );
    const unknownStageIds = events
      .map((event) => event.stageId)
      .filter((stageId): stageId is string => typeof stageId === 'string' && !nodeIds.has(stageId));

    if (unknownStageIds.length > 0) {
      throw new Error(
        `Live runtime emitted unknown stage IDs: ${[...new Set(unknownStageIds)].join(', ')}`
      );
    }

    return {
      mode: this.mode,
      pipelineId: definition.id,
      currentTimeSeconds: this.transport.getCurrentTimeSeconds(),
      isRunning: this.transport.isRunning(),
      events,
      telemetry: this.transport.getTelemetry(),
    };
  }
}

export class SimulatedRuntimeEventSource implements RuntimeEventSource {
  readonly mode: RuntimeSourceMode = 'SIMULATED';

  getSnapshot(
    definition: StaticPipelineDefinition,
    currentTimeSeconds: number,
    isRunning: boolean
  ): RuntimeSnapshot {
    const activeNodes = definition.nodes.filter(
      (node) =>
        currentTimeSeconds >= node.plannedStart &&
        currentTimeSeconds < node.plannedStart + node.expectedDuration
    );
    const activeMemoryMb = Number(
      (
        18.2 +
        activeNodes.reduce((sum, node) => sum + node.baseMemProfile.runningBase, 0)
      ).toFixed(1)
    );

    return {
      mode: this.mode,
      pipelineId: definition.id,
      currentTimeSeconds,
      isRunning,
      events: definition.eventStream
        .filter((event) => event.timestampOffset <= currentTimeSeconds)
        .sort((a, b) => a.timestampOffset - b.timestampOffset),
      telemetry: {
        workerThreads: activeNodes.length > 0 ? 4 : 1,
        activeMemoryMb,
        peakMemoryLimitMb: 512,
        cacheHitRatio: 89.4,
        bufferDropCount: 0,
      },
    };
  }
}

export const simulatedRuntimeSource = new SimulatedRuntimeEventSource();
