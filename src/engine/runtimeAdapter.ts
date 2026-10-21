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
export class SimulatedRuntimeEventSource implements RuntimeEventSource {
  readonly mode: RuntimeSourceMode = 'SIMULATED';

  getSnapshot(
    definition: StaticPipelineDefinition,
    currentTimeSeconds: number,
    isRunning: boolean
  ): RuntimeSnapshot {
    return {
      mode: this.mode,
      pipelineId: definition.id,
      currentTimeSeconds,
      isRunning,
      events: definition.eventStream
        .filter((event) => event.timestampOffset <= currentTimeSeconds)
        .sort((a, b) => a.timestampOffset - b.timestampOffset),
    };
  }
}

export const simulatedRuntimeSource = new SimulatedRuntimeEventSource();
