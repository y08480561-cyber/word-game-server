/**
 * Persistent Database Layer for Persian Word Battle Backend
 * Handles atomic persistence for Tournament Configuration, Audit Logs, Admin Credentials, and Player Data.
 * Survives server restarts, redeployments, and crashes.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('[DB] Error creating data directory:', err.message);
  }
}

const TOURNAMENT_FILE = path.join(DATA_DIR, 'tournament.json');
const AUDIT_LOG_FILE = path.join(DATA_DIR, 'audit_log.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admin_users.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const GAME_CONFIG_FILE = path.join(DATA_DIR, 'game_config.json');
const LEVELS_FILE = path.join(DATA_DIR, 'custom_levels.json');
const LEADS_FILE = path.join(DATA_DIR, 'player_leads.json');
const CYCLES_FILE = path.join(DATA_DIR, 'cycle_history.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');
const NOTIFICATION_SETTINGS_FILE = path.join(DATA_DIR, 'notification_settings.json');
const WHEEL_CONFIG_FILE = path.join(DATA_DIR, 'wheel_config.json');

// Helper for atomic file write
function safeWriteJsonSync(filePath, data) {
  const tempPath = `${filePath}.tmp.${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, filePath);
    return true;
  } catch (err) {
    console.error(`[DB Error] Failed to write ${filePath}:`, err.message);
    try {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    } catch (_) {}
    return false;
  }
}

function safeReadJsonSync(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`[DB Error] Failed to read ${filePath}:`, err.message);
  }
  return defaultValue;
}

// -------------------------------------------------------------
// 1. Tournament Configuration
// -------------------------------------------------------------
const DEFAULT_CYCLE_DAYS = 30;
const DEFAULT_CLOSURE_HOURS = 24;

function getDefaultTournament() {
  const now = Date.now();
  return {
    tournamentId: "tourn_season_1",
    monthName: "🏆 رقابت ماهانه سراسری",
    status: "ACTIVE", // "ACTIVE" or "CLOSED"
    startTimestamp: now,
    endTimestamp: now + (DEFAULT_CYCLE_DAYS * 24 * 60 * 60 * 1000),
    closureEndTimestamp: now + (DEFAULT_CYCLE_DAYS * 24 * 60 * 60 * 1000) + (DEFAULT_CLOSURE_HOURS * 60 * 60 * 1000),
    durationDays: DEFAULT_CYCLE_DAYS,
    closureHours: DEFAULT_CLOSURE_HOURS,
    entryCost: 2, // Coins
    totalParticipants: 1840,
    rewards: {
      firstPlace: "ایرپاد",
      secondPlace: "۵۰۰ سکه",
      thirdPlace: "۲۰۰ سکه"
    },
    lastUpdated: now,
    lastUpdatedBy: "system"
  };
}

let tournamentConfig = null;

function loadTournament() {
  const loaded = safeReadJsonSync(TOURNAMENT_FILE, null);
  const defaults = getDefaultTournament();
  if (loaded) {
    tournamentConfig = { ...defaults, ...loaded };
  } else {
    tournamentConfig = { ...defaults };
    safeWriteJsonSync(TOURNAMENT_FILE, tournamentConfig);
  }
  return tournamentConfig;
}

function getTournament() {
  if (!tournamentConfig) loadTournament();
  return tournamentConfig;
}

function saveTournament(newConfig, adminUser = "admin") {
  tournamentConfig = {
    ...tournamentConfig,
    ...newConfig,
    lastUpdated: Date.now(),
    lastUpdatedBy: adminUser
  };
  safeWriteJsonSync(TOURNAMENT_FILE, tournamentConfig);
  return tournamentConfig;
}

// -------------------------------------------------------------
// 1.5. Tournament Cycles History & Winners
// -------------------------------------------------------------
let cycleHistory = null;

function loadCycleHistory() {
  cycleHistory = safeReadJsonSync(CYCLES_FILE, null);
  if (!cycleHistory || !Array.isArray(cycleHistory) || cycleHistory.length === 0) {
    // Seed default previous season record so winners can always be displayed
    const seedEnd = Date.now() - (2 * 86400 * 1000); // 2 days ago
    const seedStart = seedEnd - (30 * 86400 * 1000);
    const initialCycle = {
      cycleId: "cycle_season_0",
      cycleNumber: 0,
      phaseType: "ENDED",
      status: "ENDED",
      startTimestamp: seedStart,
      endTimestamp: seedEnd,
      closureEndTimestamp: seedEnd + (24 * 3600 * 1000),
      durationDays: 30,
      closureHours: 24,
      monthName: "🏆 رقابت ماهانه دوره قبل",
      winner1: { rank: 1, username: "محمد علی", score: 1280, reward: "ایرپاد", badge: "🥇" },
      winner2: { rank: 2, username: "رضا عابدی", score: 1140, reward: "۵۰۰ سکه", badge: "🥈" },
      winner3: { rank: 3, username: "علی اکبر", score: 980, reward: "۲۰۰ سکه", badge: "🥉" },
      finalLeaderboard: [
        { rank: 1, username: "محمد علی", score: 1280, rating: 1640, wins: 58 },
        { rank: 2, username: "رضا عابدی", score: 1140, rating: 1580, wins: 51 },
        { rank: 3, username: "علی اکبر", score: 980, rating: 1520, wins: 44 }
      ]
    };
    cycleHistory = [initialCycle];
    safeWriteJsonSync(CYCLES_FILE, cycleHistory);
  }
  return cycleHistory;
}

function getCycleHistory() {
  if (!cycleHistory) loadCycleHistory();
  return cycleHistory;
}

function getLatestCompletedCycle() {
  const history = getCycleHistory();
  if (history.length > 0) {
    return history[history.length - 1];
  }
  return null;
}

function saveCycleRecord(cycle) {
  const history = getCycleHistory();
  const existingIdx = history.findIndex(c => c.cycleId === cycle.cycleId);
  if (existingIdx >= 0) {
    history[existingIdx] = { ...history[existingIdx], ...cycle };
  } else {
    history.push(cycle);
  }
  safeWriteJsonSync(CYCLES_FILE, history);
  return cycle;
}

function resetMonthlyScores(userMap) {
  if (!userMap) return;
  for (const [id, user] of userMap.entries()) {
    user.monthlyScore = 0;
  }
  saveUsers(userMap);
}

// -------------------------------------------------------------
// 2. Audit Log
// -------------------------------------------------------------
let auditLogs = null;

function loadAuditLogs() {
  auditLogs = safeReadJsonSync(AUDIT_LOG_FILE, []);
  return auditLogs;
}

function getAuditLogs(limit = 100) {
  if (!auditLogs) loadAuditLogs();
  return auditLogs.slice(-limit).reverse();
}

function addAuditLog(admin, action, prevVal, newVal, details = "") {
  if (!auditLogs) loadAuditLogs();

  const entry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    dateString: new Date().toISOString().replace('T', ' ').substring(0, 19),
    admin: admin || "admin",
    action,
    previousValue: typeof prevVal === 'object' ? JSON.stringify(prevVal) : String(prevVal ?? "-"),
    newValue: typeof newVal === 'object' ? JSON.stringify(newVal) : String(newVal ?? "-"),
    details: details || ""
  };

  auditLogs.push(entry);
  // Keep last 1000 logs in storage
  if (auditLogs.length > 1000) {
    auditLogs = auditLogs.slice(-1000);
  }
  safeWriteJsonSync(AUDIT_LOG_FILE, auditLogs);
  return entry;
}

// -------------------------------------------------------------
// 3. Admin Authentication & Credential Management (STRICT FAIL-CLOSED)
// -------------------------------------------------------------
function isAdminConfigured() {
  const user = process.env.ADMIN_USERNAME;
  const pass = process.env.ADMIN_PASSWORD;
  return Boolean(
    user &&
    typeof user === 'string' &&
    user.trim().length > 0 &&
    pass &&
    typeof pass === 'string' &&
    pass.trim().length > 0
  );
}

function verifyAdminCredentials(username, password) {
  // STRICT FAIL-CLOSED: If environment variables are missing on Render, fail closed immediately.
  if (!isAdminConfigured()) {
    console.warn('[SECURITY] Admin login rejected: ADMIN_USERNAME or ADMIN_PASSWORD is NOT configured in environment.');
    return false;
  }

  if (!username || !password) return false;

  const expectedUser = String(process.env.ADMIN_USERNAME).trim();
  const expectedPass = String(process.env.ADMIN_PASSWORD).trim();
  const inputUser = String(username).trim();
  const inputPass = String(password).trim();

  try {
    // Constant-time comparison using fixed-length SHA-256 digests to prevent timing attacks
    const userHashA = crypto.createHash('sha256').update(inputUser).digest();
    const userHashB = crypto.createHash('sha256').update(expectedUser).digest();
    const isUserMatch = crypto.timingSafeEqual(userHashA, userHashB);

    const passHashA = crypto.createHash('sha256').update(inputPass).digest();
    const passHashB = crypto.createHash('sha256').update(expectedPass).digest();
    const isPassMatch = crypto.timingSafeEqual(passHashA, passHashB);

    return isUserMatch && isPassMatch;
  } catch (err) {
    console.error('[SECURITY] Error during timingSafeEqual comparison:', err.message);
    return false;
  }
}

// -------------------------------------------------------------
// 4. Users & Leaderboard Persistence
// -------------------------------------------------------------
function loadUsers(seedPlayers = []) {
  const saved = safeReadJsonSync(USERS_FILE, null);
  const userMap = new Map();

  if (saved && Array.isArray(saved) && saved.length > 0) {
    saved.forEach(u => {
      if (u && u.id) userMap.set(u.id, u);
    });
  } else {
    // Seed default realistic Persian players
    seedPlayers.forEach((p, idx) => {
      const id = `player_seed_${idx + 1}`;
      userMap.set(id, {
        id,
        username: p.username,
        rating: p.rating,
        monthlyScore: p.monthlyScore,
        wins: p.wins,
        losses: p.losses,
        draws: p.draws,
        coins: 50
      });
    });
    saveUsers(userMap);
  }
  return userMap;
}

function saveUsers(userMap) {
  if (!userMap) return;
  const list = Array.from(userMap.values());
  safeWriteJsonSync(USERS_FILE, list);
}

// -------------------------------------------------------------
// 5. Remote Game Configuration & Dynamic Levels & Remote UI Architecture
// -------------------------------------------------------------
const HUB_REMOTE_UI_FILE = path.join(DATA_DIR, 'hub_remote_ui.json');

function getDefaultHubUi() {
  return {
    screenTitle: "🏆 رقابت آنلاین",
    showScreenTitle: true,
    showCoinsPill: true,

    showProfileCard: true,
    profileEditLabel: "ویرایش ✏️",
    showProfileRating: true,
    showProfileRank: true,

    showSponsorBanner: false,
    sponsorTitle: "اسپانسر ویژه مسابقه",
    sponsorSubtitle: "کلمه‌ت با همکاری حامیان مالی",
    sponsorImageUrl: "",
    sponsorTargetUrl: "",

    showPrizeBanner: true,
    prizeBannerTitle: "🎁 جوایز برتر دوره",
    prizeDetailsButtonText: "🏆 جزئیات جوایز",
    prize1Text: "ایرپاد",
    prize1Icon: "🥇",
    prize2Text: "۵۰۰ سکه",
    prize2Icon: "🥈",
    prize3Text: "۲۰۰ سکه",
    prize3Icon: "🥉",

    showTournamentCard: true,
    tournamentTitle: "🏆 رقابت فصل 2",
    statusActiveLabel: "🟢 فعال",
    statusInactiveLabel: "🔒 متوقف",
    countdownTitle: "زمان باقیمانده تا پایان مسابقه:",
    countdownDayLabel: "روز",
    countdownHourLabel: "ساعت",
    countdownMinuteLabel: "دقیقه",
    countdownSecondLabel: "ثانیه",
    scoreLabel: "امتیاز شما:",
    rankLabel: "رتبه شما:",

    showActionCard: true,
    showLeaderboardButton: true,
    leaderboardButtonText: "🏆 جدول رقابت",
    showStartMatchButton: true,
    startMatchButtonText: "⚔️ شروع رقابت (۲ سکه)",
    showWinnersButton: true,
    winnersButtonText: "👑 مشاهده برندگان مسابقه (۳ نفر اول)",

    showServerBadge: true,
    serverConnectedText: "🇮🇷 سرور ایران (ملی بدون فیلترشکن - فعال)",
    serverConnectingText: "🇮🇷 سرور ایران (در حال اتصال...)",

    showFooterText: true,
    footerText: "توسعه‌دهندگان بازی کلمه‌ت ⭐",

    sectionOrder: [
      "topBar",
      "sponsorBanner",
      "profileCard",
      "prizeBanner",
      "tournamentCard",
      "actionCard",
      "serverBadge",
      "footerText"
    ],

    styling: {
      titleFontSize: 22,
      bodyFontSize: 14,
      buttonFontSize: 15,
      fontWeight: "Bold",
      fontFamily: "Default",
      screenBgColor: "#1A0F07",
      screenBgGradientEnd: "#0D0704",
      textColor: "#FFD54F",
      subtitleTextColor: "#FFF8E7",
      cardBgColor: "#2E1C0C",
      cardBgGradientEnd: "#1B0F06",
      buttonPrimaryColor: "#43A047",
      buttonSecondaryColor: "#8D6E63",
      buttonTextColor: "#FFFFFF",
      cardCornerRadiusDp: 16,
      cardBorderColor: "#D49A37",
      cardBorderWidthDp: 1.5,
      cardElevationDp: 6,
      cardPaddingDp: 14,
      cardSpacingDp: 12,
      screenHorizontalPaddingDp: 16
    }
  };
}

function getDefaultGameConfig() {
  return {
    minSupportedVersion: 1,
    latestVersion: 1,
    forceUpdateUrl: "",
    maintenanceMode: false,
    maintenanceMessage: "سرور بازی در حال به‌روزرسانی و ارتقا می‌باشد. لطفا دقایقی دیگر مجدداً تلاش نمایید.",
    announcementBanner: "به مسابقات بزرگ حدس کلمات خوش آمدید! جوایز ویژه ماهانه منتظر شماست 🎁",
    announcementType: "INFO", // "INFO", "ALERT", "EVENT"
    hintCostCoins: 20,
    shuffleCostCoins: 10,
    adRewardCoins: 2,
    adChallengeBonusCoins: 50,
    dailyBonusMultiplier: 1.0,
    doubleRewardsActive: false,
    onlineTournamentActive: true,
    levelsPackVersion: 1,
    hubUi: getDefaultHubUi(),
    lastUpdated: Date.now(),
    lastUpdatedBy: "system"
  };
}

let gameConfig = null;

function loadGameConfig() {
  const loaded = safeReadJsonSync(GAME_CONFIG_FILE, null);
  const defaults = getDefaultGameConfig();
  if (loaded) {
    gameConfig = {
      ...defaults,
      ...loaded,
      hubUi: { ...getDefaultHubUi(), ...(loaded.hubUi || {}) }
    };
  } else {
    gameConfig = { ...defaults };
    safeWriteJsonSync(GAME_CONFIG_FILE, gameConfig);
  }
  return gameConfig;
}

function getGameConfig() {
  if (!gameConfig) loadGameConfig();
  if (!gameConfig.hubUi) {
    gameConfig.hubUi = getDefaultHubUi();
  }
  return gameConfig;
}

function getHubUiConfig() {
  const defaults = getDefaultHubUi();
  const dedicated = safeReadJsonSync(HUB_REMOTE_UI_FILE, null);
  const cfg = getGameConfig();
  const stored = dedicated || cfg.hubUi || {};
  return {
    ...defaults,
    ...stored,
    styling: {
      ...defaults.styling,
      ...(stored.styling || {})
    },
    sectionOrder: Array.isArray(stored.sectionOrder) && stored.sectionOrder.length > 0
      ? stored.sectionOrder
      : defaults.sectionOrder
  };
}

function saveHubUiConfig(newHubUi, adminUser = "admin") {
  const current = getHubUiConfig();
  const merged = {
    ...current,
    ...newHubUi,
    styling: {
      ...current.styling,
      ...(newHubUi.styling || {})
    },
    sectionOrder: Array.isArray(newHubUi.sectionOrder) && newHubUi.sectionOrder.length > 0
      ? newHubUi.sectionOrder
      : current.sectionOrder
  };
  safeWriteJsonSync(HUB_REMOTE_UI_FILE, merged);
  saveGameConfig({ hubUi: merged }, adminUser);
  return merged;
}

function saveGameConfig(newConfig, adminUser = "admin") {
  gameConfig = {
    ...getGameConfig(),
    ...newConfig,
    lastUpdated: Date.now(),
    lastUpdatedBy: adminUser
  };
  safeWriteJsonSync(GAME_CONFIG_FILE, gameConfig);
  return gameConfig;
}

let levelsData = null;

function loadLevels() {
  levelsData = safeReadJsonSync(LEVELS_FILE, []);
  return levelsData;
}

function getLevels() {
  if (!levelsData) loadLevels();
  return levelsData;
}

function saveLevels(newLevels, adminUser = "admin") {
  levelsData = Array.isArray(newLevels) ? newLevels : [];
  safeWriteJsonSync(LEVELS_FILE, levelsData);

  // Increment levels pack version
  const cfg = getGameConfig();
  saveGameConfig({ levelsPackVersion: (cfg.levelsPackVersion || 1) + 1 }, adminUser);
  return levelsData;
}

let leadsData = null;

function loadPlayerLeads() {
  leadsData = safeReadJsonSync(LEADS_FILE, []);
  return leadsData;
}

function getPlayerLeads(limit = 100) {
  if (!leadsData) loadPlayerLeads();
  return (leadsData || []).slice(-limit).reverse();
}

function addPlayerLead(lead) {
  if (!leadsData) loadPlayerLeads();
  if (!Array.isArray(leadsData)) leadsData = [];
  
  // Check if lead with same phone or device already exists
  const existingIdx = leadsData.findIndex(l => (lead.phone && l.phone === lead.phone) || (lead.deviceId && l.deviceId === lead.deviceId));
  if (existingIdx >= 0) {
    leadsData[existingIdx] = { ...leadsData[existingIdx], ...lead, lastUpdated: Date.now() };
  } else {
    leadsData.push(lead);
  }
  
  safeWriteJsonSync(LEADS_FILE, leadsData);
  return lead;
}

// -------------------------------------------------------------
// 6. Push & Inactivity Notification System
// -------------------------------------------------------------
function getDefaultNotificationSettings() {
  return {
    inactivityRemindersEnabled: true,
    inactivityHours: 24,
    reminderTemplates: [
      {
        id: "rem_1",
        title: "🎁 سکه‌های رایگان امروزت رو گرفتی؟",
        body: "گردونه شانس و سکه رایگان امروز منتظرته! همین حالا بیا بازی کن و سکه بگیر."
      },
      {
        id: "rem_2",
        title: "⚔️ حریفت منتظرته!",
        body: "بازیکنان جدید توی رقابت آنلاین فعال شدن. بیا و قدرت کلماتت رو ثابت کن!"
      },
      {
        id: "rem_3",
        title: "🌟 چالش روزانه جدید آمادست",
        body: "امروز با چند دقیقه بازی می‌تونی سکه‌های هدیه برنده بشی. بیا کلمه‌ها رو بساز!"
      },
      {
        id: "rem_4",
        title: "👑 صدر لیدربورد منتظر توست!",
        body: "امتیازت رو بالا ببر و اسم خودت رو بالای جدول برترین‌های کشور ثبت کن."
      },
      {
        id: "rem_5",
        title: "💎 دلتنگت شدیم! هدیه بازگشت به بازی",
        body: "خیلی وقته به کلمه‌ت سر نزدی! وارد بازی شو و جایزه ویژه بازگشتت رو تحویل بگیر."
      }
    ],
    lastUpdated: Date.now(),
    lastUpdatedBy: "system"
  };
}

let notificationSettings = null;
let notificationsList = null;

function loadNotificationSettings() {
  const loaded = safeReadJsonSync(NOTIFICATION_SETTINGS_FILE, null);
  const defaults = getDefaultNotificationSettings();
  if (loaded) {
    notificationSettings = { ...defaults, ...loaded };
  } else {
    notificationSettings = { ...defaults };
    safeWriteJsonSync(NOTIFICATION_SETTINGS_FILE, notificationSettings);
  }
  return notificationSettings;
}

function getNotificationSettings() {
  if (!notificationSettings) loadNotificationSettings();
  return notificationSettings;
}

function saveNotificationSettings(newSettings, adminUser = "admin") {
  notificationSettings = {
    ...getNotificationSettings(),
    ...newSettings,
    lastUpdated: Date.now(),
    lastUpdatedBy: adminUser
  };
  safeWriteJsonSync(NOTIFICATION_SETTINGS_FILE, notificationSettings);
  return notificationSettings;
}

function loadNotifications() {
  notificationsList = safeReadJsonSync(NOTIFICATIONS_FILE, []);
  return notificationsList;
}

function getNotifications(limit = 100) {
  if (!notificationsList) loadNotifications();
  return (notificationsList || []).slice(-limit).reverse();
}

function getLatestNotification() {
  const list = getNotifications(1);
  if (list && list.length > 0) {
    const latest = list[0];
    // Return if sent within last 7 days
    if (Date.now() - latest.timestamp < 7 * 86400 * 1000) {
      return latest;
    }
  }
  return null;
}

function addNotification(notif, adminUser = "admin") {
  if (!notificationsList) loadNotifications();
  if (!Array.isArray(notificationsList)) notificationsList = [];

  const entry = {
    id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: String(notif.title || '').trim(),
    body: String(notif.body || '').trim(),
    type: String(notif.type || 'REENGAGEMENT').toUpperCase(),
    target: String(notif.target || 'ALL').toUpperCase(),
    timestamp: Date.now(),
    dateString: new Date().toISOString().replace('T', ' ').substring(0, 19),
    sentBy: adminUser,
    status: 'SENT',
    deliveryCount: notif.deliveryCount || 0
  };

  notificationsList.push(entry);
  if (notificationsList.length > 500) {
    notificationsList = notificationsList.slice(-500);
  }
  safeWriteJsonSync(NOTIFICATIONS_FILE, notificationsList);
  return entry;
}

// -------------------------------------------------------------
// 7. Users Management & Wheel of Fortune Config
// -------------------------------------------------------------
function getAllUsers() {
  const saved = safeReadJsonSync(USERS_FILE, []);
  return Array.isArray(saved) ? saved : [];
}

function updateUser(userId, updates, adminUser = "admin") {
  const list = getAllUsers();
  const index = list.findIndex(u => u.id === userId || u.username === userId);
  if (index === -1) return null;

  const prev = { ...list[index] };
  list[index] = { ...list[index], ...updates, lastModified: Date.now() };
  safeWriteJsonSync(USERS_FILE, list);
  return { updated: list[index], previous: prev };
}

function getDefaultWheelConfig() {
  return [
    { id: 0, coins: 5, weightPercent: 42.0, label: "۵ سکه" },
    { id: 1, coins: 10, weightPercent: 5.0, label: "۱۰ سکه" },
    { id: 2, coins: 20, weightPercent: 22.0, label: "۲۰ سکه" },
    { id: 3, coins: 30, weightPercent: 15.0, label: "۳۰ سکه" },
    { id: 4, coins: 50, weightPercent: 9.0, label: "۵۰ سکه" },
    { id: 5, coins: 100, weightPercent: 5.0, label: "۱۰۰ سکه" },
    { id: 6, coins: 250, weightPercent: 1.5, label: "۲۵۰ سکه" },
    { id: 7, coins: 500, weightPercent: 0.5, label: "۵۰۰ سکه" }
  ];
}

let wheelConfig = null;

function loadWheelConfig() {
  const loaded = safeReadJsonSync(WHEEL_CONFIG_FILE, null);
  if (loaded && Array.isArray(loaded)) {
    wheelConfig = loaded;
  } else {
    wheelConfig = getDefaultWheelConfig();
    safeWriteJsonSync(WHEEL_CONFIG_FILE, wheelConfig);
  }
  return wheelConfig;
}

function getWheelConfig() {
  if (!wheelConfig) loadWheelConfig();
  return wheelConfig;
}

function saveWheelConfig(newConfig, adminUser = "admin") {
  wheelConfig = Array.isArray(newConfig) ? newConfig : getDefaultWheelConfig();
  safeWriteJsonSync(WHEEL_CONFIG_FILE, wheelConfig);
  return wheelConfig;
}

// Initial load
loadTournament();
loadCycleHistory();
loadAuditLogs();
loadGameConfig();
loadLevels();
loadPlayerLeads();
loadNotificationSettings();
loadNotifications();
loadWheelConfig();

module.exports = {
  getTournament,
  saveTournament,
  getCycleHistory,
  getLatestCompletedCycle,
  saveCycleRecord,
  resetMonthlyScores,
  getAuditLogs,
  addAuditLog,
  isAdminConfigured,
  verifyAdminCredentials,
  loadUsers,
  saveUsers,
  getAllUsers,
  updateUser,
  getGameConfig,
  saveGameConfig,
  getHubUiConfig,
  saveHubUiConfig,
  getDefaultHubUi,
  getLevels,
  saveLevels,
  getPlayerLeads,
  addPlayerLead,
  getNotificationSettings,
  saveNotificationSettings,
  getNotifications,
  getLatestNotification,
  addNotification,
  getWheelConfig,
  saveWheelConfig
};
