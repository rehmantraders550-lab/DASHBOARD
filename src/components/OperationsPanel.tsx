import React, { useState } from 'react';
import type { ChangeEvent } from 'react';
import { AlertTriangle, CheckCircle2, FileJson, Github, HardDrive, Play, RotateCcw, Sliders, UploadCloud } from 'lucide-react';
import type { StaticPipelineDefinition, RuntimeEvent } from '../engine/workflowModel';
import type { RecordedRuntimeTrace, RuntimeSourceMode } from '../engine/runtimeAdapter';

interface OperationsPanelProps {
  page: 'Integrations' | 'Settings';
  definition: StaticPipelineDefinition;
  runtimeMode: RuntimeSourceMode;
  simSpeed: number;
  onChangeSpeed: (speed: number) => void;
  onLoadTrace: (trace: RecordedRuntimeTrace) => void;
  onUseSimulation: () => void;
  onReset: () => void;
  onNavigateToMap: () => void;
}

const EVENT_TYPES = new Set(['PIPELINE_INIT','STAGE_START','STAGE_PROGRESS','STAGE_COMPLETE','ARTIFACT_PRODUCED','DEPENDENCY_RESOLVED','RESILIENCE_STATE','LOG_MESSAGE']);
const LOG_LEVELS = new Set(['INFO','WARN','DEBUG','SUCCESS']);
function parseTrace(value: unknown, pipeline: StaticPipelineDefinition): RecordedRuntimeTrace {
  if (!value || typeof value !== 'object') throw Error('Expected a JSON object.');
  const root = value as Record<string, unknown>;
  if (root.pipelineId !== pipeline.id) throw Error('Trace pipelineId must equal "' + pipeline.id + '".');
  if (!Array.isArray(root.events) || root.events.length > 10000) throw Error('Expected an events array with at most 10,000 events.');
  const ids = new Set(pipeline.nodes.map(node => node.id));
  const events: RuntimeEvent[] = root.events.map((raw: unknown, index: number) => {
    if (!raw || typeof raw !== 'object') throw Error('Event #' + (index + 1) + ' is not an object.');
    const e = raw as Record<string, unknown>;
    if (typeof e.id !== 'string' || !e.id || typeof e.timestampOffset !== 'number' || !Number.isFinite(e.timestampOffset) || e.timestampOffset < 0 || typeof e.message !== 'string' || typeof e.wallClockTime !== 'string' || !EVENT_TYPES.has(String(e.type)) || !LOG_LEVELS.has(String(e.level)) || (e.stageId != null && (typeof e.stageId !== 'string' || !ids.has(e.stageId)))) {
      throw Error('Event #' + (index + 1) + ' has invalid fields or an unknown stageId.');
    }
    return { id: e.id, timestampOffset: e.timestampOffset, wallClockTime: e.wallClockTime, type: e.type as RuntimeEvent['type'], level: e.level as RuntimeEvent['level'], message: e.message, ...(e.stageId ? { stageId: e.stageId as string } : {}), ...(e.payload && typeof e.payload === 'object' && !Array.isArray(e.payload) ? { payload: e.payload as Record<string, unknown> } : {}) };
  });
  const t = root.telemetry;
  const telemetry = t && typeof t === 'object' && ['workerThreads', 'activeMemoryMb', 'peakMemoryLimitMb', 'cacheHitRatio', 'bufferDropCount'].every(key => typeof (t as Record<string, unknown>)[key] === 'number' && Number.isFinite((t as Record<string, unknown>)[key]))
    ? t as RecordedRuntimeTrace['telemetry'] : undefined;
  return { pipelineId: pipeline.id, events, ...(telemetry ? { telemetry } : {}) };
}

