import type { NodeVisualType } from '../engine/workflowModel';

export type StageStatus = 'completed' | 'running' | 'waiting' | 'failed';

export interface StageDependency {
  name: string;
  status: 'Available' | 'Pending' | 'Missing';
  version?: string;
}

export interface StageEvent {
  timestamp: string;
  message: string;
}

export interface WorkflowStage {
  id: string;
  stepNumber: string; // e.g. "01"
  name: string; // e.g. "Intake"
  visualType?: NodeVisualType;
  status: StageStatus;
  duration: string; // e.g. "0.3s"
  durationSeconds: number;
  progressPercent?: number; // e.g. 60
  description: string;
  input: {
    name: string;
    size: string;
    type?: string;
  };
  output: {
    statusText: string;
    isProcessing: boolean;
    name?: string;
    size?: string;
  };
  dependencies: StageDependency[];
  recentEvents: StageEvent[];
  timeline: {
    start: number; // in seconds
    duration: number; // in seconds
    projectedEnd?: number; // in seconds
  };
}

export interface WorkflowLogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'DEBUG' | 'SUCCESS';
  stage: string;
  message: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  currentTimeSeconds: number;
  maxTimelineSeconds: number;
  isRunning: boolean;
  selectedStageId: string;
  stages: WorkflowStage[];
  logs: WorkflowLogEntry[];
  codeDefinition: string;
}
