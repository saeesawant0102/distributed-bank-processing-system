import React, { useState } from 'react';
import { Terminal, Trash2, Search, ChevronRight, ChevronDown } from 'lucide-react';

export function EventLog({ events = [], onClear, maxHeight = '280px' }) {
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  const filteredEvents = events.filter((e) => {
    // Level filter matching
    if (levelFilter === 'ERROR' && !(e.type?.includes('RACE') || e.type?.includes('FAILED') || e.type?.includes('TIMEOUT'))) {
      return false;
    }
    if (levelFilter === 'WARN' && !(e.type?.includes('ELECTED') || e.type?.includes('COORDINATOR') || e.type?.includes('PRIMARY') || e.type?.includes('LOCK'))) {
      return false;
    }
    if (levelFilter === 'INFO' && (e.type?.includes('RACE') || e.type?.includes('FAILED') || e.type?.includes('TIMEOUT'))) {
      return false;
    }

    // Search query matching
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      e.type?.toLowerCase().includes(q) ||
      e.message?.toLowerCase().includes(q) ||
      e.experiment?.toLowerCase().includes(q)
    );
  });

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getBadgeStyle = (type) => {
    if (type.includes('RACE') || type.includes('FAILED') || type.includes('TIMEOUT')) {
      return 'bg-red-950/40 text-red-400 border-red-800/40';
    }
    if (type.includes('ELECTED') || type.includes('COORDINATOR') || type.includes('PRIMARY')) {
      return 'bg-amber-950/40 text-amber-300 border-amber-800/40';
    }
    if (type.includes('COMPLETED') || type.includes('SUCCESS') || type.includes('ACK')) {
      return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40';
    }
    if (type.includes('RPC')) {
      return 'bg-indigo-950/40 text-indigo-300 border-indigo-800/40';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="dash-panel p-3.5 flex flex-col h-full bg-[#121a2f] border-[#1f2a44]" id="event-log-panel">
      {/* Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#1f2a44] gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider font-mono">
            System Event Console
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0b1020] text-slate-400 border border-[#1f2a44]">
            {filteredEvents.length} logs
          </span>
        </div>

        {/* Filter Chips & Search Input */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-[#0b1020] p-0.5 rounded-lg border border-[#1f2a44]">
            {['ALL', 'INFO', 'WARN', 'ERROR'].map((chip) => (
              <button
                key={chip}
                onClick={() => setLevelFilter(chip)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                  levelFilter === chip
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#151e32]'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[#0b1020] border border-[#1f2a44] text-xs px-2.5 py-1 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-32 sm:w-44 font-mono"
            />
          </div>
          {onClear && (
            <button
              onClick={onClear}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors border border-[#1f2a44]"
              title="Clear event log"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Structured Technical Table / Console */}
      <div className="overflow-y-auto mt-2 font-mono text-[11px]" style={{ maxHeight }}>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-6 text-slate-500 italic font-sans text-xs">
            No events recorded. Trigger any transaction or experiment above to stream live events.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '85px' }}>TIME</th>
                <th style={{ width: '130px' }}>EVENT TYPE</th>
                <th>MESSAGE</th>
                <th style={{ width: '30px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => {
                const isExpanded = expandedId === ev.id;
                return (
                  <React.Fragment key={ev.id}>
                    <tr
                      onClick={() => toggleExpand(ev.id)}
                      className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="text-slate-400 whitespace-nowrap">{ev.time}</td>
                      <td>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getBadgeStyle(
                            ev.type
                          )}`}
                        >
                          {ev.type}
                        </span>
                      </td>
                      <td className="text-slate-200 font-sans text-xs">{ev.message}</td>
                      <td className="text-right text-slate-500">
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 inline" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 inline" />
                        )}
                      </td>
                    </tr>
                    {isExpanded && ev.data && Object.keys(ev.data).length > 0 && (
                      <tr>
                        <td colSpan={4} className="bg-[#0b101d] p-2.5 border-b border-slate-800">
                          <div className="text-[11px] text-emerald-400 overflow-x-auto">
                            <span className="text-slate-500 block mb-1 font-sans text-[10px] uppercase font-bold">
                              Payload Inspector:
                            </span>
                            <pre className="font-mono bg-[#090d16] p-2 rounded border border-slate-800">
                              {JSON.stringify(ev.data, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
