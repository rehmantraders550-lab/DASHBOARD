import React from 'react';
import {
  FileText,
  Search,
  ShieldCheck,
  Upload,
  Check,
  GitBranch,
  Package,
  Image,
  ScanSearch,
  KeyRound,
  CloudUpload,
  CircleDot
} from 'lucide-react';
import { WorkflowStage } from '../types/workflow';

interface WorkflowCardProps {
  stage: WorkflowStage;
  isSelected: boolean;
  onSelect: () => void;
  isRunningWorkflow: boolean;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  stage,
  isSelected,
  onSelect,
  isRunningWorkflow,
}) => {
  const isRunning = stage.status === 'running';
  const isCompleted = stage.status === 'completed';
  const isWaiting = stage.status === 'waiting';

  const renderIcon = () => {
    const iconClass = "w-8 h-8 text-[#242628] stroke-[1.6]";

    if (stage.visualType === 'vectorize') {
      return (
        <div className="relative w-10 h-10 flex items-center justify-center" aria-label="Vectorization stage">
          <svg
            className={`w-10 h-10 ${isRunning && isRunningWorkflow ? 'animate-spin' : ''}`}
            viewBox="0 0 40 40"
            style={{ animationDuration: '3s' }}
          >
            <circle cx="20" cy="20" r="16" stroke="#F0ECE4" strokeWidth="3.5" fill="none" />
            <circle cx="20" cy="20" r="16" stroke="#F97316" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="100.5" strokeDashoffset="40" fill="none" />
          </svg>
        </div>
      );
    }

    switch (stage.visualType) {
      case 'intake': return <FileText className={iconClass} />;
      case 'analysis': return <Search className={iconClass} />;
      case 'validation': return <ShieldCheck className={iconClass} />;
      case 'export': return <Upload className={iconClass} />;
      case 'fanout': return <GitBranch className={iconClass} />;
      case 'bundle': return <Package className={iconClass} />;
      case 'render': return <Image className={iconClass} />;
      case 'comparison': return <ScanSearch className={iconClass} />;
      case 'sign': return <KeyRound className={iconClass} />;
      case 'publish': return <CloudUpload className={iconClass} />;
      default: return <CircleDot className={iconClass} />;
    }
  };

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`relative select-none cursor-pointer w-36 sm:w-40 md:w-44 h-48 sm:h-52 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 focus:outline-hidden ${
        isSelected
          ? 'bg-[#FFF8F3] border-2 border-[#F97316] shadow-[0_4px_24px_rgba(249,115,22,0.18)] scale-[1.02] z-10'
          : 'bg-white border border-[#E5E1DA] hover:border-[#D1CDC7] shadow-xs hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* Top Header: Step number & Title */}
      <div>
        <span className="text-[11px] font-mono font-medium text-[#737373] tracking-wider block">
          {stage.stepNumber}
        </span>
        <h3 className="font-editorial text-xl sm:text-[22px] font-medium text-[#242628] leading-tight mt-0.5">
          {stage.name}
        </h3>
      </div>

      {/* Center Icon */}
      <div className="flex items-center justify-center my-auto py-2">
        {renderIcon()}
      </div>

      {/* Bottom Status */}
      <div className="flex items-center gap-2 pt-1 text-xs">
        {isCompleted && (
          <>
            <div className="w-4 h-4 rounded-full bg-[#F97316] flex items-center justify-center text-white shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span className="font-medium text-[#242628] font-mono">
              {stage.duration}
            </span>
          </>
        )}

        {isRunning && (
          <div className="w-full text-center">
            <span className="text-[#F97316] font-semibold font-mono text-sm">
              {stage.duration}
            </span>
          </div>
        )}

        {isWaiting && (
          <>
            <div className="w-3.5 h-3.5 rounded-full border border-[#A8A29E] shrink-0" />
            <span className="text-[#8E8B85] font-medium">
              Waiting
            </span>
          </>
        )}
      </div>
    </div>
  );
};
