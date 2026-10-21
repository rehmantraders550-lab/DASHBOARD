import React from 'react';
import { Menu, Square, Play, RotateCcw } from 'lucide-react';

export type NavTab = 'Live Map' | 'Code' | 'Execution' | 'Dependencies' | 'Simulation';

interface TopNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isRunning: boolean;
  onToggleRunning: () => void;
  onResetSimulation?: () => void;
  onOpenMobileSidebar: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  isRunning,
  onToggleRunning,
  onResetSimulation,
  onOpenMobileSidebar,
}) => {
  const tabs: NavTab[] = ['Live Map', 'Code', 'Execution', 'Dependencies', 'Simulation'];

  return (
    <header className="h-16 bg-white border-b border-[#E5E1DA] px-4 md:px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left section: mobile menu toggle + navigation tabs */}
      <div className="flex items-center gap-2 md:gap-6">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-[#242628] hover:bg-[#F7F4EE] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center gap-1 md:gap-2">
          {tabs.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => onSelectTab(tab)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#F97316] text-white shadow-xs'
                    : 'text-[#686C71] hover:text-[#242628] hover:bg-[#F7F4EE]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right section: status indicator + control buttons */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isRunning
                ? 'bg-[#F97316] animate-pulse ring-4 ring-[#F97316]/15'
                : 'bg-[#9CA3AF]'
            }`}
          />
          <span className="font-medium text-[#242628] hidden sm:inline">
            {isRunning ? 'Workflow Running' : 'Workflow Paused'}
          </span>
        </div>

        {/* Reset button (subtle) */}
        {onResetSimulation && (
          <button
            onClick={onResetSimulation}
            title="Reset simulation to initial state"
            className="p-1.5 rounded-md text-[#737373] hover:text-[#242628] hover:bg-[#F7F4EE] transition-colors hidden md:block"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Primary Stop / Resume button */}
        <button
          onClick={onToggleRunning}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
            isRunning
              ? 'bg-[#242628] text-white hover:bg-[#343638] shadow-xs active:scale-98'
              : 'bg-[#F97316] text-white hover:bg-[#EA580C] shadow-xs active:scale-98'
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Resume</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
