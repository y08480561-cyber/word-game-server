/**
 * Remote Administrator API Routes
 * Securely handles tournament actions, settings updates, auth, and audit logs.
 */

const db = require('./db');
const adminAuth = require('./adminAuth');

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) { // 1MB limit
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

async function handleAdminApi(req, res, url, serverContext) {
  const {
    getAuthoritativeTournamentState,
    broadcastTournamentUpdate,
    getSortedLeaderboard,
    users,
    activeMatches,
    matchmakingQueue,
    wss
  } = serverContext;

  // 1. Login
  if (url === '/admin/api/login' && req.method === 'POST') {
    try {
      const clientIp = adminAuth.extractClientIp(req);
      const isSecure = adminAuth.isRequestSecure(req);
      const { username, password } = await readJsonBody(req);
      const result = adminAuth.login(username, password, clientIp);
      if (!result.success) {
        sendJson(res, result.statusCode || 401, { success: false, error: result.error });
        return true;
      }

      // Set hardened cookie
      res.setHeader('Set-Cookie', adminAuth.createSessionCookie(result.token, isSecure));
      sendJson(res, 200, {
        success: true,
        token: result.token,
        username: result.username,
        expiresAt: result.expiresAt
      });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'درخواست نامعتبر است.' });
      return true;
    }
  }

  // 2. Logout
  if (url === '/admin/api/logout' && req.method === 'POST') {
    const isSecure = adminAuth.isRequestSecure(req);
    adminAuth.logout(req);
    res.setHeader('Set-Cookie', adminAuth.clearSessionCookie(isSecure));
    sendJson(res, 200, { success: true });
    return true;
  }

  // 3. Auth Check (/admin/api/me)
  if (url === '/admin/api/me' && req.method === 'GET') {
    const admin = adminAuth.getAuthenticatedAdmin(req);
    if (!admin) {
      sendJson(res, 401, { authenticated: false });
      return true;
    }
    sendJson(res, 200, { authenticated: true, username: admin.username });
    return true;
  }

  // Protected Admin Routes Below
  const admin = adminAuth.getAuthenticatedAdmin(req);
  if (!admin) {
    sendJson(res, 401, { error: 'دسترسی غیرمجاز. ورود به حساب کاربری مدیر الزامی است.' });
    return true;
  }

  // 4. Admin Dashboard Data
  if (url === '/admin/api/dashboard' && req.method === 'GET') {
    const currentTourn = getAuthoritativeTournamentState();
    const leaderboard = getSortedLeaderboard().slice(0, 50).map((u, idx) => ({
      rank: idx + 1,
      username: u.username,
      rating: u.rating || 1000,
      monthlyScore: u.monthlyScore || 0,
      wins: u.wins || 0,
      losses: u.losses || 0,
      draws: u.draws || 0
    }));
    const auditLogs = db.getAuditLogs(50);
    const leads = db.getPlayerLeads(100);

    const stats = {
      activeConnections: wss && wss.clients ? wss.clients.size : 0,
      activeMatches: activeMatches ? activeMatches.size : 0,
      queueSize: matchmakingQueue ? matchmakingQueue.length : 0,
      totalUsers: users ? users.size : 0,
      totalLeads: leads.length
    };

    sendJson(res, 200, {
      success: true,
      tournament: currentTourn,
      leaderboard,
      auditLogs,
      leads,
      stats
    });
    return true;
  }

  // 4.5 Get Player Leads Route
  if (url === '/admin/api/leads' && req.method === 'GET') {
    const leads = db.getPlayerLeads(200);
    sendJson(res, 200, { success: true, count: leads.length, leads });
    return true;
  }

  // 5. Update Tournament Settings (Title, entry cost, prizes, dates, etc.)
  if (url === '/admin/api/tournament/update' && req.method === 'POST') {
    try {
      const data = await readJsonBody(req);
      const current = db.getTournament();
      const updates = {};

      if (data.tournamentId) updates.tournamentId = String(data.tournamentId).trim();
      if (data.monthName) updates.monthName = String(data.monthName).trim();
      if (data.status && (data.status === 'ACTIVE' || data.status === 'CLOSED')) {
        updates.status = data.status;
      }
      if (typeof data.entryCost === 'number' && data.entryCost >= 0) {
        updates.entryCost = Math.floor(data.entryCost);
        if (updates.entryCost !== current.entryCost) {
          db.addAuditLog(admin.username, "UPDATE_ENTRY_COST", `${current.entryCost} سکه`, `${updates.entryCost} سکه`, "تغییر هزینه ورودی مسابقه");
        }
      }
      if (typeof data.durationDays === 'number' && data.durationDays > 0) {
        updates.durationDays = data.durationDays;
        const start = updates.startTimestamp || current.startTimestamp || Date.now();
        updates.endTimestamp = start + (data.durationDays * 86400 * 1000);
        const closureH = typeof data.closureHours === 'number' ? data.closureHours : (current.closureHours || 24);
        updates.closureEndTimestamp = updates.endTimestamp + (closureH * 3600 * 1000);
      }
      if (typeof data.closureHours === 'number' && data.closureHours > 0) {
        updates.closureHours = data.closureHours;
        const end = updates.endTimestamp || current.endTimestamp || (Date.now() + (30 * 86400 * 1000));
        updates.closureEndTimestamp = end + (data.closureHours * 3600 * 1000);
      }
      if (typeof data.totalParticipants === 'number' && data.totalParticipants > 0) {
        updates.totalParticipants = data.totalParticipants;
      }
      if (typeof data.startTimestamp === 'number') {
        updates.startTimestamp = data.startTimestamp;
      }
      if (typeof data.endTimestamp === 'number') {
        updates.endTimestamp = data.endTimestamp;
        const closureH = updates.closureHours || current.closureHours || 24;
        updates.closureEndTimestamp = data.endTimestamp + (closureH * 3600 * 1000);
      }
      if (typeof data.closureEndTimestamp === 'number') {
        updates.closureEndTimestamp = data.closureEndTimestamp;
      }

      if (data.rewards && typeof data.rewards === 'object') {
        updates.rewards = {
          firstPlace: data.rewards.firstPlace || current.rewards?.firstPlace || "ایرپاد",
          secondPlace: data.rewards.secondPlace || current.rewards?.secondPlace || "۵۰۰ سکه",
          thirdPlace: data.rewards.thirdPlace || current.rewards?.thirdPlace || "۲۰۰ سکه"
        };
        db.addAuditLog(admin.username, "UPDATE_PRIZES", JSON.stringify(current.rewards), JSON.stringify(updates.rewards), "بروزرسانی جوایز مسابقه");
      }

      const saved = db.saveTournament(updates, admin.username);
      db.addAuditLog(admin.username, "UPDATE_TOURNAMENT_SETTINGS", "-", updates.monthName || saved.monthName, "تنظیمات عمومی مسابقه بروزرسانی شد");

      broadcastTournamentUpdate();
      sendJson(res, 200, { success: true, tournament: getAuthoritativeTournamentState() });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'خطا در پردازش اطلاعات ارسالی: ' + err.message });
      return true;
    }
  }

  // 6. Tournament Actions (Start, End, Extend, Close, Reopen, Start Next)
  if (url === '/admin/api/tournament/action' && req.method === 'POST') {
    try {
      const { action, days } = await readJsonBody(req);
      const current = db.getTournament();
      const now = Date.now();
      let updates = {};

      switch (action) {
        case 'start': {
          const durationDays = current.durationDays || 30;
          const closureHours = current.closureHours || 24;
          updates = {
            tournamentId: `tourn_season_${Date.now()}`,
            status: "ACTIVE",
            startTimestamp: now,
            endTimestamp: now + (durationDays * 86400 * 1000),
            closureEndTimestamp: now + (durationDays * 86400 * 1000) + (closureHours * 3600 * 1000)
          };
          db.addAuditLog(admin.username, "START_TOURNAMENT", current.status, "ACTIVE", `شروع دوره جدید مسابقه (${durationDays} روزه)`);
          break;
        }

        case 'end': {
          const closureHours = current.closureHours || 24;
          updates = {
            status: "CLOSED",
            endTimestamp: now,
            closureEndTimestamp: now + (closureHours * 3600 * 1000)
          };
          db.addAuditLog(admin.username, "END_TOURNAMENT", "ACTIVE", "CLOSED", "پایان فوری مسابقه و انتقال به فاز اهدای جوایز");
          break;
        }

        case 'extend_7': {
          const addMs = 7 * 86400 * 1000;
          const currentEnd = Math.max(now, current.endTimestamp || now);
          const newEnd = currentEnd + addMs;
          const closureHours = current.closureHours || 24;
          updates = {
            status: "ACTIVE",
            endTimestamp: newEnd,
            closureEndTimestamp: newEnd + (closureHours * 3600 * 1000)
          };
          db.addAuditLog(admin.username, "EXTEND_TOURNAMENT", new Date(current.endTimestamp).toISOString(), new Date(newEnd).toISOString(), "تمدید ۷ روزه مسابقه");
          break;
        }

        case 'extend_custom': {
          const extendDays = Math.max(1, parseInt(days, 10) || 7);
          const addMs = extendDays * 86400 * 1000;
          const currentEnd = Math.max(now, current.endTimestamp || now);
          const newEnd = currentEnd + addMs;
          const closureHours = current.closureHours || 24;
          updates = {
            status: "ACTIVE",
            endTimestamp: newEnd,
            closureEndTimestamp: newEnd + (closureHours * 3600 * 1000)
          };
          db.addAuditLog(admin.username, "EXTEND_TOURNAMENT", new Date(current.endTimestamp).toISOString(), new Date(newEnd).toISOString(), `تمدید ${extendDays} روزه مسابقه`);
          break;
        }

        case 'close': {
          const closureHours = current.closureHours || 24;
          updates = {
            status: "CLOSED",
            closureEndTimestamp: now + (closureHours * 3600 * 1000)
          };
          db.addAuditLog(admin.username, "CLOSE_TOURNAMENT", current.status, "CLOSED", `بستن مسابقه به مدت ${closureHours} ساعت استراحت`);
          break;
        }

        case 'reopen': {
          const durationDays = current.durationDays || 30;
          const closureHours = current.closureHours || 24;
          const newEnd = current.endTimestamp > now ? current.endTimestamp : now + (durationDays * 86400 * 1000);
          updates = {
            status: "ACTIVE",
            endTimestamp: newEnd,
            closureEndTimestamp: newEnd + (closureHours * 3600 * 1000)
          };
          db.addAuditLog(admin.username, "REOPEN_TOURNAMENT", current.status, "ACTIVE", "بازگشایی مجدد مسابقه");
          break;
        }

        case 'start_next': {
          const durationDays = current.durationDays || 30;
          const closureHours = current.closureHours || 24;
          const seasonMatch = (current.tournamentId || "").match(/season_(\d+)/);
          const nextSeasonNum = seasonMatch ? parseInt(seasonMatch[1], 10) + 1 : 2;

          updates = {
            tournamentId: `tourn_season_${nextSeasonNum}`,
            monthName: `🏆 رقابت فصل ${nextSeasonNum}`,
            status: "ACTIVE",
            startTimestamp: now,
            endTimestamp: now + (durationDays * 86400 * 1000),
            closureEndTimestamp: now + (durationDays * 86400 * 1000) + (closureHours * 3600 * 1000)
          };
          db.addAuditLog(admin.username, "START_NEXT_SEASON", current.tournamentId, updates.tournamentId, `آغاز فصل بعدی مسابقات (${updates.monthName})`);
          break;
        }

        default:
          sendJson(res, 400, { success: false, error: 'عملیات نامعتبر است.' });
          return true;
      }

      db.saveTournament(updates, admin.username);
      broadcastTournamentUpdate();
      sendJson(res, 200, { success: true, tournament: getAuthoritativeTournamentState() });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'خطا در انجام عملیات: ' + err.message });
      return true;
    }
  }

  // 7. Audit Log
  if (url === '/admin/api/audit-log' && req.method === 'GET') {
    sendJson(res, 200, { success: true, auditLogs: db.getAuditLogs(100) });
    return true;
  }

  // 8. Get Game Config
  if (url === '/admin/api/config' && req.method === 'GET') {
    sendJson(res, 200, { success: true, config: db.getGameConfig() });
    return true;
  }

  // 9. Update Game Config & Live Broadcast to all apps
  if (url === '/admin/api/config/update' && req.method === 'POST') {
    try {
      const data = await readJsonBody(req);
      const prevConfig = db.getGameConfig();
      const updated = db.saveGameConfig(data, admin.username);

      db.addAuditLog(
        admin.username,
        "UPDATE_GAME_CONFIG",
        JSON.stringify(prevConfig),
        JSON.stringify(updated),
        "بروزرسانی متغیرهای بازی و اعلان سراسری از طریق پنل مدیریت وب"
      );

      if (serverContext.broadcastGameConfigUpdate) {
        serverContext.broadcastGameConfigUpdate();
      }

      sendJson(res, 200, {
        success: true,
        message: "تنظیمات با موفقیت ذخیره و برای کلیه کاربران در حال بازی ارسال گردید.",
        config: updated
      });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'خطا در ذخیره‌سازی تنظیمات: ' + err.message });
      return true;
    }
  }

  // 9.5. Get Hub UI Customization
  if (url === '/admin/api/hub-ui' && req.method === 'GET') {
    sendJson(res, 200, {
      success: true,
      hubUi: db.getHubUiConfig()
    });
    return true;
  }

  // 9.6. Update Hub UI Customization & Broadcast to Players
  if ((url === '/admin/api/hub-ui' || url === '/admin/api/hub-ui/update') && req.method === 'POST') {
    try {
      const data = await readJsonBody(req);
      const prev = db.getHubUiConfig();
      const updated = db.saveHubUiConfig(data, admin.username);

      db.addAuditLog(
        admin.username,
        "UPDATE_HUB_UI",
        "-",
        "Updated",
        "ویرایش متون، بخش‌ها و ظاهر صفحه مسابقه از پنل مدیریت وب"
      );

      if (serverContext.broadcastHubUiUpdate) {
        serverContext.broadcastHubUiUpdate();
      }
      if (serverContext.broadcastGameConfigUpdate) {
        serverContext.broadcastGameConfigUpdate();
      }

      sendJson(res, 200, {
        success: true,
        message: "متن‌ها و بخش‌های صفحه مسابقه با موفقیت ذخیره و در لحظه برای کلیه کاربران اعمال گردید.",
        hubUi: updated
      });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'خطا در ذخیره متون: ' + err.message });
      return true;
    }
  }

  // 10. Live Flash Broadcast to All Connected Players
  if (url === '/admin/api/broadcast/announcement' && req.method === 'POST') {
    try {
      const { message, type } = await readJsonBody(req);
      if (!message || !message.trim()) {
        sendJson(res, 400, { success: false, error: 'متن پیام اعلان نمی‌تواند خالی باشد.' });
        return true;
      }

      const cleanMsg = String(message).trim();
      const cleanType = String(type || 'INFO').toUpperCase();

      // Save as active banner in config
      db.saveGameConfig({
        announcementBanner: cleanMsg,
        announcementType: cleanType
      }, admin.username);

      if (serverContext.broadcastAnnouncement) {
        serverContext.broadcastAnnouncement(cleanMsg, cleanType);
      }
      if (serverContext.broadcastGameConfigUpdate) {
        serverContext.broadcastGameConfigUpdate();
      }

      db.addAuditLog(admin.username, "BROADCAST_ANNOUNCEMENT", "-", cleanMsg, `ارسال پیام زنده به کلیه کاربران فعال (${cleanType})`);

      sendJson(res, 200, {
        success: true,
        message: "پیام اعلان با موفقیت برای کلیه کاربران فعال ارسال گردید."
      });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'خطا در ارسال اعلان: ' + err.message });
      return true;
    }
  }

  // 11. Get Levels
  if (url === '/admin/api/levels' && req.method === 'GET') {
    const levels = db.getLevels();
    sendJson(res, 200, { success: true, count: levels.length, levels });
    return true;
  }

  // 12. Update Levels Pack
  if (url === '/admin/api/levels/update' && req.method === 'POST') {
    try {
      const { levels } = await readJsonBody(req);
      if (!Array.isArray(levels)) {
        sendJson(res, 400, { success: false, error: 'فهرست مراحل باید در قالب آرایه JSON ارسال شود.' });
        return true;
      }

      db.saveLevels(levels, admin.username);
      db.addAuditLog(admin.username, "UPDATE_LEVELS_PACK", "-", `${levels.length} مرحله`, "بارگذاری و انتشار بسته مراحل جدید از پنل وب");

      if (serverContext.broadcastLevelsUpdate) {
        serverContext.broadcastLevelsUpdate();
      }

      sendJson(res, 200, {
        success: true,
        message: `بسته مراحل جدید شامل ${levels.length} مرحله با موفقیت در سرور ذخیره و برای همه کاربران منتشر شد.`,
        version: db.getGameConfig().levelsPackVersion || 1,
        count: levels.length
      });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'خطا در ذخیره مراحل: ' + err.message });
      return true;
    }
  }

  // 13. Get Notifications & Reminder Settings
  if (url === '/admin/api/notifications' && req.method === 'GET') {
    const settings = db.getNotificationSettings();
    const notifications = db.getNotifications(50);
    sendJson(res, 200, {
      success: true,
      settings,
      notifications,
      stats: {
        totalSent: notifications.length,
        activeConnections: wss && wss.clients ? wss.clients.size : 0
      }
    });
    return true;
  }

  // 14. Send Instant Push & Inactivity Notification to All Users
  if (url === '/admin/api/notifications/send' && req.method === 'POST') {
    try {
      const data = await readJsonBody(req);
      const title = String(data.title || '').trim();
      const body = String(data.body || data.message || '').trim();
      const type = String(data.type || 'REENGAGEMENT').toUpperCase();
      const target = String(data.target || 'ALL').toUpperCase();

      if (!title) {
        sendJson(res, 400, { success: false, error: 'عنوان اعلان نمی‌تواند خالی باشد.' });
        return true;
      }
      if (!body) {
        sendJson(res, 400, { success: false, error: 'متن پیام اعلان نمی‌تواند خالی باشد.' });
        return true;
      }

      // Save to database
      const notif = db.addNotification({
        title,
        body,
        type,
        target,
        deliveryCount: wss && wss.clients ? wss.clients.size : 0
      }, admin.username);

      // Broadcast immediately to online players
      let onlineDelivered = 0;
      if (serverContext.broadcastNotification) {
        onlineDelivered = serverContext.broadcastNotification(notif);
      }

      db.addAuditLog(
        admin.username,
        "SEND_INSTANT_NOTIFICATION",
        "-",
        `[${title}] ${body}`,
        `ارسال اعلان فوری به کاربران (${onlineDelivered} کاربر آنلاین در لحظه دریافت کردند)`
      );

      sendJson(res, 200, {
        success: true,
        message: "اعلان با موفقیت ثبت، برای کاربران آنلاین ارسال، و در صف دریافت آفلاین قرار گرفت.",
        notification: notif,
        onlineDelivered
      });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'خطا در ارسال اعلان: ' + err.message });
      return true;
    }
  }

  // 15. Update Inactivity & Automated Reminder Settings
  if (url === '/admin/api/notifications/settings' && req.method === 'POST') {
    try {
      const data = await readJsonBody(req);
      const prevSettings = db.getNotificationSettings();
      const updates = {};

      if (typeof data.inactivityRemindersEnabled === 'boolean') {
        updates.inactivityRemindersEnabled = data.inactivityRemindersEnabled;
      }
      if (typeof data.inactivityHours === 'number' && data.inactivityHours > 0) {
        updates.inactivityHours = data.inactivityHours;
      }
      if (Array.isArray(data.reminderTemplates)) {
        updates.reminderTemplates = data.reminderTemplates;
      }

      const saved = db.saveNotificationSettings(updates, admin.username);

      db.addAuditLog(
        admin.username,
        "UPDATE_NOTIFICATION_SETTINGS",
        JSON.stringify(prevSettings),
        JSON.stringify(saved),
        "بروزرسانی زمان‌بندی و متن‌های یادآوری ۲۴ ساعته کاربران غیرفعال"
      );

      sendJson(res, 200, {
        success: true,
        message: "تنظیمات اعلان‌ها و یادآوری خودکار با موفقیت ذخیره گردید.",
        settings: saved
      });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'خطا در ذخیره تنظیمات: ' + err.message });
      return true;
    }
  }

  // 16. Get & Manage Users (Coins, Rating, Ban status)
  if (url === '/admin/api/users' && req.method === 'GET') {
    const all = db.getAllUsers();
    sendJson(res, 200, { success: true, count: all.length, users: all });
    return true;
  }

  if (url === '/admin/api/users/update' && req.method === 'POST') {
    try {
      const { userId, coins, rating, monthlyScore, isBanned } = await readJsonBody(req);
      if (!userId) {
        sendJson(res, 400, { success: false, error: 'شناسه یا نام کاربری بازیکن الزامی است.' });
        return true;
      }

      const updates = {};
      if (typeof coins === 'number') updates.coins = Math.max(0, Math.floor(coins));
      if (typeof rating === 'number') updates.rating = Math.max(100, Math.floor(rating));
      if (typeof monthlyScore === 'number') updates.monthlyScore = Math.max(0, Math.floor(monthlyScore));
      if (typeof isBanned === 'boolean') updates.isBanned = isBanned;

      const result = db.updateUser(userId, updates, admin.username);
      if (!result) {
        sendJson(res, 404, { success: false, error: 'بازیکن مورد نظر یافت نشد.' });
        return true;
      }

      // If user is currently in memory map (users), update it too
      if (users && users.has(result.updated.id)) {
        users.set(result.updated.id, result.updated);
      }

      db.addAuditLog(
        admin.username,
        "UPDATE_USER_DATA",
        JSON.stringify(result.previous),
        JSON.stringify(result.updated),
        `ویرایش اطلاعات بازیکن ${result.updated.username || userId}`
      );

      sendJson(res, 200, {
        success: true,
        message: `اطلاعات بازیکن ${result.updated.username || userId} با موفقیت بروزرسانی شد.`,
        user: result.updated
      });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'خطا در ویرایش اطلاعات بازیکن: ' + err.message });
      return true;
    }
  }

  // 17. Get & Update Daily Lucky Wheel Config (Prizes & Probabilities)
  if (url === '/admin/api/wheel' && req.method === 'GET') {
    const wheel = db.getWheelConfig();
    sendJson(res, 200, { success: true, wheel });
    return true;
  }

  if (url === '/admin/api/wheel/update' && req.method === 'POST') {
    try {
      const { wheel } = await readJsonBody(req);
      if (!Array.isArray(wheel)) {
        sendJson(res, 400, { success: false, error: 'اطلاعات گردونه باید به صورت آرایه‌ای از ۸ خانه ارسال شود.' });
        return true;
      }

      const saved = db.saveWheelConfig(wheel, admin.username);
      db.addAuditLog(
        admin.username,
        "UPDATE_LUCKY_WHEEL",
        "-",
        `${saved.length} خانه گردونه شانس`,
        "بروزرسانی جوایز و شانس‌های گردونه شانس روزانه از پنل وب"
      );

      sendJson(res, 200, {
        success: true,
        message: "جوایز و تنظیمات گردونه شانس روزانه با موفقیت ذخیره گردید.",
        wheel: saved
      });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'خطا در ذخیره تنظیمات گردونه: ' + err.message });
      return true;
    }
  }

  return false;
}

module.exports = { handleAdminApi };
