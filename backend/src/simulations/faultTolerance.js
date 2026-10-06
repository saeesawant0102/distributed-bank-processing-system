// Primary-Backup Fault Tolerance Simulation: Heartbeat monitoring, Failover, and Epoch-based Promotion
import { eventBus, EVENT_TYPES } from "../events.js";
import { state } from "../state.js";

export function runFaultToleranceSimulation({
  action = "transaction", // "transaction" | "fail_primary" | "recover_old_primary"
  account = "A101",
  amount = 500,
}) {
  const eventsEmitted = [];
  function logEvent(type, data, msg) {
    const ev = eventBus.emit("faultTolerance", type, data, msg);
    eventsEmitted.push(ev);
    return ev;
  }

  const primary = state.getNode(state.primaryId);
  const backup = state.getNode(state.backupId);

  // 1. FAIL PRIMARY ACTION
  if (action === "fail_primary") {
    if (!primary) return { success: false, error: "Primary not found" };

    primary.alive = false;
    primary.role = "failed";

    logEvent(
      EVENT_TYPES.NODE_FAILED,
      { nodeId: primary.id, epoch: state.epoch },
      `PRIMARY Node ${primary.id} has CRASHED! (alive = false)`
    );

    // Backup heartbeat detection sequence
    logEvent(
      EVENT_TYPES.HEARTBEAT_MISSED,
      { observerId: backup.id, targetId: primary.id, count: 1, threshold: 3 },
      `Backup Node ${backup.id}: Heartbeat from Primary missed (1/3)`
    );

    logEvent(
      EVENT_TYPES.HEARTBEAT_MISSED,
      { observerId: backup.id, targetId: primary.id, count: 2, threshold: 3 },
      `Backup Node ${backup.id}: Heartbeat from Primary missed (2/3)`
    );

    logEvent(
      EVENT_TYPES.HEARTBEAT_MISSED,
      { observerId: backup.id, targetId: primary.id, count: 3, threshold: 3 },
      `Backup Node ${backup.id}: Heartbeat threshold exceeded (3/3)`
    );

    logEvent(
      EVENT_TYPES.FAILURE_DETECTED,
      { detectorId: backup.id, failedNodeId: primary.id },
      `FAILURE CONFIRMED: Backup Node ${backup.id} declared Primary Node ${primary.id} dead!`
    );

    // Promote backup to new primary and increment epoch
    state.epoch++;
    const oldPrimaryId = state.primaryId;
    state.primaryId = backup.id;
    state.backupId = oldPrimaryId;

    backup.role = "primary";

    logEvent(
      EVENT_TYPES.PRIMARY_CHANGED,
      {
        previousPrimaryId: oldPrimaryId,
        newPrimaryId: backup.id,
        epoch: state.epoch,
      },
      `FAILOVER COMPLETE: Node ${backup.id} PROMOTED to PRIMARY (New Epoch: ${state.epoch})`
    );

    return {
      success: true,
      action: "fail_primary",
      newPrimaryId: backup.id,
      epoch: state.epoch,
      events: eventsEmitted,
    };
  }

  // 2. RECOVER OLD PRIMARY ACTION
  if (action === "recover_old_primary") {
    const recoveredNode = state.getNode(state.backupId); // was original primary
    if (!recoveredNode) return { success: false, error: "Node not found" };

    recoveredNode.alive = true;
    recoveredNode.role = "backup";

    logEvent(
      EVENT_TYPES.NODE_RECOVERED,
      { nodeId: recoveredNode.id, currentEpoch: state.epoch },
      `Node ${recoveredNode.id} booted up after failure. Inspecting cluster epoch...`
    );

    // Sync state from current active primary
    const currentPrimary = state.getNode(state.primaryId);
    if (currentPrimary) {
      recoveredNode.accounts = JSON.parse(JSON.stringify(currentPrimary.accounts));
      logEvent(
        EVENT_TYPES.REPLICATION,
        {
          from: currentPrimary.id,
          to: recoveredNode.id,
          accountsSynced: Object.keys(recoveredNode.accounts),
        },
        `Node ${recoveredNode.id} detected higher cluster epoch (${state.epoch}). Accepted role as BACKUP and synchronized ledger from Node ${currentPrimary.id}.`
      );
    }

    return {
      success: true,
      action: "recover_old_primary",
      primaryId: state.primaryId,
      backupId: state.backupId,
      epoch: state.epoch,
      events: eventsEmitted,
    };
  }

  // 3. TRANSACTION ACTION
  const currentPrimary = state.getNode(state.primaryId);
  const currentBackup = state.getNode(state.backupId);

  if (!currentPrimary || !currentPrimary.alive) {
    logEvent(
      EVENT_TYPES.TRANSACTION_FAILED,
      { error: "NO_PRIMARY_AVAILABLE" },
      "Transaction Rejected: No active Primary available to process transaction!"
    );
    return { success: false, error: "NO_PRIMARY_AVAILABLE", events: eventsEmitted };
  }

  const primaryAcc = currentPrimary.accounts[account];
  if (!primaryAcc || primaryAcc.balance < amount) {
    logEvent(
      EVENT_TYPES.TRANSACTION_FAILED,
      { error: "INSUFFICIENT_FUNDS" },
      `Transaction Rejected: Insufficient balance in ${account}`
    );
    return { success: false, error: "INSUFFICIENT_FUNDS", events: eventsEmitted };
  }

  const prevBal = primaryAcc.balance;
  primaryAcc.balance -= Number(amount);
  primaryAcc.version = (primaryAcc.version || 1) + 1;

  logEvent(
    EVENT_TYPES.TRANSACTION_STARTED,
    {
      primaryId: currentPrimary.id,
      epoch: state.epoch,
      account,
      amount,
      newBalance: primaryAcc.balance,
    },
    `Primary Node ${currentPrimary.id} (Epoch ${state.epoch}) processed debit: ${account} ₹${prevBal} -> ₹${primaryAcc.balance}`
  );

  // Synchronous replication to backup if alive
  if (currentBackup && currentBackup.alive) {
    currentBackup.accounts[account].balance = primaryAcc.balance;
    currentBackup.accounts[account].version = primaryAcc.version;

    logEvent(
      EVENT_TYPES.REPLICATION,
      {
        from: currentPrimary.id,
        to: currentBackup.id,
        account,
        balance: primaryAcc.balance,
      },
      `Synchronous commit replicated from Primary Node ${currentPrimary.id} to Backup Node ${currentBackup.id}`
    );
  } else {
    logEvent(
      EVENT_TYPES.MESSAGE_SENT,
      { warning: "BACKUP_UNAVAILABLE" },
      `Warning: Backup Node is offline. Transaction committed on Primary Node ${currentPrimary.id} without replica redundancy.`
    );
  }

  logEvent(
    EVENT_TYPES.TRANSACTION_COMPLETED,
    {
      primaryId: currentPrimary.id,
      account,
      amount,
      finalBalance: primaryAcc.balance,
      epoch: state.epoch,
    },
    `Transaction TXN-${Date.now().toString().slice(-4)} successfully committed on Node ${currentPrimary.id}`
  );

  return {
    success: true,
    action: "transaction",
    primaryId: currentPrimary.id,
    epoch: state.epoch,
    balance: primaryAcc.balance,
    events: eventsEmitted,
  };
}
