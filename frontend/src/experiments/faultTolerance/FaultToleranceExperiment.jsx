import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExperimentHeader } from '../../components/ExperimentHeader';
import { SimulationControls } from '../../components/SimulationControls';
import { EventLog } from '../../components/EventLog';
import { ResultBanner } from '../../components/ResultBanner';
import { ShieldAlert, Activity, Power, Play, RotateCcw, ShieldCheck } from 'lucide-react';

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

  const failoverEvents = displayedEvents.filter(
    (e) => e.experiment === 'faultTolerance' || e.type?.includes('FAILOVER') || e.type?.includes('PRIMARY')
  );

  return (
    <div className="space-y-5">
      {/* 1. Header with Back Button */}
      <ExperimentHeader
        number="07"
        title="Primary-Backup Fault Tolerance & Failover"
        concept="High Availability architectures implement Primary-Backup replication with periodic heartbeats. The Primary executes transactions and synchronizes each update to Backup. If the Primary crashes, Backup detects missed heartbeats (threshold 3/3), increments the cluster Epoch to guard against split-brain, and promotes itself to Primary."
        viva={[
          {
            q: "How does the backup detect primary failure?",
            a: "Through periodic heartbeats. If heartbeats are missed beyond a threshold (3 consecutive timeouts), the backup declares the primary dead.",
          },
          {
            q: "What is Split-Brain syndrome and how does Epoch numbering prevent it?",
            a: "Split-brain occurs when a network partition makes both nodes assume primary leadership. Monotonically increasing epoch numbers ensure a node observing a higher epoch immediately steps down.",
          },
        ]}
      />

      {/* 2. MAIN SIMULATION HERO CANVAS */}
      <div className="dash-panel p-5 bg-[#0a0f1d] border-red-500/30">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1e293b]">
          <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            Main Simulation Canvas: Primary-Backup Heartbeat Monitor & Failover Engine
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40 font-bold uppercase">
            Cluster Epoch: e{epoch}
          </span>
        </div>

        {/* Primary ↔ Backup 2-Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Primary Node */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-blue-500/60 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-2 mb-3 border-b border-[#1e293b]">
                <span className="font-bold text-xs text-slate-100 flex items-center gap-2 font-mono">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  Active Primary (Node {primaryId})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40 font-bold">
                  EPOCH e{epoch}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#060a12] border border-[#1e293b] text-center my-2 font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">{account} Ledger Balance</span>
                <span className="text-3xl font-bold text-emerald-400 mt-1 block">
                  ₹{primaryNode?.accounts?.[account]?.balance ?? 10000}
                </span>
                <span className={`text-xs mt-1 block font-bold ${isPrimaryAlive ? 'text-blue-400' : 'text-red-400'}`}>
                  Status: {isPrimaryAlive ? 'ONLINE / SERVING TRAFFIC' : 'FAILED / UNRESPONSIVE'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 text-[11px]">Heartbeat Signal:</span>
              <span className={`text-[11px] font-bold flex items-center gap-1.5 ${isPrimaryAlive ? 'text-emerald-400' : 'text-red-400'}`}>
                <Activity className="w-3.5 h-3.5 animate-pulse" /> {isPrimaryAlive ? 'Emitting Heartbeat' : 'Zero Signal (Silent)'}
              </span>
            </div>
          </div>

          {/* Backup Standby Card */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
              backupNode?.alive ? 'border-[#1e293b] bg-[#0f172a]' : 'border-red-900/40 bg-red-950/20 opacity-60'
            }`}
          >
            <div>
              <div className="flex justify-between items-center pb-2 mb-3 border-b border-[#1e293b]">
                <span className="font-bold text-xs text-slate-100 font-mono flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  Backup Hot Standby (Node {backupId})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                  STANDBY
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#060a12] border border-[#1e293b] text-center my-2 font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">{account} Replicated Balance</span>
                <span className="text-3xl font-bold text-emerald-400 mt-1 block">
                  ₹{backupNode?.accounts?.[account]?.balance ?? 10000}
                </span>
                <span className="text-xs text-slate-400 mt-1 block font-bold">
                  Status: {backupNode?.alive ? 'MONITORING HEARTBEAT' : 'OFFLINE'}
                </span>
              </div>
            </div>

            {/* Missed Heartbeats Progress Gauge */}
            <div className="pt-2 border-t border-[#1e293b]">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-400 text-[11px]">Heartbeat Detection:</span>
                <span className="text-amber-400 font-bold">
                  {!isPrimaryAlive ? '3 / 3 Missed (FAILOVER)' : '0 / 3 Missed (Healthy)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                <div className={`h-2 rounded ${!isPrimaryAlive ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <div className={`h-2 rounded ${!isPrimaryAlive ? 'bg-red-500' : 'bg-slate-800'}`} />
                <div className={`h-2 rounded ${!isPrimaryAlive ? 'bg-red-500' : 'bg-slate-800'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTROLS & LIVE EVENT LOG ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Controls Card */}
        <div className="dash-panel p-4 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Failover Controls & Triggers
            </h4>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Debit Amount (₹):</span>
                <input
                  id="failover-amount-input"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-28 bg-[#060a12] border border-[#222f49] rounded p-1.5 text-xs text-slate-200 font-mono"
                />
              </div>

              <button
                id="send-failover-txn-btn"
                onClick={handleSendTransaction}
                disabled={loading}
                className="btn-primary w-full justify-center py-2 text-xs font-bold"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Send Transaction to Active Primary</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e293b] space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                id="crash-primary-btn"
                onClick={handleFailPrimary}
                disabled={loading}
                className="btn-danger py-2.5 px-3.5 text-xs font-bold justify-center shadow-md"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Crash Active Primary</span>
              </button>

              <button
                id="recover-old-primary-btn"
                onClick={handleRecoverOldPrimary}
                disabled={loading}
                className="btn-success py-2.5 px-3.5 text-xs font-bold justify-center shadow-md"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Recover Old Primary</span>
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

        {/* Scoped Live Event Log */}
        <div className="h-full">
          <EventLog events={failoverEvents.length > 0 ? failoverEvents : displayedEvents} onClear={clearLog} maxHeight="340px" />
        </div>
      </div>

      {/* 4. CURRENT STATE / RESULT BANNER */}
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
    </div>
  );
}
