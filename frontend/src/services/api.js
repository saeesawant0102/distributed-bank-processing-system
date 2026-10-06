// API Service for communication with DC Bank backend

const API_BASE = '/api';

export const api = {
  async getState() {
    const res = await fetch(`${API_BASE}/state`);
    return res.json();
  },

  async reset() {
    const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
    return res.json();
  },

  async killNode(nodeId) {
    const res = await fetch(`${API_BASE}/nodes/${nodeId}/kill`, { method: 'POST' });
    return res.json();
  },

  async recoverNode(nodeId) {
    const res = await fetch(`${API_BASE}/nodes/${nodeId}/recover`, { method: 'POST' });
    return res.json();
  },

  async runRpc(params) {
    const res = await fetch(`${API_BASE}/rpc/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async runThreads(params) {
    const res = await fetch(`${API_BASE}/threads/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async syncClock(params) {
    const res = await fetch(`${API_BASE}/clock/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async startElection(params) {
    const res = await fetch(`${API_BASE}/election/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async writeReplication(params) {
    const res = await fetch(`${API_BASE}/replication/write`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async sendLoad(params) {
    const res = await fetch(`${API_BASE}/load/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async runFailover(params) {
    const res = await fetch(`${API_BASE}/failover/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async getRecentEvents(limit = 100) {
    const res = await fetch(`${API_BASE}/events?limit=${limit}`);
    return res.json();
  },
};
