# Distributed Bank Transaction Processing System
### Simplified Simulation Laboratory Project (SPIT SEM-5 DC Lab)

A modern, cohesive interactive simulator demonstrating **seven fundamental distributed computing algorithms and paradigms** using a single unified simulated bank transaction cluster.

---

## 🌟 The 7 Distributed Computing Experiments

| # | Experiment | Route | Core Mechanism Demonstrated |
|---|---|---|---|
| **1** | **Remote Procedure Call (RPC)** | `/rpc` | Client-stub parameter marshalling, network transmission, server-skeleton unmarshalling, procedure validation, and execution on Bank Node 1. |
| **2** | **Multithreading & Concurrency** | `/threads` | Concurrent worker threads processing transactions. Demonstrates **Lost Update Race Condition** in Unsafe mode vs **Mutex Locks** preventing overdrafts. |
| **3** | **Clock Synchronization** | `/clock` | **Cristian's Algorithm** (time server with $RTT/2$ delay estimation), **Berkeley Algorithm** (master averaging without external reference), and **Lamport Logical Clocks** ($L = \max(L, L_{msg}) + 1$). |
| **4** | **Leader Election** | `/election` | Failure of coordinator Node 5 triggers election. Implements both **Bully Algorithm** (highest ID priority hierarchy) and **Ring Algorithm** (unidirectional token circulation). |
| **5** | **Data Consistency & Replication** | `/replication` | **Strong Consistency** (synchronous ACKs with quorum blocking) vs **Eventual Consistency** (fast client confirmation with temporary stale reads). |
| **6** | **Load Balancing** | `/load` | Traffic distribution across server pool via **Round Robin**, **Least Connections**, and **Weighted Round Robin**. |
| **7** | **Primary-Backup Fault Tolerance** | `/failover` | Heartbeat pulse monitoring ($3/3$ missed beats threshold), automatic epoch-based promotion of Backup Node 2, and graceful recovery of Node 1 as backup. |

---

## 🏗️ Architecture & Technology Stack

- **Frontend:** React 18, React Router v6, Lucide Icons, Vite, Custom Dark Glassmorphism Design System (Google Fonts: *Outfit* & *JetBrains Mono*).
- **Backend:** Node.js, Express, Native ES Modules (`ws` WebSocket Server).
- **Simulation Engine:** Pure deterministic algorithmic simulations in `backend/src/simulations/`.
- **State Store:** Per-node in-memory bank ledger copies with monotonic version tracking (`backend/src/state.js`).

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

### 2. Run Backend Server
```bash
cd backend
npm start
# Server listens at http://localhost:5001 (WS on ws://localhost:5001/ws)
```

### 3. Run Frontend Application
```bash
cd frontend
npm run dev
# Application accessible at http://localhost:5173
```

---

## 🧪 Automated Integration Tests

Run the complete test suite verifying all 7 experiments:
```bash
node test-simulations.js
```

All 7 experiments are tested for normal execution, failure tolerance, and edge cases.
