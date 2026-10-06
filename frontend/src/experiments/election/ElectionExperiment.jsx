import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExperimentDescription } from '../../components/ExperimentDescription';
import { SimulationControls } from '../../components/SimulationControls';
import { EventLog } from '../../components/EventLog';
import { ResultBanner } from '../../components/ResultBanner';
import { StatusBadge } from '../../components/StatusBadge';
import { Crown, Play, Power, Server } from 'lucide-react';

export function ElectionExperiment({ sim }) {
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

  const [algorithm, setAlgorithm] = useState('bully'); // 'bully' | 'ring'
  const [initiatorId, setInitiatorId] = useState(2);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const nodes = clusterState?.nodes || [];
  const currentCoordinatorId = clusterState?.coordinatorId ?? 5;

  const handleStartElection = async () => {
    setLoading(true);
    setLastResult(null);
    try {
      const res = await api.startElection({
        algorithm,
        initiatorId: Number(initiatorId),
      });
      setLastResult(res);
      refreshState();
    } catch (err) {
      console.error('Election error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ExperimentDescription
        title="Experiment 4: Leader Election (Bully & Ring Algorithms)"
        concept="When the coordinator crashes, remaining nodes must elect a new leader. Both algorithms elect the node with the highest ID among alive nodes. Bully algorithm uses direct hierarchical message exchange (worst-case O(n²)), while the Ring algorithm passes a token list unidirectionally around a logical ring (O(2n) messages)."
        scenario="Node 5 is the cluster coordinator. When Node 5 crashes, Node 2 detects failure and triggers an election. In both algorithms, Node 4 (the highest remaining alive node) is elected as the new Coordinator."
        viva={[
          {
            q: "Why is the Bully algorithm named as such?",
            a: "Because nodes with higher IDs bully and supersede lower-ID candidates by sending 'OK' and declaring their own candidacy.",
          },
          {
            q: "What does an 'OK' message signify in the Bully algorithm?",
            a: "It does NOT mean the sender is coordinator; it simply means 'I am alive and have a higher ID than you, so I will take over running the election.'",
          },
          {
            q: "How does the Ring algorithm skip dead nodes?",
            a: "When a node fails to forward the token to its logical successor in the ring, it times out and forwards to the next alive successor in the sequence.",
          },
        ]}
      />

      {/* Outcome Banner */}
      {lastResult?.success && (
        <ResultBanner
          type="success"
          title={`COORDINATOR ELECTED: Node ${lastResult.winnerId} via ${lastResult.algorithm.toUpperCase()}`}
          description={`Node ${initiatorId} initiated the election. Highest alive node (Node ${lastResult.winnerId}) was successfully elected coordinator.`}
          details={
            lastResult.membershipList
              ? `Ring token sequence: [${lastResult.membershipList.join(' → ')}]`
              : `Bully algorithm confirmed no higher alive node replied to Node ${lastResult.winnerId}`
          }
        />
      )}

      {/* Cluster Nodes & Topology Table */}
      <div className="dash-panel p-3.5">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b]">
          <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-purple-400" />
            Cluster Node Hierarchy ({algorithm === 'bully' ? 'Full Mesh' : 'Logical Ring 1→2→3→4→5→1'})
          </h3>

          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400">Coordinator:</span>
            <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40 font-bold">
              Node {currentCoordinatorId}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 my-2">
          {nodes.map((node) => {
            const isCoordinator = node.id === currentCoordinatorId && node.alive;
            const isInitiator = node.id === Number(initiatorId);

            return (
              <div
                key={node.id}
                className={`p-3 rounded-md border flex flex-col justify-between transition-all ${
                  !node.alive
                    ? 'border-red-900/40 bg-red-950/10 opacity-60'
                    : isCoordinator
                    ? 'border-purple-500/80 bg-[#1e172e]'
                    : isInitiator
                    ? 'border-blue-500/60 bg-[#111c33]'
                    : 'border-[#1e293b] bg-[#0f172a]'
                }`}
              >
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-xs text-slate-200 font-mono">N{node.id}</span>
                    <StatusBadge role={isCoordinator ? 'COORDINATOR' : node.role} isAlive={node.alive} />
                  </div>

                  <div className="space-y-1 font-mono text-[11px] text-slate-400 my-2">
                    <div className="flex justify-between">
                      <span>Priority:</span>
                      <span className="text-slate-200 font-semibold">{node.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>State:</span>
                      <span className={node.alive ? 'text-emerald-400' : 'text-red-400'}>
                        {node.alive ? 'ALIVE' : 'CRASHED'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <button
                    id={`election-toggle-node-${node.id}-btn`}
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
      </div>

      {/* Control Actions Bar */}
      <div className="dash-panel p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Algorithm switch */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Algorithm:</span>
          <div className="bg-[#0b101d] p-0.5 rounded border border-[#222f49] flex gap-1 font-mono text-xs">
            <button
              id="algo-bully-btn"
              onClick={() => setAlgorithm('bully')}
              className={`px-3 py-1 rounded transition-colors ${
                algorithm === 'bully'
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Bully Algorithm
            </button>
            <button
              id="algo-ring-btn"
              onClick={() => setAlgorithm('ring')}
              className={`px-3 py-1 rounded transition-colors ${
                algorithm === 'ring'
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ring Algorithm
            </button>
          </div>
        </div>

        {/* Initiator select */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-300">Initiator:</span>
          <select
            id="election-initiator-select"
            value={initiatorId}
            onChange={(e) => setInitiatorId(Number(e.target.value))}
            className="bg-[#0b101d] border border-[#222f49] rounded p-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
          >
            {nodes.map((n) => (
              <option key={n.id} value={n.id} disabled={!n.alive}>
                Node {n.id} {!n.alive ? '(Dead)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            id="start-election-btn"
            onClick={handleStartElection}
            disabled={loading}
            className="btn-primary py-1.5 px-4 text-xs !bg-purple-600 hover:!bg-purple-700"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loading ? 'Electing...' : `Trigger ${algorithm.toUpperCase()} Election`}</span>
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
