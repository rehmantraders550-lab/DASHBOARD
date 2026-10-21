import React, { useState } from 'react';
import { Copy, Check, FileCode, Terminal } from 'lucide-react';
import { WorkflowDefinition } from '../../types/workflow';

interface CodeViewProps {
  workflow: WorkflowDefinition;
}

export const CodeView: React.FC<CodeViewProps> = ({ workflow }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(workflow.codeDefinition);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = workflow.codeDefinition.split('\n');

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#737373] uppercase">
            <FileCode className="w-4 h-4 text-[#F97316]" />
            <span>PIPELINE DEFINITION</span>
          </div>
          <h1 className="font-editorial text-3xl font-normal text-[#242628] mt-1">
            {workflow.name} — Source Code
          </h1>
          <p className="text-sm text-[#737373] mt-0.5">
            Compiled TypeScript DAG executed by Orvia Runtime Engine.
          </p>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-[#E5E1DA] hover:bg-[#F9F7F3] rounded-lg text-xs font-medium text-[#242628] shadow-2xs transition-colors self-start"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied to Clipboard</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#8E8B85]" />
              <span>Copy Pipeline Script</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-[#1E2022] rounded-2xl border border-[#2C2E30] overflow-hidden shadow-md">
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#17181A] border-b border-[#2C2E30] text-xs font-mono text-[#8E9296]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-[#F97316]" />
            <span>pipelines/{workflow.id}.ts</span>
          </div>
          <span className="text-[11px] text-[#6C7177]">TypeScript • Strict Node Concurrency</span>
        </div>

        <div className="p-4 sm:p-6 overflow-x-auto">
          <pre className="font-mono text-xs sm:text-[13px] leading-relaxed text-[#E6E8EA]">
            {lines.map((line, idx) => (
              <div key={idx} className="table-row">
                <span className="table-cell pr-6 select-none text-[#52575D] text-right text-[11px]">
                  {idx + 1}
                </span>
                <span className="table-cell whitespace-pre">
                  {line.includes('//') ? (
                    <span className="text-[#7A828A] italic">{line}</span>
                  ) : line.includes('step(') || line.includes('definePipeline') ? (
                    <span className="text-[#F97316] font-semibold">{line}</span>
                  ) : line.includes('import') || line.includes('export') || line.includes('return') ? (
                    <span className="text-[#38BDF8]">{line}</span>
                  ) : line.includes('async') || line.includes('await') ? (
                    <span className="text-[#F43F5E]">{line}</span>
                  ) : (
                    line
                  )}
                </span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
};
