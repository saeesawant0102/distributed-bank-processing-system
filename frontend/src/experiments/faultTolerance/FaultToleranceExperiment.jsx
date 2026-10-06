import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExperimentDescription } from '../../components/ExperimentDescription';
import { SimulationControls } from '../../components/SimulationControls';
import { EventLog } from '../../components/EventLog';
import { ResultBanner } from '../../components/ResultBanner';
import { ShieldAlert, Activity, Power, Play, RotateCcw, ArrowRight } from 'lucide-react';

export function FaultToleranceExperiment({ sim }) {
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

  const [amount, setAmount] = useState(500);
  const [account, setAccount] = useState('A101');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const primaryId = clusterState?.primaryId ?? 1;
  const backupId = clusterState?.backupId ?? 2;
  const epoch = clusterState?.epoch ?? 1;

  const primaryNode = clusterState?.nodes?.find((n) => n.id === primaryId);
  const backupNode = clusterState?.nodes?.find((n) => n.id === backupId);

  const isPrimaryAlive = primaryNode ? primaryNode.alive : true;

  const handleSendTransaction = async () => {
    setLoading(true);
    setLastResult(null);
    try {
      const res = await api.runFailover({
        action: 'transaction',
        account,
        amount: Number(amount),
      });
      setLastResult(res);
      refreshState();
    } catch (err) {
      console.error('Transaction error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFailPrimary = async () => {
    setLoading(true);
    setLastResult(null);
    try {
      const res = await api.runFailover({
        action: 'fail_primary',
      });
      setLastResult(res);
      refreshState();
    } catch (err) {
      console.error('Fail primary error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverOldPrimary = async () => {
    setLoading(true);
    setLastResult(null);
    try {
      const res = await api.runFailover({
        action: 'recover_old_primary',
      });
      setLastResult(res);
      refreshState();
    } catch (err) {
      console.error('Recover error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ExperimentDescription
        title="Experiment 7: Primary-Backup Fault Tolerance & Failover"
        concept="High Availability architectures implement a Primary-Backup replication model with periodic heartbeat polling. The Primary executes transactions and synchronizes each update to the Backup. If the Primary crashes, the Backup detects missed heartbeats (threshold 3/3), increments the cluster Epoch to guard against split-brain scenarios, and promotes itself to Primary. When the failed node recovers, it observes the higher epoch, steps down to backup, and resynchronizes its ledger."
        scenario="Node 1 processes client transactions as Primary and replicates to Backup Node 2. When Node 1 fails, Node 2 detects 3 missed heartbeats and promotes itself to Primary (Epoch 2). Subsequent transactions succeed on Node 2 without data loss. When Node 1 recovers, it rejoins as Backup and pulls the updated state."
        viva={[
          {
            q: "How does the backup detect that the primary has failed?",
            a: "Through periodic heartbeat messages. If heartbeats are missed beyond a predefined threshold (e.g. 3 consecutive timeouts), the backup declares the primary dead and triggers failover.",
          },
          {
            q: "What is Split-Brain syndrome and how does Epoch/Term numbering prevent it?",
            a: "Split-brain occurs when a network partition makes both nodes assume primary leadership simultaneously, accepting conflicting writes. Monotonically increasing epoch numbers ensure that any node observing a higher epoch immediately steps down.",
          },
          {
            q: "Why is synchronous replication required between Primary and Backup for zero data loss?",
            a: "If replication was asynchronous, in-flight transactions committed at the primary might not have arrived at the backup before the crash, causing data loss during promotion.",
          },
        ]}
      />

      {/* Outcome Banner */}
      {lastResult?.action === 'fail_primary' && (
        <ResultBanner
          type="danger"
          title={`PRIMARY FAILOVER TRIGGERED: Node ${lastResult.newPrimaryId} Promoted to PRIMARY`}
          description={`Original primary crashed. Backup observed 3/3 missed heartbeats and promoted itself to Primary under Epoch ${lastResult.epoch}. All new transactions now route to Node ${lastResult.newPrimaryId}.`}
        />
      )}

      {lastResult?.action === 'recover_old_primary' && (
        <ResultBanner
          type="success"
          title={`OLD PRIMARY RECOVERED: Rejoined as BACKUP (Epoch ${lastResult.epoch})`}
          description={`Recovered node detected higher cluster epoch, stepped down to avoid split-brain, and synchronized full ledger from active Primary Node ${lastResult.primaryId}.`}
        />
      )}

      {lastResult?.action === 'transaction' && lastResult.success && (
        <ResultBanner
          type="success"
          title={`Transaction Committed on Active Primary Node ${lastResult.primaryId}`}
          description={`Processed debit of ₹${amount} on ${account} under Epoch ${lastResult.epoch}. New balance: ₹${lastResult.balance}. Synchronously replicated to backup.`}
        />
      )}

      {/* Primary vs Backup Technical View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Active Primary */}
        <div className="dash-panel p-3.5 border-blue-500/50 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#1e293b]">
              <span className="font-semibold text-xs text-slate-100 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                Active Primary (Node {primaryId})
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40 font-bold">
                EPOCH {epoch}
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#0b101d] border border-[#1e293b] text-center my-2 font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{account} Balance</span>
              <span className="text-2xl font-bold text-emerald-400 mt-0.5 block">
                ₹{primaryNode?.accounts?.[account]?.balance ?? 10000}
              </span>
              <span className="text-[11px] text-blue-400 mt-0.5 block font-semibold">
                Status: {isPrimaryAlive ? 'ONLINE / SERVING' : 'FAILED / CRASHED'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Heartbeat Signal:</span>
            <span className={`font-mono text-[11px] font-semibold flex items-center gap-1 ${isPrimaryAlive ? 'text-emerald-400' : 'text-red-400'}`}>
              <Activity className="w-3 h-3" /> {isPrimaryAlive ? 'Active (Emitting)' : 'Silent (Zero Signal)'}
            </span>
          </div>
        </div>

        {/* Hot Standby Backup */}
        <div
          className={`dash-panel p-3.5 flex flex-col justify-between transition-all ${
            backupNode?.alive ? 'border-[#1e293b]' : 'border-red-900/40 bg-red-950/10 opacity-60'
          }`}
        >
          <div>
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-[#1e293b]">
              <span className="font-semibold text-xs text-slate-100">
                Backup Hot Standby (Node {backupId})
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-semibold">
                STANDBY
              </span>
            </div>

            <div className="p-2.5 rounded bg-[#0b101d] border border-[#1e293b] text-center my-2 font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">{account} Replicated Balance</span>
              <span className="text-2xl font-bold text-emerald-400 mt-0.5 block">
                ₹{backupNode?.accounts?.[account]?.balance ?? 10000}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block font-semibold">
                Status: {backupNode?.alive ? 'MONITORING HEARTBEAT' : 'OFFLINE'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">Failover Trigger:</span>
            <span className="font-mono text-[11px] text-slate-300">Threshold: 3 Missed Beats</span>
          </div>
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="dash-panel p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Transaction input */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Debit (₹):</span>
          <input
            id="failover-amount-input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-20 bg-[#0b101d] border border-[#222f49] rounded p-1 text-xs text-slate-200 font-mono"
          />
          <button
            id="send-failover-txn-btn"
            onClick={handleSendTransaction}
            disabled={loading}
            className="btn-primary py-1.5 px-3 text-xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Send Txn</span>
          </button>
        </div>

        {/* Failover / Recovery Actions */}
        <div className="flex items-center gap-2">
          <button
            id="crash-primary-btn"
            onClick={handleFailPrimary}
            disabled={loading}
            className="btn-danger py-1.5 px-3 text-xs"
          >
            <Power className="w-3.5 h-3.5" />
            <span>Crash Active Primary</span>
          </button>

          <button
            id="recover-old-primary-btn"
            onClick={handleRecoverOldPrimary}
            disabled={loading}
            className="btn-success py-1.5 px-3 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Recover Old Primary</span>
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
