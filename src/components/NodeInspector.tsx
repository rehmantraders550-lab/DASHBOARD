import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Check,
  FileText,
  Download,
  ChevronDown,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';
import { WorkflowStage, WorkflowLogEntry } from '../types/workflow';

interface NodeInspectorProps {
  stage: WorkflowStage | null;
  onClose: () => void;
  isRunningWorkflow: boolean;
  workflowName?: string;
  workflowId?: string;
  allLogs?: WorkflowLogEntry[];
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  stage,
  onClose,
  isRunningWorkflow,
  workflowName = 'Artwork to Vector',
  workflowId = 'artwork-to-vector',
  allLogs = [],
}) => {
  const [exportFormat, setExportFormat] = useState<'json' | 'text'>('json');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  if (!stage) {
    return (
      <aside className="w-full lg:w-80 xl:w-92 bg-white rounded-2xl border border-[#E5E1DA] p-6 shadow-xs flex flex-col items-center justify-center text-center text-[#737373]">
        <p className="text-sm">Click any step on the pipeline map to inspect details.</p>
      </aside>
    );
  }

  const isRunning = stage.status === 'running';
  const isCompleted = stage.status === 'completed';
  const isWaiting = stage.status === 'waiting';

  const progress = stage.progressPercent ?? (isCompleted ? 100 : isRunning ? 60 : 0);

  // Filter correlated logs for this stage
  const correlatedLogs = allLogs.filter((log) => {
    const stageLower = stage.name.toLowerCase();
    const logStageLower = log.stage.toLowerCase();
    return (
      logStageLower === stageLower ||
      logStageLower.includes(stageLower) ||
      (stage.stepNumber === '03' && logStageLower.includes('02→03')) ||
      (stage.stepNumber === '04' && logStageLower.includes('03→04'))
    );
  });

  const handleDownloadLogs = (formatToUse?: 'json' | 'text') => {
    const format = formatToUse || exportFormat;
    const nowIso = new Date().toISOString();
    const filename = `${workflowId}_step${stage.stepNumber}_${stage.name.toLowerCase()}_logs.${format === 'json' ? 'json' : 'log'}`;

    let fileContent = '';
    let mimeType = 'text/plain;charset=utf-8';

    if (format === 'json') {
      mimeType = 'application/json;charset=utf-8';
      const payload = {
        metadata: {
          generator: 'ORVIA Code Visualizer',
          workflow: {
            id: workflowId,
            name: workflowName,
          },
          stage: {
            id: stage.id,
            stepNumber: stage.stepNumber,
            name: stage.name,
            status: stage.status,
            duration: stage.duration,
            progressPercent: progress,
            description: stage.description,
          },
          exportedAt: nowIso,
        },
        artifacts: {
          input: stage.input,
          output: stage.output,
        },
        dependencies: stage.dependencies,
        recentEvents: stage.recentEvents,
        correlatedPipelineLogs: correlatedLogs,
      };
      fileContent = JSON.stringify(payload, null, 2);
    } else {
      // Formatted Plain Text
      const separator = '='.repeat(78);
      const subSeparator = '-'.repeat(78);
      
      const lines = [
        separator,
        `ORVIA CODE VISUALIZER — STAGE EXECUTION LOG AUDIT`,
        separator,
        `Workflow:        ${workflowName} (${workflowId})`,
        `Stage:           Step ${stage.stepNumber} — ${stage.name}`,
        `Current Status:  ${stage.status.toUpperCase()} (${progress}% progress)`,
        `Duration:        ${stage.duration}`,
        `Exported At:     ${nowIso}`,
        subSeparator,
        `DESCRIPTION:`,
        `  ${stage.description}`,
        subSeparator,
        `INPUT ARTIFACT:`,
        `  File Name:     ${stage.input.name}`,
        `  File Size:     ${stage.input.size}`,
        `  MIME Type:     ${stage.input.type || 'N/A'}`,
        subSeparator,
        `OUTPUT ARTIFACT:`,
        `  Status:        ${stage.output.statusText}`,
        `  File Name:     ${stage.output.name || 'In-memory buffer / processing'}`,
        `  File Size:     ${stage.output.size || 'Pending'}`,
        subSeparator,
        `DEPENDENCY HEALTH:`,
        ...stage.dependencies.map(
          (d) => `  - ${d.name.padEnd(16)} : ${d.status}${d.version ? ` (v${d.version})` : ''}`
        ),
        subSeparator,
        `STAGE RECENT EVENTS:`,
        ...stage.recentEvents.map((e) => `  [${e.timestamp}]  ${e.message}`),
        subSeparator,
        `CORRELATED PIPELINE LOGS (${correlatedLogs.length} events):`,
        ...(correlatedLogs.length > 0
          ? correlatedLogs.map(
              (l) => `  [${l.timestamp}] [${l.level.padEnd(7)}] [${l.stage}] ${l.message}`
            )
          : ['  (No additional correlated pipeline logs captured)']),
        separator,
        `END OF AUDIT TRACE`,
      ];
      fileContent = lines.join('\n');
    }

    // Trigger client-side file download
    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);

    // Provide visual feedback
    setDownloadSuccess(true);
    setIsDropdownOpen(false);
    setTimeout(() => {
      setDownloadSuccess(false);
    }, 2500);
  };

  return (
    <aside className="w-full lg:w-80 xl:w-92 bg-white rounded-2xl border border-[#E5E1DA] p-6 shadow-xs flex flex-col justify-between shrink-0 transition-all overflow-y-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-mono text-[#737373] tracking-wide block">
              Step {stage.stepNumber}
            </span>
            <h2 className="font-editorial text-2xl font-normal text-[#242628] leading-snug mt-0.5">
              {stage.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8E8B85] hover:text-[#242628] p-1 rounded-md transition-colors"
            aria-label="Close inspector panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status & Progress */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isRunning
                    ? 'bg-[#F97316]'
                    : isCompleted
                    ? 'bg-[#16A34A]'
                    : 'bg-[#A8A29E]'
                }`}
              />
              <span
                className={`font-medium ${
                  isRunning
                    ? 'text-[#F97316]'
                    : isCompleted
                    ? 'text-[#16A34A]'
                    : 'text-[#737373]'
                }`}
              >
                {isRunning ? 'Running' : isCompleted ? 'Completed' : 'Waiting'}
              </span>
            </div>
            <span className="font-mono text-sm font-medium text-[#242628]">
              {stage.duration}
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 h-2 bg-[#ECE8E2] rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isRunning ? 'bg-[#F97316]' : isCompleted ? 'bg-[#16A34A]' : 'bg-[#D1CDC7]'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono text-xs text-[#737373] shrink-0">
              {progress}%
            </span>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-semibold text-[#242628] tracking-wider uppercase mb-1.5">
            Description
          </h4>
          <p className="text-xs leading-relaxed text-[#595C60]">
            {stage.description}
          </p>
        </div>

        {/* Input */}
        <div>
          <h4 className="text-xs font-semibold text-[#242628] tracking-wider uppercase mb-1.5">
            Input
          </h4>
          <div className="bg-[#F9F7F3] border border-[#EBE7E0] rounded-lg px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-3.5 h-3.5 text-[#595C60] shrink-0" />
              <span className="font-mono text-xs text-[#242628] truncate">
                {stage.input.name}
              </span>
            </div>
            <span className="font-mono text-xs text-[#737373] shrink-0 ml-2">
              {stage.input.size}
            </span>
          </div>
        </div>

        {/* Output */}
        <div>
          <h4 className="text-xs font-semibold text-[#242628] tracking-wider uppercase mb-1.5">
            Output
          </h4>
          <div className="bg-[#F9F7F3] border border-[#EBE7E0] rounded-lg px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {stage.output.isProcessing ? (
                <>
                  <svg
                    className={`w-3.5 h-3.5 text-[#F97316] shrink-0 ${isRunningWorkflow ? 'animate-spin' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle cx="12" cy="12" r="10" stroke="#FDE68A" strokeWidth="3" />
                    <path
                      d="M12 2A10 10 0 0 1 22 12"
                      stroke="#F97316"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="font-mono text-xs text-[#595C60]">
                    {stage.output.statusText}
                  </span>
                </>
              ) : isCompleted ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full bg-[#16A34A] flex items-center justify-center text-white shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="font-mono text-xs text-[#242628] truncate">
                    {stage.output.name || stage.output.statusText}
                  </span>
                </>
              ) : (
                <span className="font-mono text-xs text-[#8E8B85]">
                  {stage.output.statusText}
                </span>
              )}
            </div>
            {stage.output.size && (
              <span className="font-mono text-xs text-[#737373] shrink-0 ml-2">
                {stage.output.size}
              </span>
            )}
          </div>
        </div>

        {/* Dependencies */}
        <div>
          <h4 className="text-xs font-semibold text-[#242628] tracking-wider uppercase mb-2">
            Dependencies
          </h4>
          <div className="space-y-2">
            {stage.dependencies.map((dep) => (
              <div key={dep.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-[#F97316] flex items-center justify-center text-white shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span className="text-[#242628] font-medium font-sans">
                    {dep.name}
                  </span>
                </div>
                <span className="text-[#737373] font-sans">
                  {dep.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Events & Download Trigger */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-[#242628] tracking-wider uppercase">
              Recent Events
            </h4>
            <span className="text-[11px] font-mono text-[#8E8B85]">
              {stage.recentEvents.length} events
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-[11px] text-[#595C60]">
            {stage.recentEvents.map((evt, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <span className="text-[#8E8B85] shrink-0">{evt.timestamp}</span>
                <span className="text-[#242628] leading-tight">{evt.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Download Logs Section */}
      <div className="pt-6 mt-6 border-t border-[#EDE8E0]">
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-stretch rounded-lg shadow-2xs border border-[#E5E1DA] overflow-hidden bg-white">
            {/* Primary Download Trigger */}
            <button
              onClick={() => handleDownloadLogs(exportFormat)}
              className={`flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-medium transition-all ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#242628] hover:bg-[#343638] text-white active:scale-[0.99]'
              }`}
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Logs Exported!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>
                    Download Logs ({exportFormat.toUpperCase()})
                  </span>
                </>
              )}
            </button>

            {/* Format Dropdown Toggle */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`px-2.5 flex items-center justify-center border-l border-[#343638] transition-colors ${
                downloadSuccess
                  ? 'bg-emerald-700 text-white border-emerald-500'
                  : 'bg-[#242628] hover:bg-[#343638] text-[#D1CDC7]'
              }`}
              title="Select export format"
              aria-label="Select export format"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Format Selection Menu */}
          {isDropdownOpen && (
            <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-[#E5E1DA] rounded-xl shadow-lg p-1.5 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-[#8E8B85]">
                Export Format
              </div>
              <button
                onClick={() => {
                  setExportFormat('json');
                  handleDownloadLogs('json');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  exportFormat === 'json'
                    ? 'bg-[#FFF1E7] text-[#F97316]'
                    : 'text-[#242628] hover:bg-[#F9F7F3]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5" />
                  <span>JSON Document (.json)</span>
                </div>
                {exportFormat === 'json' && <Check className="w-3 h-3 stroke-[2.5]" />}
              </button>

              <button
                onClick={() => {
                  setExportFormat('text');
                  handleDownloadLogs('text');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  exportFormat === 'text'
                    ? 'bg-[#FFF1E7] text-[#F97316]'
                    : 'text-[#242628] hover:bg-[#F9F7F3]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Plain Text Log (.log)</span>
                </div>
                {exportFormat === 'text' && <Check className="w-3 h-3 stroke-[2.5]" />}
              </button>

              <div className="px-2.5 pt-1.5 pb-1 border-t border-[#EDE8E0] mt-1 text-[10px] text-[#737373]">
                Includes {stage.recentEvents.length} stage events &amp; {correlatedLogs.length} correlated pipeline traces.
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
