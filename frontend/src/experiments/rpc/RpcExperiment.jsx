import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExperimentHeader } from '../../components/ExperimentHeader';
import { SimulationControls } from '../../components/SimulationControls';
import { EventLog } from '../../components/EventLog';
import { ResultBanner } from '../../components/ResultBanner';
import { Radio, Laptop, Server, Code, RefreshCw } from 'lucide-react';

export function RpcExperiment({ sim }) {
  const {
    clusterState,
    displayedEvents,
    lastEvent,
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

  const [fromAccount, setFromAccount] = useState('A101');
  const [toAccount, setToAccount] = useState('A102');
  const [amount, setAmount] = useState(500);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const serverNode = clusterState?.nodes?.find((n) => n.id === 1);
  const isServerAlive = serverNode ? serverNode.alive : true;

  const currentStage = lastEvent?.data?.stage || (lastResult ? 'completed' : 'idle');

  const handleSendTransfer = async () => {
    setLoading(true);
    setLastResult(null);
    try {
      const res = await api.runRpc({
        from: fromAccount,
        to: toAccount,
        amount: Number(amount),
        serverNodeId: 1,
      });
      setLastResult(res);
      refreshState();
    } catch (err) {
      console.error('RPC Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const accounts = serverNode?.accounts || {};

  const requestPayload = {
    method: 'transferMoney',
    params: { from: fromAccount, to: toAccount, amount: Number(amount) },
    requestId: 'RPC-REQ-8492',
    targetNode: 1,
  };

  const rpcEvents = displayedEvents.filter(
    (e) => e.experiment === 'rpc' || e.type?.includes('RPC')
  );

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <ExperimentHeader
        number="01"
        title="REMOTE PROCEDURE CALL"
        subtitle="Remote Procedure Call (RPC) Protocol Simulation"
        concept="Client stub parameter marshalling, transport socket transmission, and server skeleton dispatch execution."
        viva={[
          {
            q: "What is the role of an RPC Stub vs Skeleton?",
            a: "The Stub resides on the client acting as a local function proxy that marshals parameters into network messages. The Skeleton resides on the server, unpacks the message, and executes the procedure.",
          },
        ]}
      />

      {/* LARGE SIMULATION CANVAS (60-70% Height) */}
      <div className="dash-panel p-5 bg-[#090e1a] border-blue-500/30 flex flex-col justify-between min-h-[380px]">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e293b]">
          <h3 className="font-bold text-xs text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-400" />
            SIMULATION CANVAS — Client Stub ↔ Network Transport ↔ Server Skeleton
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Node 1 Skeleton</span>
        </div>

        {/* 3-Column Visual Flow Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-auto items-stretch">
          {/* Client Application */}
          <div className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5 font-mono">
                  <Laptop className="w-4 h-4 text-blue-400" />
                  Client Stub
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40 font-bold">
                  CALLER
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-[#060a12] border border-slate-800 text-[11px] font-mono space-y-1 text-slate-300 my-2">
                <div className="text-blue-400 font-bold">rpc.transferMoney(&#123;</div>
                <div className="pl-3 text-slate-400">from: '{fromAccount}',</div>
                <div className="pl-3 text-slate-400">to: '{toAccount}',</div>
                <div className="pl-3 text-slate-400">amount: ₹{amount}</div>
                <div>&#125;);</div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60 flex justify-between">
              <span>Status: {loading ? 'WAITING ACK...' : 'READY'}</span>
              <span>Client-01</span>
            </div>
          </div>

          {/* Network Channel Packet Transport */}
          <div className="p-4 rounded-xl bg-[#060a12] border border-[#1e293b] flex flex-col justify-center items-center gap-3 relative">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 tracking-wider">
              Network Socket Channel
            </span>

            {/* Request Packet Animation */}
            <div className="w-full relative py-2">
              <div className="h-1 bg-blue-500/30 w-full rounded relative overflow-hidden">
                {loading && (
                  <div className="absolute top-0 bottom-0 w-8 bg-blue-400 shadow-[0_0_12px_#3b82f6] animate-pulse" style={{ left: '50%' }} />
                )}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-blue-400 mt-1 font-bold">
                <span>Request ▶</span>
                <span>JSON Payload</span>
              </div>
            </div>

            <div className="px-3 py-1 rounded-full bg-[#0f172a] border border-slate-800 text-[11px] font-mono text-slate-300">
              IPC TCP Stream
            </div>

            {/* Response Packet Animation */}
            <div className="w-full relative py-2">
              <div className="h-1 bg-emerald-500/30 w-full rounded relative overflow-hidden">
                {lastResult && (
                  <div className="absolute top-0 bottom-0 w-8 bg-emerald-400 shadow-[0_0_12px_#10b981]" style={{ left: '20%' }} />
                )}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-emerald-400 mt-1 font-bold">
                <span>◀ Response</span>
                <span>Result Data</span>
              </div>
            </div>
          </div>

          {/* Server Skeleton (Node 1) */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
              isServerAlive ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-red-950/20 border-red-900/50 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5 font-mono">
                  <Server className="w-4 h-4 text-slate-300" />
                  Server Skeleton
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    isServerAlive
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/50'
                      : 'bg-red-950/80 text-red-300 border border-red-800/50'
                  }`}
                >
                  {isServerAlive ? 'ONLINE' : 'CRASHED'}
                </span>
              </div>

              {/* 4 Pipeline Stages */}
              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono my-2">
                <div
                  className={`p-1.5 rounded border text-center font-bold transition-all ${
                    currentStage === 'server_unmarshalled' || currentStage === 'receive'
                      ? 'bg-blue-950/90 border-blue-500 text-blue-300'
                      : 'bg-[#060a12] border-slate-800 text-slate-500'
                  }`}
                >
                  1. Unmarshal
                </div>
                <div
                  className={`p-1.5 rounded border text-center font-bold transition-all ${
                    currentStage === 'validation'
                      ? 'bg-amber-950/90 border-amber-500 text-amber-300'
                      : 'bg-[#060a12] border-slate-800 text-slate-500'
                  }`}
                >
                  2. Validate
                </div>
                <div
                  className={`p-1.5 rounded border text-center font-bold transition-all ${
                    currentStage === 'execution'
                      ? 'bg-purple-950/90 border-purple-500 text-purple-300'
                      : 'bg-[#060a12] border-slate-800 text-slate-500'
                  }`}
                >
                  3. Execute
                </div>
                <div
                  className={`p-1.5 rounded border text-center font-bold transition-all ${
                    currentStage === 'completed' || currentStage === 'error'
                      ? 'bg-emerald-950/90 border-emerald-500 text-emerald-300'
                      : 'bg-[#060a12] border-slate-800 text-slate-500'
                  }`}
                >
                  4. Respond
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">Procedure: transferMoney</span>
              <button
                id="toggle-node1-crash-btn"
                onClick={() => toggleNodeLiveness(1, isServerAlive)}
                className={`text-[11px] px-2 py-0.5 rounded font-mono font-semibold ${
                  isServerAlive ? 'bg-red-950/40 text-red-400 border border-red-800/40' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                }`}
              >
                {isServerAlive ? 'Crash' : 'Recover'}
              </button>
            </div>
          </div>
        </div>

        {/* JSON Request & Ledger State Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-[#1e293b]">
          <div className="p-2.5 rounded-lg bg-[#060a12] border border-[#1e293b]">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1 mb-1">
              <Code className="w-3.5 h-3.5 text-blue-400" />
              Marshalled Request Payload JSON
            </span>
            <pre className="font-mono text-[11px] text-blue-300 bg-[#090e1a] p-2 rounded border border-slate-800 overflow-x-auto">
              {JSON.stringify(requestPayload, null, 2)}
            </pre>
          </div>

          <div className="p-2.5 rounded-lg bg-[#060a12] border border-[#1e293b]">
            <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1 mb-1">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              Node 1 Ledger Balances
            </span>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              {Object.entries(accounts).map(([id, acc]) => (
                <div key={id} className="p-1.5 rounded bg-[#0f172a] border border-[#1e293b]">
                  <div className="text-slate-400 text-[10px]">{id} ({acc.name})</div>
                  <div className="text-emerald-400 font-bold text-xs mt-0.5">₹{acc.balance}</div>
                </div>
              ))}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">From Account</label>
                  <select
                    id="rpc-from-account-select"
                    value={fromAccount}
                    onChange={(e) => setFromAccount(e.target.value)}
                    className="w-full bg-[#060a12] border border-[#222f49] rounded p-2 text-xs text-slate-200"
                  >
                    {Object.keys(accounts).map((acc) => (
                      <option key={acc} value={acc}>
                        {acc} ({accounts[acc].name} - ₹{accounts[acc].balance})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">To Account</label>
                  <select
                    id="rpc-to-account-select"
                    value={toAccount}
                    onChange={(e) => setToAccount(e.target.value)}
                    className="w-full bg-[#060a12] border border-[#222f49] rounded p-2 text-xs text-slate-200"
                  >
                    {Object.keys(accounts).map((acc) => (
                      <option key={acc} value={acc}>
                        {acc} ({accounts[acc].name} - ₹{accounts[acc].balance})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Transfer Amount (₹)</label>
                <input
                  id="rpc-amount-input"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-[#060a12] border border-[#222f49] rounded p-2 text-xs text-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1e293b] space-y-3">
            <button
              id="send-rpc-btn"
              onClick={handleSendTransfer}
              disabled={loading}
              className="btn-primary w-full justify-center py-2 text-xs font-bold"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{loading ? 'Invoking RPC...' : 'Invoke Remote Procedure Call (RPC)'}</span>
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
          <EventLog events={rpcEvents.length > 0 ? rpcEvents : displayedEvents} onClear={clearLog} maxHeight="320px" />
        </div>
      </div>

      {/* RESULT / CURRENT STATE BANNER */}
      {lastResult && (
        <ResultBanner
          type={lastResult.success ? 'success' : 'danger'}
          title={lastResult.success ? 'RPC Execution Succeeded' : 'RPC Call Failed / Server Unreachable'}
          description={
            lastResult.success
              ? `Transferred ₹${amount} from ${fromAccount} to ${toAccount}. Updated balances: ${fromAccount} = ₹${lastResult.result?.newBalances?.[fromAccount]}, ${toAccount} = ₹${lastResult.result?.newBalances?.[toAccount]}`
              : lastResult.error || 'Server Node 1 was unresponsive.'
          }
          details={
            lastResult.success
              ? `Txn ID: ${lastResult.result?.transactionId} | Method: ${lastResult.result?.method} | Server Skeleton: Node 1`
              : 'Server Node 1 was offline or parameters were invalid.'
          }
        />
      )}
    </div>
  );
}
