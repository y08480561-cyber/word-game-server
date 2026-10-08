/**
 * Real-time Player Registration & Lead Notification Service
 * Production-ready notification dispatcher for Kalamet Word Game.
 * 
 * Supports:
 * - Local database persistent storage via db.js
 * - Admin email notification (read from process.env.ADMIN_EMAIL or process.env.NOTIFICATION_EMAIL)
 * - Custom webhook notifications (read from process.env.ADMIN_LEAD_WEBHOOK_URL or process.env.NOTIFICATION_WEBHOOK_URL)
 * - Safe fallback: if email/webhook is not configured, saves lead locally and never crashes.
 */

const https = require('https');
const http = require('http');
const db = require('./db');

/**
 * Reads admin notification email safely from environment variables without hardcoding.
 */
function getAdminEmail() {
  return (process.env.ADMIN_EMAIL || process.env.NOTIFICATION_EMAIL || '').trim();
}

/**
 * Dispatches notification asynchronously without blocking server operations.
 * Handles timeouts and network errors gracefully.
 */
function sendNotification(lead) {
  const adminEmail = getAdminEmail();
  const webhookUrl = (process.env.ADMIN_LEAD_WEBHOOK_URL || process.env.NOTIFICATION_WEBHOOK_URL || '').trim();

  // If no external notification destination is configured, skip network calls gracefully
  if (!adminEmail && !webhookUrl) {
    return;
  }

  const emailSubject = `🏆 ثبت‌نام بازیکن جدید در مسابقات کلمات: ${lead.name || 'نامشخص'}`;
  const dateStr = lead.dateString || new Date(lead.registeredAt || Date.now()).toLocaleString('fa-IR');
  
  const emailContent = [
    'سلام مدیر گرامی،',
    '',
    'یک بازیکن جدید در بازی کلمه‌ت ثبت‌نام کرد:',
    `👤 نام و نام خانوادگی: ${lead.name || '-'}`,
    `📞 شماره تماس: ${lead.phone || '-'}`,
    `📱 شناسه دستگاه: ${lead.deviceId || '-'}`,
    `📅 زمان ثبت: ${dateStr}`,
    `🌐 آی‌پی: ${lead.ip || '-'}`,
    `🎁 سکه هدیه: ${lead.coinsGiven || 0}`,
    '',
    'جهت مدیریت بازیکنان می‌توانید به پنل مدیریت سرور مراجعه نمایید.'
  ].join('\n');

  // 1. Email delivery via FormSubmit gateway if ADMIN_EMAIL is set
  if (adminEmail && adminEmail.includes('@')) {
    try {
      const postData = JSON.stringify({
        _subject: emailSubject,
        name: lead.name || '-',
        phone: lead.phone || '-',
        deviceId: lead.deviceId || '-',
        registeredAt: dateStr,
        ip: lead.ip || '-',
        message: emailContent,
        _template: 'table',
        _captcha: 'false'
      });

      const req = https.request({
        hostname: 'formsubmit.co',
        port: 443,
        path: `/ajax/${encodeURIComponent(adminEmail)}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'KalametWordGameServer/1.0',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 10000
      }, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[EmailNotifier] Notification dispatched to admin.`);
          } else {
            console.log(`[EmailNotifier] Dispatch status: ${res.statusCode}`);
          }
        });
      });

      req.on('error', (err) => {
        console.log(`[EmailNotifier] Network warning: ${err.message}`);
      });

      req.on('timeout', () => {
        req.destroy();
        console.log('[EmailNotifier] Dispatch timeout');
      });

      req.write(postData);
      req.end();
    } catch (err) {
      console.log(`[EmailNotifier] Email dispatch exception: ${err.message}`);
    }
  }

  // 2. Custom Webhook dispatch if configured
  if (webhookUrl) {
    try {
      const urlObj = new URL(webhookUrl);
      const postData = JSON.stringify({
        event: 'NEW_PLAYER_REGISTRATION',
        subject: emailSubject,
        recipient: adminEmail || null,
        message: emailContent,
        lead: {
          id: lead.id,
          name: lead.name,
          phone: lead.phone,
          deviceId: lead.deviceId,
          ip: lead.ip,
          registeredAt: lead.registeredAt,
          dateString: dateStr,
          source: lead.source,
          coinsGiven: lead.coinsGiven
        }
      });

      const isHttps = urlObj.protocol === 'https:';
      const client = isHttps ? https : http;

      const req = client.request({
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'KalametWordGameServer/1.0'
        },
        timeout: 8000
      }, (res) => {
        // Webhook response handled silently
      });

      req.on('error', (err) => {
        console.log(`[EmailNotifier] Webhook warning: ${err.message}`);
      });

      req.on('timeout', () => {
        req.destroy();
      });

      req.write(postData);
      req.end();
    } catch (err) {
      console.log(`[EmailNotifier] Webhook exception: ${err.message}`);
    }
  }
}

/**
 * Records a new player registration securely into database and triggers notifications.
 * @param {Object} lead - Registration payload (name, phone, deviceId, etc.)
 * @returns {Object} Sanitized saved lead entry
 */
function recordNewPlayerRegistration(lead) {
  if (!lead || typeof lead !== 'object') {
    lead = {};
  }

  const now = Date.now();
  const entry = {
    id: lead.id || `lead_${now}_${Math.random().toString(36).substring(2, 6)}`,
    name: String(lead.name || '').trim().substring(0, 100),
    phone: String(lead.phone || '').trim().substring(0, 30),
    deviceId: String(lead.deviceId || '').trim().substring(0, 100),
    ip: String(lead.ip || '').trim().substring(0, 50),
    registeredAt: typeof lead.timestamp === 'number' ? lead.timestamp : now,
    dateString: new Date(typeof lead.timestamp === 'number' ? lead.timestamp : now).toLocaleString('fa-IR'),
    source: String(lead.source || 'Android Client').trim().substring(0, 50),
    coinsGiven: Number.isFinite(lead.coinsGiven) ? lead.coinsGiven : 50
  };

  try {
    if (typeof db.addPlayerLead === 'function') {
      db.addPlayerLead(entry);
    }
    if (typeof db.addAuditLog === 'function') {
      db.addAuditLog('system', 'NEW_PLAYER_REGISTERED', '-', `${entry.name} (${entry.phone})`, 'ثبت‌نام بازیکن جدید و ذخیره در سیستم تماس');
    }
  } catch (err) {
    console.log(`[EmailNotifier] Database save warning: ${err.message}`);
  }

  // Trigger non-blocking notification delivery
  try {
    sendNotification(entry);
  } catch (err) {
    console.log(`[EmailNotifier] Notification dispatch warning: ${err.message}`);
  }

  return entry;
}

module.exports = {
  recordNewPlayerRegistration,
  sendDirectEmailNotification: sendNotification
};
