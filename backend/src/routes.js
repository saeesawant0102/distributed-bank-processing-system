// REST API Routes for DC Bank System
import express from "express";
import { state } from "./state.js";
import { eventBus, EVENT_TYPES } from "./events.js";
import { runRpcSimulation } from "./simulations/rpc.js";
import { runMultithreadingSimulation } from "./simulations/multithreading.js";
import { runClockSimulation } from "./simulations/clock.js";
import { runElectionSimulation } from "./simulations/election.js";
import { runReplicationSimulation } from "./simulations/replication.js";
import { runLoadBalancingSimulation, resetLoadBalancing } from "./simulations/loadBalancing.js";
import { runFaultToleranceSimulation } from "./simulations/faultTolerance.js";

const router = express.Router();

// 1. Get complete cluster state
router.get("/state", (req, res) => {
  res.json({
    success: true,
    ...state.getState(),
  });
});

// 2. Reset entire simulation state
router.post("/reset", (req, res) => {
  const newState = state.reset();
  resetLoadBalancing();
  eventBus.reset();
  res.json({
    success: true,
    message: "Simulation cluster reset to initial seed state",
    ...newState,
  });
});

// 3. Get recent events
router.get("/events", (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit, 10) : 100;
  res.json({
    success: true,
    events: eventBus.getRecentEvents(limit),
  });
});

// 4. Toggle Node Liveness (kill / recover)
router.post("/nodes/:id/kill", (req, res) => {
  const nodeId = parseInt(req.params.id, 10);
  const node = state.setNodeAlive(nodeId, false);
  if (!node) {
    return res.status(404).json({ success: false, error: "Node not found" });
  }
  eventBus.emit("general", EVENT_TYPES.NODE_FAILED, { nodeId }, `Node ${nodeId} has been KILLED (crashed)`);
  res.json({ success: true, node, clusterState: state.getState() });
});

router.post("/nodes/:id/recover", (req, res) => {
  const nodeId = parseInt(req.params.id, 10);
  const node = state.setNodeAlive(nodeId, true);
  if (!node) {
    return res.status(404).json({ success: false, error: "Node not found" });
  }
  eventBus.emit("general", EVENT_TYPES.NODE_RECOVERED, { nodeId }, `Node ${nodeId} has RECOVERED and rejoined cluster`);
  res.json({ success: true, node, clusterState: state.getState() });
});

// 5. Experiment 1: RPC
router.post("/rpc/transfer", (req, res) => {
  const { from = "A101", to = "A102", amount = 500, serverNodeId = 1, method = "transferMoney" } = req.body;
  const result = runRpcSimulation({
    from,
    to,
    amount: Number(amount),
    serverNodeId: Number(serverNodeId),
    method,
  });
  res.json(result);
});

// 6. Experiment 2: Multithreading
router.post("/threads/run", (req, res) => {
  const { mode = "unsafe", workerCount = 3, isRaceDemo = true, customTransactions } = req.body;
  const result = runMultithreadingSimulation({
    mode,
    workerCount: Number(workerCount),
    isRaceDemo: Boolean(isRaceDemo),
    customTransactions,
  });
  res.json(result);
});

// 7. Experiment 3: Clock Synchronization
router.post("/clock/sync", (req, res) => {
  const { algorithm = "berkeley", timeServerId = 1, clientId = 3, customOffsets } = req.body;
  const result = runClockSimulation({
    algorithm,
    timeServerId: Number(timeServerId),
    clientId: Number(clientId),
    customOffsets,
  });
  res.json(result);
});

// 8. Experiment 4: Leader Election
router.post("/election/start", (req, res) => {
  const { algorithm = "bully", initiatorId = 2 } = req.body;
  const result = runElectionSimulation({
    algorithm,
    initiatorId: Number(initiatorId),
  });
  res.json(result);
});

// 9. Experiment 5: Consistency and Replication
router.post("/replication/write", (req, res) => {
  const { mode = "strong", account = "A101", amount = 2000, replica1Delay = 1, replica2Delay = 3 } = req.body;
  const result = runReplicationSimulation({
    mode,
    account,
    amount: Number(amount),
    replica1Delay: Number(replica1Delay),
    replica2Delay: Number(replica2Delay),
  });
  res.json(result);
});

// 10. Experiment 6: Load Balancing
router.post("/load/send", (req, res) => {
  const { algorithm = "roundRobin", count = 1, weights, initialLoads } = req.body;
  const result = runLoadBalancingSimulation({
    algorithm,
    count: Number(count),
    weights,
    initialLoads,
  });
  res.json(result);
});

// 11. Experiment 7: Fault Tolerance
router.post("/failover/run", (req, res) => {
  const { action = "transaction", account = "A101", amount = 500 } = req.body;
  const result = runFaultToleranceSimulation({
    action,
    account,
    amount: Number(amount),
  });
  res.json(result);
});

export default router;
