/**
 * Secure Administrator Authentication & Session Management
 * Protects admin API routes and verifies admin sessions.
 */

const crypto = require('crypto');
const db = require('./db');

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours
const activeSessions = new Map(); // token -> { username, expiresAt }

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
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

  // 3. Query parameter: ?token=<token> (fallback for downloads/SSE)
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

function login(username, password) {
  if (!username || !password) return null;
  const isValid = db.verifyAdminCredentials(username, password);
  if (!isValid) return null;

  const token = generateSessionToken();
  const session = {
    username: username.trim(),
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS
  };
  activeSessions.set(token, session);

  db.addAuditLog(username, "ADMIN_LOGIN", "-", "Success", "Administrator logged into Admin Panel");
  return { token, username: session.username, expiresAt: session.expiresAt };
}

function logout(req) {
  const token = extractToken(req);
  if (token && activeSessions.has(token)) {
    const session = activeSessions.get(token);
    db.addAuditLog(session.username, "ADMIN_LOGOUT", "-", "Success", "Administrator logged out");
    activeSessions.delete(token);
    return true;
  }
  return false;
}

function requireAdmin(req, res, next) {
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
  requireAdmin
};
