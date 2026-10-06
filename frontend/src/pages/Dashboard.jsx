import React from 'react';
import { Link } from 'react-router-dom';
import { NodeCard } from '../components/NodeCard';
import { StatusBadge } from '../components/StatusBadge';
import { EventLog } from '../components/EventLog';
import { SimulationControls } from '../components/SimulationControls';
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
  CheckCircle2,
  Users,
  Wallet,
  ArrowRight,
  Power,
} from 'lucide-react';

export function Dashboard({ sim }) {
  const {
    clusterState,
    displayedEvents,
    isPlaying,
    speed,
    eventQueue,
    play,
    pause,
    step,
    reset,
    clearLog,
    setSpeed,
    toggleNodeLiveness,
  } = sim;

  const nodes = clusterState?.nodes || [];
  const aliveNodes = nodes.filter((n) => n.alive);
  const primaryNode = nodes.find((n) => n.id === clusterState?.primaryId);
  const primaryAccounts = primaryNode?.accounts || nodes[0]?.accounts || {};

  const experiments = [
    {
      id: 'rpc',
      title: '1. Remote Procedure Call (RPC)',
      desc: 'Client stub parameter marshalling to server skeleton on Node 1.',
      icon: Radio,
      path: '/rpc',
      badge: 'RPC Protocol',
    },
    {
      id: 'threads',
      title: '2. Multithreading & Mutex',
      desc: 'Simulated race conditions on concurrent balance writes vs mutex locks.',
      icon: Cpu,
      path: '/threads',
      badge: 'Concurrency',
    },
    {
      id: 'clock',
      title: '3. Clock Synchronization',
      desc: 'Cristian time-server RTT, Berkeley master averaging, and Lamport causality.',
      icon: Clock,
      path: '/clock',
      badge: 'Clocks',
    },
    {
      id: 'election',
      title: '4. Leader Election',
      desc: 'Bully priority hierarchy and Ring token circulation on coordinator crash.',
      icon: Crown,
      path: '/election',
      badge: 'Consensus',
    },
    {
      id: 'replication',
      title: '5. Consistency & Replication',
      desc: 'Strong synchronous consistency vs Eventual asynchronous propagation with stale reads.',
      icon: Database,
      path: '/replication',
      badge: 'Replication',
    },
    {
      id: 'load',
      title: '6. Load Balancing',
      desc: 'Request routing with Round Robin, Least Connections, and Weighted RR.',
      icon: Scale,
      path: '/load',
      badge: 'Balancing',
    },
    {
      id: 'failover',
      title: '7. Fault Tolerance',
      desc: 'Primary-Backup heartbeat monitoring, crash detection, and epoch failover.',
      icon: ShieldAlert,
      path: '/failover',
      badge: 'High Availability',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="dash-panel p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Nodes</span>
            <Server className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-100">{nodes.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Single-cluster simulation</div>
        </div>

        <div className="dash-panel p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Active Cluster Nodes</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {aliveNodes.length} / {nodes.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {nodes.length - aliveNodes.length === 0 ? 'All nodes healthy' : `${nodes.length - aliveNodes.length} node(s) crashed`}
          </div>
        </div>

        <div className="dash-panel p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Coordinator</span>
            <Crown className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-300">
            Node {clusterState?.coordinatorId ?? 5}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Highest priority alive node</div>
        </div>

        <div className="dash-panel p-3.5">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Primary Server</span>
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-blue-400">
            Node {clusterState?.primaryId ?? 1}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Epoch: <span className="font-mono text-slate-200">e{clusterState?.epoch ?? 1}</span>
          </div>
        </div>
      </div>

      {/* Simulation Controls */}
      <SimulationControls
        isPlaying={isPlaying}
        onPlay={play}
        onPause={pause}
        onStep={step}
        onReset={reset}
        speed={speed}
        onSpeedChange={setSpeed}
        queueLength={eventQueue.length}
      />

      {/* Main Two-Column Layout: Node Status Table + Bank Accounts Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Node Status Table (2 cols on lg) */}
        <div className="lg:col-span-2 dash-panel p-3.5">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b]">
            <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-blue-400" />
              Node Cluster Telemetry
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">5 Simulation Nodes</span>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NODE</th>
                  <th>ROLE</th>
                  <th>STATUS</th>
                  <th>CLOCK SKEW</th>
                  <th>LOAD</th>
                  <th>ACTIVE CONN</th>
                  <th className="text-right">CONTROL</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <tr key={node.id}>
                    <td className="font-medium text-slate-200">
                      <span className="font-mono font-bold text-slate-100">N{node.id}</span>
                      <span className="text-slate-400 text-[11px] ml-1.5 hidden sm:inline">
                        ({node.name})
                      </span>
                    </td>
                    <td>
                      <StatusBadge role={node.role} isAlive={node.alive} />
                    </td>
                    <td>
                      <span className={`text-[11px] font-mono ${node.alive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {node.alive ? 'ONLINE' : 'DOWN'}
                      </span>
                    </td>
                    <td className="font-mono text-slate-300">
                      {node.clockOffset > 0 ? `+${node.clockOffset}` : node.clockOffset}s
                    </td>
                    <td className="font-mono text-amber-400">
                      {node.load || 0}%
                    </td>
                    <td className="font-mono text-slate-300">
                      {node.activeConnections || 0} / {node.capacity || 10}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => toggleNodeLiveness(node.id, node.alive)}
                        className={`text-[11px] px-2 py-0.5 rounded font-mono transition-colors ${
                          node.alive
                            ? 'bg-red-950/20 text-red-400 hover:bg-red-900/30 border border-red-800/30'
                            : 'bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30 border border-emerald-800/30'
                        }`}
                        title={node.alive ? `Crash Node ${node.id}` : `Recover Node ${node.id}`}
                      >
                        {node.alive ? 'Kill' : 'Recover'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bank Accounts Section (Clean Table) */}
        <div className="dash-panel p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b]">
              <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                Bank Accounts Ledger
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Primary Node 1</span>
            </div>

            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ACCOUNT</th>
                    <th>CUSTOMER</th>
                    <th className="text-right">BALANCE</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(primaryAccounts).map(([accId, acc]) => (
                    <tr key={accId}>
                      <td className="font-mono font-medium text-blue-400">{accId}</td>
                      <td className="text-slate-300">{acc.name}</td>
                      <td className="font-mono font-bold text-right text-emerald-400">
                        ₹{acc.balance}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#1e293b] text-[11px] text-slate-500 font-sans">
            In-memory state replicated per node. Used across all 7 experiments.
          </div>
        </div>
      </div>

      {/* 7 Experiments Grid */}
      <div className="dash-panel p-3.5">
        <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider mb-3">
          Distributed Systems Experiments
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {experiments.map((exp) => {
            const Icon = exp.icon;
            return (
              <Link
                key={exp.id}
                to={exp.path}
                className="p-3 rounded-md bg-[#0f172a] hover:bg-[#18233c] border border-[#1e293b] hover:border-blue-500/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {exp.badge}
                    </span>
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                  <h4 className="font-semibold text-xs text-slate-200 group-hover:text-blue-300 transition-colors">
                    {exp.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {exp.desc}
                  </p>
                </div>
                <div className="mt-2.5 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-blue-400">
                  <span>Open</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Event Console */}
      <EventLog events={displayedEvents} onClear={clearLog} />
    </div>
  );
}
