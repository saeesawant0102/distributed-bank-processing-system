// Load Balancing Simulation: Round Robin, Least Connections, Weighted Round Robin
import { eventBus, EVENT_TYPES } from "../events.js";
import { state } from "../state.js";

let roundRobinCursor = 0;
let weightedState = {
  currentWeight: 0,
  maxWeight: 0,
  gcdWeight: 1,
  i: -1,
};

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

export function runLoadBalancingSimulation({
  algorithm = "roundRobin", // "roundRobin" | "leastConnections" | "weightedRoundRobin"
  count = 1,
  weights = { 1: 1, 2: 3, 3: 2 },
  initialLoads = null,
}) {
  const eventsEmitted = [];
  function logEvent(type, data, msg) {
    const ev = eventBus.emit("loadBalancing", type, data, msg);
    eventsEmitted.push(ev);
    return ev;
  }

  const candidateNodes = state.nodes.filter((n) => n.id <= 3);

  // Set initial loads if provided
  if (initialLoads) {
    candidateNodes.forEach((node) => {
      if (initialLoads[node.id] !== undefined) {
        node.activeConnections = initialLoads[node.id];
        node.load = Math.min(100, Math.round((node.activeConnections / node.capacity) * 100));
      }
    });
  }

  const aliveNodes = candidateNodes.filter((n) => n.alive);

  if (aliveNodes.length === 0) {
    logEvent(
      EVENT_TYPES.TRANSACTION_FAILED,
      { error: "NO_AVAILABLE_NODES" },
      "Load Balancer Error: No healthy backend nodes available to route traffic!"
    );
    return { success: false, error: "NO_AVAILABLE_NODES", events: eventsEmitted };
  }

  const assignments = [];
  const requestCount = Math.max(1, Math.min(50, Number(count)));

  for (let r = 1; r <= requestCount; r++) {
    const currentAlive = candidateNodes.filter((n) => n.alive);
    if (currentAlive.length === 0) break;

    let selectedNode = null;

    if (algorithm === "roundRobin") {
      selectedNode = currentAlive[roundRobinCursor % currentAlive.length];
      roundRobinCursor++;
    } else if (algorithm === "leastConnections") {
      // Pick node with lowest activeConnections (ties: lowest ID)
      selectedNode = currentAlive.reduce((minNode, curr) => {
        if (!minNode) return curr;
        if (curr.activeConnections < minNode.activeConnections) return curr;
        if (curr.activeConnections === minNode.activeConnections && curr.id < minNode.id) return curr;
        return minNode;
      }, null);
    } else if (algorithm === "weightedRoundRobin") {
      // Smooth weighted round robin selection
      const weightList = currentAlive.map((n) => ({
        node: n,
        weight: Math.max(1, weights[n.id] || 1),
      }));

      // Find node with highest weight modulo distribution
      const totalWeight = weightList.reduce((acc, curr) => acc + curr.weight, 0);
      let rand = (roundRobinCursor * 7) % totalWeight;
      for (const item of weightList) {
        if (rand < item.weight) {
          selectedNode = item.node;
          break;
        }
        rand -= item.weight;
      }
      if (!selectedNode) selectedNode = weightList[0].node;
      roundRobinCursor++;
    }

    // Increment active connections
    selectedNode.activeConnections = (selectedNode.activeConnections || 0) + 1;
    selectedNode.load = Math.min(100, Math.round((selectedNode.activeConnections / selectedNode.capacity) * 100));

    assignments.push({
      requestId: `REQ-${Date.now()}-${r}`,
      assignedTo: selectedNode.id,
      algorithm,
      currentConnections: selectedNode.activeConnections,
      loadPercent: selectedNode.load,
    });

    logEvent(
      EVENT_TYPES.NODE_SELECTED,
      {
        requestId: `REQ-${r}`,
        algorithm,
        selectedNodeId: selectedNode.id,
        connections: selectedNode.activeConnections,
        loadPercent: selectedNode.load,
      },
      `[${algorithm.toUpperCase()}] Request #${r} routed to Node ${selectedNode.id} (Active: ${selectedNode.activeConnections}/${selectedNode.capacity}, Load: ${selectedNode.load}%)`
    );
  }

  // Summary event
  const distribution = {};
  candidateNodes.forEach((n) => {
    distribution[n.id] = {
      name: n.name,
      alive: n.alive,
      activeConnections: n.activeConnections,
      loadPercent: n.load,
      assignedCount: assignments.filter((a) => a.assignedTo === n.id).length,
    };
  });

  logEvent(
    EVENT_TYPES.LOAD_UPDATED,
    { algorithm, totalSent: requestCount, distribution },
    `Batch completed: ${requestCount} transactions distributed across active servers.`
  );

  return {
    success: true,
    algorithm,
    requestCount,
    assignments,
    distribution,
    nodes: candidateNodes.map((n) => ({
      id: n.id,
      name: n.name,
      alive: n.alive,
      activeConnections: n.activeConnections,
      load: n.load,
      capacity: n.capacity,
    })),
    events: eventsEmitted,
  };
}

export function resetLoadBalancing() {
  roundRobinCursor = 0;
  const candidateNodes = state.nodes.filter((n) => n.id <= 3);
  candidateNodes.forEach((n) => {
    n.activeConnections = 0;
    n.load = 0;
  });
}
