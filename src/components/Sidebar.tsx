import React from 'react';
import {
  FileText,
  Share2,
  Layers,
  Search,
  ExternalLink,
  Database,
  Link2,
  Settings,
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react';
import { OrviaWordmark } from './OrviaLogo';
import { WorkflowDefinition } from '../types/workflow';

interface SidebarProps {
  workflows: WorkflowDefinition[];
  activeWorkflowId: string;
  onSelectWorkflow: (id: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onSelectUtilityPage: (page: 'Integrations' | 'Settings' | null) => void;
  activeUtilityPage: 'Integrations' | 'Settings' | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  workflows,
  activeWorkflowId,
  onSelectWorkflow,
  isOpenMobile,
  onCloseMobile,
  onSelectUtilityPage,
  activeUtilityPage,
}) => {
  const getWorkflowIcon = (id: string, isActive: boolean) => {
    switch (id) {
      case 'artwork-to-vector':
        return <FileText className={`w-4 h-4 ${isActive ? 'text-[#F97316]' : 'text-[#8E9296]'}`} />;
      case 'color-analysis':
        return <Share2 className={`w-4 h-4 ${isActive ? 'text-[#F97316]' : 'text-[#8E9296]'}`} />;
      case 'batch-processing':
        return <Layers className={`w-4 h-4 ${isActive ? 'text-[#F97316]' : 'text-[#8E9296]'}`} />;
      case 'qa-validation':
        return <Search className={`w-4 h-4 ${isActive ? 'text-[#F97316]' : 'text-[#8E9296]'}`} />;
      case 'export-pipeline':
      default:
        return <ExternalLink className={`w-4 h-4 ${isActive ? 'text-[#F97316]' : 'text-[#8E9296]'}`} />;
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#1E2022] text-[#A3A7AC] flex flex-col justify-between border-r border-[#2C2E30] transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        } lg:static lg:h-screen lg:shrink-0`}
      >
        {/* Top Header & Workflows */}
        <div className="flex flex-col">
          {/* Logo Bar */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#2C2E30]">
            <OrviaWordmark />
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-[#8E9296] hover:text-white p-1 rounded-md"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section: Workflows */}
          <div className="px-3 pt-6 pb-2">
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-[#686C71] uppercase">
              WORKFLOWS
            </div>
            <nav className="space-y-1">
              {workflows.map((wf) => {
                const isActive = wf.id === activeWorkflowId;
                return (
                  <button
                    key={wf.id}
                    onClick={() => {
                      onSelectWorkflow(wf.id);
                      onCloseMobile();
                    }}
                    className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left ${
                      isActive
                        ? 'bg-[#2E2824] text-white shadow-xs border border-[#F97316]/30'
                        : 'text-[#A3A7AC] hover:text-white hover:bg-[#282A2D]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? 'bg-[#F97316]/15 border border-[#F97316]/40'
                            : 'bg-[#282A2D] group-hover:bg-[#323539]'
                        }`}
                      >
                        {getWorkflowIcon(wf.id, isActive)}
                      </div>
                      <span className="truncate">{wf.name}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-[#F97316] shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Divider */}
          <div className="mx-5 my-3 border-t border-[#2C2E30]" />

          {/* Secondary Navigation */}
          <div className="px-3 space-y-1">
            <button
              onClick={() => { window.open('https://github.com/rehmantraders550-lab/DASHBOARD', '_blank', 'noopener,noreferrer'); onCloseMobile(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#A3A7AC] hover:text-white hover:bg-[#282A2D] transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-md bg-[#282A2D] flex items-center justify-center shrink-0">
                <Database className="w-4 h-4 text-[#8E9296]" />
              </div>
              <span>Repository</span>
            </button>

            <button
              onClick={() => { onSelectUtilityPage('Integrations'); onCloseMobile(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#A3A7AC] hover:text-white hover:bg-[#282A2D] transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-md bg-[#282A2D] flex items-center justify-center shrink-0">
                <Link2 className="w-4 h-4 text-[#8E9296]" />
              </div>
              <span className={activeUtilityPage === 'Integrations' ? 'text-[#F97316]' : ''}>Integrations</span>
            </button>

            <button
              onClick={() => { onSelectUtilityPage('Settings'); onCloseMobile(); }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#A3A7AC] hover:text-white hover:bg-[#282A2D] transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-md bg-[#282A2D] flex items-center justify-center shrink-0">
                <Settings className="w-4 h-4 text-[#8E9296]" />
              </div>
              <span className={activeUtilityPage === 'Settings' ? 'text-[#F97316]' : ''}>Settings</span>
            </button>
          </div>
        </div>

        {/* Footer Brand Typography matching reference image */}
        <div className="p-5 border-t border-[#2C2E30]/60 space-y-3">
          <div className="w-6 h-0.5 bg-[#F97316] rounded-full" />
          <div className="space-y-0.5 text-[10px] tracking-[0.2em] uppercase font-mono text-[#6C7177] leading-relaxed">
            <div>ENGINEERED</div>
            <div>INTELLIGENCE</div>
            <div>FOR CREATIVE WORK.</div>
            <div className="pt-1 text-[#F97316] font-sans font-semibold tracking-[0.25em]">
              ORVIA
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
