import React from 'react';
import { StatusBadge } from './StatusBadge';
import { Power, Cpu } from 'lucide-react';

export function NodeCard({ node, onToggleLiveness, highlight = false, isStale = false }) {
  if (!node) return null;

  const accounts = node.accounts ? Object.entries(node.accounts) : [];

  return (
    <div
      className={`dash-panel p-3 flex flex-col justify-between transition-all ${
        !node.alive
          ? 'opacity-60 border-red-900/50 bg-red-950/10'
          : highlight
          ? 'border-blue-500/80 bg-[#162137]'
          : isStale
          ? 'border-amber-500/80 bg-[#211d13]'
          : 'border-[#1e293b]'
      }`}
      id={`node-card-${node.id}`}
    >
      <div>
        {/* Node Identity & Role Badge */}
        <div className="flex items-center justify-between pb-2 border-b border-[#1e293b] mb-2">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <div>
              <h4 className="font-semibold text-xs text-slate-200 leading-none">{node.name}</h4>
              <span className="text-[10px] text-slate-500 font-mono">ID: {node.id}</span>
            </div>
          </div>
          <StatusBadge isAlive={node.alive} role={isStale ? 'STALE' : node.role} />
        </div>

        {/* Distributed Metrics Grid */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded bg-[#0b101d] border border-[#1e293b] text-[11px] mb-2">
          <div>
            <span className="text-slate-500 text-[10px] block">Clock Skew</span>
            <span className="font-mono text-slate-300 font-medium">
              {node.clockOffset > 0 ? `+${node.clockOffset}` : node.clockOffset}s
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">Lamport (L)</span>
            <span className="font-mono text-purple-400 font-medium">{node.lamport || 0}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">Connections</span>
            <span className="font-mono text-slate-300 font-medium">
              {node.activeConnections || 0}/{node.capacity || 10}
            </span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] block">Load</span>
            <span className="font-mono text-amber-400 font-medium">{node.load || 0}%</span>
          </div>
        </div>

        {/* Ledger Balances Summary */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase font-semibold">
            <span>Ledger</span>
            <span className="font-mono">v{accounts[0]?.[1]?.version || 1}</span>
          </div>
          {accounts.slice(0, 3).map(([accId, acc]) => (
            <div
              key={accId}
              className="flex items-center justify-between text-[11px] px-2 py-0.5 rounded bg-[#0f172a] border border-[#1e293b]/70 font-mono"
            >
              <span className="text-slate-400">{accId}:</span>
              <span className="text-emerald-400 font-medium">₹{acc.balance}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Liveness Toggle Action */}
      {onToggleLiveness && (
        <div className="mt-3 pt-2 border-t border-[#1e293b]">
          <button
            id={`toggle-node-${node.id}-btn`}
            onClick={() => onToggleLiveness(node.id, node.alive)}
            className={`w-full py-1 px-2 rounded text-[11px] font-medium flex items-center justify-center gap-1.5 transition-all ${
              node.alive
                ? 'bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-800/40'
                : 'bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
            }`}
          >
            <Power className="w-3 h-3" />
            {node.alive ? `Crash Node ${node.id}` : `Recover Node ${node.id}`}
          </button>
        </div>
      )}
    </div>
  );
}
