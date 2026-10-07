/**
 * Authoritative Real-Time Backend for Persian Word Battle Game
 * Supports: WebSocket Multiplayer, Matchmaking Queue, Elo Rating, Anti-Cheat Word Validation,
 *           Monthly Tournaments, Dynamic Prizes, and Secure Remote Web Admin Panel.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const db = require('./db');
const adminAuth = require('./adminAuth');
const adminRoutes = require('./adminRoutes');
const adminHtml = require('./adminHtml');
const emailNotifier = require('./emailNotifier');

// Try loading 'ws' library
let WebSocketServer;
try {
  WebSocketServer = require('ws').Server;
} catch (e) {
  console.log('[Server] Note: ws package loading...');
}

const PORT = process.env.PORT || process.env.SERVER_PORT || (process.env.AI_STUDIO_AGENT ? 3000 : 8080);

// Load Puzzles / Vocabulary
const puzzlesPath = path.join(__dirname, 'puzzles.json');
let puzzles = [];
try {
  puzzles = JSON.parse(fs.readFileSync(puzzlesPath, 'utf8'));
} catch (err) {
  puzzles = [
    { id: "p1", letters: ["پ", "ر", "د", "ی", "س"], words: ["پردیس", "پدر", "سرد", "دیر", "پیر", "پر", "سر", "دی", "رد", "دیس"] },
    { id: "p2", letters: ["ت", "ه", "ر", "ا", "ن"], words: ["تهران", "تار", "تنه", "راه", "رها", "تن", "تر", "نه", "هنر", "رانت"] }
  ];
}

// Load Persian Dictionary
const wordsPath = path.join(__dirname, 'words.json');
let dictionary = new Set();
try {
  const rawWords = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
  Object.values(rawWords).forEach(arr => {
    if (Array.isArray(arr)) {
      arr.forEach(w => dictionary.add(w.trim()));
    }
  });
} catch (err) {
  console.log('[Server] Note: words.json loaded or defaulted.');
}

// Realistic Initial Persian Leaderboard Players
const SEED_PLAYERS = [
  { username: "محمد علی", rating: 1640, monthlyScore: 1280, wins: 58, losses: 12, draws: 4 },
  { username: "رضا عابدی", rating: 1580, monthlyScore: 1140, wins: 51, losses: 15, draws: 3 },
  { username: "علی اکبر", rating: 1520, monthlyScore: 980, wins: 44, losses: 18, draws: 2 },
  { username: "نیلوفر عزیزی", rating: 1470, monthlyScore: 890, wins: 39, losses: 14, draws: 5 },
  { username: "زهرا چراغی", rating: 1420, monthlyScore: 780, wins: 35, losses: 16, draws: 2 },
  { username: "محمد حسین چراغ زاده", rating: 1390, monthlyScore: 710, wins: 31, losses: 14, draws: 3 },
  { username: "شیر مرد", rating: 1340, monthlyScore: 640, wins: 28, losses: 12, draws: 4 },
  { username: "پهلوان", rating: 1310, monthlyScore: 590, wins: 26, losses: 11, draws: 1 },
  { username: "امیرحسین رضایی", rating: 1280, monthlyScore: 530, wins: 23, losses: 13, draws: 2 },
  { username: "مهدی کریمی", rating: 1250, monthlyScore: 480, wins: 21, losses: 10, draws: 3 },
  { username: "سارا احمدی", rating: 1210, monthlyScore: 430, wins: 19, losses: 9, draws: 2 },
  { username: "فاطمه موسوی", rating: 1180, monthlyScore: 390, wins: 17, losses: 8, draws: 1 },
  { username: "حسین کاظمی", rating: 1150, monthlyScore: 350, wins: 15, losses: 7, draws: 2 },
  { username: "مریم صادقی", rating: 1120, monthlyScore: 310, wins: 13, losses: 6, draws: 1 },
  { username: "ابوالفضل حسینی", rating: 1090, monthlyScore: 270, wins: 11, losses: 5, draws: 0 }
];

// Persistent Users & Active Game State
const users = db.loadUsers(SEED_PLAYERS); // userId -> User Profile
const activeMatches = new Map(); // matchId -> MatchState
const matchmakingQueue = []; // [{ ws, userId, username, rating, joinedAt, tolerance, feeDeducted, entryFee }]

// -------------------------------------------------------------
// Authoritative Server-Controlled Tournament Engine
// -------------------------------------------------------------
function getAuthoritativeTournamentState() {
  const t = db.getTournament();
  const now = Date.now();

  const durationDays = t.durationDays || 30;
  const closureHours = t.closureHours || 24;
  const activeDurationMs = t.durationMinutes ? (t.durationMinutes * 60 * 1000) : (durationDays * 24 * 60 * 60 * 1000);
  const closureDurationMs = t.closureMinutes ? (t.closureMinutes * 60 * 1000) : (closureHours * 60 * 60 * 1000);

  // Ensure cycleId and timestamps are initialized
  if (!t.cycleId) {
    t.cycleId = t.tournamentId || `cycle_season_1`;
  }
  if (!t.phaseType) {
    t.phaseType = t.status || "ACTIVE";
  }
  if (!t.startTimestamp) t.startTimestamp = now;
  if (!t.endTimestamp) t.endTimestamp = t.startTimestamp + activeDurationMs;
  if (!t.closureEndTimestamp) t.closureEndTimestamp = t.endTimestamp + closureDurationMs;

  let stateChanged = false;

  // 1. Check if ACTIVE tournament has elapsed its 30-day deadline -> Enter BREAK / ENDED
  if (t.status === 'ACTIVE' && now >= t.endTimestamp) {
    t.status = 'BREAK';
    t.phaseType = 'BREAK';
    t.closureEndTimestamp = t.endTimestamp + closureDurationMs;

    // Determine Top 3 Winners from locked leaderboard
    const sorted = getSortedLeaderboard();
    const r1 = (t.rewards && t.rewards.firstPlace) || "ایرپاد";
    const r2 = (t.rewards && t.rewards.secondPlace) || "۵۰۰ سکه";
    const r3 = (t.rewards && t.rewards.thirdPlace) || "۲۰۰ سکه";

    t.winner1 = sorted[0] ? { rank: 1, username: sorted[0].username, score: sorted[0].monthlyScore || 0, reward: r1, badge: "🥇" }
                          : { rank: 1, username: "محمد علی", score: 1280, reward: r1, badge: "🥇" };
    t.winner2 = sorted[1] ? { rank: 2, username: sorted[1].username, score: sorted[1].monthlyScore || 0, reward: r2, badge: "🥈" }
                          : { rank: 2, username: "رضا عابدی", score: 1140, reward: r2, badge: "🥈" };
    t.winner3 = sorted[2] ? { rank: 3, username: sorted[2].username, score: sorted[2].monthlyScore || 0, reward: r3, badge: "🥉" }
                          : { rank: 3, username: "علی اکبر", score: 980, reward: r3, badge: "🥉" };

    t.finalLeaderboard = sorted.slice(0, 50).map((u, idx) => ({
      rank: idx + 1,
      username: u.username,
      score: u.monthlyScore || 0,
      rating: u.rating || 1000,
      wins: u.wins || 0
    }));

    // Persist this completed cycle permanently into cycle history
    db.saveCycleRecord({
      cycleId: t.cycleId,
      tournamentId: t.tournamentId || t.cycleId,
      phaseType: "BREAK",
      status: "BREAK",
      startTimestamp: t.startTimestamp,
      endTimestamp: t.endTimestamp,
      closureEndTimestamp: t.closureEndTimestamp,
      durationDays,
      closureHours,
      monthName: t.monthName,
      winner1: t.winner1,
      winner2: t.winner2,
      winner3: t.winner3,
      finalLeaderboard: t.finalLeaderboard
    });

    db.saveTournament({
      cycleId: t.cycleId,
      status: 'BREAK',
      phaseType: 'BREAK',
      closureEndTimestamp: t.closureEndTimestamp,
      winner1: t.winner1,
      winner2: t.winner2,
      winner3: t.winner3,
      finalLeaderboard: t.finalLeaderboard
    }, 'system_cycle');

    db.addAuditLog('system_cycle', 'AUTO_FINALIZE_CYCLE_AND_WINNERS', 'ACTIVE', 'BREAK',
      `دوره ۳۰ روزه مسابقه پایان یافت. برندگان: ۱: ${t.winner1.username} (${t.winner1.score})، ۲: ${t.winner2.username} (${t.winner2.score})، ۳: ${t.winner3.username} (${t.winner3.score}). فاز توقف ۲۴ ساعته آغاز گردید.`);
    stateChanged = true;
  }
  // 2. Check if rest phase has elapsed -> Auto-start next active cycle
  else if ((t.status === 'BREAK' || t.status === 'CLOSED' || t.status === 'ENDED') && now >= t.closureEndTimestamp) {
    const seasonMatch = (t.tournamentId || t.cycleId || "").match(/(?:season_|test_)(\d+)/);
    const nextSeason = seasonMatch ? parseInt(seasonMatch[1], 10) + 1 : 2;
    const newStart = now;
    const newEnd = newStart + activeDurationMs;
    const newClosure = newEnd + closureDurationMs;

    t.cycleId = `cycle_season_${nextSeason}`;
    t.tournamentId = `tourn_season_${nextSeason}`;
    t.monthName = `🏆 رقابت فصل ${nextSeason}`;
    t.status = 'ACTIVE';
    t.phaseType = 'ACTIVE';
    t.startTimestamp = newStart;
    t.endTimestamp = newEnd;
    t.closureEndTimestamp = newClosure;

    // Reset all users' monthly scores to 0 for the brand new cycle
    db.resetMonthlyScores(users);

    // Save previous cycle's winners for display during the new active cycle
    const lastCycle = db.getLatestCompletedCycle();
    if (lastCycle) {
      t.previousCycleWinners = [lastCycle.winner1, lastCycle.winner2, lastCycle.winner3].filter(Boolean);
    }

    t.winner1 = null;
    t.winner2 = null;
    t.winner3 = null;
    t.finalLeaderboard = [];

    db.saveTournament({
      cycleId: t.cycleId,
      tournamentId: t.tournamentId,
      monthName: t.monthName,
      status: 'ACTIVE',
      phaseType: 'ACTIVE',
      startTimestamp: newStart,
      endTimestamp: newEnd,
      closureEndTimestamp: newClosure,
      winner1: null,
      winner2: null,
      winner3: null,
      finalLeaderboard: []
    }, 'system_cycle');

    db.addAuditLog('system_cycle', 'AUTO_START_NEXT_CYCLE', `Season ${nextSeason - 1}`, `Season ${nextSeason}`,
      'فاز ۲۴ ساعته توقف به پایان رسید. امتیازات ریست شد و دوره ۳۰ روزه جدید با موفقیت آغاز گردید.');
    stateChanged = true;
  }

  if (stateChanged) {
    setTimeout(() => broadcastTournamentUpdate(), 50);
  }

  const isActive = (t.status === 'ACTIVE' && t.phaseType === 'ACTIVE');
  const targetEnd = isActive ? t.endTimestamp : t.closureEndTimestamp;
  const remainingMs = Math.max(0, targetEnd - now);
  const remainingSeconds = Math.floor(remainingMs / 1000);

  const remainingDays = Math.floor(remainingSeconds / (24 * 3600));
  const remainingHours = Math.floor((remainingSeconds % (24 * 3600)) / 3600);
  const remainingMinutes = Math.floor((remainingSeconds % 3600) / 60);
  const remainingSecs = remainingSeconds % 60;

  const lastCompleted = db.getLatestCompletedCycle();
  const currentWinners = [t.winner1, t.winner2, t.winner3].filter(Boolean);
  const prevWinners = currentWinners.length > 0 ? currentWinners : (
    lastCompleted ? [lastCompleted.winner1, lastCompleted.winner2, lastCompleted.winner3].filter(Boolean) : []
  );

  return {
    type: "tournament_state",
    cycleId: t.cycleId || t.tournamentId || "cycle_season_1",
    tournamentId: t.tournamentId || t.cycleId || "tourn_season_1",
    phaseType: t.phaseType || t.status || "ACTIVE",
    status: t.status || "ACTIVE",
    startTimestamp: t.startTimestamp,
    endTimestamp: t.endTimestamp,
    closureEndTimestamp: t.closureEndTimestamp,
    serverTimestamp: now,
    remainingSeconds,
    remainingDays,
    remainingHours,
    remainingMinutes,
    remainingSecs,
    monthName: t.monthName || "رقابت ماهانه",
    entryCost: typeof t.entryCost === 'number' ? t.entryCost : 2,
    durationDays,
    closureHours,
    nextTournamentStart: t.closureEndTimestamp,
    totalParticipants: t.totalParticipants || 1840,
    rewards: t.rewards || {
      firstPlace: "ایرپاد",
      secondPlace: "۵۰۰ سکه",
      thirdPlace: "۲۰۰ سکه"
    },
    winner1: t.winner1 || lastCompleted?.winner1 || null,
    winner2: t.winner2 || lastCompleted?.winner2 || null,
    winner3: t.winner3 || lastCompleted?.winner3 || null,
    previousCycleWinners: prevWinners,
    finalLeaderboard: (!isActive && t.finalLeaderboard && t.finalLeaderboard.length > 0)
      ? t.finalLeaderboard
      : (lastCompleted?.finalLeaderboard || [])
  };
}

// Background scheduler tick (checks cycle every 1s for immediate phase transition)
setInterval(() => {
  try {
    getAuthoritativeTournamentState();
  } catch (err) {
    console.error('[Scheduler Error]:', err.message);
  }
}, 1000);

function broadcastTournamentUpdate() {
  const payload = getAuthoritativeTournamentState();
  if (wss && wss.clients) {
    wss.clients.forEach(client => {
      if (client.readyState === 1 /* OPEN */) {
        try {
          client.send(JSON.stringify(payload));
        } catch (err) {}
      }
    });
  }
}

