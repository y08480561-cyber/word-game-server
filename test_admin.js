/**
 * Comprehensive Automated Test Suite for Remote Admin Panel & Tournament System
 */

const http = require('http');

const crypto = require('crypto');
const PORT = 8089;
process.env.PORT = PORT;

const TEST_ADMIN_USER = 'admin_tester_' + crypto.randomBytes(4).toString('hex');
const TEST_ADMIN_PASS = 'TestSecurePass_' + crypto.randomBytes(12).toString('hex');
process.env.ADMIN_USERNAME = TEST_ADMIN_USER;
process.env.ADMIN_PASSWORD = TEST_ADMIN_PASS;

const serverApp = require('./server');
const server = serverApp.server;

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json'
    };
    options.headers = Object.assign(defaultHeaders, options.headers || {});
    options.port = PORT;
    options.host = '127.0.0.1';

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

async function runTests() {
  console.log('--- Starting Admin Panel & Remote Tournament Automated Tests ---');
  let adminToken = null;

  try {
    // 1. Health check
    console.log('\n[Test 1] Verifying Public Server Health API...');
    const health = await request({ path: '/api/status', method: 'GET' });
    console.log(`Status: ${health.status}, Server: ${health.body.server}`);
    if (health.status !== 200) throw new Error('Health check failed');
    console.log('✅ Test 1 Passed: Public Health API online.');

    // 2. Normal host root check (Player does NOT see admin panel)
    console.log('\n[Test 2] Verifying Player Root does NOT expose Admin Panel...');
    const playerRoot = await request({ path: '/', method: 'GET', headers: { Host: 'game.kalametgame.ir' } });
    if (playerRoot.status !== 200 || !playerRoot.body || playerRoot.body.status !== 'online') {
      throw new Error('Normal host root should return API JSON status');
    }
    console.log('✅ Test 2 Passed: Normal player URL returns API status JSON.');

    // 3. Admin domain check (admin.kalametgame.ir serves Admin HTML)
    console.log('\n[Test 3] Verifying Admin Domain (admin.kalametgame.ir) serves Admin Web UI...');
    const adminRoot = await request({ path: '/', method: 'GET', headers: { Host: 'admin.kalametgame.ir' } });
    if (adminRoot.status !== 200 || !adminRoot.raw.includes('پنل مدیریت کلمه‌ت')) {
      throw new Error('Admin domain did not serve Admin HTML');
    }
    console.log('✅ Test 3 Passed: admin.kalametgame.ir serves Persian Admin Panel.');

    // 4. /admin path serves Admin Web UI
    console.log('\n[Test 4] Verifying /admin path serves Admin Web UI...');
    const adminPath = await request({ path: '/admin', method: 'GET' });
    if (adminPath.status !== 200 || !adminPath.raw.includes('پنل مدیریت کلمه‌ت')) {
      throw new Error('/admin path did not serve Admin HTML');
    }
    console.log('✅ Test 4 Passed: /admin serves Admin Web UI.');

    // 5. Unauthenticated Admin API Access Rejected (401)
    console.log('\n[Test 5] Verifying Protected Admin Routes reject unauthenticated calls...');
    const unauthDash = await request({ path: '/admin/api/dashboard', method: 'GET' });
    if (unauthDash.status !== 401) {
      throw new Error(`Expected 401, got ${unauthDash.status}`);
    }
    console.log('✅ Test 5 Passed: Unauthenticated admin route correctly rejected with 401.');

    // 6. Admin Login with Wrong Password Fails
    console.log('\n[Test 6] Verifying Admin Login with Invalid Password...');
    const badLogin = await request(
      { path: '/admin/api/login', method: 'POST' },
      { username: 'admin', password: 'wrongPassword123' }
    );
    if (badLogin.status !== 401) throw new Error('Bad login should return 401');
    console.log('✅ Test 6 Passed: Bad login rejected.');

    // 7. Admin Login with Valid Password Succeeds
    console.log('\n[Test 7] Verifying Admin Login with Valid Credentials...');
    const goodLogin = await request(
      { path: '/admin/api/login', method: 'POST' },
      { username: TEST_ADMIN_USER, password: TEST_ADMIN_PASS }
    );
    if (goodLogin.status !== 200 || !goodLogin.body.token) throw new Error('Valid login failed');
    adminToken = goodLogin.body.token;
    console.log(`✅ Test 7 Passed: Logged in successfully. Token: ${adminToken.substring(0, 16)}...`);

    // 8. Admin Dashboard Authenticated Access
    console.log('\n[Test 8] Verifying Authenticated Admin Dashboard data...');
    const dash = await request({
      path: '/admin/api/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (dash.status !== 200 || !dash.body.tournament) throw new Error('Failed to get dashboard');
    console.log(`✅ Test 8 Passed: Dashboard loaded. Tournament ID="${dash.body.tournament.tournamentId}", EntryCost=${dash.body.tournament.entryCost}`);

    // 9. Remote Configuration: Admin Changes Entry Cost from 2 to 5 & Updates 1st Prize
    console.log('\n[Test 9] Verifying Remote Update: Entry Cost 2 -> 5, 1st Prize -> "AirPods Pro Max"...');
    const updateRes = await request(
      {
        path: '/admin/api/tournament/update',
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      },
      {
        entryCost: 5,
        monthName: "🏆 رقابت ویژه پاییزی",
        rewards: {
          firstPlace: "AirPods Pro Max",
          secondPlace: "۱۰۰۰ سکه",
          thirdPlace: "۵۰۰ سکه"
        }
      }
    );
    if (updateRes.status !== 200 || updateRes.body.tournament.entryCost !== 5) {
      throw new Error('Update failed: entryCost was not 5');
    }
    console.log('✅ Test 9 Passed: Admin successfully updated tournament settings.');

    // 10. Verify Android/Player GET /api/tournament receives new values without APK update
    console.log('\n[Test 10] Verifying Player API (/api/tournament) reflects updated remote settings...');
    const playerTourn = await request({ path: '/api/tournament', method: 'GET' });
    if (playerTourn.status !== 200) throw new Error('Player /api/tournament failed');
    if (playerTourn.body.entryCost !== 5) throw new Error(`Expected entryCost 5, got ${playerTourn.body.entryCost}`);
    if (playerTourn.body.rewards.firstPlace !== "AirPods Pro Max") throw new Error('First place prize mismatch');
    console.log(`✅ Test 10 Passed: Player receives updated Entry Cost: ${playerTourn.body.entryCost} coins, 1st Prize: ${playerTourn.body.rewards.firstPlace}`);

    // 11. Security: Player cannot modify tournament dates or settings (POST /api/tournament without admin token)
    console.log('\n[Test 11] Verifying Players CANNOT modify tournament settings (POST /api/tournament)...');
    const playerCheat = await request(
      { path: '/api/tournament', method: 'POST' },
      { entryCost: 0, rewards: { firstPlace: "Hacked Prize" } }
    );
    if (playerCheat.status !== 401) throw new Error('Rogue player modification was not blocked!');
    console.log('✅ Test 11 Passed: Unauthorized player POST rejected with 401.');

    // 12. Admin Actions: Extend Tournament 7 Days
    console.log('\n[Test 12] Verifying Admin Action: Extend Tournament 7 Days...');
    const prevEnd = playerTourn.body.endTimestamp;
    const extendRes = await request(
      {
        path: '/admin/api/tournament/action',
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      },
      { action: 'extend_7' }
    );
    if (extendRes.status !== 200) throw new Error('Extend action failed');
    const newEnd = extendRes.body.tournament.endTimestamp;
    const diffDays = Math.round((newEnd - prevEnd) / (86400 * 1000));
    console.log(`End timestamp shifted by ${diffDays} days.`);
    if (diffDays !== 7) throw new Error(`Expected 7 days extension, got ${diffDays}`);
    console.log('✅ Test 12 Passed: Tournament successfully extended by 7 days.');

    // 13. Audit Log Verification
    console.log('\n[Test 13] Verifying Administrator Audit Log...');
    const auditRes = await request({
      path: '/admin/api/audit-log',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (auditRes.status !== 200 || !auditRes.body.auditLogs || auditRes.body.auditLogs.length === 0) {
      throw new Error('Audit log is empty or failed');
    }
    const latestAction = auditRes.body.auditLogs[0];
    console.log(`Latest audit log: [${latestAction.action}] by "${latestAction.admin}" (Details: ${latestAction.details})`);
    console.log('✅ Test 13 Passed: Audit log accurately recorded admin operations.');

    // 14. Send Instant Push Notification via Admin API
    console.log('\n[Test 14] Verifying Admin Send Instant Push Notification API...');
    const sendNotifRes = await request(
      {
        path: '/admin/api/notifications/send',
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      },
      {
        title: "🎁 سکه‌های رایگان امروزت رو گرفتی؟",
        body: "گردونه شانس و سکه رایگان امروز منتظرته! همین حالا بیا بازی کن و سکه بگیر.",
        type: "REENGAGEMENT",
        target: "ALL"
      }
    );
    if (sendNotifRes.status !== 200 || !sendNotifRes.body.success) {
      throw new Error('Failed to send instant notification: ' + JSON.stringify(sendNotifRes.body));
    }
    console.log(`✅ Test 14 Passed: Instant notification sent successfully. ID: ${sendNotifRes.body.notification.id}`);

    // 15. Verify Android/Public Client GET /api/notifications/latest receives the notification
    console.log('\n[Test 15] Verifying Public API /api/notifications/latest receives latest notification...');
    const pubNotifRes = await request({ path: '/api/notifications/latest', method: 'GET' });
    if (pubNotifRes.status !== 200 || !pubNotifRes.body.latestNotification) {
      throw new Error('Public /api/notifications/latest failed');
    }
    if (pubNotifRes.body.latestNotification.title !== "🎁 سکه‌های رایگان امروزت رو گرفتی؟") {
      throw new Error('Latest notification title mismatch');
    }
    console.log(`✅ Test 15 Passed: Public client successfully fetched latest notification: "${pubNotifRes.body.latestNotification.title}"`);

    // 16. Update Inactivity Reminder Settings via Admin API
    console.log('\n[Test 16] Verifying Update Inactivity Reminder Settings API...');
    const updateNotifSettingsRes = await request(
      {
        path: '/admin/api/notifications/settings',
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      },
      {
        inactivityRemindersEnabled: true,
        inactivityHours: 12,
        reminderTemplates: [
          { id: "rem_test_1", title: "💎 هدیه اختصاصی", body: "۵۰ سکه رایگان برای بازگشت به بازی" }
        ]
      }
    );
    if (updateNotifSettingsRes.status !== 200 || updateNotifSettingsRes.body.settings.inactivityHours !== 12) {
      throw new Error('Failed to update notification settings');
    }
    console.log('✅ Test 16 Passed: Inactivity reminder settings updated.');

    // 17. Update and Get Hub UI Texts via Admin API
    console.log('\n[Test 17] Verifying Hub UI Customization API (/admin/api/hub-ui)...');
    const updateHubUiRes = await request(
      {
        path: '/admin/api/hub-ui',
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      },
      {
        screenTitle: "🏆 رقابت آنلاین کلمه‌ت",
        prize1Text: "آیفون ۱۶ پرومکس",
        footerText: "سازندگان بازی کلمه‌ت",
        showPrizeBanner: true
      }
    );
    if (updateHubUiRes.status !== 200 || updateHubUiRes.body.hubUi.prize1Text !== "آیفون ۱۶ پرومکس") {
      throw new Error('Failed to update hub UI texts: ' + JSON.stringify(updateHubUiRes.body));
    }

    const getHubUiRes = await request(
      {
        path: '/admin/api/hub-ui',
        method: 'GET',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }
    );
    if (getHubUiRes.status !== 200 || getHubUiRes.body.hubUi.screenTitle !== "🏆 رقابت آنلاین کلمه‌ت") {
      throw new Error('Failed to fetch updated hub UI');
    }
    console.log('✅ Test 17 Passed: Hub UI texts updated and verified successfully.');

    // 18. Admin Logout
    console.log('\n[Test 18] Verifying Admin Logout...');
    const logoutRes = await request({
      path: '/admin/api/logout',
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (logoutRes.status !== 200) throw new Error('Logout failed');

    const postLogoutDash = await request({
      path: '/admin/api/dashboard',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (postLogoutDash.status !== 401) throw new Error('Token should be invalidated after logout');
    console.log('✅ Test 18 Passed: Admin logged out and session revoked.');

    console.log('\n=============================================');
    console.log('🎉 ALL 18 BACKEND & ADMIN TESTS PASSED SUCCESSFULLY! 🎉');
    console.log('=============================================\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed with error:', err);
    process.exit(1);
  }
}

runTests();
