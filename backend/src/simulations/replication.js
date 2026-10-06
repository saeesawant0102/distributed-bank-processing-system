// Consistency & Replication Simulation: Strong Consistency vs Eventual Consistency
import { eventBus, EVENT_TYPES } from "../events.js";
import { state } from "../state.js";

export function runReplicationSimulation({
  mode = "strong", // "strong" | "eventual"
  account = "A101",
  amount = 2000,
  replica1Delay = 1,
  replica2Delay = 3,
}) {
  const eventsEmitted = [];
  function logEvent(type, data, msg) {
    const ev = eventBus.emit("replication", type, data, msg);
    eventsEmitted.push(ev);
    return ev;
  }

  const primary = state.getNode(1);
  const replica1 = state.getNode(2);
  const replica2 = state.getNode(3);

  if (!primary || !primary.alive) {
    return { success: false, error: "Primary Node 1 is down", events: eventsEmitted };
  }

  const currentBal = primary.accounts[account]?.balance || 0;
  if (currentBal < amount) {
    return { success: false, error: `Insufficient funds (balance ₹${currentBal} < ₹${amount})`, events: eventsEmitted };
  }

  const nextVersion = (primary.accounts[account].version || 1) + 1;
  const newBalance = currentBal - amount;

  logEvent(
    EVENT_TYPES.REPLICATION_STARTED,
    {
      mode,
      account,
      amount,
      primaryId: primary.id,
      replicas: [replica1.id, replica2.id],
      initialBalance: currentBal,
    },
    `Starting ${mode.toUpperCase()} Replication for withdraw of ₹${amount} on ${account}`
  );

  if (mode === "strong") {
    // STRONG CONSISTENCY
    // 1. Primary updates local state (pending commit)
    primary.accounts[account].balance = newBalance;
    primary.accounts[account].version = nextVersion;

    logEvent(
      EVENT_TYPES.TRANSACTION_STARTED,
      { nodeId: primary.id, balance: newBalance, version: nextVersion },
      `Primary Node 1 updated local ${account}: ₹${currentBal} -> ₹${newBalance} (v${nextVersion}). Replicating to replicas...`
    );

    // 2. Replicate synchronously to Replica 1 & Replica 2
    let replica1Ack = false;
    let replica2Ack = false;

    // Replica 1
    logEvent(
      EVENT_TYPES.REPLICATION,
      { from: primary.id, to: replica1.id, account, newBalance, version: nextVersion },
      `Primary Node 1 -> Replica Node 2: REPLICATE(${account}, ₹${newBalance}, v${nextVersion})`
    );

    if (replica1.alive) {
      replica1.accounts[account].balance = newBalance;
      replica1.accounts[account].version = nextVersion;
      replica1Ack = true;
      logEvent(
        EVENT_TYPES.REPLICATION,
        { from: replica1.id, to: primary.id, ack: true },
        `Replica Node 2 applied update and sent ACK to Primary Node 1`
      );
    } else {
      logEvent(
        EVENT_TYPES.NODE_FAILED,
        { nodeId: replica1.id },
        `Replica Node 2 is DOWN: unable to ACK replication message`
      );
    }

    // Replica 2
    logEvent(
      EVENT_TYPES.REPLICATION,
      { from: primary.id, to: replica2.id, account, newBalance, version: nextVersion },
      `Primary Node 1 -> Replica Node 3: REPLICATE(${account}, ₹${newBalance}, v${nextVersion})`
    );

    if (replica2.alive) {
      replica2.accounts[account].balance = newBalance;
      replica2.accounts[account].version = nextVersion;
      replica2Ack = true;
      logEvent(
        EVENT_TYPES.REPLICATION,
        { from: replica2.id, to: primary.id, ack: true },
        `Replica Node 3 applied update and sent ACK to Primary Node 1`
      );
    } else {
      logEvent(
        EVENT_TYPES.NODE_FAILED,
        { nodeId: replica2.id },
        `Replica Node 3 is DOWN: unable to ACK replication message`
      );
    }

    if (replica1Ack && replica2Ack) {
      logEvent(
        EVENT_TYPES.REPLICATION_COMPLETED,
        {
          mode: "strong",
          status: "COMMITTED",
          allAcksReceived: true,
          balances: {
            node1: primary.accounts[account].balance,
            node2: replica1.accounts[account].balance,
            node3: replica2.accounts[account].balance,
          },
        },
        `STRONG CONSISTENCY GUARANTEED: All ACKs received. Write committed to client.`
      );
      return {
        success: true,
        mode: "strong",
        committed: true,
        nodes: [primary, replica1, replica2],
        events: eventsEmitted,
      };
    } else {
      logEvent(
        EVENT_TYPES.TRANSACTION_FAILED,
        {
          mode: "strong",
          reason: "Replica failure prevented full quorum/acknowledgement",
        },
        `STRONG CONSISTENCY ABORT: Replica failure blocked synchronous commit!`
      );
      return {
        success: false,
        error: "Replica failure blocked synchronous replication in strong consistency mode",
        events: eventsEmitted,
      };
    }
  } else {
    // EVENTUAL CONSISTENCY
    // 1. Primary updates and immediately confirms to client
    primary.accounts[account].balance = newBalance;
    primary.accounts[account].version = nextVersion;

    logEvent(
      EVENT_TYPES.TRANSACTION_COMPLETED,
      {
        nodeId: primary.id,
        newBalance,
        version: nextVersion,
        clientConfirmed: true,
      },
      `Primary Node 1 committed locally (₹${newBalance}, v${nextVersion}) and IMMEDIATELY confirmed write to client (Fast ACK).`
    );

    // 2. Window of staleness
    logEvent(
      EVENT_TYPES.REPLICATION,
      {
        status: "STALE_WINDOW",
        primary: { balance: newBalance, version: nextVersion },
        replica1: { balance: replica1.accounts[account].balance, version: replica1.accounts[account].version, stale: true },
        replica2: { balance: replica2.accounts[account].balance, version: replica2.accounts[account].version, stale: true },
      },
      `STALENESS WINDOW: Replicas 2 and 3 currently hold STALE data (v${replica1.accounts[account].version} vs Primary v${nextVersion})`
    );

    // 3. Asynchronous catchup
    if (replica1.alive) {
      replica1.accounts[account].balance = newBalance;
      replica1.accounts[account].version = nextVersion;
      logEvent(
        EVENT_TYPES.REPLICATION,
        { nodeId: replica1.id, balance: newBalance, version: nextVersion, delaySteps: replica1Delay },
        `Replica Node 2 received async replication (delay: ${replica1Delay}s): now updated to v${nextVersion} (₹${newBalance})`
      );
    }

    if (replica2.alive) {
      replica2.accounts[account].balance = newBalance;
      replica2.accounts[account].version = nextVersion;
      logEvent(
        EVENT_TYPES.REPLICATION,
        { nodeId: replica2.id, balance: newBalance, version: nextVersion, delaySteps: replica2Delay },
        `Replica Node 3 received async replication (delay: ${replica2Delay}s): now updated to v${nextVersion} (₹${newBalance})`
      );
    }

    logEvent(
      EVENT_TYPES.REPLICATION_COMPLETED,
      {
        mode: "eventual",
        converged: true,
        balances: {
          node1: primary.accounts[account].balance,
          node2: replica1.accounts[account].balance,
          node3: replica2.accounts[account].balance,
        },
      },
      `EVENTUAL CONSISTENCY REACHED: All available replicas have asynchronously converged to v${nextVersion}`
    );

    return {
      success: true,
      mode: "eventual",
      converged: true,
      nodes: [primary, replica1, replica2],
      events: eventsEmitted,
    };
  }
}
