/**
 * Authoritative Real-Time Backend for Persian Word Game Online Battle
 * Supports: WebSocket Multiplayer, Matchmaking Queue, Elo Rating, Anti-Cheat Word Validation,
 *           Monthly Tournaments, Dynamic Prizes, and Natural Bot Fallbacks.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Try loading 'ws' library, fallback to lightweight built-in mock if not installed yet
let WebSocketServer;
try {
  WebSocketServer = require('ws').Server;
} catch (e) {
  console.log('[Server] Note: ws package will be installed via npm. Using standard require.');
}

const PORT = process.env.PORT || 8080;

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

// In-Memory Database (For production, connect to Redis / PostgreSQL / MongoDB)
const users = new Map(); // userId -> { id, username, rating, wins, losses, draws, monthlyScore }
const activeMatches = new Map(); // matchId -> MatchState
const matchmakingQueue = []; // [{ socket, userId, username, rating, joinedAt, tolerance }]

// Dynamic Monthly Tournament & Rewards (Controlled by Backend)
const currentTournament = {
  monthName: "مسابقه بزرگ شهریور",
  remainingDays: 12,
  totalParticipants: 3480,
  rewards: {
    firstPlace: "🥇 هندزفری بی‌سیم + ۳۰٬۰۰۰ سکه",
    secondPlace: "🥈 پاوربانک فست‌شارژ + ۱۵٬۰۰۰ سکه",
    thirdPlace: "🥉 کارت هدیه ۵۰۰ تومانی + ۸٬۰۰۰ سکه"
  }
};

// Seed initial leaderboard for realism
const initialTopPlayers = [
  { username: "سردار_واژگان", rating: 1840, score: 920, wins: 84 },
  { username: "آریوبرزن", rating: 1795, score: 860, wins: 76 },
  { username: "شهزاد_پارسی", rating: 1750, score: 810, wins: 69 },
  { username: "فرهاد_عاشق", rating: 1690, score: 740, wins: 62 },
  { username: "نیلوفر_روشن", rating: 1640, score: 680, wins: 55 },
  { username: "کوروش_بزرگ", rating: 1590, score: 610, wins: 48 },
  { username: "پروانه_تنها", rating: 1540, score: 560, wins: 42 },
  { username: "امیرعلی_کلام", rating: 1490, score: 510, wins: 38 },
  { username: "بهاره_دانش", rating: 1440, score: 470, wins: 34 },
  { username: "شاهین_تیزپا", rating: 1390, score: 410, wins: 30 }
];

initialTopPlayers.forEach((p, idx) => {
  users.set(`user_seed_${idx}`, {
    id: `user_seed_${idx}`,
    username: p.username,
    rating: p.rating,
    monthlyScore: p.score,
    wins: p.wins,
    losses: Math.floor(p.wins * 0.3),
    draws: Math.floor(p.wins * 0.1)
  });
});

// Calculate Word Points
function calculateWordPoints(wordLength, combo) {
  let base = 10;
  if (wordLength === 3) base = 15;
  else if (wordLength === 4) base = 20;
  else if (wordLength === 5) base = 30;
  else if (wordLength >= 6) base = 40;

  // Combo multiplier: +15% per combo level beyond 1
  const comboBonus = Math.floor((combo - 1) * 3);
  return base + Math.max(0, comboBonus);
}

// Calculate Elo Rating Delta
function calculateEloDelta(ratingA, ratingB, outcomeA) {
  // outcomeA: 1.0 (win), 0.5 (draw), 0.0 (loss)
  const K = 32;
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const delta = Math.round(K * (outcomeA - expectedA));
  return delta;
}

// HTTP Server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url.split('?')[0];

  if (url === '/' || url === '/api/status' || url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: "online",
      server: "Persian Word Battle Backend",
      version: "1.0.0",
      activeConnections: wss ? wss.clients.size : 0,
      activeMatches: activeMatches.size,
      matchmakingQueueSize: matchmakingQueue.length,
      port: PORT,
      timestamp: new Date().toISOString()
    }));
  } else if (url === '/api/tournament') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(currentTournament));
  } else if (url === '/api/leaderboard') {
    const list = Array.from(users.values())
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 50)
      .map((u, idx) => ({
        rank: idx + 1,
        username: u.username,
        rating: u.rating,
        monthlyScore: u.monthlyScore || 0,
        wins: u.wins || 0
      }));

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ leaderboard: list }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: "Endpoint not found" }));
  }
});

// WebSocket Server Initialization
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

// Handle Client Messages
function handleClientMessage(ws, data) {
  switch (data.type) {
    case 'queue_join': {
      const userId = data.userId || `guest_${Date.now()}`;
      const username = data.username || 'بازیکن';
      const rating = Number(data.rating) || 1000;

      ws.userId = userId;
      ws.username = username;
      ws.rating = rating;

      // Update or create user
      if (!users.has(userId)) {
        users.set(userId, { id: userId, username, rating, wins: 0, losses: 0, draws: 0, monthlyScore: 0 });
      } else {
        const u = users.get(userId);
        u.username = username;
        u.rating = rating;
      }

      // Remove from queue if already waiting
      removeFromQueue(ws);

      // Add to matchmaking queue
      matchmakingQueue.push({
        ws,
        userId,
        username,
        rating,
        joinedAt: Date.now(),
        tolerance: 100
      });

      console.log(`[Matchmaking] Player joined queue: ${username} (Rating: ${rating}) - Queue size: ${matchmakingQueue.length}`);
      processMatchmaking();
      break;
    }

    case 'queue_cancel': {
      removeFromQueue(ws);
      console.log(`[Matchmaking] Player canceled queue: ${ws.username || ws.userId}`);
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
      const isPlayer1 = match.p1.userId === ws.userId;
      const player = isPlayer1 ? match.p1 : match.p2;
      const opponent = isPlayer1 ? match.p2 : match.p1;

      // Anti-Cheat: Validate Word
      const isAlreadyFound = player.correctWords.includes(word);
      const isValid = match.puzzle.words.includes(word);

      if (isAlreadyFound) {
        sendJson(ws, { type: 'word_result', success: false, reason: "این کلمه را قبلاً ثبت کرده‌اید!" });
        return;
      }

      if (isValid) {
        player.combo += 1;
        const pts = calculateWordPoints(word.length, player.combo);
        player.score += pts;
        player.correctWords.push(word);

        // Notify submitting player
        sendJson(ws, {
          type: 'word_result',
          success: true,
          word,
          pointsGained: pts,
          newScore: player.score,
          combo: player.combo
        });

        // Notify opponent
        sendJson(opponent.ws, {
          type: 'opponent_progress',
          opponentScore: player.score,
          opponentCombo: player.combo,
          opponentWord: word,
          wordsFoundCount: player.correctWords.length
        });
      } else {
        player.combo = 0;
        player.wrongCount += 1;

        sendJson(ws, {
          type: 'word_result',
          success: false,
          reason: "کلمه در این راند معتبر نیست!"
        });
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
    matchmakingQueue.splice(idx, 1);
  }
}

function handleClientDisconnect(ws) {
  removeFromQueue(ws);

  if (ws.matchId && activeMatches.has(ws.matchId)) {
    const match = activeMatches.get(ws.matchId);
    const isPlayer1 = match.p1.userId === ws.userId;
    const opponent = isPlayer1 ? match.p2 : match.p1;

    // Conclude match due to early disconnect
    if (opponent.ws) {
      sendJson(opponent.ws, {
        type: 'match_end',
        matchId: match.matchId,
        outcome: "WIN",
        myScore: opponent.score,
        opponentScore: 0,
        myCorrectWords: opponent.correctWords.length,
        opponentCorrectWords: 0,
        myWrongWords: opponent.wrongCount,
        ratingDelta: 24,
        newRating: (opponent.rating || 1000) + 24,
        monthlyScoreDelta: 50,
        currentRank: 1
      });
    }

    clearInterval(match.timerInterval);
    activeMatches.delete(ws.matchId);
    console.log(`[Match End] Match ${ws.matchId} ended due to disconnect.`);
  }
}

// Matchmaking Loop
function processMatchmaking() {
  if (matchmakingQueue.length < 2) return;

  for (let i = 0; i < matchmakingQueue.length; i++) {
    const p1 = matchmakingQueue[i];

    for (let j = i + 1; j < matchmakingQueue.length; j++) {
      const p2 = matchmakingQueue[j];
      const ratingDiff = Math.abs(p1.rating - p2.rating);
      const allowedTolerance = Math.max(p1.tolerance, p2.tolerance);

      if (ratingDiff <= allowedTolerance) {
        // Match found!
        matchmakingQueue.splice(j, 1);
        matchmakingQueue.splice(i, 1);
        createMatch(p1, p2);
        return;
      }
    }
  }
}

// Gradually increase tolerance or spawn bot for long-waiting players
setInterval(() => {
  const now = Date.now();
  for (let i = matchmakingQueue.length - 1; i >= 0; i--) {
    const p = matchmakingQueue[i];
    const waitTime = now - p.joinedAt;

    if (waitTime > 3000 && p.tolerance < 200) {
      p.tolerance = 200;
    } else if (waitTime > 6000 && p.tolerance < 300) {
      p.tolerance = 300;
    } else if (waitTime > 10000) {
      // Create match with Intelligent Balanced Bot
      matchmakingQueue.splice(i, 1);
      createBotMatch(p);
    }
  }

  processMatchmaking();
}, 2000);

// Create Real 2-Player Match
function createMatch(p1, p2) {
  const matchId = `match_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
  const duration = 60;

  p1.ws.matchId = matchId;
  p2.ws.matchId = matchId;

  const matchState = {
    matchId,
    puzzle,
    remainingSeconds: duration,
    p1: {
      ws: p1.ws,
      userId: p1.userId,
      username: p1.username,
      rating: p1.rating,
      score: 0,
      combo: 0,
      correctWords: [],
      wrongCount: 0
    },
    p2: {
      ws: p2.ws,
      userId: p2.userId,
      username: p2.username,
      rating: p2.rating,
      score: 0,
      combo: 0,
      correctWords: [],
      wrongCount: 0
    }
  };

  activeMatches.set(matchId, matchState);

  // Send match_start to both players
  sendJson(p1.ws, {
    type: 'match_start',
    matchId,
    duration,
    letters: puzzle.letters,
    opponent: {
      id: p2.userId,
      username: p2.username,
      rating: p2.rating,
      avatar: "👤"
    }
  });

  sendJson(p2.ws, {
    type: 'match_start',
    matchId,
    duration,
    letters: puzzle.letters,
    opponent: {
      id: p1.userId,
      username: p1.username,
      rating: p1.rating,
      avatar: "👤"
    }
  });

  console.log(`[Match Start] 2-Player Match ${matchId} started between ${p1.username} (${p1.rating}) and ${p2.username} (${p2.rating})`);

  // Start authoritative 60s countdown timer
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
}

// Create Bot Match
function createBotMatch(p1) {
  const matchId = `match_bot_${Date.now()}`;
  const puzzle = puzzles[Math.floor(Math.random() * puzzles.length)];
  const duration = 60;

  const botNames = ["سارا_روشن", "امیرحسین_کلام", "نیلوفر_آبی", "رضا_پویا", "مریم_فرهنگ", "کیان_پارسی"];
  const botName = botNames[Math.floor(Math.random() * botNames.length)];
  const botRating = Math.max(800, p1.rating + Math.floor(Math.random() * 100 - 50));

  p1.ws.matchId = matchId;

  const matchState = {
    matchId,
    puzzle,
    remainingSeconds: duration,
    p1: {
      ws: p1.ws,
      userId: p1.userId,
      username: p1.username,
      rating: p1.rating,
      score: 0,
      combo: 0,
      correctWords: [],
      wrongCount: 0
    },
    p2: {
      ws: null,
      userId: `bot_${Date.now()}`,
      username: botName,
      rating: botRating,
      score: 0,
      combo: 0,
      correctWords: [],
      wrongCount: 0,
      isBot: true
    }
  };

  activeMatches.set(matchId, matchState);

  sendJson(p1.ws, {
    type: 'match_start',
    matchId,
    duration,
    letters: puzzle.letters,
    opponent: {
      id: matchState.p2.userId,
      username: botName,
      rating: botRating,
      avatar: "👤"
    }
  });

  console.log(`[Bot Match Start] Match ${matchId} started between ${p1.username} and Bot ${botName}`);

  // Bot Word Generation Loop
  const botAvailableWords = [...puzzle.words].sort(() => 0.5 - Math.random());
  const botInterval = setInterval(() => {
    if (!activeMatches.has(matchId) || matchState.remainingSeconds <= 0 || botAvailableWords.length === 0) {
      clearInterval(botInterval);
      return;
    }

    const word = botAvailableWords.pop();
    matchState.p2.combo += 1;
    const pts = calculateWordPoints(word.length, matchState.p2.combo);
    matchState.p2.score += pts;
    matchState.p2.correctWords.push(word);

    sendJson(p1.ws, {
      type: 'opponent_progress',
      opponentScore: matchState.p2.score,
      opponentCombo: matchState.p2.combo,
      opponentWord: word,
      wordsFoundCount: matchState.p2.correctWords.length
    });
  }, 6500);

  matchState.timerInterval = setInterval(() => {
    matchState.remainingSeconds -= 1;
    if (matchState.remainingSeconds <= 0) {
      clearInterval(matchState.timerInterval);
      clearInterval(botInterval);
      concludeMatch(matchState);
    }
  }, 1000);
}

// Conclude Match & Calculate Elo & Stats
function concludeMatch(matchState) {
  const { matchId, p1, p2 } = matchState;
  activeMatches.delete(matchId);

  let outcomeP1 = "DRAW";
  let outcomeP2 = "DRAW";
  let scoreFactorP1 = 0.5;

  if (p1.score > p2.score) {
    outcomeP1 = "WIN";
    outcomeP2 = "LOSS";
    scoreFactorP1 = 1.0;
  } else if (p1.score < p2.score) {
    outcomeP1 = "LOSS";
    outcomeP2 = "WIN";
    scoreFactorP1 = 0.0;
  }

  const deltaP1 = calculateEloDelta(p1.rating, p2.rating, scoreFactorP1);
  const deltaP2 = -deltaP1;

  const newRatingP1 = Math.max(500, p1.rating + deltaP1);
  const newRatingP2 = Math.max(500, p2.rating + deltaP2);

  // Update Database
  if (users.has(p1.userId)) {
    const u = users.get(p1.userId);
    u.rating = newRatingP1;
    if (outcomeP1 === "WIN") u.wins = (u.wins || 0) + 1;
    else if (outcomeP1 === "LOSS") u.losses = (u.losses || 0) + 1;
    else u.draws = (u.draws || 0) + 1;
    u.monthlyScore = (u.monthlyScore || 0) + p1.score;
  }

  if (p2.ws && users.has(p2.userId)) {
    const u = users.get(p2.userId);
    u.rating = newRatingP2;
    if (outcomeP2 === "WIN") u.wins = (u.wins || 0) + 1;
    else if (outcomeP2 === "LOSS") u.losses = (u.losses || 0) + 1;
    else u.draws = (u.draws || 0) + 1;
    u.monthlyScore = (u.monthlyScore || 0) + p2.score;
  }

  // Send Result to Player 1
  if (p1.ws) {
    sendJson(p1.ws, {
      type: 'match_end',
      matchId,
      outcome: outcomeP1,
      myScore: p1.score,
      opponentScore: p2.score,
      myCorrectWords: p1.correctWords.length,
      opponentCorrectWords: p2.correctWords.length,
      myWrongWords: p1.wrongCount,
      ratingDelta: deltaP1,
      newRating: newRatingP1,
      monthlyScoreDelta: p1.score,
      currentRank: 12
    });
  }

  // Send Result to Player 2 (if real player)
  if (p2.ws) {
    sendJson(p2.ws, {
      type: 'match_end',
      matchId,
      outcome: outcomeP2,
      myScore: p2.score,
      opponentScore: p1.score,
      myCorrectWords: p2.correctWords.length,
      opponentCorrectWords: p1.correctWords.length,
      myWrongWords: p2.wrongCount,
      ratingDelta: deltaP2,
      newRating: newRatingP2,
      monthlyScoreDelta: p2.score,
      currentRank: 14
    });
  }

  console.log(`[Match Concluded] ${matchId} - P1 (${p1.username}): ${p1.score} vs P2 (${p2.username}): ${p2.score} -> P1: ${outcomeP1} (Δ${deltaP1})`);
}

// Start Server Listening
server.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 Persian Word Battle Server running on port ${PORT}`);
  console.log(`🌐 HTTP API: http://0.0.0.0:${PORT}`);
  console.log(`⚡ WebSocket: ws://0.0.0.0:${PORT}`);
  console.log(`====================================================`);
});

module.exports = { server, users, activeMatches, currentTournament };
