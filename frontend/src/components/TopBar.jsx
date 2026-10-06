import React from 'react';
import { RotateCcw, Crown, ShieldCheck } from 'lucide-react';

export function TopBar({ connected = false, nodes = [], coordinatorId = 5, primaryId = 1, epoch = 1, onReset }) {
  const aliveCount = nodes.filter((n) => n.alive).length;
  const totalCount = nodes.length || 5;

  return (
    <header className="h-14 bg-[#0b101d] border-b border-[#1c273c] px-6 flex items-center justify-between sticky top-0 z-20 font-sans">
      {/* Title & Context */}
      <div className="flex items-center gap-3">
        <span className="font-extrabold text-sm text-slate-100 tracking-tight">
          Distributed Bank Processing System
        </span>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/40 font-bold">
          Lab Simulator
        </span>
      </div>

      {/* Telemetry Pills & Reset */}
      <div className="flex items-center gap-3 text-xs font-mono">
        {/* WS Status */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#080c14] border border-[#1c273c] text-slate-300">
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-slate-400">IPC:</span>
          <span className={connected ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
            {connected ? 'Running' : 'Disconnected'}
          </span>
        </div>

        {/* Active Nodes */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#080c14] border border-[#1c273c] text-slate-300">
          <span className="text-slate-400">Nodes:</span>
          <span className="text-blue-400 font-bold">{aliveCount}/{totalCount}</span>
        </div>

        {/* Coordinator */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#080c14] border border-[#1c273c] text-slate-300">
          <Crown className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-400">Coord:</span>
          <span className="text-purple-300 font-bold">N{coordinatorId}</span>
        </div>

        {/* Primary */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#080c14] border border-[#1c273c] text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Primary:</span>
          <span className="text-emerald-400 font-bold">N{primaryId} (e{epoch})</span>
        </div>

        {/* Global Reset */}
        {onReset && (
          <button
            onClick={onReset}
            className="btn-secondary py-1 px-3 text-xs text-slate-300 hover:text-red-400 border-[#273654]"
            title="Reset Simulation Cluster to Defaults"
            id="global-cluster-reset-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Cluster</span>
          </button>
        )}
      </div>
    </header>
  );
}
