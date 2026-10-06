import React, { useState } from 'react';
import { Terminal, Trash2, Search, ChevronRight, ChevronDown } from 'lucide-react';

export function EventLog({ events = [], onClear, maxHeight = '280px' }) {
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const filteredEvents = events.filter((e) => {
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
      return 'bg-purple-950/40 text-purple-300 border-purple-800/40';
    }
    if (type.includes('COMPLETED') || type.includes('SUCCESS') || type.includes('ACK')) {
      return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40';
    }
    if (type.includes('RPC')) {
      return 'bg-blue-950/40 text-blue-300 border-blue-800/40';
    }
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <div className="dash-panel p-3 flex flex-col h-full" id="event-log-panel">
      {/* Console Header */}
      <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
            System Event Console
          </h3>
          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-800/70 text-slate-400">
            {events.length} logs
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search events..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[#0b101d] border border-[#222f49] text-xs px-2 py-1 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-36 sm:w-48 font-mono"
            />
          </div>
          {onClear && (
            <button
              onClick={onClear}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
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
