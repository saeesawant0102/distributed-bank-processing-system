import React from 'react';
import { Server, Crown, ShieldAlert, Zap, Power, Activity } from 'lucide-react';

export function NodeTopology({ nodes = [], coordinatorId = 5, primaryId = 1, epoch = 1, onToggleNode }) {
  // Positional coordinates for 5 nodes arranged in a clean pentagon layout
  const positions = [
    { id: 1, label: 'Node 1 (Primary)', cx: 200, cy: 60, role: 'Primary' },
    { id: 2, label: 'Node 2 (Replica 1)', cx: 340, cy: 150, role: 'Replica' },
    { id: 3, label: 'Node 3 (Replica 2)', cx: 290, cy: 290, role: 'Replica' },
    { id: 4, label: 'Node 4 (Peer)', cx: 110, cy: 290, role: 'Peer' },
    { id: 5, label: 'Node 5 (Coordinator)', cx: 60, cy: 150, role: 'Coordinator' },
  ];

  return (
    <div className="dash-panel p-4 relative overflow-hidden">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e293b]">
        <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          Cluster Network Topology (5-Node Mesh)
        </h3>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Alive
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-red-500" /> Crashed
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Crown className="w-3 h-3 text-purple-400" /> Coordinator (N{coordinatorId})
          </span>
        </div>
      </div>

      {/* SVG Network Lines + Node Cards Overlay */}
      <div className="relative w-full h-72 bg-[#090e1a] rounded-lg border border-[#1a2336] flex items-center justify-center">
        {/* SVG Mesh Connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 350" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {/* Interconnecting mesh lines between adjacent pentagon nodes */}
          <line x1="200" y1="60" x2="340" y2="150" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="340" y1="150" x2="290" y2="290" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="290" y1="290" x2="110" y2="290" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="110" y1="290" x2="60" y2="150" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="60" y1="150" x2="200" y2="60" stroke="url(#line-grad)" strokeWidth="1.5" strokeDasharray="4 4" />

          {/* Cross mesh lines to primary/coordinator */}
          <line x1="200" y1="60" x2="290" y2="290" stroke="#1e293b" strokeWidth="1" />
          <line x1="200" y1="60" x2="110" y2="290" stroke="#1e293b" strokeWidth="1" />
          <line x1="60" y1="150" x2="340" y2="150" stroke="#1e293b" strokeWidth="1" />
        </svg>

        {/* 5 Rendered Interactive Node Cards */}
        <div className="absolute inset-0 grid grid-cols-5 p-2 gap-2 items-center">
          {nodes.map((node) => {
            const isCoordinator = node.id === coordinatorId && node.alive;
            const isPrimary = node.id === primaryId && node.alive;

            return (
              <div
                key={node.id}
                className={`p-2.5 rounded-lg border flex flex-col justify-between transition-all backdrop-blur-sm z-10 ${
                  !node.alive
                    ? 'bg-red-950/20 border-red-800/40 opacity-70'
                    : isCoordinator
                    ? 'bg-purple-950/30 border-purple-500/80 shadow-[0_0_12px_rgba(168,85,247,0.25)]'
                    : isPrimary
                    ? 'bg-blue-950/30 border-blue-500/80 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                    : 'bg-[#0f172a]/90 border-[#1e293b]'
                }`}
              >
                <div>
                  {/* Node Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-slate-100 flex items-center gap-1">
                      N{node.id}
                      {isCoordinator && <Crown className="w-3 h-3 text-purple-400 fill-purple-400/20" />}
                      {isPrimary && <Zap className="w-3 h-3 text-blue-400 fill-blue-400/20" />}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        node.alive ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                      }`}
                    />
                  </div>

                  <div className="text-[10px] text-slate-400 font-sans truncate mb-1.5">
                    {node.name}
                  </div>

                  {/* Role Tag */}
                  <div className="mb-2">
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-semibold ${
                        !node.alive
                          ? 'bg-red-950/50 text-red-400 border border-red-800/30'
                          : isCoordinator
                          ? 'bg-purple-950/60 text-purple-300 border border-purple-700/50'
                          : isPrimary
                          ? 'bg-blue-950/60 text-blue-300 border border-blue-700/50'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                      }`}
                    >
                      {!node.alive ? 'OFFLINE' : isCoordinator ? 'COORDINATOR' : isPrimary ? 'PRIMARY' : 'REPLICA'}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="text-[10px] font-mono space-y-0.5 text-slate-400">
                    <div className="flex justify-between">
                      <span>Clock:</span>
                      <span className="text-slate-200">{node.clockOffset > 0 ? `+${node.clockOffset}` : node.clockOffset}s</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Load:</span>
                      <span className="text-amber-400">{node.load || 0}%</span>
                    </div>
                  </div>
                </div>

                {/* Kill / Recover Button */}
                {onToggleNode && (
                  <button
                    onClick={() => onToggleNode(node.id, node.alive)}
                    className={`mt-2 w-full py-1 rounded text-[10px] font-mono transition-colors ${
                      node.alive
                        ? 'bg-red-950/30 text-red-400 hover:bg-red-900/40 border border-red-800/40'
                        : 'bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/40 border border-emerald-800/40'
                    }`}
                  >
                    {node.alive ? 'Kill Node' : 'Recover'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
