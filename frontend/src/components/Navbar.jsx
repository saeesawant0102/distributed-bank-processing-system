import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Beaker,
  Layers,
  Radio,
  Cpu,
  Clock,
  Crown,
  Database,
  Scale,
  ShieldAlert,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

export function Navbar({ connected = false, nodes = [], coordinatorId = 5, primaryId = 1, epoch = 1, onReset }) {
  const aliveCount = nodes.filter((n) => n.alive).length;
  const totalCount = nodes.length || 5;

  const navItems = [
    { to: '/', label: 'Overview', icon: Layers },
    { to: '/rpc', label: '01. RPC Protocol', icon: Radio },
    { to: '/threads', label: '02. Multithreading', icon: Cpu },
    { to: '/clock', label: '03. Clock Sync', icon: Clock },
    { to: '/election', label: '04. Leader Election', icon: Crown },
    { to: '/replication', label: '05. Data Replication', icon: Database },
    { to: '/load', label: '06. Load Balancing', icon: Scale },
    { to: '/failover', label: '07. Fault Tolerance', icon: ShieldAlert },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0b101d] border-b border-[#1c273c] shadow-lg font-sans">
      {/* Top Application Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand & Project Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Beaker className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-slate-100 tracking-tight">
                Distributed Bank Processing System
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/40 font-bold">
                DC Lab Simulator
              </span>
            </div>
            <div className="text-xs text-slate-400 font-mono hidden sm:block">
              SPIT SEM-5 Project • Interactive Distributed Systems Simulation
            </div>
          </div>
        </div>

        {/* Telemetry Status Pills & Actions */}
        <div className="flex items-center gap-2.5 text-xs font-mono">
          {/* WS Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#080c14] border border-[#1c273c] text-slate-300">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span className="text-slate-400 hidden sm:inline">Status:</span>
            <span className={connected ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
              {connected ? 'Running' : 'Offline'}
            </span>
          </div>

          {/* Active Nodes */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080c14] border border-[#1c273c] text-slate-300">
            <span className="text-slate-400">Nodes:</span>
            <span className="text-blue-400 font-bold">{aliveCount}/{totalCount} Active</span>
          </div>

          {/* Coordinator */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080c14] border border-[#1c273c] text-slate-300">
            <Crown className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-slate-400">Coord:</span>
            <span className="text-purple-300 font-bold">N{coordinatorId}</span>
          </div>

          {/* Primary */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#080c14] border border-[#1c273c] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Primary:</span>
            <span className="text-emerald-400 font-bold">N{primaryId} (e{epoch})</span>
          </div>

          {/* Global Reset */}
          {onReset && (
            <button
              onClick={onReset}
              className="btn-secondary py-1.5 px-3 text-xs text-slate-200 hover:text-red-400 border-[#273654]"
              title="Reset Simulation Cluster to Defaults"
              id="global-navbar-reset-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Cluster</span>
            </button>
          )}
        </div>
      </div>

      {/* Horizontal Navigation Tab Bar */}
      <div className="border-t border-[#1c273c] bg-[#080c14]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-300 border border-blue-500/40 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121b2d] font-medium'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5 text-slate-400" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </header>
  );
}
