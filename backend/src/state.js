// In-memory simulation state for Distributed Bank Processing System

export const SEED_ACCOUNTS = {
  A101: { name: "Rahul", balance: 10000, version: 1 },
  A102: { name: "Priya", balance: 15000, version: 1 },
  A103: { name: "Aman",  balance: 8000,  version: 1 },
  A104: { name: "Neha",  balance: 12000, version: 1 },
};

export const INITIAL_CLOCK_OFFSETS = [5, 12, -3, 8, 0];

export function createInitialNodes() {
  return [1, 2, 3, 4, 5].map((id) => ({
    id,
    name: `Bank Node ${id}`,
    alive: true,
    role: id === 5 ? "coordinator" : (id === 1 ? "primary" : (id <= 3 ? "replica" : "idle")),
    clockOffset: INITIAL_CLOCK_OFFSETS[id - 1] ?? 0,
    lamport: 0,
    load: 0,
    activeConnections: 0,
    capacity: 10,
    accounts: JSON.parse(JSON.stringify(SEED_ACCOUNTS)),
  }));
}

class SystemState {
  constructor() {
    this.reset();
  }

  reset() {
    this.nodes = createInitialNodes();
    this.coordinatorId = 5;
    this.primaryId = 1;
    this.backupId = 2;
    this.epoch = 1;
    this.roundRobinIndex = 0;
    this.totalTransactions = 0;
    return this.getState();
  }

  getState() {
    return {
      nodes: this.nodes,
      coordinatorId: this.coordinatorId,
      primaryId: this.primaryId,
      backupId: this.backupId,
      epoch: this.epoch,
      totalTransactions: this.totalTransactions,
    };
  }

  getNode(id) {
    return this.nodes.find((n) => n.id === Number(id));
  }

  setNodeAlive(id, alive) {
    const node = this.getNode(id);
    if (node) {
      node.alive = Boolean(alive);
      if (!node.alive && node.id === this.coordinatorId) {
        // Coordinator killed
      }
      return node;
    }
    return null;
  }
}

export const state = new SystemState();
