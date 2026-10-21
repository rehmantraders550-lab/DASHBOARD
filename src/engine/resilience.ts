import type { RuntimeEvent, StaticPipelineDefinition } from './workflowModel';

export type ResilienceState = 'failed' | 'retrying' | 'blocked' | 'fallback' | 'recovered';

export interface ResilienceImpact {
  stageId: string;
  state: ResilienceState;
  affectedStageIds: string[];
}

export function deriveResilienceImpacts(
  definition: StaticPipelineDefinition,
  events: readonly RuntimeEvent[]
): ResilienceImpact[] {
  const latest = new Map<string, ResilienceState>();
  for (const event of events) {
    if (event.type !== 'RESILIENCE_STATE' || !event.stageId) continue;
    const state = event.payload?.state;
    if (
      state === 'failed' ||
      state === 'retrying' ||
      state === 'blocked' ||
      state === 'fallback' ||
      state === 'recovered'
    ) {
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
    affectedStageIds: descendantsOf(stageId),
  }));
}
