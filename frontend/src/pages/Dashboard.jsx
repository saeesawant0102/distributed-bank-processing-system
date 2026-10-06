import React from 'react';
import { Link } from 'react-router-dom';
import {
  Radio,
  Cpu,
  Clock,
  Crown,
  Database,
  Scale,
  ShieldAlert,
  Server,
  Activity,
  ArrowRight,
  ShieldCheck,
  Power,
  RefreshCw,
} from 'lucide-react';

export function Dashboard({ sim }) {
  const { clusterState, toggleNodeLiveness } = sim;

  const nodes = clusterState?.nodes || [];
  const aliveNodes = nodes.filter((n) => n.alive);
  const coordinatorId = clusterState?.coordinatorId ?? 5;
  const primaryId = clusterState?.primaryId ?? 1;

  const experiments = [
    {
      number: '01',
      id: 'rpc',
      name: 'RPC',
      desc: 'Remote Procedure Call Sequence & Latency',
      icon: Radio,
      path: '/rpc',
    },
    {
      number: '02',
      id: 'threads',
      name: 'Concurrency',
      desc: 'Multithreading Race Conditions & Mutex Locks',
      icon: Cpu,
      path: '/threads',
    },
    {
      number: '03',
      id: 'clock',
      name: 'Clock Sync',
      desc: 'Cristian, Berkeley & Lamport Logical Clocks',
      icon: Clock,
      path: '/clock',
    },
    {
      number: '04',
      id: 'election',
      name: 'Leader Election',
      desc: 'Bully & Ring Election Consensus',
      icon: Crown,
      path: '/election',
    },
    {
      number: '05',
      id: 'replication',
      name: 'Replication',
      desc: 'Strong vs Eventual Data Consistency',
      icon: Database,
      path: '/replication',
    },
    {
      number: '06',
      id: 'load',
      name: 'Load Balancing',
      desc: 'Traffic Routing & Load Distribution',
      icon: Scale,
      path: '/load',
    },
    {
      number: '07',
      id: 'failover',
      name: 'Fault Tolerance',
      desc: 'Primary-Backup Heartbeats & Automatic Failover',
      icon: ShieldAlert,
      path: '/failover',
    },
  ];

  // Pentagon node coordinates for SVG graph
  const nodePositions = {
    1: { x: 250, y: 55 },   // Top
    2: { x: 380, y: 140 },  // Top-Right
    3: { x: 330, y: 270 },  // Bottom-Right
    4: { x: 170, y: 270 },  // Bottom-Left
    5: { x: 120, y: 140 },  // Top-Left
  };

  const edges = [
    [1, 2], [2, 3], [3, 4], [4, 5], [5, 1], // Pentagon perimeter
    [1, 3], [1, 4], [2, 4], [3, 5], [2, 5], // Pentagon chords
  ];

  return (
    <div className="space-y-6 font-sans max-w-7xl mx-auto pb-8">
      {/* 1. TOP HEADER & STAT CARDS */}
      <div className="space-y-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            Distributed Bank Transaction Processing System
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Interactive Distributed Computing Laboratory Simulator
          </p>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-4 rounded-xl bg-[#121a2f] border border-[#1f2a44] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-slate-400 text-[11px] block">TOTAL NODES</span>
              <span className="text-lg font-bold text-slate-100">{nodes.length || 5}</span>
            </div>
            <Server className="w-5 h-5 text-indigo-400 opacity-80" />
          </div>

          <div className="p-4 rounded-xl bg-[#121a2f] border border-[#1f2a44] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-slate-400 text-[11px] block">ACTIVE NODES</span>
              <span className="text-lg font-bold text-emerald-400">{aliveNodes.length} / 5</span>
            </div>
            <Activity className="w-5 h-5 text-emerald-400 opacity-80" />
          </div>

          <div className="p-4 rounded-xl bg-[#121a2f] border border-[#1f2a44] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-slate-400 text-[11px] block">COORDINATOR</span>
              <span className="text-lg font-bold text-amber-400">Node N{coordinatorId}</span>
            </div>
            <Crown className="w-5 h-5 text-amber-400 opacity-80" />
          </div>

          <div className="p-4 rounded-xl bg-[#121a2f] border border-[#1f2a44] flex items-center justify-between shadow-sm">
            <div>
              <span className="text-slate-400 text-[11px] block">PRIMARY LEAD</span>
              <span className="text-lg font-bold text-indigo-400">Node N{primaryId}</span>
            </div>
            <ShieldCheck className="w-5 h-5 text-indigo-400 opacity-80" />
          </div>
        </div>
      </div>

      {/* 2. CLUSTER NETWORK VISUAL GRAPH (SVG Pentagon with Animated Packets) */}
      <div className="dash-panel p-5 bg-[#121a2f] border-[#1f2a44]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1f2a44]">
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            Cluster Network Visual Graph (Interconnected Mesh Topology)
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/40 font-bold">
            PENTAGON MESH
          </span>
        </div>

        <div className="relative w-full h-[320px] bg-[#0b1020] rounded-xl border border-[#1f2a44] overflow-hidden flex items-center justify-center p-2">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 320" preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
              </linearGradient>
            </defs>

            {/* Render Mesh Edges */}
            {edges.map(([from, to], idx) => {
              const p1 = nodePositions[from];
              const p2 = nodePositions[to];
              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={p1.x}
                    y1={p1.y}
                    x2={p2.x}
                    y2={p2.y}
                    stroke="url(#edge-grad)"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  {/* Animated Message Packet Traveling Along Edge */}
                  <circle r="3" fill="#38bdf8">
                    <animateMotion
                      path={`M ${p1.x},${p1.y} L ${p2.x},${p2.y}`}
                      dur={`${2.5 + (idx % 3) * 0.8}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
              );
            })}

            {/* Render SVG Pentagon Node Circles & Badges */}
            {nodes.map((node) => {
              const pos = nodePositions[node.id] || { x: 250, y: 160 };
              const isCoordinator = node.id === coordinatorId && node.alive;
              const isPrimary = node.id === primaryId && node.alive;

              return (
                <g key={`svg-node-${node.id}`} transform={`translate(${pos.x}, ${pos.y})`}>
                  {/* Outer aura */}
                  <circle
                    r="26"
                    className={`transition-all ${
                      !node.alive
                        ? 'fill-red-950/40 stroke-red-600/60'
                        : isCoordinator
                        ? 'fill-amber-950/40 stroke-amber-400'
                        : isPrimary
                        ? 'fill-indigo-950/40 stroke-indigo-400'
                        : 'fill-slate-900/80 stroke-indigo-600/40'
                    }`}
                    strokeWidth="2"
                  />

                  {/* Inner circle */}
                  <circle
                    r="20"
                    fill={node.alive ? '#121a2f' : '#1c0f14'}
                  />

                  {/* Node Label Text */}
                  <text
                    textAnchor="middle"
                    dy="4"
                    fill={node.alive ? '#f8fafc' : '#f87171'}
                    className="font-mono font-bold text-[12px]"
                  >
                    N{node.id}
                  </text>

                  {/* Role Indicator Icon Above Node */}
                  {isCoordinator && (
                    <g transform="translate(0, -34)">
                      <circle r="9" fill="#78350f" stroke="#f59e0b" strokeWidth="1" />
                      <text textAnchor="middle" dy="3.5" fill="#fef3c7" className="text-[10px] font-bold">👑</text>
                    </g>
                  )}
                  {isPrimary && !isCoordinator && (
                    <g transform="translate(0, -34)">
                      <circle r="9" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" />
                      <text textAnchor="middle" dy="3.5" fill="#e0e7ff" className="text-[10px] font-bold">🛡️</text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 3. NODE CARDS RESPONSIVE GRID */}
      <div className="dash-panel p-5 bg-[#121a2f] border-[#1f2a44]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1f2a44]">
          <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider font-mono">
            Cluster Nodes Telemetry & Control
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Interactive Liveness Control</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {nodes.map((node) => {
            const isCoordinator = node.id === coordinatorId && node.alive;
            const isPrimary = node.id === primaryId && node.alive;

            return (
              <div
                key={node.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  !node.alive
                    ? 'bg-red-950/15 border-red-900/50 text-red-300'
                    : isCoordinator
                    ? 'bg-[#1a172e] border-amber-500/60 shadow-md shadow-amber-950/30'
                    : isPrimary
                    ? 'bg-[#141b36] border-indigo-500/60 shadow-md shadow-indigo-950/30'
                    : 'bg-[#0e1526] border-[#1f2a44]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1f2a44]">
                    <span className="font-mono font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      Node N{node.id}
                      {isCoordinator && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                      {isPrimary && !isCoordinator && <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        node.alive ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40' : 'bg-red-950/80 text-red-400 border border-red-800/40'
                      }`}
                    >
                      {node.alive ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-[11px] font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Role:</span>
                      <span className="font-bold text-slate-200">
                        {isCoordinator ? 'COORDINATOR' : isPrimary ? 'PRIMARY' : 'REPLICA'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Port:</span>
                      <span className="text-slate-300">500{node.id}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => toggleNodeLiveness(node.id, node.alive)}
                  className={`mt-4 w-full py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                    node.alive
                      ? 'btn-danger'
                      : 'btn-success'
                  }`}
                >
                  {node.alive ? (
                    <>
                      <Power className="w-3.5 h-3.5" />
                      <span>Kill Node</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Revive Node</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SIMULATION EXPERIMENTS GRID */}
      <div className="dash-panel p-5 bg-[#121a2f] border-[#1f2a44]">
        <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider font-mono mb-4">
          Simulation Experiments
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {experiments.map((exp) => {
            const Icon = exp.icon;
            return (
              <div
                key={exp.id}
                className="p-4 rounded-xl bg-[#0e1526] border border-[#1f2a44] hover:border-indigo-500/60 transition-all flex flex-col justify-between group shadow-sm hover:shadow-indigo-950/20"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/40">
                      {exp.number}
                    </span>
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-100 group-hover:text-indigo-300 transition-colors mt-1">
                    {exp.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 font-sans line-clamp-2">
                    {exp.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1f2a44] flex justify-end">
                  <Link
                    to={exp.path}
                    className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 group-hover:translate-x-1 transition-all"
                  >
                    <span>Open Experiment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

