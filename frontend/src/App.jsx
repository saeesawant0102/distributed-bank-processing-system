import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSimulation } from './hooks/useSimulation';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { RpcExperiment } from './experiments/rpc/RpcExperiment';
import { MultithreadingExperiment } from './experiments/multithreading/MultithreadingExperiment';
import { ClockExperiment } from './experiments/clock/ClockExperiment';
import { ElectionExperiment } from './experiments/election/ElectionExperiment';
import { ReplicationExperiment } from './experiments/replication/ReplicationExperiment';
import { LoadBalancingExperiment } from './experiments/loadBalancing/LoadBalancingExperiment';
import { FaultToleranceExperiment } from './experiments/faultTolerance/FaultToleranceExperiment';
import { EventLog } from './components/EventLog';

export default function App() {
  const sim = useSimulation();
  const [showConsoleModal, setShowConsoleModal] = useState(false);
  const nodes = sim.clusterState?.nodes || [];
  const aliveNodes = nodes.filter((n) => n.alive);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0f19] text-slate-100 font-sans">
      {/* PERSISTENT LEFT SIDEBAR */}
      <Sidebar
        connected={sim.connected}
        aliveCount={aliveNodes.length}
        totalCount={nodes.length || 5}
        onOpenConsole={() => setShowConsoleModal(true)}
      />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#0b0f19]">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto space-y-5">
            <Routes>
              <Route path="/" element={<Dashboard sim={sim} />} />
              <Route path="/rpc" element={<RpcExperiment sim={sim} />} />
              <Route path="/threads" element={<MultithreadingExperiment sim={sim} />} />
              <Route path="/clock" element={<ClockExperiment sim={sim} />} />
              <Route path="/election" element={<ElectionExperiment sim={sim} />} />
              <Route path="/replication" element={<ReplicationExperiment sim={sim} />} />
              <Route path="/load" element={<LoadBalancingExperiment sim={sim} />} />
              <Route path="/failover" element={<FaultToleranceExperiment sim={sim} />} />
            </Routes>
          </div>
        </main>
      </div>

      {/* Optional Event Console Drawer Modal */}
      {showConsoleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl w-full max-w-4xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]">
              <h3 className="text-sm font-bold text-slate-100 font-mono">System Global Event Log</h3>
              <button
                onClick={() => setShowConsoleModal(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded font-mono"
              >
                Close ✕
              </button>
            </div>
            <EventLog events={sim.displayedEvents} onClear={sim.clearLog} maxHeight="450px" />
          </div>
        </div>
      )}
    </div>
  );
}
