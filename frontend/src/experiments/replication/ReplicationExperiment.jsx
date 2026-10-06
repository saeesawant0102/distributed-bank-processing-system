import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExperimentHeader } from '../../components/ExperimentHeader';
import { SimulationControls } from '../../components/SimulationControls';
import { EventLog } from '../../components/EventLog';
import { ResultBanner } from '../../components/ResultBanner';
import { Database, Play, AlertCircle, Eye } from 'lucide-react';

export function ReplicationExperiment({ sim }) {
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

  const [mode, setMode] = useState('strong'); // 'strong' | 'eventual'
  const [amount, setAmount] = useState(2000);
  const [account, setAccount] = useState('A101');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [readModal, setReadModal] = useState(null);

  const primary = clusterState?.nodes?.find((n) => n.id === 1);
  const replica1 = clusterState?.nodes?.find((n) => n.id === 2);
  const replica2 = clusterState?.nodes?.find((n) => n.id === 3);

  const primaryVersion = primary?.accounts?.[account]?.version ?? 1;
  const r1Version = replica1?.accounts?.[account]?.version ?? 1;
  const r2Version = replica2?.accounts?.[account]?.version ?? 1;

  const isR1Stale = r1Version < primaryVersion;
  const isR2Stale = r2Version < primaryVersion;

  const handleWrite = async () => {
    setLoading(true);
    setLastResult(null);
    try {
      const res = await api.writeReplication({
        mode,
        account,
        amount: Number(amount),
        replica1Delay: 1,
        replica2Delay: 3,
      });
      setLastResult(res);
      refreshState();
    } catch (err) {
      console.error('Replication write error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReadFromNode = (nodeObj) => {
    const bal = nodeObj?.accounts?.[account]?.balance;
    const ver = nodeObj?.accounts?.[account]?.version;
    const isStale = ver < primaryVersion;

    setReadModal({
      nodeId: nodeObj.id,
      nodeName: nodeObj.name,
      balance: bal,
      version: ver,
      isStale,
      account,
    });
  };

  const replicationEvents = displayedEvents.filter(
    (e) => e.experiment === 'replication' || e.type?.includes('REPLICAT')
  );

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <ExperimentHeader
        number="05"
        title="REPLICATION"
        subtitle="Data Replication & Consistency Models Simulation"
        concept="Primary-Replica synchronization demonstrating Strong (Synchronous ACKs) vs Eventual (Async Propagation & Stale Reads) consistency."
        viva={[
          {
            q: "What trade-off does the CAP theorem describe?",
            a: "During a network partition, you must choose between Strong Consistency (waiting for ACKs, risking availability) or Availability (confirming quickly, allowing temporary staleness).",
          },
        ]}
      />

      {/* LARGE SIMULATION CANVAS (60-70% Height) */}
      <div className="dash-panel p-5 bg-[#090e1a] border-blue-500/30 flex flex-col justify-between min-h-[380px]">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e293b]">
          <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-400" />
            SIMULATION CANVAS — N1 Primary ➔ N2 Replica & N3 Replica Sync Topology
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40 font-bold uppercase">
            {mode} Consistency
          </span>
        </div>

        {/* 3 Replicas Layout Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-auto">
          {/* Primary Node 1 */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-blue-500/60 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#1e293b]">
                <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5 font-mono">
                  <Database className="w-4 h-4 text-blue-400" />
                  N1 PRIMARY
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40 font-bold">
                  PRIMARY
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#060a12] border border-[#1e293b] text-center my-2 font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">{account} Balance</span>
                <span className="text-2xl font-bold text-emerald-400 mt-0.5 block">
                  ₹{primary?.accounts?.[account]?.balance ?? 10000}
                </span>
                <span className="text-xs text-blue-400 mt-0.5 block font-bold">
                  Version: v{primaryVersion}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1e293b]">
              <button
                onClick={() => handleReadFromNode(primary)}
                className="btn-secondary w-full justify-center py-1.5 text-xs font-semibold"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Read Primary</span>
              </button>
            </div>
          </div>

          {/* Replica 1 (Node 2) */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
              !replica1?.alive
                ? 'opacity-60 border-red-900/40 bg-red-950/20'
                : isR1Stale
                ? 'border-amber-500/80 bg-[#19150d]'
                : 'border-[#1e293b] bg-[#0f172a]'
            }`}
          >
            <div>
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#1e293b]">
                <span className="font-bold text-xs text-slate-100 font-mono">N2 REPLICA 1</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    !replica1?.alive
                      ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                      : isR1Stale
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-700/50'
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                  }`}
                >
                  {!replica1?.alive ? 'OFFLINE' : isR1Stale ? 'STALE' : 'SYNCHRONIZED'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#060a12] border border-[#1e293b] text-center my-2 font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">{account} Balance</span>
                <span className="text-2xl font-bold text-emerald-400 mt-0.5 block">
                  ₹{replica1?.accounts?.[account]?.balance ?? 10000}
                </span>
                <span className={`text-xs mt-0.5 block font-bold ${isR1Stale ? 'text-amber-400' : 'text-slate-400'}`}>
                  Version: v{r1Version} {isR1Stale && '(Stale)'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1e293b] flex gap-2">
              <button
                onClick={() => handleReadFromNode(replica1)}
                disabled={!replica1?.alive}
                className="btn-secondary flex-1 justify-center py-1.5 text-xs font-semibold"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Read R1</span>
              </button>
              <button
                id="replica1-toggle-btn"
                onClick={() => toggleNodeLiveness(2, replica1?.alive)}
                className="btn-danger py-1.5 px-2.5 text-xs"
              >
                {replica1?.alive ? 'Crash' : 'Recover'}
              </button>
            </div>
          </div>

          {/* Replica 2 (Node 3) */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
              !replica2?.alive
                ? 'opacity-60 border-red-900/40 bg-red-950/20'
                : isR2Stale
                ? 'border-amber-500/80 bg-[#19150d]'
                : 'border-[#1e293b] bg-[#0f172a]'
            }`}
          >
            <div>
              <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#1e293b]">
                <span className="font-bold text-xs text-slate-100 font-mono">N3 REPLICA 2</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    !replica2?.alive
                      ? 'bg-red-950/60 text-red-400 border border-red-800/40'
                      : isR2Stale
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-700/50'
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                  }`}
                >
                  {!replica2?.alive ? 'OFFLINE' : isR2Stale ? 'STALE' : 'SYNCHRONIZED'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#060a12] border border-[#1e293b] text-center my-2 font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">{account} Balance</span>
                <span className="text-2xl font-bold text-emerald-400 mt-0.5 block">
                  ₹{replica2?.accounts?.[account]?.balance ?? 10000}
                </span>
                <span className={`text-xs mt-0.5 block font-bold ${isR2Stale ? 'text-amber-400' : 'text-slate-400'}`}>
                  Version: v{r2Version} {isR2Stale && '(Stale)'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1e293b] flex gap-2">
              <button
                onClick={() => handleReadFromNode(replica2)}
                disabled={!replica2?.alive}
                className="btn-secondary flex-1 justify-center py-1.5 text-xs font-semibold"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Read R2</span>
              </button>
              <button
                id="replica2-toggle-btn"
                onClick={() => toggleNodeLiveness(3, replica2?.alive)}
                className="btn-danger py-1.5 px-2.5 text-xs"
              >
                {replica2?.alive ? 'Crash' : 'Recover'}
              </button>
            </div>
          </div>
        </div>

        {/* Stale Read Inspector Modal */}
        {readModal && (
          <div className="mt-3 p-3 rounded-lg bg-[#060a12] border border-[#222f49] flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <AlertCircle className={`w-4 h-4 shrink-0 ${readModal.isStale ? 'text-amber-400' : 'text-emerald-400'}`} />
              <div>
                <span>Read {readModal.nodeName}: {readModal.account} = </span>
                <strong className="text-emerald-400 font-bold">₹{readModal.balance}</strong> (v{readModal.version})
                {readModal.isStale && (
                  <span className="text-amber-400 font-bold ml-2 font-mono">[STALE READ! Primary is at v{primaryVersion}]</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setReadModal(null)}
              className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded bg-slate-800 shrink-0 font-mono"
            >
              Dismiss
            </button>
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
                <span className="text-slate-300 font-semibold">Consistency Mode:</span>
                <div className="bg-[#060a12] p-1 rounded-lg border border-[#222f49] flex gap-1 font-mono text-xs">
                  <button
                    id="mode-strong-btn"
                    onClick={() => setMode('strong')}
                    className={`px-3 py-1.5 rounded-md font-bold ${mode === 'strong' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Strong (Sync ACKs)
                  </button>
                  <button
                    id="mode-eventual-btn"
                    onClick={() => setMode('eventual')}
                    className={`px-3 py-1.5 rounded-md font-bold ${mode === 'eventual' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Eventual (Async)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Debit Amount (₹):</span>
                <input
                  id="replication-amount-input"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-28 bg-[#060a12] border border-[#222f49] rounded p-1.5 text-xs text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e293b] space-y-3">
            <button
              id="send-replication-write-btn"
              onClick={handleWrite}
              disabled={loading}
              className="btn-primary w-full justify-center py-2 text-xs font-bold"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{loading ? 'Replicating...' : `Execute ${mode.toUpperCase()} Replication Write`}</span>
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
          <EventLog events={replicationEvents.length > 0 ? replicationEvents : displayedEvents} onClear={clearLog} maxHeight="320px" />
        </div>
      </div>

      {/* RESULT / CURRENT STATE BANNER */}
      {lastResult && (
        <ResultBanner
          type={lastResult.success ? 'success' : 'danger'}
          title={
            lastResult.success
              ? mode === 'strong'
                ? 'STRONG CONSISTENCY: Synchronous ACKs Confirmed'
                : 'EVENTUAL CONSISTENCY: Fast Write & Async Convergence'
              : 'REPLICATION WRITE FAILED'
          }
          description={
            lastResult.success
              ? mode === 'strong'
                ? `Synchronous commit acknowledged by all replicas. Updated to version v${primaryVersion}.`
                : `Primary Node 1 confirmed write immediately. Replicas update asynchronously.`
              : lastResult.error || 'Replication blocked.'
          }
        />
      )}
    </div>
  );
}
