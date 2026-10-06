// Clock Synchronization Simulation: Cristian, Berkeley, and Lamport Logical Clocks
import { eventBus, EVENT_TYPES } from "../events.js";
import { state } from "../state.js";

export function runClockSimulation({
  algorithm = "berkeley", // "cristian" | "berkeley" | "lamport"
  timeServerId = 1,
  clientId = 3,
  customOffsets = null,
  rtt = 200, // simulated round trip time in ms for Cristian
}) {
  const eventsEmitted = [];
  function logEvent(type, data, msg) {
    const ev = eventBus.emit("clock", type, data, msg);
    eventsEmitted.push(ev);
    return ev;
  }

  // 1. CRISTIAN ALGORITHM
  if (algorithm === "cristian") {
    const serverNode = state.getNode(timeServerId);
    const clientNode = state.getNode(clientId);

    if (!serverNode || !clientNode) {
      return { success: false, error: "Invalid node IDs for Cristian sync" };
    }

    const t0 = 100; // Client sends request at t0
    logEvent(
      EVENT_TYPES.MESSAGE_SENT,
      { from: clientNode.id, to: serverNode.id, kind: "TIME_REQUEST", t0 },
      `Node ${clientNode.id} sent TIME_REQUEST to Time Server Node ${serverNode.id} at T0=${t0}ms`
    );

    const ts = 1000; // Server authoritative timestamp
    logEvent(
      EVENT_TYPES.MESSAGE_RECEIVED,
      { serverId: serverNode.id, ts },
      `Time Server Node ${serverNode.id} generated authoritative timestamp Ts=${ts}ms`
    );

    const t1 = t0 + rtt; // Client receives reply at t1
    const measuredRtt = t1 - t0;
    const estimatedOneWayDelay = measuredRtt / 2;
    const newTime = ts + estimatedOneWayDelay;
    const oldOffset = clientNode.clockOffset;

    // Adjust client clock offset so it matches server
    clientNode.clockOffset = serverNode.clockOffset;

    logEvent(
      EVENT_TYPES.CLOCK_UPDATED,
      {
        nodeId: clientNode.id,
        t0,
        t1,
        ts,
        rtt: measuredRtt,
        estimatedDelay: estimatedOneWayDelay,
        newTime,
        errorBound: estimatedOneWayDelay,
        oldOffset,
        newOffset: clientNode.clockOffset,
      },
      `Node ${clientNode.id} synchronized via Cristian: RTT=${measuredRtt}ms, newTime=${newTime}ms (error ≤ ±${estimatedOneWayDelay}ms)`
    );

    return {
      success: true,
      algorithm: "cristian",
      formula: "newTime = Ts + (T1 - T0) / 2",
      t0,
      t1,
      ts,
      rtt: measuredRtt,
      newTime,
      events: eventsEmitted,
    };
  }

  // 2. BERKELEY ALGORITHM
  if (algorithm === "berkeley") {
    const masterNode = state.getNode(1);
    const participantNodes = state.nodes.filter((n) => n.id <= 4 && n.alive);

    if (customOffsets && Array.isArray(customOffsets)) {
      participantNodes.forEach((node, i) => {
        if (customOffsets[i] !== undefined) node.clockOffset = customOffsets[i];
      });
    }

    logEvent(
      EVENT_TYPES.SIM_STARTED,
      {
        masterId: masterNode.id,
        participants: participantNodes.map((n) => ({ id: n.id, offset: n.clockOffset })),
      },
      `Berkeley Algorithm started: Master Node ${masterNode.id} polling ${participantNodes.length} nodes for clock offsets`
    );

    // Master polls each node and gathers offset relative to master
    const masterOffset = masterNode.clockOffset;
    const offsetsRelativeToMaster = participantNodes.map((n) => ({
      nodeId: n.id,
      offset: n.clockOffset - masterOffset,
      currentOffset: n.clockOffset,
    }));

    // Calculate average offset
    const sumOffsets = offsetsRelativeToMaster.reduce((acc, curr) => acc + curr.offset, 0);
    const averageOffset = Number((sumOffsets / offsetsRelativeToMaster.length).toFixed(2));

    // Calculate adjustment for each node: adjustment = averageOffset - relativeOffset
    const adjustments = offsetsRelativeToMaster.map((item) => {
      const adj = Number((averageOffset - item.offset).toFixed(2));
      const node = state.getNode(item.nodeId);
      const oldOffset = node.clockOffset;
      node.clockOffset = Number((node.clockOffset + adj).toFixed(2));
      return {
        nodeId: item.nodeId,
        oldOffset,
        adjustment: adj,
        newOffset: node.clockOffset,
      };
    });

    logEvent(
      EVENT_TYPES.CLOCK_UPDATED,
      {
        masterId: masterNode.id,
        averageOffset,
        adjustments,
      },
      `Berkeley: Average offset relative to master is ${averageOffset >= 0 ? "+" : ""}${averageOffset}s. Adjustments dispatched to all nodes.`
    );

    return {
      success: true,
      algorithm: "berkeley",
      masterId: masterNode.id,
      averageOffset,
      adjustments,
      nodes: participantNodes.map((n) => ({ id: n.id, offset: n.clockOffset })),
      events: eventsEmitted,
    };
  }

  // 3. LAMPORT LOGICAL CLOCK
  if (algorithm === "lamport") {
    // Reset lamport clocks
    state.nodes.forEach((n) => (n.lamport = 0));

    const lamportSteps = [
      {
        nodeId: 1,
        type: "LOCAL",
        desc: "Node 1 initiates debit transaction on A101",
      },
      {
        nodeId: 1,
        type: "SEND",
        toNodeId: 2,
        desc: "Node 1 sends transfer replication message to Node 2",
      },
      {
        nodeId: 2,
        type: "RECEIVE",
        fromNodeId: 1,
        desc: "Node 2 receives transfer replication message from Node 1",
      },
      {
        nodeId: 2,
        type: "LOCAL",
        desc: "Node 2 verifies signature and ledger state",
      },
      {
        nodeId: 2,
        type: "SEND",
        toNodeId: 3,
        desc: "Node 2 forwards audit log to Node 3",
      },
      {
        nodeId: 3,
        type: "RECEIVE",
        fromNodeId: 2,
        desc: "Node 3 receives audit log from Node 2",
      },
    ];

    let messageInFlightClock = 0;
    const history = [];

    for (const step of lamportSteps) {
      const node = state.getNode(step.nodeId);
      const prevLamport = node.lamport;

      if (step.type === "LOCAL") {
        node.lamport += 1;
        logEvent(
          EVENT_TYPES.LAMPORT_EVENT,
          {
            nodeId: node.id,
            type: step.type,
            prevLamport,
            newLamport: node.lamport,
            description: step.desc,
            rule: "L = L + 1",
          },
          `Node ${node.id} [LOCAL]: ${step.desc} (L: ${prevLamport} -> ${node.lamport})`
        );
      } else if (step.type === "SEND") {
        node.lamport += 1;
        messageInFlightClock = node.lamport;
        logEvent(
          EVENT_TYPES.LAMPORT_EVENT,
          {
            nodeId: node.id,
            targetNodeId: step.toNodeId,
            type: step.type,
            prevLamport,
            newLamport: node.lamport,
            attachedClock: messageInFlightClock,
            description: step.desc,
            rule: "L = L + 1, send(L)",
          },
          `Node ${node.id} [SEND to N${step.toNodeId}]: ${step.desc} (attached L=${messageInFlightClock})`
        );
      } else if (step.type === "RECEIVE") {
        const receivedClock = messageInFlightClock;
        node.lamport = Math.max(node.lamport, receivedClock) + 1;
        logEvent(
          EVENT_TYPES.LAMPORT_EVENT,
          {
            nodeId: node.id,
            sourceNodeId: step.fromNodeId,
            type: step.type,
            prevLamport,
            receivedClock,
            newLamport: node.lamport,
            description: step.desc,
            rule: "L = max(L, L_msg) + 1",
          },
          `Node ${node.id} [RECEIVE from N${step.fromNodeId}]: max(${prevLamport}, ${receivedClock}) + 1 = ${node.lamport}`
        );
      }

      history.push({ ...step, clock: node.lamport });
    }

    return {
      success: true,
      algorithm: "lamport",
      history,
      events: eventsEmitted,
    };
  }

  return { success: false, error: "Unknown clock algorithm" };
}
