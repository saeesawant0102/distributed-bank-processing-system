// Multithreading Simulation: Concurrency, Race Conditions, and Mutex Locks
import { eventBus, EVENT_TYPES } from "../events.js";
import { state } from "../state.js";

export function runMultithreadingSimulation({
  mode = "unsafe", // "unsafe" | "mutex"
  workerCount = 3,
  isRaceDemo = true,
  customTransactions = null,
}) {
  const eventsEmitted = [];
  function logEvent(type, data, msg) {
    const ev = eventBus.emit("multithreading", type, data, msg);
    eventsEmitted.push(ev);
    return ev;
  }

  const server = state.getNode(1); // Server node
  const accountId = "A101";

  if (isRaceDemo) {
    // Set initial balance for race demo
    const initialBalance = 1000;
    server.accounts[accountId].balance = initialBalance;

    logEvent(
      EVENT_TYPES.SIM_STARTED,
      {
        mode,
        initialBalance,
        accountId,
        workers: workerCount,
      },
      `Starting Multithreading Demo in [${mode.toUpperCase()}] mode on account ${accountId} (initial ₹${initialBalance})`
    );

    // Two concurrent withdrawals: T1 wants ₹800, T2 wants ₹700
    const t1 = { id: "TXN-1", workerId: 1, account: accountId, amount: 800, op: "WITHDRAW" };
    const t2 = { id: "TXN-2", workerId: 2, account: accountId, amount: 700, op: "WITHDRAW" };

    logEvent(EVENT_TYPES.TRANSACTION_QUEUED, { transactions: [t1, t2] }, "Enqueued TXN-1 (₹800) and TXN-2 (₹700)");

    if (mode === "unsafe") {
      // UNSAFE MODE: Both workers read concurrently before either writes
      logEvent(EVENT_TYPES.WORKER_ASSIGNED, { workerId: 1, txn: t1 }, "Worker 1 assigned to TXN-1");
      logEvent(EVENT_TYPES.WORKER_ASSIGNED, { workerId: 2, txn: t2 }, "Worker 2 assigned to TXN-2");

      const readValW1 = initialBalance;
      logEvent(
        EVENT_TYPES.RPC_PROCESSING,
        { workerId: 1, account: accountId, readBalance: readValW1 },
        `Worker 1 reads balance: ₹${readValW1}`
      );

      const readValW2 = initialBalance;
      logEvent(
        EVENT_TYPES.RPC_PROCESSING,
        { workerId: 2, account: accountId, readBalance: readValW2 },
        `Worker 2 reads balance: ₹${readValW2} (UNSAFE concurrent read!)`
      );

      // Worker 1 computes and writes
      const writeValW1 = readValW1 - t1.amount; // 200
      server.accounts[accountId].balance = writeValW1;
      logEvent(
        EVENT_TYPES.TRANSACTION_COMPLETED,
        {
          workerId: 1,
          txn: t1,
          newBalance: writeValW1,
        },
        `Worker 1 writes: ₹${readValW1} - ₹${t1.amount} = ₹${writeValW1}`
      );

      // Worker 2 computes using stale read and overwrites!
      const writeValW2 = readValW2 - t2.amount; // 300
      server.accounts[accountId].balance = writeValW2;
      logEvent(
        EVENT_TYPES.TRANSACTION_COMPLETED,
        {
          workerId: 2,
          txn: t2,
          newBalance: writeValW2,
        },
        `Worker 2 writes: ₹${readValW2} - ₹${t2.amount} = ₹${writeValW2} (OVERWROTE Worker 1's write!)`
      );

      // Race detection analysis
      const expectedBalance = 200; // T1 succeeds, T2 should have failed due to insufficient funds
      const actualBalance = writeValW2; // 300

      logEvent(
        EVENT_TYPES.RACE_DETECTED,
        {
          accountId,
          initialBalance,
          actualBalance,
          expectedBalance,
          totalWithdrawn: 1500,
          error: "Lost Update / Overdraft Anomaly: ₹1500 withdrawn from ₹1000 account, leaving ₹300!",
        },
        `CRITICAL RACE DETECTED! Both withdrawals processed. Expected balance: ₹${expectedBalance}, Actual: ₹${actualBalance}`
      );

      return {
        success: false,
        raceDetected: true,
        mode,
        initialBalance,
        actualBalance,
        expectedBalance,
        events: eventsEmitted,
      };
    } else {
      // MUTEX MODE: Lock acquired on account
      logEvent(EVENT_TYPES.WORKER_ASSIGNED, { workerId: 1, txn: t1 }, "Worker 1 assigned to TXN-1");
      logEvent(EVENT_TYPES.WORKER_ASSIGNED, { workerId: 2, txn: t2 }, "Worker 2 assigned to TXN-2");

      // Worker 1 acquires lock
      logEvent(
        EVENT_TYPES.LOCK_ACQUIRED,
        { workerId: 1, account: accountId },
        `Worker 1 acquired MUTEX lock on ${accountId}`
      );

      // Worker 2 attempts to acquire lock and waits
      logEvent(
        EVENT_TYPES.RPC_PROCESSING,
        { workerId: 2, account: accountId, status: "BLOCKED" },
        `Worker 2 WAITING: Mutex lock on ${accountId} is held by Worker 1`
      );

      // Worker 1 reads and writes
      const readValW1 = server.accounts[accountId].balance; // 1000
      const writeValW1 = readValW1 - t1.amount; // 200
      server.accounts[accountId].balance = writeValW1;
      logEvent(
        EVENT_TYPES.TRANSACTION_COMPLETED,
        { workerId: 1, txn: t1, newBalance: writeValW1 },
        `Worker 1 completes TXN-1: balance updated to ₹${writeValW1}`
      );

      // Worker 1 releases lock
      logEvent(
        EVENT_TYPES.LOCK_RELEASED,
        { workerId: 1, account: accountId },
        `Worker 1 released MUTEX lock on ${accountId}`
      );

      // Worker 2 acquires lock
      logEvent(
        EVENT_TYPES.LOCK_ACQUIRED,
        { workerId: 2, account: accountId },
        `Worker 2 acquired MUTEX lock on ${accountId}`
      );

      // Worker 2 reads updated balance
      const readValW2 = server.accounts[accountId].balance; // 200
      logEvent(
        EVENT_TYPES.RPC_PROCESSING,
        { workerId: 2, account: accountId, readBalance: readValW2 },
        `Worker 2 reads up-to-date balance: ₹${readValW2}`
      );

      if (readValW2 < t2.amount) {
        logEvent(
          EVENT_TYPES.TRANSACTION_FAILED,
          {
            workerId: 2,
            txn: t2,
            reason: `Insufficient funds (balance ₹${readValW2} < ₹${t2.amount})`,
          },
          `Worker 2 TXN-2 cleanly REJECTED: Insufficient funds (balance ₹${readValW2} < ₹${t2.amount})`
        );
      } else {
        server.accounts[accountId].balance -= t2.amount;
      }

      logEvent(
        EVENT_TYPES.LOCK_RELEASED,
        { workerId: 2, account: accountId },
        `Worker 2 released MUTEX lock on ${accountId}`
      );

      return {
        success: true,
        raceDetected: false,
        mode,
        initialBalance,
        actualBalance: server.accounts[accountId].balance,
        expectedBalance: 200,
        events: eventsEmitted,
      };
    }
  } else {
    // Batch processing
    const txns = customTransactions || [
      { id: "T1", from: "A101", to: "A102", amount: 500 },
      { id: "T2", from: "A103", to: "A101", amount: 200 },
      { id: "T3", from: "A102", to: "A103", amount: 1000 },
      { id: "T4", from: "A101", to: "A103", amount: 300 },
    ];

    logEvent(
      EVENT_TYPES.SIM_STARTED,
      { mode, txns, workers: workerCount },
      `Running batch queue of ${txns.length} transactions across ${workerCount} workers`
    );

    let workerIdx = 1;
    for (const txn of txns) {
      const assignedWorker = ((workerIdx - 1) % workerCount) + 1;
      workerIdx++;

      logEvent(
        EVENT_TYPES.WORKER_ASSIGNED,
        { workerId: assignedWorker, txn },
        `Worker ${assignedWorker} assigned to ${txn.id} (${txn.from} -> ${txn.to} ₹${txn.amount})`
      );

      if (mode === "mutex") {
        logEvent(EVENT_TYPES.LOCK_ACQUIRED, { workerId: assignedWorker, account: txn.from }, `Worker ${assignedWorker} locked ${txn.from}`);
      }

      const fromAcc = server.accounts[txn.from];
      const toAcc = server.accounts[txn.to];
      if (fromAcc && toAcc && fromAcc.balance >= txn.amount) {
        fromAcc.balance -= txn.amount;
        toAcc.balance += txn.amount;
        logEvent(
          EVENT_TYPES.TRANSACTION_COMPLETED,
          { workerId: assignedWorker, txn, fromBalance: fromAcc.balance, toBalance: toAcc.balance },
          `${txn.id} completed: ${txn.from} (₹${fromAcc.balance}), ${txn.to} (₹${toAcc.balance})`
        );
      } else {
        logEvent(
          EVENT_TYPES.TRANSACTION_FAILED,
          { workerId: assignedWorker, txn, reason: "Insufficient balance" },
          `${txn.id} failed: Insufficient funds`
        );
      }

      if (mode === "mutex") {
        logEvent(EVENT_TYPES.LOCK_RELEASED, { workerId: assignedWorker, account: txn.from }, `Worker ${assignedWorker} unlocked ${txn.from}`);
      }
    }

    return { success: true, mode, events: eventsEmitted };
  }
}
