import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSimulation } from './hooks/useSimulation';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { RpcExperiment } from './experiments/rpc/RpcExperiment';
import { MultithreadingExperiment } from './experiments/multithreading/MultithreadingExperiment';
import { ClockExperiment } from './experiments/clock/ClockExperiment';
import { ElectionExperiment } from './experiments/election/ElectionExperiment';
import { ReplicationExperiment } from './experiments/replication/ReplicationExperiment';
import { LoadBalancingExperiment } from './experiments/loadBalancing/LoadBalancingExperiment';
import { FaultToleranceExperiment } from './experiments/faultTolerance/FaultToleranceExperiment';

export default function App() {
  const sim = useSimulation();

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 font-sans">
      <Navbar
        connected={sim.connected}
        nodes={sim.clusterState?.nodes || []}
        onReset={sim.reset}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3.5 md:p-5 pb-10">
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
      </main>

      <footer className="border-t border-[#1e293b] py-3.5 px-4 text-center text-[11px] text-slate-500 font-mono bg-[#0d1322]">
        Distributed Computing Laboratory Project • SPIT SEM-5 • 7 Core Simulation Experiments
      </footer>
    </div>
  );
}
