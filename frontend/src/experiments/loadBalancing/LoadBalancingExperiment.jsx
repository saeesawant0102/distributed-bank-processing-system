import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExperimentHeader } from '../../components/ExperimentHeader';
import { SimulationControls } from '../../components/SimulationControls';
import { EventLog } from '../../components/EventLog';
import { ResultBanner } from '../../components/ResultBanner';
import { Scale, Play, Zap } from 'lucide-react';

export function LoadBalancingExperiment({ sim }) {
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
    toggleNodeLiveness,
  } = sim;

  const [algorithm, setAlgorithm] = useState('roundRobin'); // 'roundRobin' | 'leastConnections' | 'weightedRoundRobin'
  const [burstCount, setBurstCount] = useState(15);
  const [weights, setWeights] = useState({ 1: 1, 2: 3, 3: 2 });
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const nodes = (clusterState?.nodes || []).slice(0, 3);

  const handleSendTraffic = async (count) => {
    setLoading(true);
    setLastResult(null);
    try {
      const res = await api.sendLoad({
        algorithm,
        count: Number(count),
        weights,
      });
      setLastResult(res);
      refreshState();
    } catch (err) {
      console.error('Load balancer error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getLoadBarColor = (percent) => {
    if (percent > 80) return 'bg-red-500';
    if (percent > 50) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const loadEvents = displayedEvents.filter(
    (e) => e.experiment === 'loadBalancing' || e.type?.includes('LOAD')
  );

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <ExperimentHeader
        number="06"
        title="LOAD BALANCING"
        subtitle="Load Balancing Routing Algorithms Simulation"
        concept="Incoming client traffic distribution across backend servers via Round Robin, Least Connections, or Weighted RR policies."
        viva={[
          {
            q: "Why can pure Round Robin cause server overload?",
            a: "Round Robin assumes all transactions take equal time. If processing durations vary, certain nodes accumulate queues while others sit idle.",
          },
        ]}
      />

      {/* LARGE SIMULATION CANVAS (60-70% Height) */}
      <div className="dash-panel p-5 bg-[#090e1a] border-blue-500/30 flex flex-col justify-between min-h-[380px]">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e293b]">
          <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-400" />
            SIMULATION CANVAS — Incoming Requests ➔ LOAD BALANCER ➔ Backend Pool (N1, N2, N3)
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40 font-bold uppercase">
            Policy: {algorithm}
          </span>
        </div>

        {/* 3 Backend Servers Load Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-auto">
          {nodes.map((node) => {
            const loadPercent = node.load || 0;
            const assignedInLastBurst =
              lastResult?.assignments?.filter((a) => a.assignedTo === node.id).length ?? 0;

            return (
              <div
                key={node.id}
                className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                  !node.alive ? 'opacity-60 border-red-900/40 bg-red-950/20' : 'border-[#1e293b] bg-[#0f172a]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#1e293b]">
                    <span className="font-bold text-xs text-slate-100 font-mono">N{node.id} ({node.name})</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        !node.alive ? 'bg-red-950/60 text-red-400 border border-red-800/40' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                      }`}
                    >
                      {!node.alive ? 'OFFLINE' : 'ONLINE'}
                    </span>
                  </div>

                  {/* Meter */}
                  <div className="p-3 rounded-lg bg-[#060a12] border border-[#1e293b] my-2 space-y-2 font-mono">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 text-[11px]">Server Utilization:</span>
                      <span className="font-bold text-slate-100">{loadPercent}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getLoadBarColor(loadPercent)}`}
                        style={{ width: `${Math.min(100, loadPercent)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                      <span>Active Conn: <strong>{node.activeConnections || 0}/{node.capacity || 10}</strong></span>
                      <span className="text-blue-400 font-bold">+{assignedInLastBurst} batch req</span>
                    </div>
                  </div>

                  {/* Weight Input */}
                  {algorithm === 'weightedRoundRobin' && (
                    <div className="p-1.5 rounded-lg bg-[#060a12] border border-[#1e293b] text-xs flex items-center justify-between font-mono mb-1">
                      <span className="text-slate-400 text-[11px]">Config Weight:</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={weights[node.id] || 1}
                        onChange={(e) =>
                          setWeights({ ...weights, [node.id]: Math.max(1, Number(e.target.value)) })
                        }
                        className="w-14 bg-[#090e1a] border border-slate-700 rounded px-1.5 py-0.5 text-xs text-center text-slate-100 font-mono"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[#1e293b]">
                  <button
                    id={`load-toggle-node-${node.id}-btn`}
                    onClick={() => toggleNodeLiveness(node.id, node.alive)}
                    className={`w-full py-1 px-2 rounded text-[11px] font-mono font-semibold ${
                      node.alive ? 'bg-red-950/40 text-red-400 border border-red-800/40' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                    }`}
                  >
                    {node.alive ? `Crash N${node.id}` : `Recover N${node.id}`}
                  </button>
                </div>
              </div>
            );
          })}
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

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Routing Policy:</span>
                <div className="bg-[#060a12] p-1 rounded-lg border border-[#222f49] flex gap-1 font-mono text-xs">
                  <button
                    id="algo-rr-btn"
                    onClick={() => setAlgorithm('roundRobin')}
                    className={`px-3 py-1.5 rounded-md font-bold ${algorithm === 'roundRobin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Round Robin
                  </button>
                  <button
                    id="algo-leastconn-btn"
                    onClick={() => setAlgorithm('leastConnections')}
                    className={`px-3 py-1.5 rounded-md font-bold ${algorithm === 'leastConnections' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Least Conn
                  </button>
                  <button
                    id="algo-wrr-btn"
                    onClick={() => setAlgorithm('weightedRoundRobin')}
                    className={`px-3 py-1.5 rounded-md font-bold ${algorithm === 'weightedRoundRobin' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Weighted RR
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e293b] space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                id="send-single-load-btn"
                onClick={() => handleSendTraffic(1)}
                disabled={loading}
                className="btn-secondary py-2 px-3 text-xs font-bold justify-center"
              >
                <span>Send 1 Request</span>
              </button>

              <button
                id="send-burst-load-btn"
                onClick={() => handleSendTraffic(burstCount)}
                disabled={loading}
                className="btn-primary py-2 px-4 text-xs font-bold justify-center"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{loading ? 'Routing...' : `Dispatch Burst (${burstCount} Txns)`}</span>
              </button>
            </div>

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
          <EventLog events={loadEvents.length > 0 ? loadEvents : displayedEvents} onClear={clearLog} maxHeight="320px" />
        </div>
      </div>

      {/* RESULT / CURRENT STATE BANNER */}
      {lastResult?.success && (
        <ResultBanner
          type="success"
          title={`Traffic Distributed: ${lastResult.requestCount} Requests via ${algorithm.toUpperCase()}`}
          description={`Distributed across backend pool. Current distribution: ${Object.entries(
            lastResult.distribution || {}
          )
            .map(([id, d]) => `Node ${id}: ${d.activeConnections} conn (${d.loadPercent}%)`)
            .join(' | ')}`}
        />
      )}
    </div>
  );
}
