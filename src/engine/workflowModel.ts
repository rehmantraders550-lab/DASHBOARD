import { StageDependency, NodeVisualType } from '../types/workflow';

// Static declaration of a pipeline node in the DAG
export interface StaticNodeDefinition {
  id: string;
  stepNumber: string; // e.g. "01"
  name: string; // e.g. "Intake"
  visualType: NodeVisualType;
  description: string;
  plannedStart: number; // in seconds on virtual timeline
  expectedDuration: number; // in seconds
  dependsOn: string[]; // parent node IDs
  inputTemplate: {
    name: string;
    size: string;
    type?: string;
  };
  outputTemplate: {
    name: string;
    size: string;
    type?: string;
    runningStatusText?: string;
  };
  dependencies: StageDependency[];
  baseCpuProfile: {
    runningBase: number;
    runningVariance: number;
    idleBase: number;
  };
  baseMemProfile: {
    runningBase: number;
    runningVariance: number;
    idleBase: number;
  };
}

// Runtime event emitted by execution engine
export interface RuntimeEvent {
  id: string;
  timestampOffset: number; // seconds from pipeline start (e.g. 0.3, 1.4)
  wallClockTime: string; // e.g. "14:21:08"
  type:
    | 'PIPELINE_INIT'
    | 'STAGE_START'
    | 'STAGE_PROGRESS'
    | 'STAGE_COMPLETE'
    | 'ARTIFACT_PRODUCED'
    | 'DEPENDENCY_RESOLVED'
    | 'LOG_MESSAGE';
  stageId?: string;
  level: 'INFO' | 'WARN' | 'DEBUG' | 'SUCCESS';
  message: string;
  payload?: Record<string, unknown>;
}

// Telemetry state feed
export interface RuntimeTelemetry {
  workerThreads: number;
  activeMemoryMb: number;
  peakMemoryLimitMb: number;
  cacheHitRatio: number;
  bufferDropCount: number;
}

// Complete static pipeline specification
export interface StaticPipelineDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  maxTimelineSeconds: number;
  defaultTimeSeconds: number;
  nodes: StaticNodeDefinition[];
  codeDefinition: string;
  eventStream: RuntimeEvent[];
}
