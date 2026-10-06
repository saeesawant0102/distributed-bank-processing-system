import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExperimentHeader } from '../../components/ExperimentHeader';
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

  const clockEvents = displayedEvents.filter(
    (e) => e.experiment === 'clock' || e.type?.includes('CLOCK')
  );

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <ExperimentHeader
        number="03"
        title="CLOCK SYNC"
        subtitle="Clock Synchronization Algorithms Simulation"
        concept="Physical computer clock offset drift compensation and logical Lamport timestamp causality ordering."
        viva={[
          {
            q: "How does Cristian's algorithm calculate latency?",
            a: "It measures round-trip time (RTT = T1 - T0) and updates the clock as Ts + RTT/2.",
          },
        ]}
      />

      {/* LARGE SIMULATION CANVAS (60-70% Height) */}
      <div className="dash-panel p-5 bg-[#090e1a] border-blue-500/30 flex flex-col justify-between min-h-[380px]">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e293b]">
          <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            SIMULATION CANVAS — Cluster Node Clocks & Synchronization
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Baseline: 10:00:00</span>
        </div>

        {/* Algorithm Tabs */}
        <div className="flex border-b border-[#1e293b] gap-2 font-mono text-xs mb-3">
          {[
            { id: 'berkeley', label: '1. Berkeley Master Averaging' },
            { id: 'cristian', label: "2. Cristian's Time Server (RTT/2)" },
            { id: 'lamport', label: '3. Lamport Logical Clocks' },
          ].map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}-btn`}
              onClick={() => {
                setActiveTab(tab.id);
                setSyncResult(null);
              }}
              className={`pb-2 px-3 font-bold border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 4 Digital Clock Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {nodes.map((node) => {
            const baseHours = 10;
            const baseMins = 0;
            const offsetSec = node.clockOffset || 0;
            const displaySec = (60 + offsetSec) % 60;
            const timeString = `${baseHours}:${String(baseMins).padStart(2, '0')}:${String(displaySec).padStart(2, '0')}`;

            return (
              <div
                key={node.id}
                className="p-3 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono font-bold text-xs text-slate-100">Node {node.id}</span>
                    <span className="text-[10px] font-mono text-slate-400">({node.name})</span>
                  </div>

                  <div className="text-center my-1 p-2 rounded-lg bg-[#060a12] border border-slate-800">
                    <div className="text-xl font-bold font-mono text-slate-100 tracking-wider">
                      {timeString}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Offset:{' '}
                      <span className={offsetSec === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {offsetSec > 0 ? `+${offsetSec}` : offsetSec}s
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-800/80 flex justify-between items-center text-[10px] font-mono text-slate-400">
                  <span>Lamport L: <strong className="text-purple-400">{node.lamport || 0}</strong></span>
                  {activeTab === 'cristian' && node.id === 1 && <span className="text-blue-400 font-bold">Time Server</span>}
                  {activeTab === 'berkeley' && node.id === 1 && <span className="text-blue-400 font-bold">Master</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Algorithm Math & Details Card */}
        <div className="p-3 rounded-xl bg-[#060a12] border border-[#1e293b]">
          {activeTab === 'cristian' && (
            <div className="space-y-1.5 font-mono text-xs">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Cristian's Protocol RTT Latency Calculation
              </h4>
              <div className="p-2.5 rounded bg-[#090e1a] border border-slate-800 space-y-1 text-[11px]">
                <div className="text-slate-300">• T0 Request = 100ms | Ts Server Time = 10:00:00.000 | T1 Receive = 300ms</div>
                <div className="text-slate-300">• RTT = T1 - T0 = 200 ms | One-Way Delay = RTT / 2 = 100 ms</div>
                <div className="text-emerald-400 font-bold">• Synchronized Clock = Ts + (RTT / 2) = 10:00:00.100 UTC</div>
              </div>
            </div>
          )}

          {activeTab === 'berkeley' && (
            <div className="space-y-1.5 font-mono text-xs">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" /> Berkeley Master Offset Averaging & Distribution
              </h4>
              <div className="p-2.5 rounded bg-[#090e1a] border border-slate-800 space-y-1 text-[11px]">
                <div className="text-slate-300">1. Master Node 1 gathered offsets: [0s, +7s, -8s, +3s]</div>
                <div className="text-slate-300">2. Average offset = (0 + 7 - 8 + 3) / 4 = <strong className="text-amber-400">+0.5s</strong></div>
                <div className="text-emerald-400 font-bold">3. Adjustments: N1 (+0.5s), N2 (-6.5s), N3 (+8.5s), N4 (-2.5s)</div>
              </div>
            </div>
          )}

          {activeTab === 'lamport' && (
            <div className="space-y-1.5 font-mono text-xs">
              <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Lamport Causal Event Sequence
              </h4>
              <div className="overflow-x-auto max-h-32">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>STEP</th>
                      <th>NODE</th>
                      <th>EVENT TYPE</th>
                      <th>DESCRIPTION</th>
                      <th className="text-right">LAMPORT TIME (L)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {syncResult?.history?.map((stepItem, idx) => (
                      <tr key={idx}>
                        <td className="font-mono text-slate-400">#{idx + 1}</td>
                        <td className="font-mono text-blue-400 font-bold">Node {stepItem.nodeId}</td>
                        <td>
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
                            {stepItem.type}
                          </span>
                        </td>
                        <td className="text-slate-200 font-sans">{stepItem.desc}</td>
                        <td className="font-mono font-bold text-right text-purple-400">
                          L = {stepItem.clock}
                        </td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={5} className="text-center py-3 text-slate-500 italic font-sans">
                          Click 'Execute Synchronization' below to step through Lamport events.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONTROLS & LIVE EVENTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* CONTROLS */}
        <div className="dash-panel p-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono mb-3">
              CONTROLS
            </h4>

            <div className="p-3 rounded-lg bg-[#060a12] border border-[#1e293b] font-mono text-xs space-y-1">
              <div className="text-slate-400">Active Algorithm:</div>
              <div className="text-blue-400 font-bold uppercase">{activeTab} Sync</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e293b] space-y-3">
            <button
              id="run-clock-sync-btn"
              onClick={handleSync}
              disabled={loading}
              className="btn-primary w-full justify-center py-2 text-xs font-bold"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{loading ? 'Synchronizing...' : `Execute ${activeTab.toUpperCase()} Synchronization`}</span>
            </button>

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
          </div>
        </div>

        {/* LIVE EVENTS */}
        <div className="h-full">
          <EventLog events={clockEvents.length > 0 ? clockEvents : displayedEvents} onClear={clearLog} maxHeight="320px" />
        </div>
      </div>

      {/* RESULT / CURRENT STATE BANNER */}
      {syncResult && (
        <ResultBanner
          type="success"
          title={`Clock Synchronization Completed (${activeTab.toUpperCase()})`}
          description={
            activeTab === 'berkeley'
              ? `Master Node 1 calculated average offset: ${syncResult.averageOffset >= 0 ? '+' : ''}${syncResult.averageOffset}s. Clocks synchronized.`
              : activeTab === 'cristian'
              ? `Client Node 3 synchronized with Time Server Node 1. RTT: ${syncResult.rtt}ms.`
              : 'Lamport logical clock sequence verified causal event ordering.'
          }
        />
      )}
    </div>
  );
}
