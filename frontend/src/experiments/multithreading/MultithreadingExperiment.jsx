import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExperimentHeader } from '../../components/ExperimentHeader';
import { SimulationControls } from '../../components/SimulationControls';
import { EventLog } from '../../components/EventLog';
import { ResultBanner } from '../../components/ResultBanner';
import { Cpu, Lock, Unlock, Play, ListOrdered } from 'lucide-react';

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

  const threadEvents = displayedEvents.filter(
    (e) => e.experiment === 'multithreading' || e.type?.includes('TRANSACTION') || e.type?.includes('THREAD')
  );

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <ExperimentHeader
        number="02"
        title="CONCURRENCY"
        subtitle="Multithreading & Mutex Locks Simulation"
        concept="Concurrent worker threads executing READ → COMPUTE → WRITE cycles on shared memory. Demonstrating Race Conditions vs Mutex Lock serialization."
        viva={[
          {
            q: "What constitutes a race condition?",
            a: "A race condition occurs when system behavior depends on the uncontrolled sequence or timing of concurrent execution threads accessing shared mutable state.",
          },
        ]}
      />

      {/* LARGE SIMULATION CANVAS (60-70% Height) */}
      <div className="dash-panel p-5 bg-[#090e1a] border-purple-500/30 flex flex-col justify-between min-h-[380px]">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e293b]">
          <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            SIMULATION CANVAS — Transaction Queue ➔ Worker Thread Lanes ➔ Account A101
          </h3>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-slate-400">Lock:</span>
            {mode === 'mutex' ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40">
                <Lock className="w-3.5 h-3.5" /> Mutex Locked
              </span>
            ) : (
              <span className="text-red-400 font-bold flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/60 border border-red-800/40">
                <Unlock className="w-3.5 h-3.5" /> Unlocked (Unsafe)
              </span>
            )}
          </div>
        </div>

        {/* 3-Column Visual Flow Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 my-auto items-stretch">
          {/* Transaction Queue */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b]">
                <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5 font-mono">
                  <ListOrdered className="w-3.5 h-3.5 text-blue-400" />
                  Transaction Queue
                </span>
                <span className="text-[10px] font-mono text-slate-400">Target: A101</span>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="p-2.5 rounded-lg bg-[#060a12] border border-[#1e293b]">
                  <div className="flex justify-between text-blue-400 font-bold mb-0.5">
                    <span>TXN-1 (Worker 1)</span>
                    <span>Withdraw ₹800</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">Account A101 (Rahul)</div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#060a12] border border-[#1e293b]">
                  <div className="flex justify-between text-purple-400 font-bold mb-0.5">
                    <span>TXN-2 (Worker 2)</span>
                    <span>Withdraw ₹700</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans">Account A101 (Rahul)</div>
                </div>
              </div>
            </div>

            <div className="mt-2 p-2 rounded bg-[#060a12] border border-[#1e293b] text-[10px] text-slate-400 font-mono space-y-0.5">
              <div>Initial Balance: <strong className="text-emerald-400">₹1,000</strong></div>
              <div>Requested Debit: <strong className="text-red-400">₹1,500 Total</strong></div>
            </div>
          </div>

          {/* Worker Execution Lanes */}
          <div className="p-4 rounded-xl bg-[#060a12] border border-[#1e293b] space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
              <span className="font-bold text-xs text-slate-100 font-mono">
                Worker Lanes ({workerCount} Active)
              </span>
              <span className="text-[10px] font-mono text-slate-400">Thread Pool</span>
            </div>

            {[1, 2, 3].slice(0, workerCount).map((workerId) => {
              const isAssigned = workerId <= 2;
              return (
                <div
                  key={workerId}
                  className="p-2.5 rounded-lg bg-[#0f172a] border border-[#1e293b] space-y-1.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-200 text-xs font-mono">Worker #{workerId}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        !isAssigned
                          ? 'bg-slate-800 text-slate-500'
                          : mode === 'unsafe'
                          ? 'bg-red-950/80 text-red-300 border border-red-800/40'
                          : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40'
                      }`}
                    >
                      {!isAssigned ? 'IDLE' : mode === 'unsafe' ? 'UNSAFE READ' : 'SERIALIZED MUTEX'}
                    </span>
                  </div>

                  {/* 3 Step Sequence */}
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-center font-mono">
                    <div className="p-1 rounded bg-[#060a12] border border-slate-800 text-blue-400 font-bold">
                      1. READ
                    </div>
                    <div className="p-1 rounded bg-[#060a12] border border-slate-800 text-amber-400 font-bold">
                      2. COMPUTE
                    </div>
                    <div className="p-1 rounded bg-[#060a12] border border-slate-800 text-purple-400 font-bold">
                      3. WRITE
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 font-sans truncate">
                    {workerId === 1 && 'Processing TXN-1: Debit ₹800'}
                    {workerId === 2 && (mode === 'unsafe' ? 'Processing TXN-2: Stale ₹1,000 read!' : 'Awaiting Mutex Lock...')}
                    {workerId === 3 && 'Awaiting dispatch'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Account Balance Memory */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1e293b]">
                <span className="font-bold text-xs text-slate-100 font-mono">
                  Shared Account Memory
                </span>
                <span className="text-[10px] font-mono text-slate-400">Account A101</span>
              </div>

              <div className="p-3 rounded-xl bg-[#060a12] border border-[#1e293b] text-center my-2 font-mono">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  Current Balance
                </span>
                <span className="text-3xl font-bold text-emerald-400 mt-0.5 block">
                  ₹{currentA101Balance}
                </span>
                <span className="text-[10px] text-slate-400 font-sans mt-0.5 block">
                  Customer: Rahul
                </span>
              </div>

              <div className="p-2 rounded-lg bg-[#060a12] border border-[#1e293b] text-xs space-y-1 font-mono mt-2">
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Expected (Mutex):</span>
                  <span className="text-emerald-400 font-bold">₹200</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Unsafe Anomaly:</span>
                  <span className="text-red-400 font-bold">₹300 (Lost Update)</span>
                </div>
              </div>
            </div>
          </div>
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
                <span className="text-slate-300 font-semibold">Concurrency Mode:</span>
                <div className="bg-[#060a12] p-1 rounded-lg border border-[#222f49] flex gap-1 font-mono text-xs">
                  <button
                    id="mode-unsafe-btn"
                    onClick={() => setMode('unsafe')}
                    className={`px-3 py-1.5 rounded-md transition-all font-bold ${
                      mode === 'unsafe' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Unsafe (No Lock)
                  </button>
                  <button
                    id="mode-mutex-btn"
                    onClick={() => setMode('mutex')}
                    className={`px-3 py-1.5 rounded-md transition-all font-bold ${
                      mode === 'mutex' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Mutex (Locked)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-semibold">Worker Threads:</span>
                <div className="bg-[#060a12] p-1 rounded-lg border border-[#222f49] flex gap-1 font-mono">
                  {[1, 2, 3].map((count) => (
                    <button
                      key={count}
                      onClick={() => setWorkerCount(count)}
                      id={`worker-count-${count}-btn`}
                      className={`px-3 py-1 rounded-md text-xs font-bold ${
                        workerCount === count ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e293b] space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                id="run-race-demo-btn"
                onClick={handleRunRaceDemo}
                disabled={loading}
                className={`btn-primary py-2 px-3 text-xs font-bold justify-center ${
                  mode === 'unsafe' ? '!bg-red-600 hover:!bg-red-700' : '!bg-emerald-600 hover:!bg-emerald-700'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>{loading ? 'Simulating...' : `Run ${mode.toUpperCase()} Demo`}</span>
              </button>

              <button
                id="run-batch-queue-btn"
                onClick={handleRunBatch}
                disabled={loading}
                className="btn-secondary py-2 px-3 text-xs font-bold justify-center"
              >
                <span>Run 4-Txn Batch</span>
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
          <EventLog events={threadEvents.length > 0 ? threadEvents : displayedEvents} onClear={clearLog} maxHeight="320px" />
        </div>
      </div>

      {/* RESULT / CURRENT STATE BANNER */}
      {lastResult?.raceDetected && (
        <ResultBanner
          type="race"
          title="RACE CONDITION DETECTED: Lost Update Anomaly"
          description={`Worker 1 and Worker 2 executed overlapping READ-COMPUTE-WRITE cycles. Initial balance: ₹${lastResult.initialBalance}. Withdrawals: ₹1,500. Ending balance: ₹${lastResult.actualBalance} (Expected under serialization: ₹${lastResult.expectedBalance})`}
        />
      )}

      {lastResult && !lastResult.raceDetected && lastResult.mode === 'mutex' && (
        <ResultBanner
          type="success"
          title="MUTEX LOCK PREVENTED RACE CONDITION"
          description={`Worker 1 acquired the mutex, committed TXN-1 (₹800 debit, balance ₹200), and released the lock. Worker 2 subsequently observed ₹200, cleanly rejecting overdraft.`}
        />
      )}
    </div>
  );
}
