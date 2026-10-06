import React from 'react';

export function StatusBadge({ status, role, isAlive = true }) {
  if (!isAlive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-red-950/40 text-red-400 border border-red-800/40 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        FAILED
      </span>
    );
  }

  const roleText = (role || status || 'ACTIVE').toUpperCase();

  switch (roleText) {
    case 'COORDINATOR':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-950/40 text-purple-300 border border-purple-700/40 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          COORDINATOR
        </span>
      );
    case 'PRIMARY':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-950/40 text-blue-300 border border-blue-700/40 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          PRIMARY
        </span>
      );
    case 'BACKUP':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/70 text-slate-300 border border-slate-700 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          BACKUP
        </span>
      );
    case 'REPLICA':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-cyan-950/30 text-cyan-300 border border-cyan-800/40 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          REPLICA
        </span>
      );
    case 'STALE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/40 text-amber-300 border border-amber-700/40 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          STALE
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-950/30 text-emerald-300 border border-emerald-800/40 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          ACTIVE
        </span>
      );
  }
}
