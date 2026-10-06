import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExperimentDescription } from '../../components/ExperimentDescription';
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

  return (
    <div className="space-y-4">
      <ExperimentDescription
        title="Experiment 5: Data Consistency & Replication (Strong vs Eventual)"
        concept="Replication ensures high availability and fault tolerance. Strong Consistency guarantees that any read operation sees the most recent write, requiring synchronous ACKs from all replicas before acknowledging the client. Eventual Consistency confirms writes immediately at the primary, allowing temporary staleness while replicas converge asynchronously in the background."
        scenario="Account A101 starts with ₹10,000 on Primary (Node 1) and Replicas (Nodes 2 & 3). In Strong mode, debiting ₹2,000 requires both replicas to ACK before confirmation. In Eventual mode, Node 1 confirms immediately; reading from Replicas 2 or 3 before convergence demonstrates a STALE read (₹10,000) until the replicas catch up."
        viva={[
          {
            q: "What trade-off does the CAP theorem describe for replication?",
            a: "During a network partition, you must choose between Strong Consistency (waiting for ACKs, risking availability) or Availability (confirming quickly, allowing temporary staleness).",
          },
          {
            q: "Why do replicas track version numbers?",
            a: "Monotonic version numbers detect stale reads and ensure old out-of-order replication messages are ignored.",
          },
          {
            q: "What happens in Strong consistency when a replica is down?",
            a: "The write is aborted or blocked because the required synchronous acknowledgement cannot be obtained from the dead replica.",
          },
        ]}
      />

      {/* Outcome Banner */}
      {lastResult && (
        <ResultBanner
          type={lastResult.success ? 'success' : 'danger'}
          title={
            lastResult.success
              ? mode === 'strong'
                ? 'STRONG CONSISTENCY: Synchronous ACKs Received'
                : 'EVENTUAL CONSISTENCY: Fast Confirmation & Async Convergence'
              : 'REPLICATION WRITE FAILED / BLOCKED'
          }
          description={
            lastResult.success
              ? mode === 'strong'
                ? `Synchronous commit acknowledged by Replica 2 and Replica 3. All copies updated to version ${primaryVersion}.`
                : `Primary Node 1 confirmed write immediately. Asynchronous updates delivered across simulated delay window.`
              : lastResult.error
          }
        />
      )}

      {/* Stale Read Popover Info */}
      {readModal && (
        <div className="p-3 rounded-md bg-[#0f172a] border border-[#222f49] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className={`w-4 h-4 ${readModal.isStale ? 'text-amber-400' : 'text-emerald-400'}`} />
            <span>
              Read from {readModal.nodeName}: Balance is{' '}
              <strong className="font-mono text-emerald-400">₹{readModal.balance}</strong> (version {readModal.version})
              {readModal.isStale && (
                <span className="text-amber-400 font-semibold ml-2">[STALE DATA! Primary is at v{primaryVersion}]</span>
              )}
            </span>
          </div>
          <button
            onClick={() => setReadModal(null)}
            className="text-slate-400 hover:text-slate-200 text-xs px-2 py-0.5 rounded bg-slate-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3 Replicas Comparison Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Primary Node 1 */}
        <div className="dash-panel p-3.5 border-blue-500/50 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#1e293b]">
              <span className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Primary (Node 1)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                PRIMARY
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#0b101d] border border-[#1e293b] text-center my-2 font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{account} Balance</span>
              <span className="text-2xl font-bold text-emerald-400 mt-0.5 block">
                ₹{primary?.accounts?.[account]?.balance ?? 10000}
              </span>
              <span className="text-[11px] text-blue-400 mt-0.5 block font-semibold">
                Version: v{primaryVersion}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1e293b]">
            <button
              onClick={() => handleReadFromNode(primary)}
              className="btn-secondary w-full justify-center py-1.5 text-xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Read from Primary</span>
            </button>
          </div>
        </div>

        {/* Replica 1 (Node 2) */}
        <div
          className={`dash-panel p-3.5 flex flex-col justify-between transition-all ${
            !replica1?.alive
              ? 'opacity-60 border-red-900/40 bg-red-950/10'
              : isR1Stale
              ? 'border-amber-500/60 bg-[#1e1a12]'
              : 'border-[#1e293b]'
          }`}
        >
          <div>
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#1e293b]">
              <span className="font-semibold text-xs text-slate-100">Replica 1 (Node 2)</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                  !replica1?.alive
                    ? 'bg-red-950/40 text-red-400'
                    : isR1Stale
                    ? 'bg-amber-950/40 text-amber-300 border border-amber-700/40'
                    : 'bg-emerald-950/40 text-emerald-300 border border-emerald-700/40'
                }`}
              >
                {!replica1?.alive ? 'DEAD' : isR1Stale ? 'STALE' : 'SYNCHRONIZED'}
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#0b101d] border border-[#1e293b] text-center my-2 font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{account} Balance</span>
              <span className="text-2xl font-bold text-emerald-400 mt-0.5 block">
                ₹{replica1?.accounts?.[account]?.balance ?? 10000}
              </span>
              <span className={`text-[11px] mt-0.5 block font-semibold ${isR1Stale ? 'text-amber-400' : 'text-slate-400'}`}>
                Version: v{r1Version} {isR1Stale && '(Stale)'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1e293b] flex gap-2">
            <button
              onClick={() => handleReadFromNode(replica1)}
              disabled={!replica1?.alive}
              className="btn-secondary flex-1 justify-center py-1 text-xs"
            >
              <Eye className="w-3 h-3" />
              <span>Read R1</span>
            </button>
            <button
              id="replica1-toggle-btn"
              onClick={() => toggleNodeLiveness(2, replica1?.alive)}
              className="btn-danger py-1 px-2 text-xs"
            >
              {replica1?.alive ? 'Crash' : 'Recover'}
            </button>
          </div>
        </div>

        {/* Replica 2 (Node 3) */}
        <div
          className={`dash-panel p-3.5 flex flex-col justify-between transition-all ${
            !replica2?.alive
              ? 'opacity-60 border-red-900/40 bg-red-950/10'
              : isR2Stale
              ? 'border-amber-500/60 bg-[#1e1a12]'
              : 'border-[#1e293b]'
          }`}
        >
          <div>
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#1e293b]">
              <span className="font-semibold text-xs text-slate-100">Replica 2 (Node 3)</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                  !replica2?.alive
                    ? 'bg-red-950/40 text-red-400'
                    : isR2Stale
                    ? 'bg-amber-950/40 text-amber-300 border border-amber-700/40'
                    : 'bg-emerald-950/40 text-emerald-300 border border-emerald-700/40'
                }`}
              >
                {!replica2?.alive ? 'DEAD' : isR2Stale ? 'STALE' : 'SYNCHRONIZED'}
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#0b101d] border border-[#1e293b] text-center my-2 font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{account} Balance</span>
              <span className="text-2xl font-bold text-emerald-400 mt-0.5 block">
                ₹{replica2?.accounts?.[account]?.balance ?? 10000}
              </span>
              <span className={`text-[11px] mt-0.5 block font-semibold ${isR2Stale ? 'text-amber-400' : 'text-slate-400'}`}>
                Version: v{r2Version} {isR2Stale && '(Stale)'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1e293b] flex gap-2">
            <button
              onClick={() => handleReadFromNode(replica2)}
              disabled={!replica2?.alive}
              className="btn-secondary flex-1 justify-center py-1 text-xs"
            >
              <Eye className="w-3 h-3" />
              <span>Read R2</span>
            </button>
            <button
              id="replica2-toggle-btn"
              onClick={() => toggleNodeLiveness(3, replica2?.alive)}
              className="btn-danger py-1 px-2 text-xs"
            >
              {replica2?.alive ? 'Crash' : 'Recover'}
            </button>
          </div>
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="dash-panel p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Consistency Mode */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Protocol:</span>
          <div className="bg-[#0b101d] p-0.5 rounded border border-[#222f49] flex gap-1 font-mono text-xs">
            <button
              id="mode-strong-btn"
              onClick={() => setMode('strong')}
              className={`px-3 py-1 rounded transition-colors ${
                mode === 'strong' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Strong (Synchronous ACKs)
            </button>
            <button
              id="mode-eventual-btn"
              onClick={() => setMode('eventual')}
              className={`px-3 py-1 rounded transition-colors ${
                mode === 'eventual' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Eventual (Async Propagation)
            </button>
          </div>
        </div>

        {/* Amount */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Withdraw Amount:</span>
          <input
            id="replication-amount-input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-20 bg-[#0b101d] border border-[#222f49] rounded p-1 text-xs text-slate-200 font-mono"
          />
        </div>

        {/* Trigger */}
        <div className="flex items-center gap-2">
          <button
            id="send-replication-write-btn"
            onClick={handleWrite}
            disabled={loading}
            className="btn-primary py-1.5 px-4 text-xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loading ? 'Replicating...' : `Execute ${mode.toUpperCase()} Write`}</span>
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
