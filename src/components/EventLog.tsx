import React, { useState } from 'react';
import { Search, Copy, Check, Filter } from 'lucide-react';
import { WorkflowLogEntry } from '../types/workflow';

interface EventLogProps {
  logs: WorkflowLogEntry[];
}

export const EventLog: React.FC<EventLogProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'INFO' | 'SUCCESS' | 'WARN' | 'DEBUG'>('ALL');
  const [copied, setCopied] = useState(false);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.stage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.timestamp.includes(searchTerm);

    const matchesLevel = levelFilter === 'ALL' || log.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.stage}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'WARN':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'DEBUG':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'INFO':
      default:
        return 'bg-orange-50 text-orange-700 border-orange-200';
    }
  };

  return (
    <div className="space-y-3">
      {/* Search & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-[#EDE8E0]">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#8E8B85]" />
            <input
              type="text"
              placeholder="Search execution logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F9F7F3] border border-[#E5E1DA] rounded-md text-[#242628] placeholder-[#9CA3AF] focus:outline-hidden focus:border-[#F97316] transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-[#8E8B85] mr-1 hidden sm:block" />
          {(['ALL', 'INFO', 'SUCCESS', 'DEBUG'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                levelFilter === lvl
                  ? 'bg-[#242628] text-white'
                  : 'bg-[#F9F7F3] text-[#737373] hover:text-[#242628]'
              }`}
            >
              {lvl}
            </button>
          ))}

          <button
            onClick={handleCopyLogs}
            className="flex items-center gap-1.5 ml-2 px-2.5 py-1 text-xs text-[#595C60] hover:text-[#242628] hover:bg-[#F9F7F3] border border-[#E5E1DA] rounded transition-colors"
            title="Copy logs to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs pr-1">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-6 text-xs text-[#8E8B85]">
            No matching log events recorded.
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 py-1 px-2 rounded-md hover:bg-[#F9F7F3] transition-colors"
            >
              <span className="text-[#8E8B85] text-[11px] shrink-0 select-none">
                {log.timestamp}
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-sans font-medium shrink-0 ${getLevelBadgeClass(
                  log.level
                )}`}
              >
                {log.level}
              </span>
              <span className="text-[#F97316] text-[11px] font-medium shrink-0">
                [{log.stage}]
              </span>
              <span className="text-[#242628] text-[11px] leading-relaxed break-all">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