export const OperationsPanel: React.FC<OperationsPanelProps> = ({ page, definition, runtimeMode, simSpeed, onChangeSpeed, onLoadTrace, onUseSimulation, onReset, onNavigateToMap }) => {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const handleTraceUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setMessage('');
    try {
      if (file.size > 3 * 1024 * 1024) throw Error('The maximum supported trace file size is 3 MB.');
      const trace = parseTrace(JSON.parse(await file.text()) as unknown, definition);
      onLoadTrace(trace);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Unable to load this trace.');
    }
  };
  return (
    <main className="flex-1 overflow-y-auto bg-[#F7F4EE] p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#F97316] font-semibold">ORVIA CODE VISUALIZER</p>
            <h1 className="font-editorial text-4xl mt-2 text-[#242628]">{page === 'Integrations' ? 'Runtime Integrations' : 'Playback Settings'}</h1>
            <p className="text-sm text-[#737373] mt-2">{page === 'Integrations' ? 'Connect recorded ORVIA events locally, or inspect connection readiness.' : 'Control deterministic playback without paid services or API calls.'}</p>
          </div>
          <button onClick={onNavigateToMap} className="shrink-0 bg-[#242628] text-white px-4 py-2 rounded-lg text-sm">Live Map</button>
        </div>
        <section className="bg-white border border-[#E5E1DA] rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-2 font-semibold text-[#242628]"><HardDrive className="w-4 h-4 text-[#F97316]" />Runtime mode <span className="ml-auto text-xs font-mono bg-[#FFF1E7] px-2 py-1 rounded text-[#EA580C]">{runtimeMode}</span></div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl bg-[#F9F7F3] border border-[#E5E1DA] p-4"><CheckCircle2 className="w-4 h-4 text-[#16A34A] mb-2"/><strong>Simulation</strong><p className="text-[#737373] text-xs mt-1">Runs offline using versioned fixture events.</p></div>
            <div className="rounded-xl bg-[#F9F7F3] border border-[#E5E1DA] p-4"><FileJson className="w-4 h-4 text-[#F97316] mb-2"/><strong>Recorded trace</strong><p className="text-[#737373] text-xs mt-1">Replays a validated, uploaded JSON event stream.</p></div>
            <div className="rounded-xl bg-[#F9F7F3] border border-[#E5E1DA] p-4"><AlertTriangle className="w-4 h-4 text-[#B45309] mb-2"/><strong>Live engine</strong><p className="text-[#737373] text-xs mt-1">Adapter exists, but no ORVIA backend transport is configured.</p></div>
          </div>
          <button onClick={() => { onUseSimulation(); setMessage('Simulation selected and paused at reference time.'); }} className="inline-flex items-center gap-2 border border-[#E5E1DA] hover:border-[#F97316] px-4 py-2 rounded-lg text-sm"><Play className="w-4 h-4"/>Use offline simulation</button>
        </section>
        {page === 'Integrations' ? (
          <section className="bg-white border border-[#E5E1DA] rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 font-semibold"><UploadCloud className="w-5 h-5 text-[#F97316]"/>Import recorded execution</div>
            <p className="text-sm text-[#737373]">Choose a local JSON file for the currently selected workflow: <strong>{definition.id}</strong>. The file stays in this browser. No data is uploaded to ORVIA, Vercel, or GitHub.</p>
            <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg bg-[#F97316] text-white text-sm font-semibold">
              <UploadCloud className="w-4 h-4"/> Choose trace JSON
              <input className="sr-only" type="file" accept=".json,application/json" onChange={handleTraceUpload}/>
            </label>
            <div className="p-4 rounded-lg bg-[#F9F7F3] text-xs font-mono text-[#595C60] overflow-x-auto whitespace-pre">{'{\n  "pipelineId": "' + definition.id + '",\n  "events": [\n    { "id": "e1", "timestampOffset": 0.1,\n      "wallClockTime": "14:21:05", "type": "STAGE_START",\n      "stageId": "' + definition.nodes[0].id + '", "level": "INFO",\n      "message": "Started" }\n  ]\n}'}</div>
            <a className="inline-flex items-center gap-2 text-[#F97316] text-sm underline" href="https://github.com/rehmantraders550-lab/DASHBOARD" target="_blank" rel="noopener noreferrer"><Github className="w-4 h-4"/>Open actual GitHub repository</a>
          </section>
        ) : (
          <section className="bg-white border border-[#E5E1DA] rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2 font-semibold"><Sliders className="w-5 h-5 text-[#F97316]"/>Playback speed</div>
            <div className="flex flex-wrap gap-2">{[0.5, 1, 2, 4].map(speed => <button key={speed} onClick={() => onChangeSpeed(speed)} className={'px-4 py-2 rounded-lg text-sm font-mono border ' + (simSpeed === speed ? 'bg-[#F97316] border-[#F97316] text-white' : 'border-[#E5E1DA] text-[#595C60]')}>{speed}×</button>)}</div>
            <button onClick={() => { onReset(); setMessage('Playback reset.'); }} className="inline-flex items-center gap-2 px-4 py-2 border border-[#E5E1DA] rounded-lg text-sm"><RotateCcw className="w-4 h-4"/>Reset playback</button>
            <p className="text-xs text-[#737373]">All settings are local to this session. No billable backend execution is triggered.</p>
          </section>
        )}
        {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">{error}</p>}
        {message && <p role="status" className="text-sm text-[#166534] bg-green-50 p-3 rounded-lg">{message}</p>}
      </div>
    </main>
  );
};