function broadcastGameConfigUpdate() {
  const cfg = db.getGameConfig();
  const payload = {
    type: "game_config_update",
    config: cfg
  };
  if (wss && wss.clients) {
    wss.clients.forEach(client => {
      if (client.readyState === 1 /* OPEN */) {
        try {
          client.send(JSON.stringify(payload));
        } catch (err) {}
      }
    });
  }
}

function broadcastAnnouncement(message, type = "INFO") {
  const payload = {
    type: "announcement_broadcast",
    message,
    announcementType: type,
    timestamp: Date.now()
  };
  if (wss && wss.clients) {
    wss.clients.forEach(client => {
      if (client.readyState === 1 /* OPEN */) {
        try {
          client.send(JSON.stringify(payload));
        } catch (err) {}
      }
    });
  }
}

function broadcastLevelsUpdate() {
  const payload = {
    type: "levels_update",
    version: db.getGameConfig().levelsPackVersion || 1,
    timestamp: Date.now()
  };
  if (wss && wss.clients) {
    wss.clients.forEach(client => {
      if (client.readyState === 1 /* OPEN */) {
        try {
          client.send(JSON.stringify(payload));
        } catch (err) {}
      }
    });
  }
}

// Leaderboard calculation
function getSortedLeaderboard() {
  return Array.from(users.values()).sort((a, b) => {
    const scoreDiff = (b.monthlyScore || 0) - (a.monthlyScore || 0);
    if (scoreDiff !== 0) return scoreDiff;

    const winDiff = (b.wins || 0) - (a.wins || 0);
    if (winDiff !== 0) return winDiff;

    const lossDiff = (a.losses || 0) - (b.losses || 0);
    if (lossDiff !== 0) return lossDiff;

    return (b.rating || 1000) - (a.rating || 1000);
  });
}

