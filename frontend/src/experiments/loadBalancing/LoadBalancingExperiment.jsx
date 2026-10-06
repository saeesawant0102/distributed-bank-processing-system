import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExperimentDescription } from '../../components/ExperimentDescription';
import { SimulationControls } from '../../components/SimulationControls';
import { EventLog } from '../../components/EventLog';
import { ResultBanner } from '../../components/ResultBanner';
import { Scale, Play, Zap, Power, Cpu, Server } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      <ExperimentDescription
        title="Experiment 6: Load Balancing Routing Algorithms"
        concept="A Load Balancer distributes incoming requests across a cluster of backend servers to prevent hotspots and maximize throughput. Round Robin assigns requests in cyclic sequence regardless of load. Least Connections routes traffic to the server with the fewest active in-flight connections. Weighted Round Robin assigns higher request ratios to nodes with larger configured capacity."
        scenario="A burst of 15 incoming bank transactions is dispatched. Under Round Robin, Node 2 can reach high utilization if previous requests linger. Under Least Connections, traffic automatically diverts to less-busy servers, keeping loads balanced across the cluster."
        viva={[
          {
            q: "Why can pure Round Robin cause server overload?",
            a: "Round Robin assumes all transactions take equal time and servers have equal processing capacity. If transactions differ in execution time, certain nodes accumulate queues while others sit idle.",
          },
          {
            q: "When is Least Connections superior?",
            a: "When request processing durations vary widely (e.g. fast balance lookups vs long database reconciliations), dynamically balancing active server load.",
          },
          {
            q: "What is the single point of failure in a basic load-balanced system?",
            a: "The Load Balancer itself. Production systems deploy high-availability pairs with virtual IP failover (e.g. Keepalived / VRRP).",
          },
        ]}
      />

      {/* Outcome Banner */}
      {lastResult?.success && (
        <ResultBanner
          type="success"
          title={`Traffic Distributed: ${lastResult.requestCount} Requests via ${algorithm.toUpperCase()}`}
          description={`Distributed across active backend nodes. Current load metrics: ${Object.entries(
            lastResult.distribution || {}
          )
            .map(([id, d]) => `Node ${id}: ${d.activeConnections} active conn (${d.loadPercent}%)`)
            .join(' | ')}`}
        />
      )}

      {/* Gateway Telemetry Header */}
      <div className="dash-panel p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-slate-100 uppercase tracking-wide">
              Load Balancing Gateway
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Policy: <strong className="text-blue-400">{algorithm}</strong> • Pool: Nodes 1–3
            </span>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="text-slate-400 text-[11px] block">Cluster Nodes Alive</span>
          <span className="text-emerald-400 font-bold">
            {nodes.filter((n) => n.alive).length} / {nodes.length} Healthy
          </span>
        </div>
      </div>

      {/* 3 Backend Servers with Horizontal Load Bars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {nodes.map((node) => {
          const loadPercent = node.load || 0;
          const assignedInLastBurst =
            lastResult?.assignments?.filter((a) => a.assignedTo === node.id).length ?? 0;

          return (
            <div
              key={node.id}
              className={`dash-panel p-3.5 flex flex-col justify-between transition-all ${
                !node.alive ? 'opacity-60 border-red-900/40 bg-red-950/10' : 'border-[#1e293b]'
              }`}
            >
              <div>
                <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#1e293b]">
                  <span className="font-semibold text-xs text-slate-200 font-mono">N{node.id} ({node.name})</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                      !node.alive ? 'bg-red-950/40 text-red-400' : 'bg-emerald-950/40 text-emerald-300'
                    }`}
                  >
                    {!node.alive ? 'OFFLINE' : 'ONLINE'}
                  </span>
                </div>

                {/* Compact Horizontal Load Bar */}
                <div className="p-2.5 rounded bg-[#0b101d] border border-[#1e293b] my-2">
                  <div className="flex justify-between text-xs mb-1 font-mono">
                    <span className="text-slate-400 text-[11px]">Server Load:</span>
                    <span className="font-bold text-slate-200">{loadPercent}%</span>
                  </div>
                  <div className="w-full h-2 rounded bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getLoadBarColor(loadPercent)}`}
                      style={{ width: `${Math.min(100, loadPercent)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-400 mt-2 font-mono">
                    <span>Active: {node.activeConnections || 0}/{node.capacity || 10}</span>
                    <span>+{assignedInLastBurst} batch req</span>
                  </div>
                </div>

                {/* Weight Input if Weighted RR */}
                {algorithm === 'weightedRoundRobin' && (
                  <div className="p-1.5 rounded bg-[#0b101d] border border-[#1e293b] text-xs flex items-center justify-between font-mono mb-2">
                    <span className="text-slate-400 text-[11px]">Weight:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={weights[node.id] || 1}
                      onChange={(e) =>
                        setWeights({ ...weights, [node.id]: Math.max(1, Number(e.target.value)) })
                      }
                      className="w-14 bg-[#090d16] border border-slate-700 rounded px-1.5 py-0.5 text-xs text-center"
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#1e293b]">
                <button
                  id={`load-toggle-node-${node.id}-btn`}
                  onClick={() => toggleNodeLiveness(node.id, node.alive)}
                  className={`w-full py-1 px-1.5 rounded text-[11px] font-mono transition-colors ${
                    node.alive
                      ? 'bg-red-950/20 text-red-400 hover:bg-red-900/30 border border-red-800/30'
                      : 'bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/30 border border-emerald-800/30'
                  }`}
                >
                  {node.alive ? `Crash N${node.id}` : `Recover N${node.id}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Actions Bar */}
      <div className="dash-panel p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Routing Policy Segmented Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Policy:</span>
          <div className="bg-[#0b101d] p-0.5 rounded border border-[#222f49] flex gap-1 font-mono text-xs">
            <button
              id="algo-rr-btn"
              onClick={() => setAlgorithm('roundRobin')}
              className={`px-3 py-1 rounded transition-colors ${
                algorithm === 'roundRobin' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Round Robin
            </button>
            <button
              id="algo-leastconn-btn"
              onClick={() => setAlgorithm('leastConnections')}
              className={`px-3 py-1 rounded transition-colors ${
                algorithm === 'leastConnections' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Least Connections
            </button>
            <button
              id="algo-wrr-btn"
              onClick={() => setAlgorithm('weightedRoundRobin')}
              className={`px-3 py-1 rounded transition-colors ${
                algorithm === 'weightedRoundRobin' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Weighted RR
            </button>
          </div>
        </div>

        {/* Traffic Send Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="send-single-load-btn"
            onClick={() => handleSendTraffic(1)}
            disabled={loading}
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            <span>Send 1 Request</span>
          </button>

          <button
            id="send-burst-load-btn"
            onClick={() => handleSendTraffic(burstCount)}
            disabled={loading}
            className="btn-primary py-1.5 px-3.5 text-xs"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{loading ? 'Routing...' : `Dispatch Burst (${burstCount} Txns)`}</span>
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
