// RPC Simulation: Client stubs, Server skeletons, and procedure calls
import { eventBus, EVENT_TYPES } from "../events.js";
import { state } from "../state.js";

export function runRpcSimulation({
  method = "transferMoney",
  from = "A101",
  to = "A102",
  amount = 500,
  clientId = "Client-App",
  serverNodeId = 1,
}) {
  const eventsEmitted = [];
  function logEvent(type, data, msg) {
    const ev = eventBus.emit("rpc", type, data, msg);
    eventsEmitted.push(ev);
    return ev;
  }

  const server = state.getNode(serverNodeId);
  const stubRequest = {
    method,
    params: { from, to, amount: Number(amount) },
    id: `req-${Date.now()}`,
    client: clientId,
    targetNode: serverNodeId,
  };

  // 1. Client stub marshals the request and sends it
  logEvent(
    EVENT_TYPES.RPC_REQUEST,
    {
      stage: "client_marshalled",
      request: stubRequest,
      from: clientId,
      to: `Node ${serverNodeId}`,
    },
    `Client stub marshalled call: ${method}(${from} -> ${to}, ₹${amount})`
  );

  // Check if server is alive
  if (!server || !server.alive) {
    logEvent(
      EVENT_TYPES.RPC_RESPONSE,
      {
        stage: "timeout",
        success: false,
        error: `Server Node ${serverNodeId} is unreachable (TIMEOUT)`,
        request: stubRequest,
      },
      `RPC Call Failed: Node ${serverNodeId} did not respond within timeout window.`
    );
    return {
      success: false,
      error: `Server Node ${serverNodeId} is unreachable (TIMEOUT)`,
      events: eventsEmitted,
    };
  }

  // 2. Server skeleton unmarshals and dispatches
  logEvent(
    EVENT_TYPES.RPC_PROCESSING,
    {
      stage: "server_unmarshalled",
      method,
      nodeId: serverNodeId,
    },
    `Node ${serverNodeId} skeleton unmarshalled call: dispatching to procedure '${method}'`
  );

  // 3. Validation step
  logEvent(
    EVENT_TYPES.RPC_PROCESSING,
    {
      stage: "validation",
      nodeId: serverNodeId,
    },
    `Validating account existence and funds for accounts ${from} and ${to}`
  );

  const fromAcc = server.accounts[from];
  const toAcc = server.accounts[to];

  if (amount <= 0) {
    logEvent(
      EVENT_TYPES.RPC_RESPONSE,
      {
        stage: "error",
        success: false,
        error: "Invalid amount: must be greater than 0",
      },
      `Validation Error: Transfer amount ₹${amount} is invalid (must be > 0)`
    );
    return { success: false, error: "Invalid amount", events: eventsEmitted };
  }

  if (!fromAcc || !toAcc) {
    logEvent(
      EVENT_TYPES.RPC_RESPONSE,
      {
        stage: "error",
        success: false,
        error: "Invalid account ID: account not found",
      },
      `Validation Error: One or both accounts (${from}, ${to}) not found on Node ${serverNodeId}`
    );
    return { success: false, error: "Account not found", events: eventsEmitted };
  }

  if (fromAcc.balance < amount) {
    logEvent(
      EVENT_TYPES.RPC_RESPONSE,
      {
        stage: "error",
        success: false,
        error: `Insufficient funds: balance is ₹${fromAcc.balance}, needed ₹${amount}`,
      },
      `Validation Error: Insufficient funds in ${from} (balance: ₹${fromAcc.balance}, required: ₹${amount})`
    );
    return {
      success: false,
      error: `Insufficient funds (balance: ₹${fromAcc.balance})`,
      events: eventsEmitted,
    };
  }

  // 4. Execution step
  const prevFromBal = fromAcc.balance;
  const prevToBal = toAcc.balance;

  fromAcc.balance -= amount;
  toAcc.balance += amount;
  fromAcc.version = (fromAcc.version || 1) + 1;
  toAcc.version = (toAcc.version || 1) + 1;

  logEvent(
    EVENT_TYPES.RPC_PROCESSING,
    {
      stage: "execution",
      fromAccount: from,
      toAccount: to,
      amount,
      prevFromBal,
      newFromBal: fromAcc.balance,
      prevToBal,
      newToBal: toAcc.balance,
    },
    `Executed transfer: ${from} (₹${prevFromBal} -> ₹${fromAcc.balance}), ${to} (₹${prevToBal} -> ₹${toAcc.balance})`
  );

  // 5. Response marshalled back to client
  const responseData = {
    stage: "completed",
    success: true,
    result: {
      transactionId: `TXN-${Math.floor(Math.random() * 90000 + 10000)}`,
      method,
      from,
      to,
      amount,
      newBalances: {
        [from]: fromAcc.balance,
        [to]: toAcc.balance,
      },
    },
  };

  logEvent(
    EVENT_TYPES.RPC_RESPONSE,
    responseData,
    `RPC Response sent back to client: Status SUCCESS for ${from} -> ${to} ₹${amount}`
  );

  state.totalTransactions++;

  return {
    success: true,
    result: responseData.result,
    events: eventsEmitted,
    accounts: server.accounts,
  };
}