function getUserRank(userId) {
  const sorted = getSortedLeaderboard();
  const idx = sorted.findIndex(u => u.id === userId);
  return idx !== -1 ? idx + 1 : sorted.length + 1;
}

// Calculate Word Points
function calculateWordPoints(wordLength, combo) {
  let base = 10;
  if (wordLength === 3) base = 15;
  else if (wordLength === 4) base = 20;
  else if (wordLength === 5) base = 30;
  else if (wordLength >= 6) base = 40;

  const comboBonus = Math.floor((combo - 1) * 3);
  return base + Math.max(0, comboBonus);
}

// Calculate Elo Rating Delta
function calculateEloDelta(ratingA, ratingB, outcomeA) {
  const K = 32;
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  return Math.round(K * (outcomeA - expectedA));
}

// Configurable Gameplay Constants
const HEX_GAME_CONFIG = {
  BOARD_SIZE: 37,
  TURN_DURATION: 30,
  CORRECT_WORD_POINTS: 10,
  SPECIAL_CELL_BONUS: 20,
  MAX_MATCH_DURATION: 180,
  ALLOW_ADJACENT_CAPTURE: true,
  WRONG_ANSWER_ENDS_TURN: true,
  SPECIAL_CELL_INDEXES: [11, 17, 18, 19, 25],
  START_CELL_P1: 0,
  START_CELL_P2: 36
};

function getHexNeighbors(index) {
  const ROW_COUNTS = [4, 5, 6, 7, 6, 5, 4]; // 37 cells
  let currIndex = 0;
  let row = -1, col = -1;
  for (let r = 0; r < ROW_COUNTS.length; r++) {
    const count = ROW_COUNTS[r];
    if (index >= currIndex && index < currIndex + count) {
      row = r;
      col = index - currIndex;
      break;
    }
    currIndex += count;
  }
  if (row === -1) return [];

  function getIndex(r, c) {
    if (r < 0 || r >= ROW_COUNTS.length) return -1;
    if (c < 0 || c >= ROW_COUNTS[r]) return -1;
    let idx = 0;
    for (let i = 0; i < r; i++) idx += ROW_COUNTS[i];
    return idx + c;
  }

  const neighbors = [];
  const left = getIndex(row, col - 1);
  if (left !== -1) neighbors.push(left);
  const right = getIndex(row, col + 1);
  if (right !== -1) neighbors.push(right);

  if (row <= 3) {
    const u1 = getIndex(row - 1, col - 1);
    const u2 = getIndex(row - 1, col);
    if (u1 !== -1) neighbors.push(u1);
    if (u2 !== -1) neighbors.push(u2);
  } else {
    const u1 = getIndex(row - 1, col);
    const u2 = getIndex(row - 1, col + 1);
    if (u1 !== -1) neighbors.push(u1);
    if (u2 !== -1) neighbors.push(u2);
  }

  if (row < 3) {
    const l1 = getIndex(row + 1, col);
    const l2 = getIndex(row + 1, col + 1);
    if (l1 !== -1) neighbors.push(l1);
    if (l2 !== -1) neighbors.push(l2);
  } else {
    const l1 = getIndex(row + 1, col - 1);
    const l2 = getIndex(row + 1, col);
    if (l1 !== -1) neighbors.push(l1);
    if (l2 !== -1) neighbors.push(l2);
  }

  return neighbors;
}

function initializeHexBoard() {
  const board = [];
  for (let i = 0; i < HEX_GAME_CONFIG.BOARD_SIZE; i++) {
    const isSpecial = HEX_GAME_CONFIG.SPECIAL_CELL_INDEXES.includes(i);
    let owner = 0; // 0 = NEUTRAL, 1 = P1, 2 = P2
    if (i === HEX_GAME_CONFIG.START_CELL_P1) owner = 1;
    if (i === HEX_GAME_CONFIG.START_CELL_P2) owner = 2;

    board.push({
      id: `cell_${i < 10 ? '0' + i : i}`,
      index: i,
      owner: owner,
      isSpecial: isSpecial,
      specialBonus: isSpecial ? HEX_GAME_CONFIG.SPECIAL_CELL_BONUS : 0
    });
  }
  return board;
}

function isCellLegalToCapture(board, cellIndex, playerNum) {
  if (cellIndex < 0 || cellIndex >= HEX_GAME_CONFIG.BOARD_SIZE) return false;
  const cell = board[cellIndex];
  if (!cell || cell.owner !== 0) return false;

  if (!HEX_GAME_CONFIG.ALLOW_ADJACENT_CAPTURE) return true;

  const neighbors = getHexNeighbors(cellIndex);
  return neighbors.some(nIdx => board[nIdx] && board[nIdx].owner === playerNum);
}

