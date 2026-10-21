import type { RuntimeEvent, StaticPipelineDefinition } from './workflowModel';

export type ResilienceState = 'failed' | 'retrying' | 'blocked' | 'fallback' | 'recovered';
export type ResilienceScenarioKind = 'dependency' | 'timeout' | 'malformed' | 'retry' | 'fallback' | 'recovery';

export interface ResilienceImpact {
  stageId: string;
  state: ResilienceState;
  affectedStageIds: string[];
}

export interface ResilienceScenario {
  id: ResilienceScenarioKind;
  label: string;
  state: ResilienceState;
  message: string;
}

export const RESILIENCE_SCENARIOS: ResilienceScenario[] = [
  { id: 'dependency', label: 'Dependency unavailable', state: 'blocked', message: 'Required dependency is unavailable.' },
  { id: 'timeout', label: 'Stage timeout', state: 'failed', message: 'Stage exceeded its execution deadline.' },
  { id: 'malformed', label: 'Malformed output', state: 'failed', message: 'Stage output did not satisfy the expected contract.' },
  { id: 'retry', label: 'Retry stage', state: 'retrying', message: 'Stage is retrying after a recoverable interruption.' },
  { id: 'fallback', label: 'Activate fallback', state: 'fallback', message: 'Fallback execution route is active.' },
  { id: 'recovery', label: 'Recover stage', state: 'recovered', message: 'Stage recovered and can continue execution.' },
];

export function createResilienceEvent(
  scenario: ResilienceScenario,
  stageId: string,
  timestampOffset: number
): RuntimeEvent {
  const seconds = Math.max(0, Math.round(timestampOffset));
  return {
    id: `resilience_${scenario.id}_${stageId}_${timestampOffset.toFixed(2)}`,
    timestampOffset,
    wallClockTime: `T+${seconds}s`,
    type: 'RESILIENCE_STATE',
    stageId,
    level: scenario.state === 'recovered' ? 'SUCCESS' : 'WARN',
    message: scenario.message,
    payload: { state: scenario.state, scenario: scenario.id },
  };
}

export function deriveResilienceImpacts(
  definition: StaticPipelineDefinition,
  events: readonly RuntimeEvent[]
): ResilienceImpact[] {
  const latest = new Map<string, ResilienceState>();
  for (const event of events) {
    if (event.type !== 'RESILIENCE_STATE' || !event.stageId) continue;
    const state = event.payload?.state;
    if (state === 'failed' || state === 'retrying' || state === 'blocked' || state === 'fallback' || state === 'recovered') {
      latest.set(event.stageId, state);
    }
  }

  const descendantsOf = (rootId: string): string[] => {
    const seen = new Set<string>();
    const queue = [rootId];
    while (queue.length) {
      const current = queue.shift()!;
      for (const node of definition.nodes) {
        if (node.dependsOn.includes(current) && !seen.has(node.id)) {
          seen.add(node.id);
          queue.push(node.id);
        }
      }
    }
    return [...seen];
  };

  return [...latest.entries()].map(([stageId, state]) => ({
    stageId,
    state,
    affectedStageIds: state === 'recovered' ? [] : descendantsOf(stageId),
  }));
}
