import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExperimentDescription } from '../../components/ExperimentDescription';
import { SimulationControls } from '../../components/SimulationControls';
import { EventLog } from '../../components/EventLog';
import { ResultBanner } from '../../components/ResultBanner';
import { Cpu, Lock, Unlock, Play, Layers, ListOrdered } from 'lucide-react';

export function MultithreadingExperiment({ sim }) {
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

  const [mode, setMode] = useState('unsafe'); // 'unsafe' | 'mutex'
  const [workerCount, setWorkerCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const serverNode = clusterState?.nodes?.find((n) => n.id === 1);
  const currentA101Balance = serverNode?.accounts?.['A101']?.balance ?? 1000;

  const handleRunRaceDemo = async () => {
    setLoading(true);
    setLastResult(null);
    try {
      const res = await api.runThreads({
        mode,
        workerCount,
        isRaceDemo: true,
      });
      setLastResult(res);
      refreshState();
    } catch (err) {
      console.error('Multithreading demo error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunBatch = async () => {
    setLoading(true);
    setLastResult(null);
    try {
      const res = await api.runThreads({
        mode,
        workerCount,
        isRaceDemo: false,
      });
      setLastResult(res);
      refreshState();
    } catch (err) {
      console.error('Batch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ExperimentDescription
        title="Experiment 2: Multithreading & Mutex Locks"
        concept="Multi-threaded banking servers use worker threads to handle concurrent client requests. When workers concurrently read and write the same account balance without synchronization, an interleaved execution causes a Race Condition (Lost Update anomaly). Mutual exclusion (Mutex) locks serialize concurrent transactions on shared memory."
        scenario="Account A101 starts with ₹1,000. Worker 1 withdraws ₹800 while Worker 2 concurrently withdraws ₹700. In Unsafe mode, both workers read ₹1,000 concurrently, allowing ₹1,500 total to be withdrawn! In Mutex mode, Worker 2 waits for Worker 1 to release the lock, observes the new balance of ₹200, and cleanly fails due to insufficient funds."
        viva={[
          {
            q: "What constitutes a race condition?",
            a: "A race condition occurs when system behavior depends on the uncontrolled sequence or timing of concurrent execution threads accessing shared mutable state.",
          },
          {
            q: "How does a Mutex prevent the lost update anomaly?",
            a: "A Mutex enforces mutual exclusion: only one thread holds the lock at any instant. Concurrent threads wait until the lock is released, ensuring serializability.",
          },
          {
            q: "How do you avoid deadlock with multiple locks?",
            a: "Enforce a strict global lock acquisition ordering (e.g. always acquiring account locks in ascending order of their account IDs).",
          },
        ]}
      />

      {/* Outcome Banner */}
      {lastResult?.raceDetected && (
        <ResultBanner
          type="race"
          title="RACE CONDITION DETECTED: Lost Update Anomaly"
          description={`Both workers executed overlapping read-compute-write cycles on Account A101. Initial balance: ₹${lastResult.initialBalance}. Total withdrawals attempted: ₹1,500. Ending balance: ₹${lastResult.actualBalance} (Expected balance under serialization: ₹${lastResult.expectedBalance})`}
          details="Anomaly: Worker 2 computed new balance based on stale uncommitted read, overwriting Worker 1's debit."
        />
      )}

      {lastResult && !lastResult.raceDetected && lastResult.mode === 'mutex' && (
        <ResultBanner
          type="success"
          title="MUTEX LOCK PREVENTED RACE CONDITION"
          description={`Worker 1 acquired the mutex, committed TXN-1 (₹800 debit, balance ₹200), and released the lock. Worker 2 subsequently acquired the lock, detected insufficient funds for ₹700, and rejected the overdraft cleanly.`}
          details={`Final balance accurately preserved at ₹${lastResult.actualBalance} (Zero overdraft).`}
        />
      )}

      {/* Technical Concurrency Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left: Transaction Queue */}
        <div className="dash-panel p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b]">
              <h4 className="font-semibold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ListOrdered className="w-3.5 h-3.5 text-blue-400" />
                Transaction Queue
              </h4>
              <span className="text-[10px] font-mono text-slate-400">Target: A101</span>
            </div>

            <div className="space-y-2 mt-2 font-mono text-xs">
              <div className="p-2.5 rounded bg-[#0b101d] border border-[#1e293b]">
                <div className="flex justify-between text-blue-400 font-semibold">
                  <span>TXN-1</span>
                  <span>Withdraw ₹800</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Account: A101 (Rahul)</div>
              </div>

              <div className="p-2.5 rounded bg-[#0b101d] border border-[#1e293b]">
                <div className="flex justify-between text-purple-400 font-semibold">
                  <span>TXN-2</span>
                  <span>Withdraw ₹700</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Account: A101 (Rahul)</div>
              </div>
            </div>
          </div>

          <div className="mt-3 p-2 rounded bg-[#0b101d] border border-[#1e293b] text-[11px] text-slate-400 font-mono">
            Total Withdrawal Requested: <span className="text-red-400 font-bold">₹1,500</span>
          </div>
        </div>

        {/* Middle: Horizontal Worker Lanes */}
        <div className="dash-panel p-3.5">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b]">
            <h4 className="font-semibold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              Worker Thread Execution Lanes
            </h4>
            <span className="text-[10px] font-mono text-slate-400">{workerCount} Active Workers</span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {[1, 2, 3].slice(0, workerCount).map((workerId) => {
              const isAssigned = workerId <= 2;
              return (
                <div
                  key={workerId}
                  className="p-2.5 rounded bg-[#0b101d] border border-[#1e293b] flex flex-col gap-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200">Worker #{workerId}</span>
                    <span
                      className={`text-[10px] px-2 py-0.2 rounded font-semibold ${
                        !isAssigned
                          ? 'bg-slate-800 text-slate-500'
                          : mode === 'unsafe'
                          ? 'bg-red-950/40 text-red-400 border border-red-800/40'
                          : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                      }`}
                    >
                      {isAssigned ? (mode === 'unsafe' ? 'CONCURRENT READ' : 'SERIALIZED') : 'IDLE'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    {workerId === 1 && 'Processing TXN-1: Debit ₹800 on A101'}
                    {workerId === 2 && 'Processing TXN-2: Debit ₹700 on A101'}
                    {workerId === 3 && 'Awaiting transaction queue dispatch'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Account & Lock State */}
        <div className="dash-panel p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b]">
              <h4 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
                Account A101 State
              </h4>
              <div className="flex items-center gap-1 text-[11px] font-mono">
                {mode === 'mutex' ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <Lock className="w-3 h-3" /> Mutex Locked
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center gap-1 font-semibold">
                    <Unlock className="w-3 h-3" /> Unlocked (Unsafe)
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded bg-[#0b101d] border border-[#1e293b] text-center my-2 font-mono">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Current Ledger Balance
              </span>
              <span className="text-2xl font-bold text-emerald-400 mt-0.5 block">
                ₹{currentA101Balance}
              </span>
              <span className="text-[10px] text-slate-500 font-sans mt-0.5 block">
                Account: A101 (Rahul)
              </span>
            </div>

            <div className="p-2 rounded bg-[#0b101d] border border-[#1e293b] text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Initial Balance:</span>
                <span className="text-slate-200">₹1,000</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Expected (Mutex):</span>
                <span className="text-emerald-400">₹200</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Unsafe Actual:</span>
                <span className="text-red-400">₹300 (Anomaly)</span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 mt-2 font-sans">
            Compare Unsafe mode (lost update) against Mutex mode (serialized).
          </div>
        </div>
      </div>

      {/* Control Actions Bar */}
      <div className="dash-panel p-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300">Mode:</span>
          <div className="bg-[#0b101d] p-0.5 rounded border border-[#222f49] flex gap-1 font-mono text-xs">
            <button
              id="mode-unsafe-btn"
              onClick={() => setMode('unsafe')}
              className={`px-3 py-1 rounded transition-colors ${
                mode === 'unsafe'
                  ? 'bg-red-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unsafe (No Lock)
            </button>
            <button
              id="mode-mutex-btn"
              onClick={() => setMode('mutex')}
              className={`px-3 py-1 rounded transition-colors ${
                mode === 'mutex'
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mutex (Locked)
            </button>
          </div>
        </div>

        {/* Worker Count */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Workers:</span>
          <div className="bg-[#0b101d] p-0.5 rounded border border-[#222f49] flex gap-1 font-mono">
            {[1, 2, 3].map((count) => (
              <button
                key={count}
                onClick={() => setWorkerCount(count)}
                id={`worker-count-${count}-btn`}
                className={`px-2 py-0.5 rounded text-xs ${
                  workerCount === count
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Action Trigger Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="run-race-demo-btn"
            onClick={handleRunRaceDemo}
            disabled={loading}
            className={`btn-primary py-1.5 px-3.5 text-xs ${
              mode === 'unsafe' ? '!bg-red-600 hover:!bg-red-700' : '!bg-emerald-600 hover:!bg-emerald-700'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loading ? 'Simulating...' : `Run ${mode.toUpperCase()} Race Demo`}</span>
          </button>

          <button
            id="run-batch-queue-btn"
            onClick={handleRunBatch}
            disabled={loading}
            className="btn-secondary py-1.5 px-3 text-xs"
          >
            <span>Run 4-Txn Batch</span>
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