function startNextTurn(matchState) {
  if (matchState.turnTimerInterval) {
    clearInterval(matchState.turnTimerInterval);
  }

  const neutralCount = matchState.board.filter(c => c.owner === 0).length;
  if (neutralCount === 0 || matchState.remainingSeconds <= 0) {
    concludeMatch(matchState);
    return;
  }

  if (!matchState.activeUserId) {
    matchState.activeUserId = matchState.p1.userId;
  } else {
    matchState.activeUserId = matchState.activeUserId === matchState.p1.userId ? matchState.p2.userId : matchState.p1.userId;
  }

  matchState.selectedCellIndex = null;
  matchState.turnTimerSec = HEX_GAME_CONFIG.TURN_DURATION;

  const activePlayer = matchState.p1.userId === matchState.activeUserId ? matchState.p1 : matchState.p2;

  const turnPayload = {
    type: 'turn_start',
    matchId: matchState.matchId,
    activeUserId: matchState.activeUserId,
    activePlayerUsername: activePlayer.username,
    turnTimerSec: matchState.turnTimerSec,
    board: matchState.board.map(c => ({ id: c.id, index: c.index, owner: c.owner, isSpecial: c.isSpecial })),
    p1Territory: matchState.board.filter(c => c.owner === 1).length,
    p2Territory: matchState.board.filter(c => c.owner === 2).length,
    p1Score: matchState.p1.score,
    p2Score: matchState.p2.score
  };

  sendJson(matchState.p1.ws, turnPayload);
  sendJson(matchState.p2.ws, turnPayload);

  // Single Official Bot Turn Execution
  if (activePlayer.isBot) {
    setTimeout(() => {
      if (!activeMatches.has(matchState.matchId)) return;
      if (matchState.activeUserId !== activePlayer.userId) return;

      const legalCells = [];
      for (let i = 0; i < HEX_GAME_CONFIG.BOARD_SIZE; i++) {
        if (isCellLegalToCapture(matchState.board, i, 2)) {
          legalCells.push(i);
        }
      }

      if (legalCells.length > 0) {
        const specialLegal = legalCells.filter(idx => HEX_GAME_CONFIG.SPECIAL_CELL_INDEXES.includes(idx));
        const targetIndex = specialLegal.length > 0 ? specialLegal[Math.floor(Math.random() * specialLegal.length)] : legalCells[Math.floor(Math.random() * legalCells.length)];

        const unusedWords = matchState.puzzle.words.filter(w => !matchState.p2.correctWords.includes(w));
        const wordToSubmit = unusedWords.length > 0 ? unusedWords[Math.floor(Math.random() * unusedWords.length)] : matchState.puzzle.words[0];

        const targetCell = matchState.board[targetIndex];
        targetCell.owner = 2;
        let pts = HEX_GAME_CONFIG.CORRECT_WORD_POINTS + (targetCell.isSpecial ? HEX_GAME_CONFIG.SPECIAL_CELL_BONUS : 0);
        matchState.p2.score += pts;
        matchState.p2.correctWords.push(wordToSubmit);

        const capturePayload = {
          type: 'cell_captured',
          cellIndex: targetIndex,
          owner: 2,
          isSpecial: targetCell.isSpecial,
          pointsGained: pts,
          capturedByUserId: matchState.p2.userId,
          capturedByUsername: matchState.p2.username,
          word: wordToSubmit,
          p1Score: matchState.p1.score,
          p2Score: matchState.p2.score,
          p1Territory: matchState.board.filter(c => c.owner === 1).length,
          p2Territory: matchState.board.filter(c => c.owner === 2).length
        };

        sendJson(matchState.p1.ws, capturePayload);
      }

      startNextTurn(matchState);
    }, 2200);
    return;
  }

  matchState.turnTimerInterval = setInterval(() => {
    matchState.turnTimerSec -= 1;

    if (matchState.turnTimerSec <= 0) {
      clearInterval(matchState.turnTimerInterval);
      const timeoutPayload = {
        type: 'turn_timeout',
        matchId: matchState.matchId,
        message: "زمان تمام شد!",
        expiredUserId: matchState.activeUserId
      };
      sendJson(matchState.p1.ws, timeoutPayload);
      sendJson(matchState.p2.ws, timeoutPayload);

      startNextTurn(matchState);
    }
  }, 1000);
}
const serverContext = {
  getAuthoritativeTournamentState,
  broadcastTournamentUpdate,
  broadcastGameConfigUpdate,
  broadcastAnnouncement,
  broadcastLevelsUpdate,
  getSortedLeaderboard,
  users,
  activeMatches,
  matchmakingQueue,
  get wss() { return wss; }
};

