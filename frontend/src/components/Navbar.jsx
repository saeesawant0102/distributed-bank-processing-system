import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Landmark,
  Radio,
  Cpu,
  Clock,
  Crown,
  Database,
  Scale,
  ShieldAlert,
  RotateCcw,
  Activity,
  Layers,
} from 'lucide-react';

export function Navbar({ connected = false, nodes = [], onReset }) {
  const aliveCount = nodes.filter((n) => n.alive).length;
  const totalCount = nodes.length || 5;

  const navItems = [
    { to: '/', label: 'Overview', icon: Layers },
    { to: '/rpc', label: '1. RPC', icon: Radio },
    { to: '/threads', label: '2. Multithreading', icon: Cpu },
    { to: '/clock', label: '3. Clock Sync', icon: Clock },
    { to: '/election', label: '4. Leader Election', icon: Crown },
    { to: '/replication', label: '5. Replication', icon: Database },
    { to: '/load', label: '6. Load Balancing', icon: Scale },
    { to: '/failover', label: '7. Fault Tolerance', icon: ShieldAlert },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0d1322] border-b border-[#1e293b]">
      {/* Top Application Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand & Lab Tag */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-slate-100">
                Distributed Bank Processing System
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-medium">
                DC LAB
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2">
              <span>SPIT SEM-5 Lab Simulator</span>
              <span>•</span>
              <span className="font-mono text-slate-500">Node Cluster: 5 Nodes</span>
            </div>
          </div>
        </div>

        {/* System Telemetry & Cluster State */}
        <div className="flex items-center gap-2.5 text-xs">
          {/* WS Status */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#131b2e] border border-[#222f49] text-[11px] font-mono text-slate-300">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
            <span className="text-slate-400">Status:</span>
            <span className={connected ? 'text-emerald-400 font-medium' : 'text-red-400 font-medium'}>
              {connected ? 'Cluster Running' : 'Offline'}
            </span>
          </div>

          {/* Active Nodes Count */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#131b2e] border border-[#222f49] text-[11px] font-mono text-slate-300">
            <span className="text-slate-400">Nodes:</span>
            <span className="text-blue-400 font-semibold">{aliveCount} / {totalCount} Active</span>
          </div>

          {/* Global Reset */}
          {onReset && (
            <button
              onClick={onReset}
              className="p-1.5 rounded bg-[#131b2e] hover:bg-[#1a253e] border border-[#222f49] text-slate-400 hover:text-red-400 transition-colors"
              title="Reset Simulation Cluster to Defaults"
              id="global-reset-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-t border-[#1a2438] bg-[#0b101d]">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all ${
                    isActive
                      ? 'border-blue-500 text-blue-400 bg-blue-500/5 font-semibold'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </header>
  );
}
