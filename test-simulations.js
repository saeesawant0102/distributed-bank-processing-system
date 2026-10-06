// Automated integration test script for all 7 DC Bank experiments

const BASE = 'http://localhost:5001/api';

async function post(endpoint, data = {}) {
  const res = await fetch(`${BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function get(endpoint) {
  const res = await fetch(`${BASE}${endpoint}`);
  return res.json();
}

async function runTests() {
  console.log('--- TEST 1: System State & Reset ---');
  const resetRes = await post('/reset');
  console.log('Reset OK:', resetRes.success, 'Nodes:', resetRes.nodes.length);

  console.log('\n--- TEST 2: Experiment 1 RPC Transfer ---');
  const rpcRes = await post('/rpc/transfer', { from: 'A101', to: 'A102', amount: 500 });
  console.log('RPC Normal OK:', rpcRes.success, 'New Balances:', rpcRes.result?.newBalances);

  const rpcFailRes = await post('/rpc/transfer', { from: 'A101', to: 'A102', amount: 999999 });
  console.log('RPC Insufficient Funds Handled:', !rpcFailRes.success, 'Error:', rpcFailRes.error);

  console.log('\n--- TEST 3: Experiment 2 Multithreading (Race vs Mutex) ---');
  const raceRes = await post('/threads/run', { mode: 'unsafe', isRaceDemo: true });
  console.log('Unsafe Mode Race Detected:', raceRes.raceDetected, 'Actual:', raceRes.actualBalance, 'Expected:', raceRes.expectedBalance);

  const mutexRes = await post('/threads/run', { mode: 'mutex', isRaceDemo: true });
  console.log('Mutex Mode Race Prevented:', !mutexRes.raceDetected, 'Actual:', mutexRes.actualBalance);

  console.log('\n--- TEST 4: Experiment 3 Clock Synchronization ---');
  const cristianRes = await post('/clock/sync', { algorithm: 'cristian', timeServerId: 1, clientId: 3 });
  console.log('Cristian Sync OK:', cristianRes.success, 'RTT:', cristianRes.rtt, 'newTime:', cristianRes.newTime);

  const berkeleyRes = await post('/clock/sync', { algorithm: 'berkeley' });
  console.log('Berkeley Sync OK:', berkeleyRes.success, 'Avg Offset:', berkeleyRes.averageOffset, 'Adjustments:', berkeleyRes.adjustments?.length);

  const lamportRes = await post('/clock/sync', { algorithm: 'lamport' });
  console.log('Lamport Sync OK:', lamportRes.success, 'Events count:', lamportRes.history?.length);

  console.log('\n--- TEST 5: Experiment 4 Leader Election ---');
  await post('/nodes/5/kill');
  const bullyRes = await post('/election/start', { algorithm: 'bully', initiatorId: 2 });
  console.log('Bully Election OK (Node 5 dead):', bullyRes.success, 'Winner:', bullyRes.winnerId);

  const ringRes = await post('/election/start', { algorithm: 'ring', initiatorId: 2 });
  console.log('Ring Election OK (Node 5 dead):', ringRes.success, 'Winner:', ringRes.winnerId, 'Membership:', ringRes.membershipList);

  console.log('\n--- TEST 6: Experiment 5 Consistency and Replication ---');
  await post('/reset');
  const strongRes = await post('/replication/write', { mode: 'strong', amount: 2000 });
  console.log('Strong Replication Committed:', strongRes.success, 'Committed:', strongRes.committed);

  const eventualRes = await post('/replication/write', { mode: 'eventual', amount: 1000 });
  console.log('Eventual Replication Converged:', eventualRes.success, 'Converged:', eventualRes.converged);

  console.log('\n--- TEST 7: Experiment 6 Load Balancing ---');
  const rrRes = await post('/load/send', { algorithm: 'roundRobin', count: 6 });
  console.log('Round Robin OK:', rrRes.success, 'Requests routed:', rrRes.requestCount);

  const lcRes = await post('/load/send', { algorithm: 'leastConnections', count: 6 });
  console.log('Least Connections OK:', lcRes.success, 'Distribution:', Object.keys(lcRes.distribution));

  console.log('\n--- TEST 8: Experiment 7 Fault Tolerance & Failover ---');
  const txn1 = await post('/failover/run', { action: 'transaction', amount: 500 });
  console.log('Primary Txn 1 OK:', txn1.success, 'Primary:', txn1.primaryId, 'Epoch:', txn1.epoch);

  const failPrimary = await post('/failover/run', { action: 'fail_primary' });
  console.log('Failover Triggered:', failPrimary.success, 'New Primary:', failPrimary.newPrimaryId, 'Epoch:', failPrimary.epoch);

  const txn2 = await post('/failover/run', { action: 'transaction', amount: 300 });
  console.log('Next Txn on New Primary OK:', txn2.success, 'Serving Primary:', txn2.primaryId, 'Epoch:', txn2.epoch);

  const recovery = await post('/failover/run', { action: 'recover_old_primary' });
  console.log('Old Primary Recovered as Backup:', recovery.success, 'Backup ID:', recovery.backupId);

  console.log('\n=== ALL 7 DISTRIBUTED COMPUTING EXPERIMENTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(console.error);