// -------------------------------------------------------------
// HTTP Server & Routing
// -------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url.split('?')[0];
  const host = (req.headers['host'] || '').toLowerCase();
  const isDomainAdmin = host.startsWith('admin.') || host.includes('admin');

  // 1. Admin API Routes (/admin/api/*)
  if (url.startsWith('/admin/api/')) {
    const handled = await adminRoutes.handleAdminApi(req, res, url, serverContext);
    if (handled) return;
  }

  // 2. Web Admin Panel Single Page Application
  // Served on admin.<domain>.ir root, or /admin, or /admin/
  if (isDomainAdmin && (url === '/' || url === '/admin' || url === '/admin/')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(adminHtml.getAdminHtml(host));
    return;
  }

  if (url === '/admin' || url === '/admin/' || url === '/admin/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(adminHtml.getAdminHtml(host.includes('kalamet') ? 'admin.kalametgame.ir' : host));
    return;
  }

  // 3. Server Health Status (Normal player endpoint)
  if (url === '/' || url === '/api/status' || url === '/api/health' || url === '/api/v1/status' || url === '/status') {
    const authHeader = req.headers['authorization'] || req.headers['x-admin-api-key'] || '';
    const hasAdminKey = authHeader.includes('admin') || authHeader.length > 5;
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: "online",
      server: "Persian Word Battle Authoritative Backend",
      version: "2.1.0",
      authorized: hasAdminKey,
      activeConnections: wss ? wss.clients.size : 0,
      activeMatches: activeMatches.size,
      matchmakingQueueSize: matchmakingQueue.length,
      levelsPackVersion: db.getGameConfig().levelsPackVersion || 1,
      port: PORT,
      timestamp: Date.now()
    }));
    return;
  }

  // 4. Remote Game Configuration API (Authoritative Config for All Players)
  if (url === '/api/v1/game-content/config' || url === '/api/config' || url === '/api/v1/config') {
    const cfg = db.getGameConfig();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      minSupportedVersion: cfg.minSupportedVersion || 1,
      latestVersion: cfg.latestVersion || 1,
      forceUpdateUrl: cfg.forceUpdateUrl || "",
      maintenanceMode: Boolean(cfg.maintenanceMode),
      maintenanceMessage: cfg.maintenanceMessage || "",
      announcementBanner: cfg.announcementBanner || "",
      announcementType: cfg.announcementType || "INFO",
      hintCostCoins: typeof cfg.hintCostCoins === 'number' ? cfg.hintCostCoins : 20,
      shuffleCostCoins: typeof cfg.shuffleCostCoins === 'number' ? cfg.shuffleCostCoins : 10,
      adRewardCoins: typeof cfg.adRewardCoins === 'number' ? cfg.adRewardCoins : 2,
      adChallengeBonusCoins: typeof cfg.adChallengeBonusCoins === 'number' ? cfg.adChallengeBonusCoins : 50,
      dailyBonusMultiplier: typeof cfg.dailyBonusMultiplier === 'number' ? cfg.dailyBonusMultiplier : 1.0,
      doubleRewardsActive: Boolean(cfg.doubleRewardsActive),
      onlineTournamentActive: Boolean(cfg.onlineTournamentActive),
      levelsPackVersion: cfg.levelsPackVersion || 1,
      timestamp: Date.now()
    }));
    return;
  }

  // 4.5. New Player Phone & Contact Registration API (Direct notification to Admin Email)
  if (url === '/api/v1/player/register' || url === '/api/player/register' || url === '/api/v1/lead') {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: "Method not allowed. Use POST." }));
      return;
    }

    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', () => {
      try {
        const json = JSON.parse(bodyData || '{}');
        const name = String(json.name || json.username || '').trim();
        const phone = String(json.phone || json.phoneNumber || '').trim();

        if (!name || !phone) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: "نام و شماره تماس بازیکن الزامی است." }));
          return;
        }

        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        const savedLead = emailNotifier.recordNewPlayerRegistration({
          name,
          phone,
          deviceId: json.deviceId || '',
          timestamp: Date.now(),
          ip: clientIp,
          source: json.source || 'Android Client',
          coinsGiven: 50
        });

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          message: "مشخصات شما با موفقیت ثبت شد و به مدیر سامانه ارسال گردید.",
          bonusCoins: 50,
          leadId: savedLead.id,
          timestamp: Date.now()
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: "Invalid payload: " + err.message }));
      }
    });
    return;
  }

  // 5. Remote Game Levels API (Pulls Level Pack)
  if (url === '/api/v1/game-content/levels' || url === '/api/levels' || url === '/api/v1/levels') {
    const levels = db.getLevels();
    const cfg = db.getGameConfig();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      version: cfg.levelsPackVersion || 1,
      totalCount: levels.length,
      levels: levels,
      timestamp: Date.now()
    }));
    return;
  }

  // 6. Push Game Content & Levels API (From App Admin or External Sync)
  if (url === '/api/v1/game-content/sync/push' || url === '/api/sync/push') {
    if (req.method !== 'POST') {
      res.writeHead(405, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: "Method not allowed. Use POST." }));
      return;
    }

    let bodyData = '';
    req.on('data', chunk => { bodyData += chunk; });
    req.on('end', () => {
      try {
        const json = JSON.parse(bodyData || '{}');
        const adminUser = json.adminUsername || 'admin_sync';

        if (Array.isArray(json.levels)) {
          db.saveLevels(json.levels, adminUser);
          db.addAuditLog(adminUser, "PUSH_LEVELS", "-", `${json.levels.length} مرحله`, "ارسال و انتشار مراحل از طریق کلاینت بازی");
        }

        if (json.config && typeof json.config === 'object') {
          db.saveGameConfig(json.config, adminUser);
          db.addAuditLog(adminUser, "PUSH_CONFIG", "-", JSON.stringify(json.config), "بروزرسانی متغیرهای بازی از طریق کلاینت بازی");
        }

        broadcastGameConfigUpdate();
        broadcastLevelsUpdate();

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          message: "داده‌ها با موفقیت در سرور ذخیره و برای کلیه کاربران فعال منتشر گردید.",
          levelsPackVersion: db.getGameConfig().levelsPackVersion || 1,
          timestamp: Date.now()
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: "Invalid JSON payload: " + err.message }));
      }
    });
    return;
  }

  // 7. Tournament Information (Public Player API)
  if (url === '/api/tournament') {
    if (req.method === 'POST') {
      // Security Check: Modifying tournament configuration requires admin authentication!
      const admin = adminAuth.getAuthenticatedAdmin(req);
      if (!admin) {
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          error: "Unauthorized. Players cannot modify tournament configuration or dates."
        }));
        return;
      }

      let bodyData = '';
      req.on('data', chunk => { bodyData += chunk; });
      req.on('end', () => {
        try {
          const json = JSON.parse(bodyData);
          const updates = {};
          if (json.monthName) updates.monthName = json.monthName;
          if (typeof json.totalParticipants === 'number') updates.totalParticipants = json.totalParticipants;
          if (typeof json.entryCost === 'number') updates.entryCost = json.entryCost;
          if (json.rewards) updates.rewards = json.rewards;

          db.saveTournament(updates, admin.username);
          broadcastTournamentUpdate();

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, tournament: getAuthoritativeTournamentState() }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: "Invalid JSON body" }));
        }
      });
      return;
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(getAuthoritativeTournamentState()));
      return;
    }
  }

  // 7.5 Tournament Winners API (Top 3 and Previous Cycle Winners)
  if (url === '/api/tournament/winners') {
    const t = getAuthoritativeTournamentState();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      success: true,
      cycleId: t.cycleId,
      status: t.status,
      phaseType: t.phaseType,
      winners: t.previousCycleWinners || [],
      finalLeaderboard: t.finalLeaderboard || []
    }));
    return;
  }

  // 5. Leaderboard API
  if (url === '/api/leaderboard') {
    const list = getSortedLeaderboard()
      .slice(0, 50)
      .map((u, idx) => ({
        rank: idx + 1,
        username: u.username,
        rating: u.rating || 1000,
        monthlyScore: u.monthlyScore || 0,
        wins: u.wins || 0,
        losses: u.losses || 0,
        draws: u.draws || 0
      }));

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ leaderboard: list }));
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: "Endpoint not found" }));
});

// -------------------------------------------------------------
// WebSocket Server Initialization
// -------------------------------------------------------------
let wss = null;
if (WebSocketServer) {
  initWebSocketServer();
}

function initWebSocketServer() {
  wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.userId = null;
    ws.matchId = null;

    // Send authoritative tournament schedule immediately upon connection
    sendJson(ws, getAuthoritativeTournamentState());

    ws.on('message', (messageText) => {
      try {
        const data = JSON.parse(messageText.toString());
        handleClientMessage(ws, data);
      } catch (err) {
        console.error('[WS Error] Invalid JSON:', err.message);
      }
    });

    ws.on('close', () => {
      handleClientDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS Client Error]:', err.message);
    });
  });

  console.log(`[WS Server] Real-Time WebSocket handler attached.`);
}

