import React from 'react';
import { Package, ShieldAlert } from 'lucide-react';
import type { WorkflowDefinition } from '../../types/workflow';

interface DependenciesViewProps { workflow: WorkflowDefinition; }

export const DependenciesView: React.FC<DependenciesViewProps> = ({ workflow }) => {
  const dependencies = workflow.stages.flatMap(stage => stage.dependencies.map(dep => ({ ...dep, stageName: stage.name, stageId: stage.id })));
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#737373]"><Package className="w-4 h-4 text-[#F97316]"/>Pipeline requirements</div>
        <h1 className="font-editorial text-3xl text-[#242628] mt-1">Pipeline Dependencies</h1>
        <p className="text-sm text-[#737373] mt-2">Declared requirements for {workflow.name}. This browser dashboard does not verify native binaries or package integrity.</p>
      </div>
      <div className="flex gap-3 p-4 rounded-xl border border-[#F5D09A] bg-[#FFF8EC] text-[#92400E] text-sm"><ShieldAlert className="w-5 h-5 shrink-0"/>Dependency availability, versions and licenses shown in demo configuration are unverified until a real runtime connects.</div>
      <div className="bg-white rounded-2xl border border-[#E5E1DA] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E1DA] font-semibold text-sm">{dependencies.length} declared stage requirements</div>
        <div className="divide-y divide-[#F2EFEA]">
          {dependencies.map((dep, index) => (
            <div key={dep.stageId+'-'+dep.name+'-'+index} className="px-6 py-4 flex flex-wrap justify-between items-center gap-3 text-sm">
              <div><div className="font-mono font-semibold text-[#242628]">{dep.name} <span className="text-[#8E8B85] font-normal">{dep.version ? 'v'+dep.version : ''}</span></div><div className="text-xs text-[#737373] mt-1">{dep.stageName} / {dep.stageId}</div></div>
              <span className="text-xs font-medium border border-[#E5E1DA] px-3 py-1 rounded-lg text-[#8E8B85]">Unverified specification</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
