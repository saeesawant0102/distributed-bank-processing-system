import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExperimentDescription } from '../../components/ExperimentDescription';
import { SimulationControls } from '../../components/SimulationControls';
import { EventLog } from '../../components/EventLog';
import { ResultBanner } from '../../components/ResultBanner';
import { Clock, Zap, Share2, Layers } from 'lucide-react';

export function ClockExperiment({ sim }) {
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
    refreshState,
  } = sim;

  const [activeTab, setActiveTab] = useState('berkeley'); // 'cristian' | 'berkeley' | 'lamport'
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const nodes = (clusterState?.nodes || []).slice(0, 4);

  const handleSync = async () => {
    setLoading(true);
    setSyncResult(null);
    try {
      const res = await api.syncClock({
        algorithm: activeTab,
        timeServerId: 1,
        clientId: 3,
        rtt: 200,
      });
      setSyncResult(res);
      refreshState();
    } catch (err) {
      console.error('Clock sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ExperimentDescription
        title="Experiment 3: Clock Synchronization"
        concept="Physical computer clocks drift due to quartz oscillator thermal variance. Cristian's algorithm uses a central authoritative time server with RTT/2 latency compensation. Berkeley algorithm uses an elected master that polls nodes, averages offsets, and distributes adjustments without requiring external UTC sources. Lamport logical clocks order distributed events causally without physical clocks using L = max(L, L_msg) + 1."
        scenario="Nodes 1 to 4 record distributed bank transactions. Without synchronization, an audit record on Node 1 at 10:00:05 appears after a transfer recorded at 10:00:12 on Node 2, inverting the apparent order of operations in the audit log."
        viva={[
          {
            q: "How does Cristian's algorithm estimate one-way network latency?",
            a: "It measures round-trip time (RTT = T1 - T0) and assumes symmetric delay, calculating the new clock as Ts + RTT/2 with error bounded by ±RTT/2.",
          },
          {
            q: "Why is Berkeley algorithm suitable for isolated local networks?",
            a: "Berkeley does not rely on an external authoritative time server; it establishes an internal consensus by averaging all clocks in the group.",
          },
          {
            q: "What is the update rule for Lamport logical timestamps?",
            a: "For local events or sends: L = L + 1. For receiving a message with attached timestamp L_msg: L = max(L_local, L_msg) + 1.",
          },
        ]}
      />

      {/* Outcome Banner */}
      {syncResult && (
        <ResultBanner
          type="success"
          title={`Clock Synchronization Completed (${activeTab.toUpperCase()})`}
          description={
            activeTab === 'berkeley'
              ? `Master Node 1 calculated average cluster offset: ${syncResult.averageOffset >= 0 ? '+' : ''}${syncResult.averageOffset}s. All node clocks adjusted to common baseline.`
              : activeTab === 'cristian'
              ? `Client Node 3 synchronized with Time Server Node 1. Measured RTT: ${syncResult.rtt}ms. Estimated delay: ${syncResult.rtt / 2}ms.`
              : 'Lamport logical clock sequence verified causal event ordering across nodes.'
          }
          details={
            activeTab === 'berkeley' && syncResult.adjustments
              ? syncResult.adjustments.map((a) => `Node ${a.nodeId}: adj ${a.adjustment >= 0 ? '+' : ''}${a.adjustment}s (Offset: ${a.newOffset}s)`).join(' | ')
              : null
          }
        />
      )}

      {/* Clean Algorithm Selection Tabs */}
      <div className="flex border-b border-[#1e293b] gap-2 font-mono text-xs">
        {[
          { id: 'berkeley', label: 'Berkeley Algorithm (Master Averaging)' },
          { id: 'cristian', label: "Cristian's Algorithm (Time Server + RTT/2)" },
          { id: 'lamport', label: 'Lamport Logical Clocks (Causal Ordering)' },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}-btn`}
            onClick={() => {
              setActiveTab(tab.id);
              setSyncResult(null);
            }}
            className={`pb-2.5 px-3 font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Node Clock Status Table */}
      <div className="dash-panel p-3.5">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b]">
          <h4 className="font-semibold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Cluster Node Clocks (Nodes 1–4)
          </h4>
          <span className="text-[11px] font-mono text-slate-400">Reference: 10:00:00</span>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>NODE</th>
                <th>SIMULATED TIME</th>
                <th>CLOCK SKEW</th>
                <th>LAMPORT (L)</th>
                <th>ROLE IN ALGORITHM</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => {
                const baseHours = 10;
                const baseMins = 0;
                const offsetSec = node.clockOffset || 0;
                const displaySec = (60 + offsetSec) % 60;
                const timeString = `${baseHours}:${String(baseMins).padStart(2, '0')}:${String(
                  displaySec
                ).padStart(2, '0')}`;

                return (
                  <tr key={node.id}>
                    <td className="font-medium font-mono text-slate-200">
                      N{node.id} ({node.name})
                    </td>
                    <td className="font-mono font-bold text-slate-100">
                      {timeString}
                    </td>
                    <td className="font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                          offsetSec === 0
                            ? 'text-emerald-400 bg-emerald-950/30'
                            : offsetSec > 0
                            ? 'text-amber-400 bg-amber-950/30'
                            : 'text-blue-400 bg-blue-950/30'
                        }`}
                      >
                        {offsetSec > 0 ? `+${offsetSec}` : offsetSec}s
                      </span>
                    </td>
                    <td className="font-mono font-semibold text-purple-400">
                      {node.lamport || 0}
                    </td>
                    <td className="text-[11px] text-slate-300">
                      {activeTab === 'cristian' && node.id === 1 && (
                        <span className="text-blue-400 font-mono font-semibold">Authoritative Time Server</span>
                      )}
                      {activeTab === 'cristian' && node.id === 3 && (
                        <span className="text-purple-400 font-mono font-semibold">Client (Synchronizing)</span>
                      )}
                      {activeTab === 'cristian' && node.id !== 1 && node.id !== 3 && 'Idle Peer'}

                      {activeTab === 'berkeley' && node.id === 1 && (
                        <span className="text-blue-400 font-mono font-semibold">Elected Master</span>
                      )}
                      {activeTab === 'berkeley' && node.id !== 1 && 'Polled Peer'}

                      {activeTab === 'lamport' && 'Message Participant'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Algorithm Specific Details & Math */}
      <div className="dash-panel p-3.5">
        {activeTab === 'cristian' && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Cristian's Algorithm Calculations
            </h4>
            <div className="p-3 rounded bg-[#0b101d] border border-[#1e293b] font-mono text-xs space-y-1.5">
              <div>
                Formula: <span className="text-blue-400 font-bold">newTime = Ts + (T1 - T0) / 2</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                • T0 = Client request timestamp (100 ms) | Ts = Server authoritative timestamp (1000 ms)
              </div>
              <div className="text-slate-400 text-[11px]">
                • T1 = Client response receive timestamp (300 ms) | Round-Trip Time (RTT) = 200 ms
              </div>
              <div className="text-emerald-400 text-[11px]">
                • Calculated newTime = 1100 ms | Error bound ≤ ±100 ms
              </div>
            </div>
          </div>
        )}

        {activeTab === 'berkeley' && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5" /> Berkeley Master-Slave Averaging
            </h4>
            <div className="p-3 rounded bg-[#0b101d] border border-[#1e293b] font-mono text-xs space-y-1.5">
              <div className="text-slate-300">
                1. Master polls Nodes 1–4: Relative offsets gathered = [0s, +7s, -8s, +3s]
              </div>
              <div className="text-slate-300">
                2. Average offset = (0 + 7 - 8 + 3) / 4 = <span className="text-amber-400 font-bold">+0.5s</span>
              </div>
              <div className="text-slate-300">
                3. Dispatched adjustments: Node 1 (+0.5s), Node 2 (-6.5s), Node 3 (+8.5s), Node 4 (-2.5s)
              </div>
              <div className="text-emerald-400 text-[11px]">
                Result: All node clocks converge to the exact same average time without external time reference.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lamport' && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Lamport Logical Clock Sequence
            </h4>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>STEP</th>
                    <th>NODE</th>
                    <th>EVENT TYPE</th>
                    <th>DESCRIPTION</th>
                    <th className="text-right">LOGICAL CLOCK (L)</th>
                  </tr>
                </thead>
                <tbody>
                  {syncResult?.history?.map((stepItem, idx) => (
                    <tr key={idx}>
                      <td className="font-mono text-slate-400">#{idx + 1}</td>
                      <td className="font-mono text-blue-400">Node {stepItem.nodeId}</td>
                      <td>
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 font-mono">
                          {stepItem.type}
                        </span>
                      </td>
                      <td className="text-slate-300">{stepItem.desc}</td>
                      <td className="font-mono font-bold text-right text-purple-400">
                        {stepItem.clock}
                      </td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-slate-500 italic font-sans">
                        Click 'Execute Synchronization' below to step through causal Lamport events.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-3 pt-2 border-t border-[#1e293b]">
          <button
            id="run-clock-sync-btn"
            onClick={handleSync}
            disabled={loading}
            className="btn-primary py-1.5 px-4 text-xs"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{loading ? 'Synchronizing...' : `Execute ${activeTab.toUpperCase()} Synchronization`}</span>
          </button>
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

      {/* Event Console */}
      <EventLog events={displayedEvents} onClear={clearLog} />
    </div>
  );
}