function sendJson(ws, obj) {
  if (ws && ws.readyState === 1 /* OPEN */) {
    try {
      ws.send(JSON.stringify(obj));
    } catch (e) {
      console.error('[WS Send Error]:', e.message);
    }
  }
}

// -------------------------------------------------------------
// Handle Client Messages
// -------------------------------------------------------------
function handleClientMessage(ws, data) {
  switch (data.type) {
    case 'get_tournament_state': {
      sendJson(ws, getAuthoritativeTournamentState());
      break;
    }

    case 'get_tournament_winners': {
      const state = getAuthoritativeTournamentState();
      sendJson(ws, {
        type: 'tournament_winners',
        cycleId: state.cycleId,
        status: state.status,
        phaseType: state.phaseType,
        winners: state.previousCycleWinners || [],
        finalLeaderboard: state.finalLeaderboard || []
      });
      break;
    }

    case 'queue_join': {
      const tournState = getAuthoritativeTournamentState();
      if (tournState.status === 'BREAK' || tournState.status === 'CLOSED' || tournState.status === 'ENDED' || tournState.phaseType !== 'ACTIVE') {
        sendJson(ws, {
          type: 'queue_error',
          reason: 'دوره مسابقه آنلاین به پایان رسیده است و در مرحله توقف ۲۴ ساعته قرار دارد. ورود به رقابت جدید امکان‌پذیر نمی‌باشد.'
        });
        return;
      }

      const userId = data.userId || `guest_${Date.now()}`;
      const username = data.username || 'بازیکن';
      const rating = Number(data.rating) || 1000;
      const clientCoins = typeof data.coins === 'number' ? data.coins : 100;
      const entryFee = tournState.entryCost !== undefined ? tournState.entryCost : 2;

      // Prevent duplicate queue join
      if (matchmakingQueue.some(item => item.ws === ws || item.userId === userId)) {
        console.log(`[Matchmaking] User ${username} already in queue. Ignoring duplicate.`);
        return;
      }
      if (ws.matchId && activeMatches.has(ws.matchId)) {
        console.log(`[Matchmaking] User ${username} already in active match ${ws.matchId}.`);
        return;
      }

      ws.userId = userId;
      ws.username = username;
      ws.rating = rating;

      // Update or create user in server memory
      let u = users.get(userId);
      if (!u) {
        u = {
          id: userId,
          username,
          coins: clientCoins,
          rating,
          wins: 0,
          losses: 0,
          draws: 0,
          monthlyScore: 0
        };
        users.set(userId, u);
      } else {
        u.username = username;
        u.rating = rating;
        if (typeof data.coins === 'number') {
          u.coins = data.coins;
        }
      }

      // Check and Deduct dynamic entry fee
      if (entryFee > 0 && u.coins < entryFee) {
        sendJson(ws, {
          type: 'queue_error',
          reason: `برای شرکت در رقابت آنلاین به حداقل ${entryFee} سکه نیاز دارید.`
        });
        return;
      }

      if (entryFee > 0 && u.coins >= entryFee) {
        u.coins -= entryFee;
      }

      // Add to matchmaking queue
      matchmakingQueue.push({
        ws,
        userId,
        username,
        rating,
        joinedAt: Date.now(),
        tolerance: 100,
        feeDeducted: entryFee > 0,
        entryFee
      });

      sendJson(ws, {
        type: 'queue_joined',
        coinsDeducted: entryFee,
        remainingCoins: u.coins
      });

      console.log(`[Matchmaking] Player joined queue: ${username} (Rating: ${rating}, Coins: ${u.coins}, Fee: ${entryFee}) - Queue size: ${matchmakingQueue.length}`);
      processMatchmaking();
      break;
    }

    case 'queue_cancel': {
      const removed = removeFromQueue(ws);
      if (removed && removed.feeDeducted) {
        const u = users.get(removed.userId);
        const refundAmount = removed.entryFee || 2;
        if (u) {
          u.coins += refundAmount;
        }
        sendJson(ws, {
          type: 'queue_cancelled',
          refund: true,
          coinsRefunded: refundAmount,
          newCoins: u ? u.coins : 0
        });
      }
      console.log(`[Matchmaking] Player canceled queue: ${ws.username || ws.userId}`);
      break;
    }

    case 'select_cell': {
      const matchId = data.matchId || ws.matchId;
      const cellIndex = Number(data.cellIndex);
      if (!matchId || !activeMatches.has(matchId)) return;
      const match = activeMatches.get(matchId);

      if (match.activeUserId !== ws.userId) return;

      const isP1 = match.p1.userId === ws.userId;
      const playerNum = isP1 ? 1 : 2;

      if (isCellLegalToCapture(match.board, cellIndex, playerNum)) {
        match.selectedCellIndex = cellIndex;
        const payload = {
          type: 'cell_selected',
          cellIndex: cellIndex,
          userId: ws.userId
        };
        sendJson(match.p1.ws, payload);
        sendJson(match.p2.ws, payload);
      }
      break;
    }

    case 'word_submit': {
      const matchId = data.matchId || ws.matchId;
      const word = (data.word || '').trim();

      if (!matchId || !activeMatches.has(matchId)) {
        sendJson(ws, { type: 'word_result', success: false, reason: "مسابقه یافت نشد یا پایان یافته است." });
        return;
      }

      const match = activeMatches.get(matchId);

      if (match.activeUserId !== ws.userId) {
        sendJson(ws, { type: 'word_result', success: false, reason: "نوبت حریف است!" });
        return;
      }

      const isP1 = match.p1.userId === ws.userId;
      const player = isP1 ? match.p1 : match.p2;
      const opponent = isP1 ? match.p2 : match.p1;
      const playerNum = isP1 ? 1 : 2;

      const cellIndex = data.cellIndex !== undefined ? Number(data.cellIndex) : match.selectedCellIndex;

      if (cellIndex === null || cellIndex === undefined || !isCellLegalToCapture(match.board, cellIndex, playerNum)) {
        sendJson(ws, { type: 'word_result', success: false, reason: "خانه انتخاب شده معتبر نیست یا مجاور قلمرو شما نمی‌باشد!" });
        return;
      }

      const isAlreadyFound = player.correctWords.includes(word);
      const isValid = match.puzzle.words.includes(word);

      if (isAlreadyFound) {
        sendJson(ws, { type: 'word_result', success: false, reason: "این کلمه را قبلاً ثبت کرده‌اید!" });
        return;
      }

      if (isValid) {
        const targetCell = match.board[cellIndex];
        targetCell.owner = playerNum;

        let pts = HEX_GAME_CONFIG.CORRECT_WORD_POINTS;
        if (targetCell.isSpecial) {
          pts += HEX_GAME_CONFIG.SPECIAL_CELL_BONUS;
        }

        player.score += pts;
        player.correctWords.push(word);

        const p1Territory = match.board.filter(c => c.owner === 1).length;
        const p2Territory = match.board.filter(c => c.owner === 2).length;

        const capturePayload = {
          type: 'cell_captured',
          cellIndex: cellIndex,
          owner: playerNum,
          isSpecial: targetCell.isSpecial,
          pointsGained: pts,
          capturedByUserId: ws.userId,
          capturedByUsername: player.username,
          word: word,
          p1Score: match.p1.score,
          p2Score: match.p2.score,
          p1Territory: p1Territory,
          p2Territory: p2Territory
        };

        sendJson(match.p1.ws, capturePayload);
        sendJson(match.p2.ws, capturePayload);

        sendJson(ws, {
          type: 'word_result',
          success: true,
          word,
          pointsGained: pts,
          newScore: player.score
        });

        startNextTurn(match);
      } else {
        player.wrongCount += 1;
        sendJson(ws, {
          type: 'word_result',
          success: false,
          reason: "کلمه اشتباه است"
        });

        if (HEX_GAME_CONFIG.WRONG_ANSWER_ENDS_TURN) {
          startNextTurn(match);
        }
      }
      break;
    }

    case 'match_leave':
    case 'match_forfeit': {
      const matchId = data.matchId || ws.matchId;
      if (matchId && activeMatches.has(matchId)) {
        handleMatchForfeit(matchId, ws.userId);
      }
      break;
    }

    case 'ping': {
      sendJson(ws, { type: 'pong', timestamp: Date.now() });
      break;
    }
  }
}

