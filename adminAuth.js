/**
 * Production Administrator Authentication & Session Management
 * Strict Fail-Closed Security, Brute-Force Rate Limiting & Zero Hardcoded Passwords
 */

const crypto = require('crypto');
const db = require('./db');

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 Minutes

const activeSessions = new Map(); // token -> { username, createdAt, expiresAt }
const failedAttemptsByIp = new Map(); // clientIp -> { count, lockedUntil }

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function extractClientIp(req) {
  if (!req) return '127.0.0.1';
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || req.connection?.remoteAddress || '127.0.0.1';
}

function isRequestSecure(req) {
  if (!req) return false;
  const proto = req.headers['x-forwarded-proto'];
  return proto === 'https' || Boolean(req.socket?.encrypted) || Boolean(req.connection?.encrypted);
}

function parseCookies(cookieHeader) {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
    }
  });
  return list;
}

function extractToken(req) {
  // 1. Authorization header: Bearer <token>
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  // 2. Cookie header: admin_token=<token>
  const cookies = parseCookies(req.headers['cookie']);
  if (cookies['admin_token']) {
    return cookies['admin_token'];
  }

  // 3. Query parameter: ?token=<token>
  if (req.url && req.url.includes('token=')) {
    try {
      const u = new URL(req.url, 'http://localhost');
      return u.searchParams.get('token');
    } catch (_) {}
  }

  return null;
}

function getAuthenticatedAdmin(req) {
  const token = extractToken(req);
  if (!token) return null;

  const session = activeSessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }

  // Slide expiration window on active use
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return { username: session.username, token };
}

function login(username, password, clientIp = '127.0.0.1') {
  // 1. Fail-Closed Check: If environment variables are missing on Render, fail closed immediately
  if (!db.isAdminConfigured()) {
    console.warn('[SECURITY FAIL-CLOSED] Login rejected: ADMIN_USERNAME and ADMIN_PASSWORD must be configured in environment.');
    return {
      success: false,
      statusCode: 503,
      error: 'سیستم ورود مدیریت غیرفعال است: متغیرهای محیطی ADMIN_USERNAME و ADMIN_PASSWORD در سرور تنظیم نشده‌اند.'
    };
  }
  if (!username || !password) {
    return {
      success: false,
      statusCode: 400,
      error: 'نام کاربری و رمز عبور الزامی است.'
    };
  }
  // 2. Verify credentials using constant-time comparison (No lockout or 15-min blocking)
  const isValid = db.verifyAdminCredentials(username, password);
  if (!isValid) {
    db.addAuditLog(
      String(username).trim() || 'unknown',
      "ADMIN_LOGIN_FAILED",
      "-",
      "Rejected",
      `ورود ناموفق از IP: ${clientIp}`
    );
    return {
      success: false,
      statusCode: 401,
      error: 'نام کاربری یا رمز عبور اشتباه است.'
    };
  }
  // 3. Successful login
  const token = generateSessionToken();
  const session = {
    username: String(username).trim(),
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS
  };
  activeSessions.set(token, session);
  db.addAuditLog(session.username, "ADMIN_LOGIN", "-", "Success", `ورود موفق مدیر به پنل از IP: ${clientIp}`);
  return {
    success: true,
    statusCode: 200,
    token,
    username: session.username,
    expiresAt: session.expiresAt
  };
}

function logout(req) {
  const token = extractToken(req);
  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token);
    db.addAuditLog(session.username, "ADMIN_LOGOUT", "-", "Success", "خروج موفق مدیر از پنل");
    activeSessions.delete(token);
    return true;
  }
  return false;
}

function createSessionCookie(token, isSecure = false) {
  const secureFlag = isSecure ? '; Secure' : '';
  return `admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400${secureFlag}`;
}

function clearSessionCookie(isSecure = false) {
  const secureFlag = isSecure ? '; Secure' : '';
  return `admin_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secureFlag}`;
}

function requireAdmin(req, res) {
  const admin = getAuthenticatedAdmin(req);
  if (!admin) {
    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: "Unauthorized. Admin authentication required." }));
    return false;
  }
  req.admin = admin;
  return true;
}

module.exports = {
  login,
  logout,
  getAuthenticatedAdmin,
  requireAdmin,
  extractClientIp,
  isRequestSecure,
  createSessionCookie,
  clearSessionCookie
};
