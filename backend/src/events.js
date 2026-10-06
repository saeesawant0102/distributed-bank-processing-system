// Event management and WebSocket broadcasting for DC Bank System

export const EVENT_TYPES = {
  // General
  SIM_STARTED: "SIM_STARTED",
  SIM_RESET: "SIM_RESET",
  MESSAGE_SENT: "MESSAGE_SENT",
  MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
  NODE_FAILED: "NODE_FAILED",
  NODE_RECOVERED: "NODE_RECOVERED",

  // Transactions
  TRANSACTION_STARTED: "TRANSACTION_STARTED",
  TRANSACTION_COMPLETED: "TRANSACTION_COMPLETED",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",

  // RPC
  RPC_REQUEST: "RPC_REQUEST",
  RPC_PROCESSING: "RPC_PROCESSING",
  RPC_RESPONSE: "RPC_RESPONSE",

  // Multithreading
  TRANSACTION_QUEUED: "TRANSACTION_QUEUED",
  WORKER_ASSIGNED: "WORKER_ASSIGNED",
  LOCK_ACQUIRED: "LOCK_ACQUIRED",
  LOCK_RELEASED: "LOCK_RELEASED",
  RACE_DETECTED: "RACE_DETECTED",

  // Clock
  CLOCK_UPDATED: "CLOCK_UPDATED",
  LAMPORT_EVENT: "LAMPORT_EVENT",

  // Election
  ELECTION_STARTED: "ELECTION_STARTED",
  ELECTION_MESSAGE: "ELECTION_MESSAGE",
  COORDINATOR_ELECTED: "COORDINATOR_ELECTED",

  // Replication
  REPLICATION_STARTED: "REPLICATION_STARTED",
  REPLICATION: "REPLICATION",
  REPLICATION_COMPLETED: "REPLICATION_COMPLETED",

  // Load Balancing
  NODE_SELECTED: "NODE_SELECTED",
  LOAD_UPDATED: "LOAD_UPDATED",

  // Fault Tolerance
  HEARTBEAT_MISSED: "HEARTBEAT_MISSED",
  FAILURE_DETECTED: "FAILURE_DETECTED",
  PRIMARY_CHANGED: "PRIMARY_CHANGED",
};

class EventBus {
  constructor() {
    this.clients = new Set();
    this.history = [];
    this.nextId = 1;
  }

  addClient(ws) {
    this.clients.add(ws);
  }

  removeClient(ws) {
    this.clients.delete(ws);
  }

  emit(experiment, type, data = {}, message = "") {
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0]; // "HH:MM:SS"

    const event = {
      id: this.nextId++,
      time: timeStr,
      experiment,
      type,
      data,
      message: message || `${experiment.toUpperCase()}: ${type}`,
    };

    this.history.push(event);
    if (this.history.length > 500) {
      this.history.shift();
    }

    const payload = JSON.stringify(event);
    for (const ws of this.clients) {
      if (ws.readyState === ws.OPEN) {
        ws.send(payload);
      }
    }

    return event;
  }

  reset() {
    this.nextId = 1;
    this.history = [];
    this.emit("general", EVENT_TYPES.SIM_RESET, {}, "Simulation state reset to defaults");
  }

  getRecentEvents(limit = 100) {
    return this.history.slice(-limit);
  }
}

export const eventBus = new EventBus();