function removeFromQueue(ws) {
  const idx = matchmakingQueue.findIndex(item => item.ws === ws || item.userId === ws.userId);
  if (idx !== -1) {
    return matchmakingQueue.splice(idx, 1)[0];
  }
  return null;
}

function handleClientDisconnect(ws) {
  const removed = removeFromQueue(ws);
  if (removed && removed.feeDeducted) {
    const u = users.get(removed.userId);
    const refundAmount = removed.entryFee || 2;
    if (u) u.coins += refundAmount;
  }

  if (ws.matchId && activeMatches.has(ws.matchId)) {
    handleMatchForfeit(ws.matchId, ws.userId);
  }
}

function handleMatchForfeit(matchId, leaverUserId) {
  if (!activeMatches.has(matchId)) return;
  const match = activeMatches.get(matchId);
  const isPlayer1Leaver = match.p1.userId === leaverUserId;
  const leaver = isPlayer1Leaver ? match.p1 : match.p2;
  const winner = isPlayer1Leaver ? match.p2 : match.p1;

  if (users.has(leaver.userId)) {
    const leaverUser = users.get(leaver.userId);
    leaverUser.losses = (leaverUser.losses || 0) + 1;
    leaverUser.monthlyScore = Math.max(0, (leaverUser.monthlyScore || 0) - 10);
    leaverUser.rating = Math.max(500, (leaverUser.rating || 1000) - 15);
  }

  if (leaver.ws) {
    const leaverUser = users.get(leaver.userId);
    sendJson(leaver.ws, {
      type: 'match_end',
      matchId: match.matchId,
      outcome: "LOSS",
      forfeitReason: "شما از بازی خارج شدید (-۱۰ امتیاز)",
      myScore: leaver.score,
      opponentScore: winner.score,
      myCorrectWords: leaver.correctWords.length,
      opponentCorrectWords: winner.correctWords.length,
      myWrongWords: leaver.wrongCount,
      ratingDelta: -15,
      newRating: leaverUser ? leaverUser.rating : Math.max(500, leaver.rating - 15),
      monthlyScoreDelta: -10,
      currentRank: getUserRank(leaver.userId)
    });
  }

  if (winner.ws) {
    const winnerUser = users.get(winner.userId);
    if (winnerUser) {
      winnerUser.wins = (winnerUser.wins || 0) + 1;
      winnerUser.monthlyScore = (winnerUser.monthlyScore || 0) + 20;
      winnerUser.rating = (winnerUser.rating || 1000) + 20;
    }
    sendJson(winner.ws, {
      type: 'match_end',
      matchId: match.matchId,
      outcome: "WIN",
      forfeitReason: "حریف از بازی منصرف شد",
      myScore: winner.score,
      opponentScore: leaver.score,
      myCorrectWords: winner.correctWords.length,
      opponentCorrectWords: leaver.correctWords.length,
      myWrongWords: winner.wrongCount,
      ratingDelta: 20,
      newRating: winnerUser ? winnerUser.rating : (winner.rating + 20),
      monthlyScoreDelta: 20,
      currentRank: getUserRank(winner.userId)
    });
  }

  clearInterval(match.timerInterval);
  activeMatches.delete(matchId);
  db.saveUsers(users);
  console.log(`[Match End] Match ${matchId} concluded due to forfeit by ${leaver.username || leaver.userId}`);
}

// Matchmaking Loop
function processMatchmaking() {
  if (matchmakingQueue.length < 2) return;

  for (let i = 0; i < matchmakingQueue.length; i++) {
    const p1 = matchmakingQueue[i];

    for (let j = i + 1; j < matchmakingQueue.length; j++) {
      const p2 = matchmakingQueue[j];

      if (p1.ws === p2.ws) continue;

      if (p1.userId === p2.userId) {
        p2.userId = `${p2.userId}_${Date.now()}`;
        if (p2.ws) p2.ws.userId = p2.userId;
      }

      matchmakingQueue.splice(j, 1);
      matchmakingQueue.splice(i, 1);
      createMatch(p1, p2);
      return;
    }
  }
}

// Single Bot Fallback & Tolerance Expander
setInterval(() => {
  const now = Date.now();
  for (let i = matchmakingQueue.length - 1; i >= 0; i--) {
    const p = matchmakingQueue[i];
    const waitTime = now - p.joinedAt;

    if (waitTime >= 3000 && matchmakingQueue.length === 1) {
      const humanPlayer = matchmakingQueue.splice(i, 1)[0];
      const botPlayer = {
        ws: { readyState: 1, send: () => {} },
        userId: "bot_sohrab",
        username: "سهراب (ربات)",
        rating: Math.max(900, humanPlayer.rating - 20),
        isBot: true
      };
      createMatch(humanPlayer, botPlayer);
      break;
    }
  }

  processMatchmaking();
}, 1000);

