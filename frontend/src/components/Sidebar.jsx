import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Layers,
  Radio,
  Cpu,
  Clock,
  Crown,
  Database,
  Scale,
  ShieldAlert,
  Terminal,
  Server,
  Activity,
  Menu,
  X,
} from 'lucide-react';

export function Sidebar({ connected = false, aliveCount = 5, totalCount = 5, onOpenConsole }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Overview', icon: Layers, isOverview: true },
    { to: '/rpc', label: '01  RPC', icon: Radio },
    { to: '/threads', label: '02  Concurrency', icon: Cpu },
    { to: '/clock', label: '03  Clock Sync', icon: Clock },
    { to: '/election', label: '04  Leader Election', icon: Crown },
    { to: '/replication', label: '05  Replication', icon: Database },
    { to: '/load', label: '06  Load Balancing', icon: Scale },
    { to: '/failover', label: '07  Fault Tolerance', icon: ShieldAlert },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full font-sans select-none">
      <div>
        {/* App Title Header */}
        <div className="p-4 border-b border-[#1f2a44] flex items-center justify-between">
          <div>
            <div className="text-base font-extrabold text-indigo-400 tracking-tight font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block"></span>
              DC LAB
            </div>
            <div className="text-[11px] text-slate-400 font-sans font-medium mt-0.5">
              Distributed Bank Simulator
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="p-3 space-y-3">
          {/* Overview Link */}
          <NavLink
            to="/"
            end
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-[#151e32]'
              }`
            }
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Overview</span>
          </NavLink>

          {/* Experiments Section */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">
              EXPERIMENTS
            </div>
            <div className="space-y-1">
              {navItems.slice(1).map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-bold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-[#131b2e] font-medium'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* System Console Section */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] uppercase font-mono tracking-widest text-slate-500 font-bold">
              SYSTEM
            </div>
            <button
              onClick={() => {
                setMobileOpen(false);
                onOpenConsole();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200 hover:bg-[#131b2e] font-medium transition-all text-left"
            >
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Event Console</span>
            </button>
          </div>
        </div>
      </div>

      {/* Persistent Footer Cluster Telemetry */}
      <div className="p-3.5 border-t border-[#1f2a44] bg-[#090e1a] text-[11px] font-mono space-y-2">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            Cluster Nodes
          </span>
          <span className="text-emerald-400 font-bold">
            {aliveCount}/{totalCount} Active
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            WebSocket IPC
          </span>
          <span className="flex items-center font-bold">
            <span className="relative flex h-2 w-2 mr-1.5">
              {connected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </span>
            <span className={connected ? 'text-emerald-400' : 'text-red-400'}>
              {connected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Topbar Toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#0d1322] border-b border-[#1f2a44] px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-2 text-indigo-400 font-mono font-bold text-sm">
          <span className="w-2 h-2 rounded-sm bg-indigo-500"></span>
          DC LAB SIMULATOR
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-300 hover:text-white bg-[#131b2e] rounded-lg border border-[#1f2a44]"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-[260px] bg-[#0d1322] h-full border-r border-[#1f2a44]"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-[260px] bg-[#0d1322] border-r border-[#1f2a44] shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>
    </>
  );
}

