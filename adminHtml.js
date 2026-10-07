/**
 * Single-Page Web-based Remote Administrator Panel for Persian Word Battle
 * Served at admin.kalametgame.ir or /admin
 * Features: Authentication, Tournament KPI Cards, Action Confirmation Modals,
 *           Schedule & Prize Configuration, Live Leaderboard, and Persistent Audit Log.
 */

function getAdminHtml(hostName = "admin.kalametgame.ir") {
  return `<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>پنل مدیریت کلمه‌ت | Kalamet Admin</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #120e0a;
      --card-bg: #1c150e;
      --card-border: #3b2817;
      --card-hover: #261b11;
      --primary: #d49a37;
      --primary-hover: #e5ab48;
      --primary-glow: rgba(212, 154, 55, 0.25);
      --gold-light: #ffd700;
      --wood-dark: #2a190b;
      --wood-accent: #6b3e14;
      --success: #10b981;
      --danger: #ef4444;
      --warning: #f59e0b;
      --info: #3b82f6;
      --text-main: #fdf6ec;
      --text-muted: #a38c76;
      --font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: var(--font-family);
    }

    body {
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(circle at 15% 20%, rgba(107, 62, 20, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 85% 80%, rgba(212, 154, 55, 0.08) 0%, transparent 40%);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Container */
    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 24px 20px;
      width: 100%;
    }

    /* Header */
    header {
      background: rgba(28, 21, 14, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--card-border);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-content {
      max-width: 1280px;
      margin: 0 auto;
      padding: 14px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: var(--text-main);
    }
    .brand-icon {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, var(--wood-accent), var(--primary));
      border: 1.5px solid var(--gold-light);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      box-shadow: 0 4px 12px var(--primary-glow);
    }
    .brand-title {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .brand-subtitle {
      font-size: 11px;
      color: var(--primary);
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
    }
    .badge-active {
      background: rgba(16, 185, 129, 0.15);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .badge-closed {
      background: rgba(239, 68, 68, 0.15);
      color: var(--danger);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .badge-domain {
      background: rgba(212, 154, 55, 0.15);
      color: var(--primary);
      border: 1px solid var(--card-border);
      font-family: monospace;
      direction: ltr;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: currentColor;
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.3; transform: scale(0.8); }
      100% { opacity: 1; transform: scale(1); }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .server-time-box {
      background: rgba(0, 0, 0, 0.3);
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid var(--card-border);
      font-size: 12px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .server-time-box span {
      color: var(--text-main);
      font-weight: 700;
      font-family: monospace;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 9px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--primary), #b37e24);
      color: #1a0f05;
      box-shadow: 0 4px 14px var(--primary-glow);
    }
    .btn-primary:hover {
      background: linear-gradient(135deg, var(--primary-hover), var(--primary));
      transform: translateY(-1px);
    }
    .btn-outline {
      background: transparent;
      color: var(--text-main);
      border: 1px solid var(--card-border);
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--primary);
    }
    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.25);
    }
    .btn-success {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
    .btn-success:hover {
      background: rgba(16, 185, 129, 0.25);
    }
    .btn-warning {
      background: rgba(245, 158, 11, 0.15);
      color: #fbbf24;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .btn-warning:hover {
      background: rgba(245, 158, 11, 0.25);
    }
    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
      border-radius: 8px;
    }

    /* Cards Grid */
    .grid-kpi {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      transition: border-color 0.2s;
    }
    .kpi-card:hover {
      border-color: var(--primary);
    }
    .kpi-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: rgba(212, 154, 55, 0.12);
      border: 1px solid var(--card-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      flex-shrink: 0;
    }
    .kpi-label {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .kpi-val {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-main);
    }
    .kpi-sub {
      font-size: 11px;
      color: var(--primary);
      margin-top: 2px;
      font-weight: 500;
    }

    /* Section Cards */
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 18px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--card-border);
      padding-bottom: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .card-title {
      font-size: 17px;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--text-main);
    }

    /* Action Toolbar */
    .actions-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }

    /* Forms */
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 18px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }
    .form-control {
      background: #140e08;
      border: 1px solid var(--card-border);
      border-radius: 10px;
      padding: 10px 14px;
      color: var(--text-main);
      font-size: 14px;
      outline: none;
      transition: all 0.2s;
    }
    .form-control:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }
    .form-control:read-only {
      opacity: 0.7;
      background: #0f0a06;
    }

    /* Prize Cards in Form */
    .prizes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-top: 12px;
    }
    .prize-box {
      background: #160f09;
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 14px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .prize-medal {
      font-size: 30px;
    }
    .prize-inputs {
      flex: 1;
    }

    /* Tables */
    .table-responsive {
      overflow-x: auto;
      border-radius: 12px;
      border: 1px solid var(--card-border);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      text-align: right;
    }
    th {
      background: #160f09;
      padding: 12px 16px;
      color: var(--text-muted);
      font-weight: 700;
      border-bottom: 1px solid var(--card-border);
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(59, 40, 23, 0.5);
      color: var(--text-main);
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background: rgba(212, 154, 55, 0.04);
    }
    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      font-weight: 800;
      font-size: 12px;
    }
    .rank-1 { background: #ffd700; color: #000; }
    .rank-2 { background: #c0c0c0; color: #000; }
    .rank-3 { background: #cd7f32; color: #fff; }
    .rank-normal { background: #2a1b10; color: var(--text-muted); }

    /* Modal Dialog */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      pointer-events: none;
      transition: all 0.2s ease;
      padding: 16px;
    }
    .modal-overlay.active {
      opacity: 1;
      pointer-events: all;
    }
    .modal {
      background: var(--card-bg);
      border: 1.5px solid var(--primary);
      border-radius: 20px;
      padding: 28px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
      transform: scale(0.95);
      transition: transform 0.2s ease;
    }
    .modal-overlay.active .modal {
      transform: scale(1);
    }
    .modal-icon {
      font-size: 40px;
      margin-bottom: 14px;
      text-align: center;
    }
    .modal-title {
      font-size: 18px;
      font-weight: 800;
      text-align: center;
      margin-bottom: 10px;
      color: var(--text-main);
    }
    .modal-desc {
      font-size: 13.5px;
      color: var(--text-muted);
      line-height: 1.6;
      text-align: center;
      margin-bottom: 22px;
    }
    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 24px;
      background: var(--card-bg);
      border: 1.5px solid var(--primary);
      color: var(--text-main);
      padding: 14px 20px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13.5px;
      font-weight: 600;
      z-index: 2000;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.25s ease;
    }
    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    /* Login Screen */
    .login-wrapper {
      min-height: 80vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .login-card {
      background: var(--card-bg);
      border: 1.5px solid var(--primary);
      border-radius: 24px;
      padding: 36px 32px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
      text-align: center;
    }
    .login-brand {
      width: 68px;
      height: 68px;
      border-radius: 18px;
      background: linear-gradient(135deg, var(--wood-accent), var(--primary));
      border: 2px solid var(--gold-light);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      margin: 0 auto 16px auto;
      box-shadow: 0 6px 18px var(--primary-glow);
    }

    /* Tabs */
    .nav-tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--card-border);
      margin-bottom: 24px;
      overflow-x: auto;
      padding-bottom: 6px;
    }
    .nav-tab {
      padding: 10px 18px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 700;
      color: var(--text-muted);
      cursor: pointer;
      background: transparent;
      border: 1px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .nav-tab:hover {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.04);
    }
    .nav-tab.active {
      color: #1a0f05;
      background: var(--primary);
      border-color: var(--gold-light);
    }

    .tab-pane {
      display: none;
    }
    .tab-pane.active {
      display: block;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }
      .header-actions {
        width: 100%;
        justify-content: space-between;
      }
      .actions-toolbar {
        flex-direction: column;
        width: 100%;
      }
      .actions-toolbar .btn {
        width: 100%;
      }
    }
  </style>
</head>
<body>

  <!-- Top Header -->
  <header>
    <div class="header-content">
      <div class="brand">
        <div class="brand-icon">🏆</div>
        <div>
          <div class="brand-title">پنل مدیریت مسابقات کلمه‌ت</div>
          <div class="brand-subtitle">
            <span class="badge badge-domain">${hostName}</span>
            <span id="headerTournBadge" class="badge badge-active">
              <span class="pulse-dot"></span> <span id="headerStatusText">درحال بررسی...</span>
            </span>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <div class="server-time-box">
          🕒 ساعت رسمی سرور: <span id="clockDisplay">--:--:--</span>
        </div>
        <div id="userBadgeArea" style="display: none;">
          <span class="badge badge-domain">مدیر: <span id="adminUsernameDisplay">admin</span></span>
          <button class="btn btn-outline btn-sm" onclick="handleLogout()">خروج</button>
        </div>
      </div>
    </div>
  </header>

  <main class="container">

    <!-- LOGIN FORM (Shown when unauthenticated) -->
    <div id="loginView" class="login-wrapper">
      <div class="login-card">
        <div class="login-brand">🛡️</div>
        <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 8px;">ورود به مدیریت کلمه‌ت</h2>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px;">
          برای دسترسی به تنظیمات مسابقات آنلاین و اعمال تغییرات سراسری، وارد شوید.
        </p>

        <div style="background: rgba(212, 154, 55, 0.12); border: 1px solid rgba(212, 154, 55, 0.35); border-radius: 10px; padding: 14px; margin-bottom: 20px; text-align: right;">
          <div style="font-weight: 700; font-size: 13px; color: var(--primary); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>🔑</span> اطلاعات ورود پیش‌فرض مدیر:
          </div>
          <div style="font-size: 12.5px; color: var(--text-muted); line-height: 1.8;">
            <div>• نام کاربری: <strong style="color: var(--text-main); font-family: monospace;">admin</strong></div>
            <div>• رمز عبور: <strong style="color: var(--text-main); font-family: monospace;">adminPassword123!</strong> (یا <strong style="color: var(--text-main); font-family: monospace;">KalametAdmin@2026!</strong>)</div>
          </div>
          <button type="button" onclick="autoFillAndLogin()" class="btn btn-secondary" style="width: 100%; margin-top: 10px; font-size: 12.5px; padding: 7px 12px; gap: 6px; border-color: rgba(212, 154, 55, 0.5);">
            ⚡ ورود خودکار به پنل (تک‌کلیک)
          </button>
        </div>

        <form id="adminLoginForm" onsubmit="handleLogin(event)" style="display: flex; flex-direction: column; gap: 16px;">
          <div class="form-group" style="text-align: right;">
            <label class="form-label">نام کاربری مدیر</label>
            <input type="text" id="loginUser" class="form-control" value="admin" required dir="ltr">
          </div>
          <div class="form-group" style="text-align: right;">
            <label class="form-label">رمز عبور امن</label>
            <input type="password" id="loginPass" class="form-control" value="adminPassword123!" required dir="ltr">
          </div>

          <div id="loginError" style="display: none; color: #f87171; font-size: 12.5px; background: rgba(239, 68, 68, 0.1); padding: 10px; border-radius: 8px; border: 1px solid rgba(239, 68, 68, 0.3);"></div>

          <button type="submit" class="btn btn-primary" style="margin-top: 8px;">
            🔐 ورود به پنل مدیریت
          </button>
        </form>
      </div>
    </div>

    <!-- MAIN DASHBOARD (Shown when authenticated) -->
    <div id="dashboardView" style="display: none;">

      <!-- KPI Status Cards -->
      <div class="grid-kpi">
        <div class="kpi-card">
          <div class="kpi-icon">🏁</div>
          <div>
            <div class="kpi-label">وضعیت دوره فعلی</div>
            <div class="kpi-val" id="kpiStatus">--</div>
            <div class="kpi-sub" id="kpiId">--</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">⏳</div>
          <div>
            <div class="kpi-label">زمان باقیمانده (ساعت سرور)</div>
            <div class="kpi-val" id="kpiTimer" style="color: var(--gold-light);">--:--:--</div>
            <div class="kpi-sub" id="kpiDaysDetail">محاسبه برخط</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">🪙</div>
          <div>
            <div class="kpi-label">هزینه ورودی مسابقه</div>
            <div class="kpi-val" id="kpiEntryCost">۲ سکه</div>
            <div class="kpi-sub">تغییر فوری در اپ بدون نیاز به آپدیت</div>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">👥</div>
          <div>
            <div class="kpi-label">کاربران متصل و شرکت‌کنندگان</div>
            <div class="kpi-val" id="kpiParticipants">--</div>
            <div class="kpi-sub" id="kpiActiveConn">۰ اتصال فعال در سرور</div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="nav-tabs">
        <button class="nav-tab active" onclick="switchTab('tab-actions')">⚡ عملیات و مسابقات</button>
        <button class="nav-tab" onclick="switchTab('tab-leads')">📞 لیست تماس و ثبت‌نامی‌ها (<span id="leadsCountBadge">۰</span>)</button>
        <button class="nav-tab" onclick="switchTab('tab-broadcast')">📢 اعلان سراسری به کاربران</button>
        <button class="nav-tab" onclick="switchTab('tab-economy')">💰 اقتصاد بازی و راهنما</button>
        <button class="nav-tab" onclick="switchTab('tab-levels')">🎮 مراحل آنلاین</button>
        <button class="nav-tab" onclick="switchTab('tab-settings')">⚙️ جوایز و دوره مسابقه</button>
        <button class="nav-tab" onclick="switchTab('tab-leaderboard')">🏆 رده‌بندی زنده</button>
        <button class="nav-tab" onclick="switchTab('tab-audit')">📜 تاریخچه لاگ‌ها</button>
      </div>

      <!-- TAB 1: QUICK ACTIONS & TOURNAMENT LIFECYCLE -->
      <div id="tab-actions" class="tab-pane active">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>⚡</span> کنترل چرخه مسابقه (شروع، تمدید، پایان و استراحت)
            </div>
            <button class="btn btn-outline btn-sm" onclick="fetchDashboardData()">
              🔄 بروزرسانی زنده
            </button>
          </div>

          <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.6;">
            دستورات زیر بلافاصله در دیتابیس سرور ذخیره شده و از طریق وب‌سوکت به تمام بازیکنان آنلاین مخابره می‌شود.
            هر عمل دارای پنجره تایید نهایی است تا از تغییرات تصادفی جلوگیری شود.
          </p>

          <div class="actions-toolbar">
            <!-- Start / New Tournament -->
            <button class="btn btn-success" onclick="confirmAction('start', 'شروع دوره جدید مسابقه', 'آیا از شروع یک دوره جدید مسابقه با دوره ۳۰ روزه و هزینه مشخص‌شده اطمینان دارید؟')">
              🚀 شروع دوره جدید
            </button>

            <!-- Extend 7 Days -->
            <button class="btn btn-primary" onclick="confirmAction('extend_7', 'تمدید مسابقه به مدت ۷ روز', 'با این کار دقیقاً ۷ روز به مهلت پایان مسابقه فعلی اضافه خواهد شد و امتیازات بازیکنان حفظ می‌شود.')">
              ⏰ تمدید ۷ روزه
            </button>

            <!-- Extend Custom Days -->
            <button class="btn btn-warning" onclick="promptCustomExtend()">
              ⏳ تمدید با روز دلخواه...
            </button>

            <!-- Close / Rest Period -->
            <button class="btn btn-outline" onclick="confirmAction('close', 'بستن مسابقه (دوره استراحت ۲۴ ساعته)', 'آیا مایلید مسابقه را وارد فاز اهدای جوایز و استراحت ۲۴ ساعته کنید؟ در این حالت ورود به بازی موقتاً بسته می‌شود.')">
              🔒 بستن مسابقه (فاز استراحت ۲۴ ساعته)
            </button>

            <!-- Reopen -->
            <button class="btn btn-outline" onclick="confirmAction('reopen', 'بازگشایی مجدد مسابقه', 'آیا مایلید وضعیت مسابقه را مجدداً به ACTIVE تغییر دهید؟')">
              🔓 بازگشایی مجدد مسابقه
            </button>

            <!-- End Tournament -->
            <button class="btn btn-danger" onclick="confirmAction('end', 'پایان فوری مسابقه', '⚠️ هشدار: آیا مطمئن هستید که می‌خواهید مسابقه فعلی را در همین لحظه به پایان برسانید؟ زمان باقیمانده به صفر تغییر خواهد کرد.')">
              🏁 پایان فوری مسابقه
            </button>

            <!-- Next Season -->
            <button class="btn btn-outline" onclick="confirmAction('start_next', 'آغاز فصل بعدی مسابقات', 'یک شناسه فصل جدید ثبت شده و شمارش ۳۰ روزه از نو آغاز می‌شود.')">
              🔄 آغاز فصل بعدی
            </button>
          </div>
        </div>

        <!-- Schedule & Autoritative Info Box -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>🕒</span> زمان‌بندی قطعی و مستقل سمت سرور (Server Authoritative)
            </div>
          </div>
          <div style="font-size: 13.5px; line-height: 1.8; color: var(--text-muted);">
            <p>✅ <strong>قانون ساعت جهانی:</strong> محاسبه زمان اتمام مسابقه بر اساس ساعت قطعی و میلی‌ثانیه‌ای سرور انجام می‌پذیرد. ساعت و تاریخ گوشی بازیکن هیچ اثری روی زمانبندی مسابقات ندارد.</p>
            <p>✅ <strong>بدون نیاز به آپدیت APK:</strong> با تغییر هر یک از موارد (مانند جوایز، عنوان یا روزها)، اطلاعات جدید فوراً روی سرور ذخیره شده و از طریق API در اختیار اپلیکیشن قرار می‌گیرد.</p>
            <p>✅ <strong>چرخه پیش‌فرض خودکار:</strong> ۳۰ روز رقابت فعال (ACTIVE) ⬅️ ۲۴ ساعت استراحت و اهدای جوایز (CLOSED) ⬅️ آغاز خودکار دوره بعدی.</p>
          </div>
        </div>
      </div>

      <!-- TAB: BROADCAST & LIVE ANNOUNCEMENT -->
      <div id="tab-broadcast" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>📢</span> پخش پیام و اعلان سراسری به تمام بازیکنان آنلاین
            </div>
            <button class="btn btn-primary btn-sm" onclick="sendLiveBroadcast()">
              ⚡ ارسال و نمایش فوری در اپلیکیشن
            </button>
          </div>

          <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.6;">
            با ثبت پیام در این بخش، متن اعلان به‌صورت زنده از طریق وب‌سوکت به صفحه اصلی بازی تمام کاربران در سراسر دنیا ارسال شده و در بنر بالای بازی به نمایش درمی‌آید.
          </p>

          <form id="broadcastForm" onsubmit="event.preventDefault(); sendLiveBroadcast();">
            <div class="form-group" style="margin-bottom: 16px;">
              <label class="form-label">متن پیام اعلان سراسری</label>
              <textarea id="broadcastMessage" class="form-control" rows="3" placeholder="مثال: 🎉 مسابقات عیدانه آغاز شد! به ازای هر مرحله ۲۰ سکه هدیه بگیرید!"></textarea>
            </div>

            <div class="form-grid" style="margin-bottom: 20px;">
              <div class="form-group">
                <label class="form-label">نوع نمایش پیام</label>
                <select id="broadcastType" class="form-control">
                  <option value="INFO">📢 پیام اطلاع‌رسانی (رنگ آبی)</option>
                  <option value="ALERT">⚠️ پیام هشدار یا فوری (رنگ قرمز)</option>
                  <option value="EVENT">🎁 رویداد ویژه و پاداش (رنگ طلایی)</option>
                </select>
              </div>

              <div class="form-group" style="display: flex; align-items: flex-end;">
                <button type="button" class="btn btn-outline" style="width: 100%;" onclick="clearLiveBroadcast()">
                  🗑️ حذف و خاموش کردن بنر اعلان
                </button>
              </div>
            </div>

            <div style="background: rgba(212, 154, 55, 0.1); border: 1px solid var(--card-border); border-radius: 12px; padding: 16px;">
              <div style="font-weight: 700; font-size: 13px; color: var(--primary); margin-bottom: 6px;">
                👁️ پیش‌نمایش بنر در صفحه اصلی بازی:
              </div>
              <div id="bannerPreviewBox" style="background: #1976D2; color: #fff; padding: 10px 14px; border-radius: 10px; font-weight: bold; text-align: center; font-size: 13px;">
                📢 در حال بارگذاری اعلان فعال...
              </div>
            </div>

            <div style="margin-top: 24px; display: flex; justify-content: flex-end; gap: 12px;">
              <button type="submit" class="btn btn-primary">
                🚀 پخش زنده پیام برای تمام بازیکنان
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- TAB: GAME ECONOMY & COSTS -->
      <div id="tab-economy" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>💰</span> تنظیمات اقتصادی بازی، هزینه‌ها و حالت نگهداری
            </div>
            <button class="btn btn-primary btn-sm" onclick="saveEconomySettings()">
              💾 ذخیره تنظیمات اقتصادی
            </button>
          </div>

          <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.6;">
            این مقادیر در کسری از ثانیه در اپلیکیشن کلیه کاربران اعمال می‌شوند و هزینه دکمه‌های راهنما، جوایز تبلیغات و ضرایب بازی را در لحظه تغییر می‌دهند.
          </p>

          <form id="economyForm" onsubmit="event.preventDefault(); saveEconomySettings();">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">هزینه راهنمای کلمات (سکه)</label>
                <input type="number" id="ecoHintCost" class="form-control" min="1" max="1000" value="20">
              </div>

              <div class="form-group">
                <label class="form-label">هزینه مخلوط کردن حروف (سکه)</label>
                <input type="number" id="ecoShuffleCost" class="form-control" min="0" max="1000" value="10">
              </div>

              <div class="form-group">
                <label class="form-label">پاداش تماشای هر تبلیغ ویدیویی (سکه)</label>
                <input type="number" id="ecoAdReward" class="form-control" min="1" max="500" value="2">
              </div>

              <div class="form-group">
                <label class="form-label">پاداش چالش ۲۰ تبلیغ نامحدود (سکه)</label>
                <input type="number" id="ecoAdBonus" class="form-control" min="1" max="10000" value="50">
              </div>

              <div class="form-group">
                <label class="form-label">ضریب جوایز گردونه و روزانه</label>
                <input type="number" id="ecoDailyMultiplier" class="form-control" min="0.5" max="10" step="0.1" value="1.0">
              </div>

              <div class="form-group">
                <label class="form-label">وضعیت سرور و حالت نگهداری (Maintenance)</label>
                <select id="ecoMaintenance" class="form-control">
                  <option value="false">🟢 فعال و در دسترس همه (Normal)</option>
                  <option value="true">🔴 حالت نگهداری و تعمیرات سرور (Maintenance)</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-top: 16px;">
              <label class="form-label">پیام حالت تعمیرات و نگهداری (در صورت فعال بودن)</label>
              <input type="text" id="ecoMaintenanceMsg" class="form-control" placeholder="سرور بازی در حال به‌روزرسانی و ارتقا می‌باشد. لطفا دقایقی دیگر مجدداً تلاش نمایید.">
            </div>

            <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
              <button type="submit" class="btn btn-primary">
                💾 اعمال و انتشار تنظیمات اقتصادی
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- TAB: ONLINE LEVELS PACKS -->
      <div id="tab-levels" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>🎮</span> مدیریت بسته‌های مراحل آنلاین (Online Level Packs)
            </div>
            <button class="btn btn-outline btn-sm" onclick="fetchLevelsData()">
              🔄 بازخوانی مراحل سرور
            </button>
          </div>

          <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.6;">
            مراحل ذخیره شده در سرور به‌صورت خودکار توسط کلاینت‌های بازی دانلود و نصب می‌شوند بدون اینکه کاربر نیازی به آپدیت کردن برنامه از بازار یا گوگل‌پلی داشته باشد.
          </p>

          <div class="grid-kpi" style="margin-bottom: 20px;">
            <div class="kpi-card">
              <div class="kpi-icon">📦</div>
              <div>
                <div class="kpi-label">نسخه بسته مراحل در سرور</div>
                <div class="kpi-val" id="levelsPackVersionVal">نسخه ۱</div>
                <div class="kpi-sub">با هر آپدیت یک شماره افزایش می‌یابد</div>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-icon">🎯</div>
              <div>
                <div class="kpi-label">تعداد کل مراحل فعال سرور</div>
                <div class="kpi-val" id="levelsTotalCountVal">۰ مرحله</div>
                <div class="kpi-sub">آماده همگام‌سازی با گوشی‌ها</div>
              </div>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 16px;">
            <label class="form-label">محتوای بسته مراحل (قالب استاندارد JSON آرایه مراحل)</label>
            <textarea id="levelsJsonEditor" class="form-control" rows="10" dir="ltr" style="font-family: monospace; font-size: 12px;" placeholder='[{"id": 1, "letters": ["س", "ل", "ا", "م"], "words": ["سلام", "مال", "لمس"]}]'></textarea>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: gap: 12px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="loadSampleLevels()">
              📋 درج قالب نمونه مراحل
            </button>
            <button type="button" class="btn btn-primary" onclick="saveLevelsPack()">
              🚀 ذخیره و انتشار بسته مراحل به همه کاربران
            </button>
          </div>
        </div>
      </div>

      <!-- TAB 2: SETTINGS & PRIZES CONFIGURATION -->
      <div id="tab-settings" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>⚙️</span> ویرایش مشخصات مسابقه، هزینه‌ها و جوایز
            </div>
            <button class="btn btn-primary btn-sm" onclick="saveTournamentSettings()">
              💾 ذخیره تغییرات در سرور
            </button>
          </div>

          <form id="settingsForm" onsubmit="event.preventDefault(); saveTournamentSettings();">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">شناسه یکتای مسابقه (Tournament ID)</label>
                <input type="text" id="settingId" class="form-control" dir="ltr">
              </div>

              <div class="form-group">
                <label class="form-label">عنوان و نام مسابقه (نمایش در اپ)</label>
                <input type="text" id="settingTitle" class="form-control" placeholder="🏆 رقابت ماهانه سراسری">
              </div>

              <div class="form-group">
                <label class="form-label">وضعیت دوره (Status)</label>
                <select id="settingStatus" class="form-control">
                  <option value="ACTIVE">ACTIVE (در حال رقابت و ثبت امتیاز)</option>
                  <option value="CLOSED">CLOSED (پایان یافته - در حال محاسبه جوایز)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">هزینه ورودی هر بازی (سکه)</label>
                <input type="number" id="settingEntryCost" class="form-control" min="0" max="1000" value="2">
              </div>

              <div class="form-group">
                <label class="form-label">طول دوره پیش‌فرض (روز)</label>
                <input type="number" id="settingDurationDays" class="form-control" min="1" max="365" value="30">
              </div>

              <div class="form-group">
                <label class="form-label">مهلت استراحت و بستن مسابقه (ساعت)</label>
                <input type="number" id="settingClosureHours" class="form-control" min="1" max="168" value="24">
              </div>

              <div class="form-group">
                <label class="form-label">تعداد شرکت‌کنندگان نمایشی در کارت</label>
                <input type="number" id="settingParticipants" class="form-control" min="1" value="1840">
              </div>

              <div class="form-group">
                <label class="form-label">تاریخ و زمان شروع مسابقه</label>
                <input type="datetime-local" id="settingStartTime" class="form-control" dir="ltr">
              </div>

              <div class="form-group">
                <label class="form-label">تاریخ و زمان پایان مسابقه</label>
                <input type="datetime-local" id="settingEndTime" class="form-control" dir="ltr">
              </div>
            </div>

            <!-- Prizes Section -->
            <div style="margin-top: 24px;">
              <h3 style="font-size: 15px; font-weight: 700; margin-bottom: 12px;">🎁 جوایز برندگان مسابقه</h3>
              <div class="prizes-grid">
                <div class="prize-box">
                  <div class="prize-medal">🥇</div>
                  <div class="prize-inputs">
                    <label class="form-label">جایزه نفر اول</label>
                    <input type="text" id="prize1" class="form-control" placeholder="ایرپاد">
                  </div>
                </div>

                <div class="prize-box">
                  <div class="prize-medal">🥈</div>
                  <div class="prize-inputs">
                    <label class="form-label">جایزه نفر دوم</label>
                    <input type="text" id="prize2" class="form-control" placeholder="۵۰۰ سکه">
                  </div>
                </div>

                <div class="prize-box">
                  <div class="prize-medal">🥉</div>
                  <div class="prize-inputs">
                    <label class="form-label">جایزه نفر سوم</label>
                    <input type="text" id="prize3" class="form-control" placeholder="۲۰۰ سکه">
                  </div>
                </div>
              </div>
            </div>

            <div style="margin-top: 24px; display: flex; justify-content: flex-end;">
              <button type="submit" class="btn btn-primary">
                💾 ثبت و ذخیره پایدار در دیتابیس
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- TAB 3: LEADERBOARD -->
      <div id="tab-leaderboard" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>🏆</span> جدول زنده رده‌بندی بازیکنان
            </div>
            <button class="btn btn-outline btn-sm" onclick="fetchDashboardData()">
              🔄 بروزرسانی جدول
            </button>
          </div>

          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style="width: 70px;">رتبه</th>
                  <th>نام بازیکن</th>
                  <th>امتیاز ماهانه</th>
                  <th>ریتینگ (Elo)</th>
                  <th>برد / باخت / مساوی</th>
                </tr>
              </thead>
              <tbody id="leaderboardTbody">
                <tr>
                  <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 24px;">درحال بارگذاری رده‌بندی...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB: PLAYER LEADS & PHONE REGISTRATIONS -->
      <div id="tab-leads" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>📞</span> مشخصات و شماره تماس بازیکنان ثبت‌نامی (ارسال خودکار به ایمیل: y08480561@gmail.com)
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-outline btn-sm" onclick="exportLeadsCsv()">
                📥 خروجی اکسل / CSV
              </button>
              <button class="btn btn-outline btn-sm" onclick="fetchDashboardData()">
                🔄 بروزرسانی لیست
              </button>
            </div>
          </div>

          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; font-size: 13px; color: var(--text-muted); display: flex; align-items: center; justify-content: space-between;">
            <div>
              📧 <strong>ارسال لحظه‌ای:</strong> هر کاربری در بازی نام و شماره موبایل خود را ثبت کند، فوراً در این جدول نمایش داده شده و مشخصات آن به ایمیل <strong>y08480561@gmail.com</strong> ارسال می‌شود.
            </div>
            <div style="font-weight: 700; color: var(--success);" id="leadsCountText">
              ۰ بازیکن ثبت شده
            </div>
          </div>

          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th style="width: 50px;">#</th>
                  <th>نام و نام خانوادگی</th>
                  <th>شماره همراه / تماس</th>
                  <th>شناسه دستگاه</th>
                  <th>تاریخ و ساعت ثبت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody id="leadsTbody">
                <tr>
                  <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">درحال بارگذاری شماره تماس‌ها...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB 4: AUDIT LOG -->
      <div id="tab-audit" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>📜</span> تاریخچه اقدامات مدیران (Audit Log)
            </div>
            <button class="btn btn-outline btn-sm" onclick="fetchDashboardData()">
              🔄 بروزرسانی لاگ‌ها
            </button>
          </div>

          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>زمان دقیق</th>
                  <th>مدیر</th>
                  <th>نوع اقدام</th>
                  <th>مقدار قبلی</th>
                  <th>مقدار جدید</th>
                  <th>توضیحات</th>
                </tr>
              </thead>
              <tbody id="auditTbody">
                <tr>
                  <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">درحال بارگذاری تاریخچه اقدامات...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </main>

  <!-- CONFIRMATION MODAL -->
  <div id="confirmModal" class="modal-overlay">
    <div class="modal">
      <div class="modal-icon" id="modalIcon">⚠️</div>
      <div class="modal-title" id="modalTitle">تایید اقدام مدیریتی</div>
      <div class="modal-desc" id="modalDesc">آیا از انجام این عملیات اطمینان دارید؟</div>
      <div class="modal-actions">
        <button class="btn btn-primary" id="modalConfirmBtn">بله، انجام شود</button>
        <button class="btn btn-outline" onclick="closeModal()">انصراف</button>
      </div>
    </div>
  </div>

  <!-- TOAST NOTIFICATION -->
  <div id="toast" class="toast">
    <span id="toastIcon">✅</span>
    <span id="toastMsg">عملیات با موفقیت انجام شد</span>
  </div>

  <script>
    // State
    let currentTournamentState = null;
    let countdownInterval = null;
    let clockInterval = null;
    let serverTimeOffsetMs = 0;
    let pendingAction = null;

    // Toast
    function showToast(msg, icon = "✅") {
      const toast = document.getElementById('toast');
      document.getElementById('toastMsg').innerText = msg;
      document.getElementById('toastIcon').innerText = icon;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3500);
    }

    // Modal
    function openModal(title, desc, onConfirm, icon = "⚠️") {
      document.getElementById('modalTitle').innerText = title;
      document.getElementById('modalDesc').innerText = desc;
      document.getElementById('modalIcon').innerText = icon;
      const btn = document.getElementById('modalConfirmBtn');
      btn.onclick = () => {
        closeModal();
        if (typeof onConfirm === 'function') onConfirm();
      };
      document.getElementById('confirmModal').classList.add('active');
    }
    function closeModal() {
      document.getElementById('confirmModal').classList.remove('active');
    }

    // Tabs
    function switchTab(tabId) {
      document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

      const targetPane = document.getElementById(tabId);
      if (targetPane) targetPane.classList.add('active');

      const btn = Array.from(document.querySelectorAll('.nav-tab')).find(b => b.getAttribute('onclick').includes(tabId));
      if (btn) btn.classList.add('active');
    }

    // Auth & Token management
    function getToken() {
      return localStorage.getItem('kalamet_admin_token');
    }
    function setToken(token) {
      localStorage.setItem('kalamet_admin_token', token);
    }
    function removeToken() {
      localStorage.removeItem('kalamet_admin_token');
    }

    // API fetch wrapper with Bearer token
    async function apiRequest(url, options = {}) {
      options.headers = options.headers || {};
      const token = getToken();
      if (token) {
        options.headers['Authorization'] = 'Bearer ' + token;
      }
      options.headers['Content-Type'] = 'application/json';

      const res = await fetch(url, options);
      if (res.status === 401) {
        removeToken();
        showLoginView();
        throw new Error('Unauthorized');
      }
      return res.json();
    }

    // Check Auth on load
    async function checkAuth() {
      try {
        const data = await apiRequest('/admin/api/me');
        if (data && data.authenticated) {
          showDashboardView(data.username);
          fetchDashboardData();
        } else {
          showLoginView();
        }
      } catch (err) {
        showLoginView();
      }
    }

    function showLoginView() {
      document.getElementById('loginView').style.display = 'flex';
      document.getElementById('dashboardView').style.display = 'none';
      document.getElementById('userBadgeArea').style.display = 'none';
    }

    function showDashboardView(username) {
      document.getElementById('loginView').style.display = 'none';
      document.getElementById('dashboardView').style.display = 'block';
      document.getElementById('userBadgeArea').style.display = 'flex';
      document.getElementById('adminUsernameDisplay').innerText = username || 'admin';
    }

    function autoFillAndLogin() {
      document.getElementById('loginUser').value = 'admin';
      document.getElementById('loginPass').value = 'adminPassword123!';
      const evt = new Event('submit', { cancelable: true });
      handleLogin(evt);
    }

    async function handleLogin(e) {
      e.preventDefault();
      const user = document.getElementById('loginUser').value.trim();
      const pass = document.getElementById('loginPass').value;
      const errBox = document.getElementById('loginError');
      errBox.style.display = 'none';

      try {
        const res = await fetch('/admin/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user, password: pass })
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setToken(data.token);
          showToast('با موفقیت وارد شدید', '🔓');
          showDashboardView(data.username);
          fetchDashboardData();
        } else {
          errBox.style.display = 'block';
          errBox.innerText = data.error || 'نام کاربری یا رمز عبور نامعتبر است!';
        }
      } catch (err) {
        errBox.style.display = 'block';
        errBox.innerText = 'خطا در برقراری ارتباط با سرور.';
      }
    }

    async function handleLogout() {
      try {
        await apiRequest('/admin/api/logout', { method: 'POST' });
      } catch (_) {}
      removeToken();
      showToast('از حساب کاربری خارج شدید', '👋');
      showLoginView();
    }

    // Load Dashboard Data
    async function fetchDashboardData() {
      try {
        const data = await apiRequest('/admin/api/dashboard');
        if (!data || !data.tournament) return;

        currentTournamentState = data.tournament;
        serverTimeOffsetMs = (data.tournament.serverTimestamp || Date.now()) - Date.now();

        renderKpis(data);
        renderSettingsForm(data.tournament);
        renderLeaderboard(data.leaderboard || []);
        renderAuditLog(data.auditLogs || []);
        renderLeads(data.leads || []);

        startCountdownTimer();
        fetchGameConfig();
        fetchLevelsData();
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    }

    function renderKpis(data) {
      const t = data.tournament;
      const isActive = t.status === 'ACTIVE';

      const statusEl = document.getElementById('kpiStatus');
      const headerStatus = document.getElementById('headerStatusText');
      const headerBadge = document.getElementById('headerTournBadge');

      if (isActive) {
        statusEl.innerHTML = '<span style="color: var(--success)">فعال (ACTIVE)</span>';
        headerStatus.innerText = 'مسابقه فعال است';
        headerBadge.className = 'badge badge-active';
      } else {
        statusEl.innerHTML = '<span style="color: var(--danger)">بسته (CLOSED)</span>';
        headerStatus.innerText = 'مسابقه پایان یافته';
        headerBadge.className = 'badge badge-closed';
      }

      document.getElementById('kpiId').innerText = t.tournamentId || 'tourn_season_1';
      document.getElementById('kpiEntryCost').innerText = (t.entryCost || 2) + ' سکه';
      document.getElementById('kpiParticipants').innerText = (t.totalParticipants || 1840).toLocaleString('fa-IR') + ' نفر';

      if (data.stats) {
        document.getElementById('kpiActiveConn').innerText = data.stats.activeConnections + ' اتصال زنده سرور | ' + data.stats.activeMatches + ' مسابقه فعال';
      }
    }

    function renderSettingsForm(t) {
      document.getElementById('settingId').value = t.tournamentId || '';
      document.getElementById('settingTitle').value = t.monthName || '';
      document.getElementById('settingStatus').value = t.status || 'ACTIVE';
      document.getElementById('settingEntryCost').value = t.entryCost || 2;
      document.getElementById('settingDurationDays').value = t.durationDays || 30;
      document.getElementById('settingClosureHours').value = t.closureHours || 24;
      document.getElementById('settingParticipants').value = t.totalParticipants || 1840;

      if (t.startTimestamp) {
        document.getElementById('settingStartTime').value = new Date(t.startTimestamp).toISOString().slice(0, 16);
      }
      if (t.endTimestamp) {
        document.getElementById('settingEndTime').value = new Date(t.endTimestamp).toISOString().slice(0, 16);
      }

      if (t.rewards) {
        document.getElementById('prize1').value = t.rewards.firstPlace || 'ایرپاد';
        document.getElementById('prize2').value = t.rewards.secondPlace || '۵۰۰ سکه';
        document.getElementById('prize3').value = t.rewards.thirdPlace || '۲۰۰ سکه';
      }
    }

    function renderLeaderboard(list) {
      const tbody = document.getElementById('leaderboardTbody');
      if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">رکوردی ثبت نشده است.</td></tr>';
        return;
      }

      let html = '';
      list.forEach((item, idx) => {
        let rankClass = 'rank-normal';
        let medal = idx + 1;
        if (idx === 0) { rankClass = 'rank-1'; medal = '🥇'; }
        else if (idx === 1) { rankClass = 'rank-2'; medal = '🥈'; }
        else if (idx === 2) { rankClass = 'rank-3'; medal = '🥉'; }

        html += \`
          <tr>
            <td><span class="rank-badge \${rankClass}">\${medal}</span></td>
            <td><strong>\${escapeHtml(item.username)}</strong></td>
            <td style="color: var(--gold-light); font-weight: 700;">\${(item.monthlyScore || 0).toLocaleString('fa-IR')}</td>
            <td>\${item.rating || 1000}</td>
            <td style="font-size: 12px; color: var(--text-muted);">
              \${item.wins || 0} برد / \${item.losses || 0} باخت / \${item.draws || 0} تساوی
            </td>
          </tr>
        \`;
      });
      tbody.innerHTML = html;
    }

    function renderAuditLog(logs) {
      const tbody = document.getElementById('auditTbody');
      if (!logs || logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--text-muted);">هنوز هیچ اقدامی ثبت نشده است.</td></tr>';
        return;
      }

      let html = '';
      logs.forEach(item => {
        html += \`
          <tr>
            <td style="direction: ltr; font-family: monospace; font-size: 11px;">\${item.dateString || '-'}</td>
            <td><strong>\${escapeHtml(item.admin)}</strong></td>
            <td><span class="badge badge-domain">\${escapeHtml(item.action)}</span></td>
            <td style="font-size: 12px; color: var(--text-muted); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${escapeHtml(item.previousValue)}</td>
            <td style="font-size: 12px; color: var(--gold-light); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\${escapeHtml(item.newValue)}</td>
            <td style="font-size: 12px; color: var(--text-muted);">\${escapeHtml(item.details)}</td>
          </tr>
        \`;
      });
      tbody.innerHTML = html;
    }

    let currentLeadsData = [];
    function renderLeads(leads) {
      currentLeadsData = leads || [];
      const countEl = document.getElementById('leadsCountBadge');
      const textEl = document.getElementById('leadsCountText');
      const tbody = document.getElementById('leadsTbody');

      if (countEl) countEl.innerText = (currentLeadsData.length || 0).toLocaleString('fa-IR');
      if (textEl) textEl.innerText = (currentLeadsData.length || 0).toLocaleString('fa-IR') + ' بازیکن ثبت شده';

      if (!leads || leads.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--text-muted);">هنوز هیچ شماره تماسی ثبت نشده است. به محض اینکه بازیکنی شماره خود را در بازی وارد کند در اینجا نمایش داده می‌شود.</td></tr>';
        return;
      }

      let html = '';
      leads.forEach((item, idx) => {
        const phone = escapeHtml(item.phone || item.phoneNumber || '');
        const name = escapeHtml(item.name || item.username || 'بی‌نام');
        const device = escapeHtml(item.deviceId || '-');
        const timeStr = item.dateString || (item.timestamp ? new Date(item.timestamp).toLocaleString('fa-IR') : '-');

        html += \`
          <tr>
            <td>\${idx + 1}</td>
            <td><strong style="color: var(--gold-light);">\${name}</strong></td>
            <td style="direction: ltr; font-family: monospace; font-weight: 700; font-size: 14px; color: var(--success);">
              <a href="tel:\${phone}" style="color: inherit; text-decoration: none;">\${phone}</a>
            </td>
            <td style="direction: ltr; font-family: monospace; font-size: 11px; color: var(--text-muted);">\${device}</td>
            <td style="font-size: 12px; color: var(--text-muted);">\${timeStr}</td>
            <td>
              <a href="tel:\${phone}" class="btn btn-sm btn-primary" style="padding: 4px 10px; font-size: 11px;">📞 تماس</a>
            </td>
          </tr>
        \`;
      });
      tbody.innerHTML = html;
    }

    function exportLeadsCsv() {
      if (!currentLeadsData || currentLeadsData.length === 0) {
        showToast('لیست شماره‌ها خالی است', 'ℹ️');
        return;
      }
      let csv = 'ردیف,نام,شماره تماس,شناسه دستگاه,تاریخ ثبت\\n';
      currentLeadsData.forEach((item, idx) => {
        const name = (item.name || item.username || '').replace(/,/g, ' ');
        const phone = item.phone || item.phoneNumber || '';
        const dev = item.deviceId || '';
        const date = (item.dateString || '').replace(/,/g, ' ');
        csv += \`\${idx + 1},\${name},\${phone},\${dev},\${date}\\n\`;
      });

      const blob = new Blob(['\\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`kalamet_leads_\${Date.now()}.csv\`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('فایل اکسل با موفقیت دانلود شد', '📥');
    }

    // Countdown Timer logic (Authoritative Server Clock)
    function startCountdownTimer() {
      if (countdownInterval) clearInterval(countdownInterval);

      countdownInterval = setInterval(() => {
        if (!currentTournamentState) return;

        const now = Date.now() + serverTimeOffsetMs;
        const target = currentTournamentState.status === 'ACTIVE' 
          ? currentTournamentState.endTimestamp 
          : currentTournamentState.closureEndTimestamp;

        const diff = Math.max(0, target - now);
        const secs = Math.floor(diff / 1000);

        const d = Math.floor(secs / (24 * 3600));
        const h = Math.floor((secs % (24 * 3600)) / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = secs % 60;

        const pad = (n) => String(n).padStart(2, '0');
        const timerEl = document.getElementById('kpiTimer');
        const detailEl = document.getElementById('kpiDaysDetail');

        timerEl.innerText = \`\${d} روز و \${pad(h)}:\${pad(m)}:\${pad(s)}\`;
        detailEl.innerText = currentTournamentState.status === 'ACTIVE' ? 'تا پایان دوره رقابت' : 'تا آغاز دوره بعدی (فاز استراحت)';
      }, 1000);
    }

    // Live Server Clock
    function startLiveClock() {
      if (clockInterval) clearInterval(clockInterval);
      clockInterval = setInterval(() => {
        const now = new Date(Date.now() + serverTimeOffsetMs);
        document.getElementById('clockDisplay').innerText = now.toTimeString().split(' ')[0];
      }, 1000);
    }

    // Quick Actions
    function confirmAction(actionType, title, desc) {
      openModal(title, desc, async () => {
        try {
          const res = await apiRequest('/admin/api/tournament/action', {
            method: 'POST',
            body: JSON.stringify({ action: actionType })
          });
          if (res.success) {
            showToast('عملیات با موفقیت در سرور اعمال شد!', '🚀');
            fetchDashboardData();
          } else {
            showToast(res.error || 'خطا در اعمال عملیات', '⚠️');
          }
        } catch (err) {
          showToast('خطا در برقراری ارتباط با سرور', '❌');
        }
      });
    }

    function promptCustomExtend() {
      const daysStr = prompt("تعداد روز تمدید مسابقه را وارد نمایید (مثلاً: 3 یا 14):", "7");
      if (!daysStr) return;
      const days = parseInt(daysStr, 10);
      if (isNaN(days) || days <= 0) {
        alert("لطفاً یک عدد معتبر بزرگتر از صفر وارد کنید.");
        return;
      }

      openModal(
        \`تمدید مسابقه به مدت \${days} روز\`,
        \`با این اقدام، \${days} روز به مهلت پایان مسابقه اضافه می‌شود و تاریخ جدید بلافاصله برای همه اعمال می‌گردد.\`,
        async () => {
          try {
            const res = await apiRequest('/admin/api/tournament/action', {
              method: 'POST',
              body: JSON.stringify({ action: 'extend_custom', days: days })
            });
            if (res.success) {
              showToast(\`مسابقه با موفقیت \${days} روز تمدید شد!\`, '⏰');
              fetchDashboardData();
            } else {
              showToast(res.error || 'خطا در تمدید', '⚠️');
            }
          } catch (err) {
            showToast('خطا در برقراری ارتباط با سرور', '❌');
          }
        }
      );
    }

    // Save Settings Form
    async function saveTournamentSettings() {
      const payload = {
        tournamentId: document.getElementById('settingId').value.trim(),
        monthName: document.getElementById('settingTitle').value.trim(),
        status: document.getElementById('settingStatus').value,
        entryCost: parseInt(document.getElementById('settingEntryCost').value, 10) || 2,
        durationDays: parseInt(document.getElementById('settingDurationDays').value, 10) || 30,
        closureHours: parseInt(document.getElementById('settingClosureHours').value, 10) || 24,
        totalParticipants: parseInt(document.getElementById('settingParticipants').value, 10) || 1840,
        rewards: {
          firstPlace: document.getElementById('prize1').value.trim() || 'ایرپاد',
          secondPlace: document.getElementById('prize2').value.trim() || '۵۰۰ سکه',
          thirdPlace: document.getElementById('prize3').value.trim() || '۲۰۰ سکه'
        }
      };

      const startInput = document.getElementById('settingStartTime').value;
      if (startInput) {
        payload.startTimestamp = new Date(startInput).getTime();
      }
      const endInput = document.getElementById('settingEndTime').value;
      if (endInput) {
        payload.endTimestamp = new Date(endInput).getTime();
      }

      try {
        const res = await apiRequest('/admin/api/tournament/update', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          showToast('تنظیمات جدید مسابقه با موفقیت در دیتابیس ذخیره و پخش شد!', '💾');
          fetchDashboardData();
        } else {
          showToast(res.error || 'خطا در ذخیره سازی', '⚠️');
        }
      } catch (err) {
        showToast('خطا در برقراری ارتباط با سرور', '❌');
      }
    }

    // -------------------------------------------------------------
    // Live Broadcast & Announcement Functions
    // -------------------------------------------------------------
    async function sendLiveBroadcast() {
      const msg = document.getElementById('broadcastMessage').value.trim();
      const type = document.getElementById('broadcastType').value;
      if (!msg) {
        showToast('لطفاً متن اعلان را وارد نمایید', '⚠️');
        return;
      }

      try {
        const res = await apiRequest('/admin/api/broadcast/announcement', {
          method: 'POST',
          body: JSON.stringify({ message: msg, type: type })
        });
        if (res.success) {
          showToast('اعلان با موفقیت برای کلیه کاربران فعال در اپ پخش شد!', '📢');
          updateBannerPreview(msg, type);
        } else {
          showToast(res.error || 'خطا در ارسال اعلان', '⚠️');
        }
      } catch (err) {
        showToast('خطا در برقراری ارتباط با سرور', '❌');
      }
    }

    async function clearLiveBroadcast() {
      try {
        const res = await apiRequest('/admin/api/config/update', {
          method: 'POST',
          body: JSON.stringify({ announcementBanner: "", announcementType: "INFO" })
        });
        if (res.success) {
          document.getElementById('broadcastMessage').value = '';
          updateBannerPreview('', 'INFO');
          showToast('بنر اعلان غیرفعال شد', '🗑️');
        }
      } catch (err) {
        showToast('خطا در ارتباط با سرور', '❌');
      }
    }

    function updateBannerPreview(msg, type) {
      const box = document.getElementById('bannerPreviewBox');
      if (!msg) {
        box.innerText = 'هیچ اعلانی در حال حاضر فعال نیست (بنر خاموش است)';
        box.style.background = '#374151';
        return;
      }
      const icon = type === 'ALERT' ? '⚠️ ' : (type === 'EVENT' ? '🎁 ' : '📢 ');
      const bg = type === 'ALERT' ? '#D32F2F' : (type === 'EVENT' ? '#B8860B' : '#1976D2');
      box.innerText = icon + msg;
      box.style.background = bg;
    }

    // -------------------------------------------------------------
    // Game Economy Settings
    // -------------------------------------------------------------
    async function fetchGameConfig() {
      try {
        const res = await apiRequest('/admin/api/config');
        if (res && res.config) {
          const c = res.config;
          document.getElementById('ecoHintCost').value = c.hintCostCoins || 20;
          document.getElementById('ecoShuffleCost').value = c.shuffleCostCoins || 10;
          document.getElementById('ecoAdReward').value = c.adRewardCoins || 2;
          document.getElementById('ecoAdBonus').value = c.adChallengeBonusCoins || 50;
          document.getElementById('ecoDailyMultiplier').value = c.dailyBonusMultiplier || 1.0;
          document.getElementById('ecoMaintenance').value = String(Boolean(c.maintenanceMode));
          document.getElementById('ecoMaintenanceMsg').value = c.maintenanceMessage || '';

          if (c.announcementBanner) {
            document.getElementById('broadcastMessage').value = c.announcementBanner;
            document.getElementById('broadcastType').value = c.announcementType || 'INFO';
            updateBannerPreview(c.announcementBanner, c.announcementType || 'INFO');
          } else {
            updateBannerPreview('', 'INFO');
          }
        }
      } catch (err) {
        console.error('Error fetching game config:', err);
      }
    }

    async function saveEconomySettings() {
      const payload = {
        hintCostCoins: parseInt(document.getElementById('ecoHintCost').value, 10) || 20,
        shuffleCostCoins: parseInt(document.getElementById('ecoShuffleCost').value, 10) || 10,
        adRewardCoins: parseInt(document.getElementById('ecoAdReward').value, 10) || 2,
        adChallengeBonusCoins: parseInt(document.getElementById('ecoAdBonus').value, 10) || 50,
        dailyBonusMultiplier: parseFloat(document.getElementById('ecoDailyMultiplier').value) || 1.0,
        maintenanceMode: document.getElementById('ecoMaintenance').value === 'true',
        maintenanceMessage: document.getElementById('ecoMaintenanceMsg').value.trim()
      };

      try {
        const res = await apiRequest('/admin/api/config/update', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          showToast('تنظیمات اقتصادی با موفقیت ذخیره و برای همه کاربران اعمال شد!', '💰');
        } else {
          showToast(res.error || 'خطا در ذخیره‌سازی', '⚠️');
        }
      } catch (err) {
        showToast('خطا در برقراری ارتباط با سرور', '❌');
      }
    }

    // -------------------------------------------------------------
    // Online Levels Pack Functions
    // -------------------------------------------------------------
    async function fetchLevelsData() {
      try {
        const res = await apiRequest('/admin/api/levels');
        if (res && res.levels) {
          document.getElementById('levelsTotalCountVal').innerText = res.count + ' مرحله';
          document.getElementById('levelsJsonEditor').value = JSON.stringify(res.levels, null, 2);
        }
        const cfgRes = await apiRequest('/admin/api/config');
        if (cfgRes && cfgRes.config) {
          document.getElementById('levelsPackVersionVal').innerText = 'نسخه ' + (cfgRes.config.levelsPackVersion || 1);
        }
      } catch (err) {
        console.error('Error fetching levels data:', err);
      }
    }

    async function saveLevelsPack() {
      const raw = document.getElementById('levelsJsonEditor').value.trim();
      let levelsArr;
      try {
        levelsArr = JSON.parse(raw);
        if (!Array.isArray(levelsArr)) {
          throw new Error('محتوای وارد شده باید آرایه‌ای از اشیاء مراحل باشد.');
        }
      } catch (e) {
        showToast('خطا در قالب JSON مراحل: ' + e.message, '⚠️');
        return;
      }

      openModal(
        'انتشار بسته مراحل جدید',
        \`آیا مطمئن هستید که می‌خواهید \${levelsArr.length} مرحله جدید را در سرور ذخیره کرده و به همه گوشی‌های کاربران ارسال کنید؟\`,
        async () => {
          try {
            const res = await apiRequest('/admin/api/levels/update', {
              method: 'POST',
              body: JSON.stringify({ levels: levelsArr })
            });
            if (res.success) {
              showToast(res.message, '🚀');
              fetchLevelsData();
            } else {
              showToast(res.error || 'خطا در ذخیره مراحل', '⚠️');
            }
          } catch (err) {
            showToast('خطا در برقراری ارتباط با سرور', '❌');
          }
        }
      );
    }

    function loadSampleLevels() {
      const sample = [
        { "id": 1, "letters": ["س", "ل", "ا", "م"], "words": ["سلام", "مال", "لمس"] },
        { "id": 2, "letters": ["ب", "ه", "ا", "ر"], "words": ["بهار", "راه", "ابر", "رها"] },
        { "id": 3, "letters": ["د", "ر", "خ", "ت"], "words": ["درخت", "دختر", "رخت", "ترد"] }
      ];
      document.getElementById('levelsJsonEditor').value = JSON.stringify(sample, null, 2);
      showToast('قالب نمونه مراحل درج شد', '📋');
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Init
    startLiveClock();
    checkAuth();
  </script>
</body>
</html>`;
}

module.exports = { getAdminHtml };