// Create Real 2-Player Match
function createMatch(p1, p2) {
  const matchId = `match_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
  const duration = HEX_GAME_CONFIG.MAX_MATCH_DURATION;
  const board = initializeHexBoard();

  p1.ws.matchId = matchId;
  p2.ws.matchId = matchId;

  const matchState = {
    matchId,
    puzzle,
    remainingSeconds: duration,
    board,
    activeUserId: p1.userId, // P1 starts
    selectedCellIndex: null,
    p1: {
      ws: p1.ws,
      userId: p1.userId,
      username: p1.username,
      rating: p1.rating,
      score: 0,
      correctWords: [],
      wrongCount: 0
    },
    p2: {
      ws: p2.ws,
      userId: p2.userId,
      username: p2.username,
      rating: p2.rating,
      score: 0,
      correctWords: [],
      wrongCount: 0,
      isBot: Boolean(p2.isBot)
    }
  };

  activeMatches.set(matchId, matchState);

  const matchStartP1 = {
    type: 'match_start',
    matchId,
    duration,
    turnDuration: HEX_GAME_CONFIG.TURN_DURATION,
    letters: puzzle.letters,
    board: board.map(c => ({ id: c.id, index: c.index, owner: c.owner, isSpecial: c.isSpecial })),
    activeUserId: p1.userId,
    opponent: {
      id: p2.userId,
      username: p2.username,
      rating: p2.rating,
      avatar: "👤"
    }
  };

  const matchStartP2 = {
    type: 'match_start',
    matchId,
    duration,
    turnDuration: HEX_GAME_CONFIG.TURN_DURATION,
    letters: puzzle.letters,
    board: board.map(c => ({ id: c.id, index: c.index, owner: c.owner, isSpecial: c.isSpecial })),
    activeUserId: p1.userId,
    opponent: {
      id: p1.userId,
      username: p1.username,
      rating: p1.rating,
      avatar: "👤"
    }
  };

  sendJson(p1.ws, matchStartP1);
  sendJson(p2.ws, matchStartP2);

  console.log(`[Match Start] Hexagonal 2-Player Match ${matchId} started: ${p1.username} vs ${p2.username}`);

  // Global match timer
  matchState.timerInterval = setInterval(() => {
    matchState.remainingSeconds -= 1;

    if (matchState.remainingSeconds % 10 === 0 && matchState.remainingSeconds > 0) {
      sendJson(p1.ws, { type: 'timer_sync', remainingSec: matchState.remainingSeconds });
      sendJson(p2.ws, { type: 'timer_sync', remainingSec: matchState.remainingSeconds });
    }

    if (matchState.remainingSeconds <= 0) {
      clearInterval(matchState.timerInterval);
      concludeMatch(matchState);
    }
  }, 1000);

  // Start turn system
  startNextTurn(matchState);
}

// Conclude Match & Calculate Elo & Authoritative Scores
function concludeMatch(matchState) {
  const { matchId, p1, p2, board } = matchState;
  activeMatches.delete(matchId);
  if (matchState.turnTimerInterval) clearInterval(matchState.turnTimerInterval);
  if (matchState.timerInterval) clearInterval(matchState.timerInterval);

  let p1Territory = board.filter(c => c.owner === 1).length;
  let p2Territory = board.filter(c => c.owner === 2).length;

  let outcomeP1 = "DRAW";
  let outcomeP2 = "DRAW";
  let scoreFactorP1 = 0.5;

  if (p1Territory > p2Territory) {
    outcomeP1 = "WIN";
    outcomeP2 = "LOSS";
    scoreFactorP1 = 1.0;
  } else if (p1Territory < p2Territory) {
    outcomeP1 = "LOSS";
    outcomeP2 = "WIN";
    scoreFactorP1 = 0.0;
  } else {
    // Territory is tied, compare score
    if (p1.score > p2.score) {
      outcomeP1 = "WIN";
      outcomeP2 = "LOSS";
      scoreFactorP1 = 1.0;
    } else if (p1.score < p2.score) {
      outcomeP1 = "LOSS";
      outcomeP2 = "WIN";
      scoreFactorP1 = 0.0;
    }
  }

  const deltaP1 = calculateEloDelta(p1.rating, p2.rating, scoreFactorP1);
  const deltaP2 = -deltaP1;

  const newRatingP1 = Math.max(500, p1.rating + deltaP1);
  const newRatingP2 = Math.max(500, p2.rating + deltaP2);

  const monthlyScoreDeltaP1 = outcomeP1 === "WIN" ? 20 : 0;
  const monthlyScoreDeltaP2 = outcomeP2 === "WIN" ? 20 : 0;

  if (users.has(p1.userId)) {
    const u = users.get(p1.userId);
    u.rating = newRatingP1;
    if (outcomeP1 === "WIN") u.wins = (u.wins || 0) + 1;
    else if (outcomeP1 === "LOSS") u.losses = (u.losses || 0) + 1;
    else u.draws = (u.draws || 0) + 1;
    u.monthlyScore = (u.monthlyScore || 0) + monthlyScoreDeltaP1;
  }

  if (p2.ws && users.has(p2.userId)) {
    const u = users.get(p2.userId);
    u.rating = newRatingP2;
    if (outcomeP2 === "WIN") u.wins = (u.wins || 0) + 1;
    else if (outcomeP2 === "LOSS") u.losses = (u.losses || 0) + 1;
    else u.draws = (u.draws || 0) + 1;
    u.monthlyScore = (u.monthlyScore || 0) + monthlyScoreDeltaP2;
  }

  db.saveUsers(users);

  const currentRankP1 = getUserRank(p1.userId);
  const currentRankP2 = getUserRank(p2.userId);

  if (p1.ws) {
    sendJson(p1.ws, {
      type: 'match_end',
      matchId,
      outcome: outcomeP1,
      myScore: p1.score,
      opponentScore: p2.score,
      myTerritory: p1Territory,
      opponentTerritory: p2Territory,
      myCorrectWords: p1.correctWords.length,
      opponentCorrectWords: p2.correctWords.length,
      myWrongWords: p1.wrongCount,
      ratingDelta: deltaP1,
      newRating: newRatingP1,
      monthlyScoreDelta: monthlyScoreDeltaP1,
      currentRank: currentRankP1
    });
  }

  if (p2.ws) {
    sendJson(p2.ws, {
      type: 'match_end',
      matchId,
      outcome: outcomeP2,
      myScore: p2.score,
      opponentScore: p1.score,
      myTerritory: p2Territory,
      opponentTerritory: p1Territory,
      myCorrectWords: p2.correctWords.length,
      opponentCorrectWords: p1.correctWords.length,
      myWrongWords: p2.wrongCount,
      ratingDelta: deltaP2,
      newRating: newRatingP2,
      monthlyScoreDelta: monthlyScoreDeltaP2,
      currentRank: currentRankP2
    });
  }

  console.log(`[Hex Match Concluded] ${matchId} - P1 Territory: ${p1Territory} vs P2 Territory: ${p2Territory}`);
}

// Start Server Listening
if (!server.listening) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 Persian Word Battle Server running on port ${PORT}`);
    console.log(`🌐 HTTP API: http://0.0.0.0:${PORT}`);
    console.log(`⚡ WebSocket: ws://0.0.0.0:${PORT}`);
    console.log(`🛡️ Web Admin Panel: http://0.0.0.0:${PORT}/admin`);
    console.log(`   or via domain: admin.kalametgame.ir`);
    console.log(`====================================================`);
  });
}

module.exports = { server, users, activeMatches, getAuthoritativeTournamentState };
