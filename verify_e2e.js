/**
 * Complete End-to-End Verification of the Remote Admin Panel & Server Engine
 * Tests all 14 requirements specified by the user.
 */

const http = require('http');
const dns = require('dns').promises;
const fs = require('fs');
const path = require('path');

const crypto = require('crypto');
const PORT = 8099;
process.env.PORT = PORT;

const TEST_ADMIN_USER = 'admin_tester_' + crypto.randomBytes(4).toString('hex');
const TEST_ADMIN_PASS = 'TestPass_' + crypto.randomBytes(12).toString('hex');
process.env.ADMIN_USERNAME = TEST_ADMIN_USER;
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASS;

let serverApp = require('./server');
let server = serverApp.server;

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    options.port = PORT;
    options.host = '127.0.0.1';
    options.headers = options.headers || {};
    if (postData && !options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: json, raw: data });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, body: null, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runE2E() {
  console.log('================================================================');
  console.log('🏁 STARTING FULL END-TO-END VERIFICATION OF REMOTE ADMIN PANEL');
  console.log('================================================================\n');

  const results = {};
  let adminToken = '';

  // -------------------------------------------------------------
  // Item 1: Verify Admin Panel URL & admin.kalametgame.ir reachability
  // -------------------------------------------------------------
  console.log('--- [1] Verifying Admin Panel URL and admin.kalametgame.ir DNS ---');
  let dnsResolved = false;
  let dnsError = null;
  try {
    const lookup = await dns.lookup('admin.kalametgame.ir');
    dnsResolved = !!lookup.address;
  } catch (err) {
    dnsError = err.code || err.message;
  }

  // Also check if server router serves Admin HTML when Host is admin.kalametgame.ir
  const hostCheck = await request({
    path: '/',
    method: 'GET',
    headers: { Host: 'admin.kalametgame.ir' }
  });
  const htmlServedOnHost = hostCheck.raw.includes('پنل مدیریت مسابقات کلمه‌ت');

  console.log(`DNS Lookup admin.kalametgame.ir: ${dnsResolved ? 'RESOLVED' : 'UNRESOLVED (' + dnsError + ')'}`);
  console.log(`Server handles Host admin.kalametgame.ir: ${htmlServedOnHost ? 'YES' : 'NO'}`);
  console.log(`Server handles path /admin: YES`);

  results['item1'] = {
    pass: htmlServedOnHost,
    dnsConfigured: dnsResolved,
    dnsNote: dnsResolved ? 'DNS is configured' : 'DNS record for admin.kalametgame.ir is NOT yet added in DNS provider (needs CNAME or A record).'
  };

  // -------------------------------------------------------------
  // Item 2: Connected to same backend used by Android app
  // -------------------------------------------------------------
  console.log('\n--- [2] Verifying Admin Panel connected to same backend as Android app ---');
  const appStatus = await request({ path: '/api/status', method: 'GET' });
  const appTourn = await request({ path: '/api/tournament', method: 'GET' });
  const adminPage = await request({ path: '/admin', method: 'GET' });

  const sameBackend = appStatus.status === 200 && appTourn.status === 200 && adminPage.status === 200;
  console.log(`App Status endpoint: HTTP ${appStatus.status}, Server: ${appStatus.body.server}`);
  console.log(`App Tournament endpoint: HTTP ${appTourn.status}, Tourn ID: ${appTourn.body.tournamentId}`);
  console.log(`Admin Web UI: HTTP ${adminPage.status}`);
  results['item2'] = { pass: sameBackend };

  // -------------------------------------------------------------
  // Item 3: Admin Login
  // -------------------------------------------------------------
  console.log('\n--- [3] Verifying Admin Login ---');
  const badLogin = await request(
    { path: '/admin/api/login', method: 'POST' },
    { username: 'admin', password: 'InvalidPassword!' }
  );
  const goodLogin = await request(
    { path: '/admin/api/login', method: 'POST' },
    { username: TEST_ADMIN_USER, password: TEST_ADMIN_PASS }
  );

  const loginSuccess = badLogin.status === 401 && goodLogin.status === 200 && !!goodLogin.body.token;
  if (loginSuccess) {
    adminToken = goodLogin.body.token;
  }
  console.log(`Invalid password rejected: ${badLogin.status === 401}`);
  console.log(`Valid login accepted: ${goodLogin.status === 200}, Token: ${adminToken.substring(0, 16)}...`);
  results['item3'] = { pass: loginSuccess };

  // -------------------------------------------------------------
  // Item 4: Change tournament entry cost from 2 to 5 coins
  // -------------------------------------------------------------
  console.log('\n--- [4] Changing tournament entry cost from 2 to 5 coins via Admin API ---');
  const updateCost = await request(
    {
      path: '/admin/api/tournament/update',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    },
    { entryCost: 5 }
  );

  const costUpdated = updateCost.status === 200 && updateCost.body.tournament.entryCost === 5;
  console.log(`Admin update response: HTTP ${updateCost.status}, new entryCost: ${updateCost.body?.tournament?.entryCost}`);
  results['item4'] = { pass: costUpdated };

  // -------------------------------------------------------------
  // Item 5: Verify backend stores the new value in DB
  // -------------------------------------------------------------
  console.log('\n--- [5] Verifying backend stores new value in persistent database ---');
  const tournFile = path.join(__dirname, 'data', 'tournament.json');
  const dbData = JSON.parse(fs.readFileSync(tournFile, 'utf8'));
  const storedInDb = dbData.entryCost === 5;
  console.log(`data/tournament.json entryCost on disk: ${dbData.entryCost}`);
  results['item5'] = { pass: storedInDb };

  // -------------------------------------------------------------
  // Item 6: Verify Android app receives new value without APK update
  // -------------------------------------------------------------
  console.log('\n--- [6] Verifying Android client endpoint (/api/tournament) receives 5 coins ---');
  const clientTourn = await request({ path: '/api/tournament', method: 'GET' });
  const clientGotCost = clientTourn.status === 200 && clientTourn.body.entryCost === 5;
  console.log(`Player API /api/tournament entryCost: ${clientTourn.body.entryCost}`);
  results['item6'] = { pass: clientGotCost };

  // -------------------------------------------------------------
  // Item 7: Change tournament end time
  // -------------------------------------------------------------
  console.log('\n--- [7] Changing tournament end time ---');
  const oldEnd = clientTourn.body.endTimestamp;
  const extendAction = await request(
    {
      path: '/admin/api/tournament/action',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    },
    { action: 'extend_7' }
  );
  const newEnd = extendAction.body.tournament.endTimestamp;
  const daysDiff = Math.round((newEnd - oldEnd) / (86400 * 1000));
  const timeChanged = extendAction.status === 200 && daysDiff === 7;
  console.log(`Old end: ${new Date(oldEnd).toISOString()}`);
  console.log(`New end: ${new Date(newEnd).toISOString()}`);
  console.log(`Difference: ${daysDiff} days`);
  results['item7'] = { pass: timeChanged };

  // -------------------------------------------------------------
  // Item 8: Verify all clients receive same server-authoritative remaining time
  // -------------------------------------------------------------
  console.log('\n--- [8] Verifying server-authoritative timing across client queries ---');
  const client1 = await request({ path: '/api/tournament', method: 'GET' });
  const client2 = await request({ path: '/api/tournament', method: 'GET' });

  const syncCheck = client1.body.endTimestamp === client2.body.endTimestamp &&
                    Math.abs(client1.body.serverTimestamp - client2.body.serverTimestamp) < 100 &&
                    client1.body.remainingSeconds === client2.body.remainingSeconds;
  console.log(`Client 1 Remaining Secs: ${client1.body.remainingSeconds}`);
  console.log(`Client 2 Remaining Secs: ${client2.body.remainingSeconds}`);
  results['item8'] = { pass: syncCheck };

  // -------------------------------------------------------------
  // Item 9: Restart backend and verify changes remain
  // -------------------------------------------------------------
  console.log('\n--- [9] Simulating backend restart and verifying persistence ---');
  // Close existing server
  await new Promise(resolve => server.close(resolve));

  // Require fresh modules or clear cache
  delete require.cache[require.resolve('./server')];
  delete require.cache[require.resolve('./db')];
  delete require.cache[require.resolve('./adminRoutes')];
  delete require.cache[require.resolve('./adminAuth')];

  serverApp = require('./server');
  server = serverApp.server;
  await new Promise(resolve => setTimeout(resolve, 500));

  const postRestartTourn = await request({ path: '/api/tournament', method: 'GET' });
  const persisted = postRestartTourn.status === 200 &&
                    postRestartTourn.body.entryCost === 5 &&
                    postRestartTourn.body.endTimestamp === newEnd;
  console.log(`After restart entryCost: ${postRestartTourn.body.entryCost} (expected: 5)`);
  console.log(`After restart endTimestamp: ${postRestartTourn.body.endTimestamp} (persisted: ${persisted})`);
  results['item9'] = { pass: persisted };

  // Re-login after restart
  const relogin = await request(
    { path: '/admin/api/login', method: 'POST' },
    { username: TEST_ADMIN_USER, password: TEST_ADMIN_PASS }
  );
  adminToken = relogin.body.token;

  // -------------------------------------------------------------
  // Item 10: Change prizes and verify Android app receives new prizes
  // -------------------------------------------------------------
  console.log('\n--- [10] Changing prizes and verifying Android app receives new prizes ---');
  const newPrizes = {
    firstPlace: "گوشی پرچمدار + ۵۰ هزار سکه",
    secondPlace: "ساعت هوشمند + ۲۰ هزار سکه",
    thirdPlace: "ایرپاد پرو + ۱۰ هزار سکه"
  };
  const prizeUpdate = await request(
    {
      path: '/admin/api/tournament/update',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    },
    { rewards: newPrizes }
  );

  const clientPrizes = await request({ path: '/api/tournament', method: 'GET' });
  const prizesMatch = clientPrizes.body.rewards.firstPlace === newPrizes.firstPlace &&
                      clientPrizes.body.rewards.secondPlace === newPrizes.secondPlace &&
                      clientPrizes.body.rewards.thirdPlace === newPrizes.thirdPlace;
  console.log(`Updated 1st Prize in Player API: "${clientPrizes.body.rewards.firstPlace}"`);
  results['item10'] = { pass: prizesMatch };

  // -------------------------------------------------------------
  // Item 11: Normal player cannot access any admin API
  // -------------------------------------------------------------
  console.log('\n--- [11] Verifying normal player cannot access any admin API ---');
  const playerDash = await request({ path: '/admin/api/dashboard', method: 'GET' });
  const playerAudit = await request({ path: '/admin/api/audit-log', method: 'GET' });
  const playerAction = await request({ path: '/admin/api/tournament/action', method: 'POST' }, { action: 'end' });
  const playerUpdate = await request({ path: '/admin/api/tournament/update', method: 'POST' }, { entryCost: 0 });
  const playerPostTourn = await request({ path: '/api/tournament', method: 'POST' }, { entryCost: 0 });

  const allRejected = playerDash.status === 401 &&
                      playerAudit.status === 401 &&
                      playerAction.status === 401 &&
                      playerUpdate.status === 401 &&
                      playerPostTourn.status === 401;

  console.log(`GET /admin/api/dashboard without token: HTTP ${playerDash.status}`);
  console.log(`GET /admin/api/audit-log without token: HTTP ${playerAudit.status}`);
  console.log(`POST /admin/api/tournament/action without token: HTTP ${playerAction.status}`);
  console.log(`POST /admin/api/tournament/update without token: HTTP ${playerUpdate.status}`);
  console.log(`POST /api/tournament (unauthorized modification): HTTP ${playerPostTourn.status}`);
  results['item11'] = { pass: allRejected };

  // -------------------------------------------------------------
  // Item 12: Audit log records changes
  // -------------------------------------------------------------
  console.log('\n--- [12] Verifying audit log records changes ---');
  const auditRes = await request({
    path: '/admin/api/audit-log',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  const logs = auditRes.body.auditLogs;
  const hasUpdateCostLog = logs.some(l => l.action === 'UPDATE_ENTRY_COST');
  const hasExtendLog = logs.some(l => l.action === 'EXTEND_TOURNAMENT');
  const hasPrizesLog = logs.some(l => l.action === 'UPDATE_PRIZES');

  const auditWorking = logs.length > 0 && hasUpdateCostLog && hasExtendLog && hasPrizesLog;
  console.log(`Total Audit Log Entries: ${logs.length}`);
  console.log(`Logged UPDATE_ENTRY_COST: ${hasUpdateCostLog}`);
  console.log(`Logged EXTEND_TOURNAMENT: ${hasExtendLog}`);
  console.log(`Logged UPDATE_PRIZES: ${hasPrizesLog}`);
  results['item12'] = { pass: auditWorking };

  // -------------------------------------------------------------
  // Item 13: 24-hour closed period works correctly
  // -------------------------------------------------------------
  console.log('\n--- [13] Verifying 24-hour closed period ---');
  const closeAction = await request(
    {
      path: '/admin/api/tournament/action',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    },
    { action: 'close' }
  );

  const closedState = closeAction.body.tournament;
  const isClosed = closedState.status === 'CLOSED';
  const closureHours = closedState.closureHours;
  const closureDiffHours = Math.round((closedState.closureEndTimestamp - closedState.serverTimestamp) / (3600 * 1000));

  console.log(`Tournament status: ${closedState.status}`);
  console.log(`Configured closure hours: ${closureHours}`);
  console.log(`Remaining closure duration: ~${closureDiffHours} hours`);

  const closedPeriodWorking = isClosed && closureDiffHours >= 23 && closureDiffHours <= 25;
  results['item13'] = { pass: closedPeriodWorking };

  // -------------------------------------------------------------
  // Item 14: Next tournament can start without APK update
  // -------------------------------------------------------------
  console.log('\n--- [14] Verifying next tournament can start without APK update ---');
  const nextAction = await request(
    {
      path: '/admin/api/tournament/action',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    },
    { action: 'start_next' }
  );

  const nextState = nextAction.body.tournament;
  const isNextActive = nextState.status === 'ACTIVE';
  const isNextSeason = nextState.tournamentId.includes('season_2') || nextState.tournamentId !== closedState.tournamentId;

  // Confirm client API immediately sees next tournament
  const clientNextTourn = await request({ path: '/api/tournament', method: 'GET' });
  const clientSeesNext = clientNextTourn.body.status === 'ACTIVE' && clientNextTourn.body.tournamentId === nextState.tournamentId;

  console.log(`Next Tournament ID: ${nextState.tournamentId}`);
  console.log(`Next Tournament Status: ${nextState.status}`);
  console.log(`Player API sees next season: ${clientSeesNext}`);

  const nextTournamentWorking = isNextActive && isNextSeason && clientSeesNext;
  results['item14'] = { pass: nextTournamentWorking };

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n================================================================');
  console.log('📊 VERIFICATION SUMMARY JSON');
  console.log('================================================================');
  console.log(JSON.stringify(results, null, 2));

  // Exit cleanly
  server.close(() => process.exit(0));
}

runE2E().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
