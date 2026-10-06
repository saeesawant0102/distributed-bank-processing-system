import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExperimentHeader } from '../../components/ExperimentHeader';
import { SimulationControls } from '../../components/SimulationControls';
import { EventLog } from '../../components/EventLog';
import { ResultBanner } from '../../components/ResultBanner';
import { StatusBadge } from '../../components/StatusBadge';
import { Crown, Play, RotateCw } from 'lucide-react';

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

  const electionEvents = displayedEvents.filter(
    (e) => e.experiment === 'election' || e.type?.includes('ELECTION') || e.type?.includes('COORDINATOR')
  );

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <ExperimentHeader
        number="04"
        title="LEADER ELECTION"
        subtitle="Bully & Ring Election Algorithms Simulation"
        concept="Coordinator election following node failure. Bully algorithm uses priority hierarchy while Ring algorithm circulates an election token."
        viva={[
          {
            q: "Why is the Bully algorithm named as such?",
            a: "Because nodes with higher IDs bully and supersede lower-ID candidates by sending 'OK' and taking over the election.",
          },
        ]}
      />

      {/* LARGE SIMULATION CANVAS (60-70% Height) */}
      <div className="dash-panel p-5 bg-[#090e1a] border-purple-500/30 flex flex-col justify-between min-h-[380px]">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e293b]">
          <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <Crown className="w-4 h-4 text-purple-400" />
            SIMULATION CANVAS — {algorithm === 'bully' ? 'Bully Priority Mesh' : 'Ring Token Sequence (1 → 2 → 3 → 4 → 5 → 1)'}
          </h3>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Coordinator:</span>
            <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-700/50 font-bold flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-purple-400" /> Node {currentCoordinatorId}
            </span>
          </div>
        </div>

        {/* Dynamic Topology rendering */}
        {algorithm === 'ring' ? (
          <div className="p-4 rounded-xl bg-[#060a12] border border-[#1e293b] flex flex-col items-center justify-center my-auto min-h-56">
            <div className="text-[10px] uppercase font-mono text-purple-400 font-bold mb-3 tracking-wider flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 animate-spin" /> Ring Election Token Circulation
            </div>

            <div className="grid grid-cols-5 gap-3 w-full max-w-2xl">
              {nodes.map((node) => {
                const isCoordinator = node.id === currentCoordinatorId && node.alive;
                const isInitiator = node.id === Number(initiatorId);

                return (
                  <div
                    key={node.id}
                    className={`p-3 rounded-xl border flex flex-col justify-between text-center transition-all ${
                      !node.alive
                        ? 'border-red-900/40 bg-red-950/20 opacity-60'
                        : isCoordinator
                        ? 'border-purple-500 bg-purple-950/40 shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                        : isInitiator
                        ? 'border-blue-500 bg-blue-950/40 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                        : 'border-[#1e293b] bg-[#0f172a]'
                    }`}
                  >
                    <div>
                      <div className="font-mono font-bold text-xs text-slate-100 flex items-center justify-center gap-1 mb-0.5">
                        N{node.id}
                        {isCoordinator && <Crown className="w-3 h-3 text-purple-400" />}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mb-1">Priority: {node.id}</div>
                      <StatusBadge role={isCoordinator ? 'COORDINATOR' : node.role} isAlive={node.alive} />
                    </div>

                    <button
                      onClick={() => toggleNodeLiveness(node.id, node.alive)}
                      className={`mt-2 w-full py-0.5 rounded text-[10px] font-mono font-semibold ${
                        node.alive ? 'bg-red-950/30 text-red-400 border border-red-800/30' : 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/30'
                      }`}
                    >
                      {node.alive ? 'Crash' : 'Recover'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 my-auto">
            {nodes.map((node) => {
              const isCoordinator = node.id === currentCoordinatorId && node.alive;
              const isInitiator = node.id === Number(initiatorId);

              return (
                <div
                  key={node.id}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                    !node.alive
                      ? 'border-red-900/40 bg-red-950/20 opacity-60'
                      : isCoordinator
                      ? 'border-purple-500 bg-purple-950/40 shadow-[0_0_15px_rgba(168,85,247,0.35)]'
                      : isInitiator
                      ? 'border-blue-500 bg-blue-950/40 shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                      : 'border-[#1e293b] bg-[#0f172a]'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono font-bold text-xs text-slate-100 flex items-center gap-1">
                        Node {node.id}
                        {isCoordinator && <Crown className="w-3.5 h-3.5 text-purple-400" />}
                      </span>
                      <StatusBadge role={isCoordinator ? 'COORDINATOR' : node.role} isAlive={node.alive} />
                    </div>

                    <div className="space-y-0.5 font-mono text-[10px] text-slate-400 my-1">
                      <div className="flex justify-between">
                        <span>Priority:</span>
                        <span className="text-slate-200 font-bold">{node.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>State:</span>
                        <span className={node.alive ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {node.alive ? 'ALIVE' : 'CRASHED'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-slate-800/80">
                    <button
                      id={`election-toggle-node-${node.id}-btn`}
                      onClick={() => toggleNodeLiveness(node.id, node.alive)}
                      className={`w-full py-1 px-1 rounded text-[10px] font-mono font-semibold ${
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
        )}
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
                <span className="text-slate-300 font-semibold">Algorithm:</span>
                <div className="bg-[#060a12] p-1 rounded-lg border border-[#222f49] flex gap-1 font-mono text-xs">
                  <button
                    id="algo-bully-btn"
                    onClick={() => setAlgorithm('bully')}
                    className={`px-3 py-1 rounded-md font-bold ${algorithm === 'bully' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Bully Algorithm
                  </button>
                  <button
                    id="algo-ring-btn"
                    onClick={() => setAlgorithm('ring')}
                    className={`px-3 py-1 rounded-md font-bold ${algorithm === 'ring' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Ring Token
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Initiating Node:</span>
                <select
                  id="election-initiator-select"
                  value={initiatorId}
                  onChange={(e) => setInitiatorId(Number(e.target.value))}
                  className="bg-[#060a12] border border-[#222f49] rounded p-1.5 text-xs text-slate-200 font-mono"
                >
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id} disabled={!n.alive}>
                      Node {n.id} {!n.alive ? '(Dead)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e293b] space-y-3">
            <button
              id="start-election-btn"
              onClick={handleStartElection}
              disabled={loading}
              className="btn-primary w-full justify-center py-2 text-xs font-bold !bg-purple-600 hover:!bg-purple-700"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{loading ? 'Electing...' : `Trigger ${algorithm.toUpperCase()} Election`}</span>
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
          <EventLog events={electionEvents.length > 0 ? electionEvents : displayedEvents} onClear={clearLog} maxHeight="320px" />
        </div>
      </div>

      {/* RESULT / CURRENT STATE BANNER */}
      {lastResult?.success && (
        <ResultBanner
          type="success"
          title={`COORDINATOR ELECTED: Node ${lastResult.winnerId} via ${lastResult.algorithm.toUpperCase()}`}
          description={`Initiator: Node ${initiatorId}. Highest alive node (Node ${lastResult.winnerId}) was elected coordinator.`}
          details={
            lastResult.membershipList
              ? `Ring sequence: [${lastResult.membershipList.join(' → ')}]`
              : `Bully algorithm confirmed no higher alive node replied to Node ${lastResult.winnerId}`
          }
        />
      )}
    </div>
  );
}
