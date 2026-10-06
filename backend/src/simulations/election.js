// Election Simulation: Bully and Ring Leader Election Algorithms
import { eventBus, EVENT_TYPES } from "../events.js";
import { state } from "../state.js";

export function runElectionSimulation({
  algorithm = "bully", // "bully" | "ring"
  initiatorId = 2,
}) {
  const eventsEmitted = [];
  function logEvent(type, data, msg) {
    const ev = eventBus.emit("election", type, data, msg);
    eventsEmitted.push(ev);
    return ev;
  }

  const aliveNodes = state.nodes.filter((n) => n.alive);
  const initiator = state.getNode(initiatorId);

  if (!initiator || !initiator.alive) {
    return {
      success: false,
      error: `Initiator Node ${initiatorId} is not alive`,
      events: eventsEmitted,
    };
  }

  logEvent(
    EVENT_TYPES.ELECTION_STARTED,
    {
      algorithm,
      initiatorId,
      aliveNodeIds: aliveNodes.map((n) => n.id),
      previousCoordinatorId: state.coordinatorId,
    },
    `Node ${initiatorId} detected failure of coordinator (Node ${state.coordinatorId}). Starting ${algorithm.toUpperCase()} election!`
  );

  // 1. BULLY ALGORITHM
  if (algorithm === "bully") {
    // Stage 1: Initiator sends ELECTION to all higher IDs
    const higherFromInitiator = state.nodes.filter((n) => n.id > initiatorId);
    for (const target of higherFromInitiator) {
      logEvent(
        EVENT_TYPES.ELECTION_MESSAGE,
        { from: initiatorId, to: target.id, kind: "ELECTION" },
        `Node ${initiatorId} -> Node ${target.id}: ELECTION message`
      );

      if (target.alive) {
        logEvent(
          EVENT_TYPES.ELECTION_MESSAGE,
          { from: target.id, to: initiatorId, kind: "OK" },
          `Node ${target.id} -> Node ${initiatorId}: OK (I am alive and take over)`
        );
      } else {
        logEvent(
          EVENT_TYPES.ELECTION_MESSAGE,
          { from: initiatorId, to: target.id, kind: "TIMEOUT" },
          `Node ${target.id} is DOWN: no response to Node ${initiatorId}`
        );
      }
    }

    // Successive rounds: Higher alive nodes contest among themselves
    const aliveHigher = higherFromInitiator.filter((n) => n.alive);

    if (aliveHigher.length > 0) {
      // For each higher node, it sends election to even higher nodes
      for (const node of aliveHigher) {
        const higherStill = state.nodes.filter((n) => n.id > node.id);
        for (const target of higherStill) {
          logEvent(
            EVENT_TYPES.ELECTION_MESSAGE,
            { from: node.id, to: target.id, kind: "ELECTION" },
            `Node ${node.id} -> Node ${target.id}: ELECTION message`
          );
          if (target.alive) {
            logEvent(
              EVENT_TYPES.ELECTION_MESSAGE,
              { from: target.id, to: node.id, kind: "OK" },
              `Node ${target.id} -> Node ${node.id}: OK`
            );
          } else {
            logEvent(
              EVENT_TYPES.ELECTION_MESSAGE,
              { from: node.id, to: target.id, kind: "TIMEOUT" },
              `Node ${target.id} is DOWN: no response to Node ${node.id}`
            );
          }
        }
      }
    }

    // Highest alive node among all is the winner
    const winner = aliveNodes.reduce((max, n) => (n.id > max.id ? n : max), aliveNodes[0]);

    // Winner broadcasts COORDINATOR to all alive nodes
    for (const node of aliveNodes) {
      if (node.id !== winner.id) {
        logEvent(
          EVENT_TYPES.ELECTION_MESSAGE,
          { from: winner.id, to: node.id, kind: "COORDINATOR", coordinatorId: winner.id },
          `Node ${winner.id} -> Node ${node.id}: COORDINATOR(${winner.id}) declaration`
        );
      }
    }

    // Update state
    state.coordinatorId = winner.id;
    state.nodes.forEach((n) => {
      if (n.role === "coordinator" && n.id !== winner.id) n.role = "idle";
      if (n.id === winner.id) n.role = "coordinator";
    });

    logEvent(
      EVENT_TYPES.COORDINATOR_ELECTED,
      {
        algorithm: "bully",
        winnerId: winner.id,
      },
      `Bully Algorithm Concluded: Node ${winner.id} is ELECTED as new Coordinator!`
    );

    return {
      success: true,
      algorithm: "bully",
      winnerId: winner.id,
      events: eventsEmitted,
    };
  }

  // 2. RING ALGORITHM
  if (algorithm === "ring") {
    // Nodes ordered in logical ring [1, 2, 3, 4, 5]
    const allNodeIds = [1, 2, 3, 4, 5];
    const token = [initiatorId];

    // Traverse ring starting after initiator
    let currentIndex = allNodeIds.indexOf(initiatorId);
    let visitedCount = 0;

    logEvent(
      EVENT_TYPES.ELECTION_MESSAGE,
      { from: initiatorId, token: [...token], kind: "TOKEN_INITIALIZED" },
      `Node ${initiatorId} created Ring Election Token: [${token.join(", ")}]`
    );

    while (visitedCount < allNodeIds.length) {
      currentIndex = (currentIndex + 1) % allNodeIds.length;
      const nextId = allNodeIds[currentIndex];
      visitedCount++;

      if (nextId === initiatorId) {
        break; // Returned to initiator
      }

      const nodeObj = state.getNode(nextId);
      if (nodeObj && nodeObj.alive) {
        token.push(nextId);
        logEvent(
          EVENT_TYPES.ELECTION_MESSAGE,
          { from: allNodeIds[(currentIndex - 1 + 5) % 5], to: nextId, token: [...token], kind: "TOKEN_FORWARD" },
          `Node ${nextId} received token, appended ID: [${token.join(", ")}]`
        );
      } else {
        logEvent(
          EVENT_TYPES.ELECTION_MESSAGE,
          { skippedNodeId: nextId, kind: "SKIP_DEAD" },
          `Node ${nextId} is DEAD: skipped in logical ring forwarding`
        );
      }
    }

    logEvent(
      EVENT_TYPES.ELECTION_MESSAGE,
      { to: initiatorId, token: [...token], kind: "TOKEN_RETURNED" },
      `Token returned to Initiator Node ${initiatorId} with complete membership list: [${token.join(", ")}]`
    );

    const winnerId = Math.max(...token);

    // Circulate COORDINATOR message around the ring
    for (const nid of token) {
      logEvent(
        EVENT_TYPES.ELECTION_MESSAGE,
        { from: initiatorId, to: nid, kind: "COORDINATOR", coordinatorId: winnerId },
        `Ring notification: Node ${nid} informed that Node ${winnerId} is COORDINATOR`
      );
    }

    // Update state
    state.coordinatorId = winnerId;
    state.nodes.forEach((n) => {
      if (n.role === "coordinator" && n.id !== winnerId) n.role = "idle";
      if (n.id === winnerId) n.role = "coordinator";
    });

    logEvent(
      EVENT_TYPES.COORDINATOR_ELECTED,
      {
        algorithm: "ring",
        winnerId,
        membershipList: token,
      },
      `Ring Algorithm Concluded: Highest ID Node ${winnerId} is ELECTED as new Coordinator!`
    );

    return {
      success: true,
      algorithm: "ring",
      winnerId,
      membershipList: token,
      events: eventsEmitted,
    };
  }

  return { success: false, error: "Unknown algorithm" };
}
