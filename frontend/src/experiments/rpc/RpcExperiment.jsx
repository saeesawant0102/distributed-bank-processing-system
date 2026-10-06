import React, { useState } from 'react';
import { api } from '../../services/api';
import { ExperimentDescription } from '../../components/ExperimentDescription';
import { SimulationControls } from '../../components/SimulationControls';
import { EventLog } from '../../components/EventLog';
import { ResultBanner } from '../../components/ResultBanner';
import { Radio, ArrowRight, ArrowLeft, Server, Laptop, Power, CheckCircle, ShieldAlert } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      {/* Title & Concept Header */}
      <ExperimentDescription
        title="Experiment 1: Remote Procedure Call (RPC)"
        concept="A client calls a procedure on a remote server as if calling a local function. A client stub marshals arguments into an interoperable message format, transmits over the transport channel, and the server skeleton unmarshals arguments, dispatches to the internal procedure, and marshals the result back."
        scenario="Client calls transferMoney(from='A101', to='A102', amount=₹500) on Bank Node 1. The server checks account existence, verifies balance sufficiency, atomically updates the balances, and returns the response."
        viva={[
          {
            q: "What is the difference between an RPC Stub and an RPC Skeleton?",
            a: "The Stub resides on the client acting as a local function proxy that marshals parameters into network messages. The Skeleton resides on the server, unpacks the message, and executes the server-side procedure.",
          },
          {
            q: "What is marshalling and unmarshalling?",
            a: "Marshalling serializes memory objects into a structured transmittable format (e.g. JSON or binary buffer). Unmarshalling reconstructs the objects at the receiver.",
          },
          {
            q: "How does RPC differ from REST?",
            a: "RPC is operation-centric (invoking procedures directly like transferMoney()), while REST is resource-centric (manipulating resources via standard HTTP methods).",
          },
        ]}
      />

      {/* Outcome Banner */}
      {lastResult && (
        <ResultBanner
          type={lastResult.success ? 'success' : 'danger'}
          title={lastResult.success ? 'RPC Execution Succeeded' : 'RPC Call Failed / Timed Out'}
          description={
            lastResult.success
              ? `Transferred ₹${amount} from ${fromAccount} to ${toAccount}. Updated balances: ${fromAccount} = ₹${lastResult.result?.newBalances?.[fromAccount]}, ${toAccount} = ₹${lastResult.result?.newBalances?.[toAccount]}`
              : lastResult.error
          }
          details={
            lastResult.success
              ? `Txn ID: ${lastResult.result?.transactionId} | Procedure: ${lastResult.result?.method} | Server: Node 1 Skeleton`
              : 'Server Node 1 was unresponsive or rejected parameters.'
          }
        />
      )}

      {/* Main Technical View: Client vs Server Pipeline */}
      <div className="dash-panel p-4">
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e293b]">
          <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            RPC Client Stub ↔ Server Skeleton Architecture
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Target Node: Bank Node 1</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-stretch">
          {/* Client Application */}
          <div className="p-3.5 rounded-md bg-[#0f172a] border border-[#1e293b] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-blue-400" />
                  Client Application
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">
                  Caller
                </span>
              </div>
              <div className="font-mono text-[11px] text-blue-400 mb-2">
                rpc.call("transferMoney", &#123; {fromAccount}, {toAccount}, ₹{amount} &#125;)
              </div>
              <div className="p-2 rounded bg-[#0b101d] border border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
                <div>• Client Stub marshals JSON payload</div>
                <div>• Attaches unique Request ID</div>
                <div>• Blocks/waits for server ACK</div>
              </div>
            </div>
            <div className="text-[10px] text-slate-500 mt-2 font-mono">Client ID: Client-App-01</div>
          </div>

          {/* Network Channel / Flow */}
          <div className="p-3 rounded-md bg-[#0b101d] border border-[#1e293b] flex flex-col justify-center items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Network Channel
            </span>
            <div className="w-full flex items-center gap-2 text-xs font-mono text-blue-400">
              <span className="text-[11px]">Request</span>
              <div className="h-px flex-1 bg-blue-500/60 relative">
                <span className="absolute right-0 -top-1.5 text-blue-400">▶</span>
              </div>
            </div>
            <div className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
              Simulated In-Memory IPC
            </div>
            <div className="w-full flex items-center gap-2 text-xs font-mono text-emerald-400">
              <div className="h-px flex-1 bg-emerald-500/60 relative">
                <span className="absolute left-0 -top-1.5 text-emerald-400">◀</span>
              </div>
              <span className="text-[11px]">Response</span>
            </div>
          </div>

          {/* Server Skeleton (Node 1) */}
          <div
            className={`p-3.5 rounded-md border flex flex-col justify-between transition-all ${
              isServerAlive
                ? 'bg-[#0f172a] border-[#1e293b]'
                : 'bg-red-950/10 border-red-900/50 opacity-60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-slate-400" />
                  Server Skeleton (Node 1)
                </span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                    isServerAlive
                      ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'
                      : 'bg-red-950/50 text-red-300 border border-red-800/40'
                  }`}
                >
                  {isServerAlive ? 'ONLINE' : 'DOWN'}
                </span>
              </div>

              {/* Execution Stages */}
              <div className="grid grid-cols-2 gap-1 text-[11px] font-mono my-2">
                <div
                  className={`p-1 rounded text-center border ${
                    currentStage === 'server_unmarshalled' || currentStage === 'receive'
                      ? 'bg-blue-950/60 border-blue-600 text-blue-300'
                      : 'bg-[#0b101d] border-slate-800 text-slate-500'
                  }`}
                >
                  1. Unmarshal
                </div>
                <div
                  className={`p-1 rounded text-center border ${
                    currentStage === 'validation'
                      ? 'bg-amber-950/60 border-amber-600 text-amber-300'
                      : 'bg-[#0b101d] border-slate-800 text-slate-500'
                  }`}
                >
                  2. Validate
                </div>
                <div
                  className={`p-1 rounded text-center border ${
                    currentStage === 'execution'
                      ? 'bg-purple-950/60 border-purple-600 text-purple-300'
                      : 'bg-[#0b101d] border-slate-800 text-slate-500'
                  }`}
                >
                  3. Execute
                </div>
                <div
                  className={`p-1 rounded text-center border ${
                    currentStage === 'completed' || currentStage === 'error'
                      ? 'bg-emerald-950/60 border-emerald-600 text-emerald-300'
                      : 'bg-[#0b101d] border-slate-800 text-slate-500'
                  }`}
                >
                  4. Respond
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-mono">Procedure: transferMoney</span>
              <button
                id="toggle-node1-crash-btn"
                onClick={() => toggleNodeLiveness(1, isServerAlive)}
                className={`text-[11px] px-2 py-0.5 rounded font-mono transition-colors ${
                  isServerAlive
                    ? 'bg-red-950/20 text-red-400 border border-red-800/30'
                    : 'bg-emerald-950/20 text-emerald-400 border border-emerald-800/30'
                }`}
              >
                {isServerAlive ? 'Crash Node 1' : 'Recover Node 1'}
              </button>
            </div>
          </div>
        </div>

        {/* Node 1 Ledger Table */}
        <div className="mt-4 pt-3 border-t border-[#1e293b]">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
            Node 1 In-Memory Ledger State
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
            {Object.entries(accounts).map(([id, acc]) => (
              <div key={id} className="p-2 rounded bg-[#0b101d] border border-[#1e293b]">
                <div className="text-slate-400 text-[10px]">{id} ({acc.name})</div>
                <div className="text-emerald-400 font-bold text-sm mt-0.5">₹{acc.balance}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RPC Parameters Configuration Card */}
      <div className="dash-panel p-3.5">
        <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-2.5">
          Dispatch Remote Procedure Call
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end text-xs">
          <div>
            <label className="text-slate-400 block mb-1">From Account</label>
            <select
              id="rpc-from-account-select"
              value={fromAccount}
              onChange={(e) => setFromAccount(e.target.value)}
              className="w-full bg-[#0b101d] border border-[#222f49] rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
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
              className="w-full bg-[#0b101d] border border-[#222f49] rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              {Object.keys(accounts).map((acc) => (
                <option key={acc} value={acc}>
                  {acc} ({accounts[acc].name} - ₹{accounts[acc].balance})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Amount (₹)</label>
            <input
              id="rpc-amount-input"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#0b101d] border border-[#222f49] rounded p-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          <div>
            <button
              id="send-rpc-btn"
              onClick={handleSendTransfer}
              disabled={loading}
              className="btn-primary w-full justify-center py-2 text-xs"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{loading ? 'Invoking RPC...' : 'Invoke RPC Call'}</span>
            </button>
          </div>
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
