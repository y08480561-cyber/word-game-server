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
      const { username, password } = await readJsonBody(req);
      const session = adminAuth.login(username, password);
      if (!session) {
        sendJson(res, 401, { success: false, error: 'نام کاربری یا رمز عبور اشتباه است.' });
        return true;
      }

      // Set secure cookie as well
      res.setHeader('Set-Cookie', `admin_token=${session.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
      sendJson(res, 200, {
        success: true,
        token: session.token,
        username: session.username,
        expiresAt: session.expiresAt
      });
      return true;
    } catch (err) {
      sendJson(res, 400, { success: false, error: 'درخواست نامعتبر است.' });
      return true;
    }
  }

  // 2. Logout
  if (url === '/admin/api/logout' && req.method === 'POST') {
    adminAuth.logout(req);
    res.setHeader('Set-Cookie', `admin_token=; Path=/; HttpOnly; Max-Age=0`);
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

  return false;
}

module.exports = { handleAdminApi };
