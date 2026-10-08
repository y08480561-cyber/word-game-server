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

        <form id="adminLoginForm" onsubmit="handleLogin(event)" style="display: flex; flex-direction: column; gap: 16px;">
          <div class="form-group" style="text-align: right;">
            <label class="form-label">نام کاربری مدیر (ADMIN_USERNAME)</label>
            <input type="text" id="loginUser" class="form-control" placeholder="نام کاربری مدیریت" autocomplete="username" required dir="ltr">
          </div>
          <div class="form-group" style="text-align: right;">
            <label class="form-label">رمز عبور امن (ADMIN_PASSWORD)</label>
            <input type="password" id="loginPass" class="form-control" placeholder="رمز عبور مدیریت" autocomplete="current-password" required dir="ltr">
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
        <button class="nav-tab" onclick="switchTab('tab-hub-ui')">🎨 ویرایش متون و بخش‌های صفحه مسابقه</button>
        <button class="nav-tab" onclick="switchTab('tab-users')">👥 ویرایش کاربران و سکه‌ها</button>
        <button class="nav-tab" onclick="switchTab('tab-wheel')">🎡 ویرایش گردونه شانس</button>
        <button class="nav-tab" onclick="switchTab('tab-notifications')">🔔 ارسال اعلان و یادآوری بازگشت</button>
        <button class="nav-tab" onclick="switchTab('tab-leads')">📞 لیست تماس و ثبت‌نامی‌ها (<span id="leadsCountBadge">۰</span>)</button>
        <button class="nav-tab" onclick="switchTab('tab-broadcast')">📢 بنر پیام زنده در بازی</button>
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

      <!-- TAB: HUB UI & SCREEN TEXT CUSTOMIZER -->
      <div id="tab-hub-ui" class="tab-pane">
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header">
            <div class="card-title">
              <span>🎨</span> ویرایشگر زنده متن‌ها و بخش‌های صفحه مسابقه (تغییر و حذف واقعی)
            </div>
            <button class="btn btn-primary" onclick="saveHubUiSettings()">
              💾 ذخیره و انتشار آنی روی گوشی تمام کاربران
            </button>
          </div>
          <p style="font-size: 13.5px; color: var(--text-muted); line-height: 1.8; margin-top: 8px;">
            شما می‌توانید تمام متن‌های موجود در تصویر صفحه مسابقه را به دلخواه تغییر دهید یا با برداشتن تیک هر بخش، آن بخش را <strong>به طور کامل حذف یا پنهان</strong> نمایید. پیش‌نمایش سمت چپ به صورت زنده تغییرات شما را نشان می‌دهد.
          </p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start;">
          <!-- Controls Column -->
          <div style="display: flex; flex-direction: column; gap: 16px;">

            <!-- Section 1: Header & Screen Title -->
            <div class="card">
              <div class="card-header" style="margin-bottom: 12px;">
                <div class="card-title" style="font-size: 15px;">
                  <span>🏷️</span> ۱. عنوان بالای صفحه و دکمه‌ها
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">متن عنوان بالای صفحه</label>
                  <input type="text" id="hubScreenTitle" class="form-control" value="🏆 رقابت آنلاین" oninput="updateHubPreview()">
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px; justify-content: center;">
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; color: var(--text-main);">
                    <input type="checkbox" id="hubShowScreenTitle" checked onchange="updateHubPreview()">
                    نمایش عنوان بالای صفحه
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; color: var(--text-main);">
                    <input type="checkbox" id="hubShowCoinsPill" checked onchange="updateHubPreview()">
                    نمایش نشانگر سکه بالای صفحه
                  </label>
                </div>
              </div>
            </div>

            <!-- Section 2: Player Profile Card -->
            <div class="card">
              <div class="card-header" style="margin-bottom: 12px;">
                <div class="card-title" style="font-size: 15px;">
                  <span>👤</span> ۲. کارت مشخصات بازیکن
                </div>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; color: var(--text-main);">
                  <input type="checkbox" id="hubShowProfileCard" checked onchange="updateHubPreview()">
                  نمایش کل کارت مشخصات
                </label>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">متن دکمه ویرایش نام</label>
                  <input type="text" id="hubProfileEditLabel" class="form-control" value="ویرایش ✏️" oninput="updateHubPreview()">
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px; justify-content: center;">
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; color: var(--text-main);">
                    <input type="checkbox" id="hubShowProfileRating" checked onchange="updateHubPreview()">
                    نمایش امتیاز بازیکن (⭐)
                  </label>
                  <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; color: var(--text-main);">
                    <input type="checkbox" id="hubShowProfileRank" checked onchange="updateHubPreview()">
                    نمایش رتبه بازیکن (🏅)
                  </label>
                </div>
              </div>
            </div>

            <!-- Section 3: Prizes Banner Card -->
            <div class="card" style="border: 1px solid rgba(212, 154, 55, 0.4);">
              <div class="card-header" style="margin-bottom: 12px;">
                <div class="card-title" style="font-size: 15px; color: var(--primary);">
                  <span>🎁</span> ۳. بنر جوایز برتر دوره (امکان حذف کامل این بخش)
                </div>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; color: #ffd700; font-weight: bold;">
                  <input type="checkbox" id="hubShowPrizeBanner" checked onchange="updateHubPreview()">
                  نمایش بنر جوایز
                </label>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 12px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">عنوان بنر جوایز</label>
                  <input type="text" id="hubPrizeBannerTitle" class="form-control" value="🎁 جوایز برتر دوره" oninput="updateHubPreview()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">متن دکمه جزئیات جوایز</label>
                  <input type="text" id="hubPrizeDetailsButtonText" class="form-control" value="🏆 جزئیات جوایز" oninput="updateHubPreview()">
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">🥇 جایزه نفر اول</label>
                  <input type="text" id="hubPrize1Text" class="form-control" value="ایرپاد" oninput="updateHubPreview()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">🥈 جایزه نفر دوم</label>
                  <input type="text" id="hubPrize2Text" class="form-control" value="۵۰۰ سکه" oninput="updateHubPreview()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">🥉 جایزه نفر سوم</label>
                  <input type="text" id="hubPrize3Text" class="form-control" value="۲۰۰ سکه" oninput="updateHubPreview()">
                </div>
              </div>
            </div>

            <!-- Section 4: Tournament & Countdown Card -->
            <div class="card" style="border: 1px solid rgba(212, 154, 55, 0.4);">
              <div class="card-header" style="margin-bottom: 12px;">
                <div class="card-title" style="font-size: 15px; color: var(--primary);">
                  <span>⏳</span> ۴. کارت مسابقه و زمان‌سنج (امکان حذف کامل این بخش)
                </div>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; color: #ffd700; font-weight: bold;">
                  <input type="checkbox" id="hubShowTournamentCard" checked onchange="updateHubPreview()">
                  نمایش کادر مسابقه و تایمر
                </label>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">عنوان مسابقه</label>
                  <input type="text" id="hubTournamentTitle" class="form-control" value="🏆 رقابت فصل 2" oninput="updateHubPreview()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">برچسب وضعیت فعال</label>
                  <input type="text" id="hubStatusActiveLabel" class="form-control" value="🟢 فعال" oninput="updateHubPreview()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">برچسب وضعیت متوقف</label>
                  <input type="text" id="hubStatusInactiveLabel" class="form-control" value="🔒 متوقف" oninput="updateHubPreview()">
                </div>
              </div>
              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label">متن بالای کادرهای زمان‌سنج</label>
                <input type="text" id="hubCountdownTitle" class="form-control" value="زمان باقیمانده تا پایان مسابقه:" oninput="updateHubPreview()">
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 12px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">برچسب روز</label>
                  <input type="text" id="hubCountdownDayLabel" class="form-control" value="روز" oninput="updateHubPreview()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">برچسب ساعت</label>
                  <input type="text" id="hubCountdownHourLabel" class="form-control" value="ساعت" oninput="updateHubPreview()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">برچسب دقیقه</label>
                  <input type="text" id="hubCountdownMinuteLabel" class="form-control" value="دقیقه" oninput="updateHubPreview()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">برچسب ثانیه</label>
                  <input type="text" id="hubCountdownSecondLabel" class="form-control" value="ثانیه" oninput="updateHubPreview()">
                </div>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">برچسب امتیاز بازیکن</label>
                  <input type="text" id="hubScoreLabel" class="form-control" value="امتیاز شما:" oninput="updateHubPreview()">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label class="form-label">برچسب رتبه بازیکن</label>
                  <input type="text" id="hubRankLabel" class="form-control" value="رتبه شما:" oninput="updateHubPreview()">
                </div>
              </div>
            </div>

            <!-- Section 5: Action Buttons -->
            <div class="card">
              <div class="card-header" style="margin-bottom: 12px;">
                <div class="card-title" style="font-size: 15px;">
                  <span>⚔️</span> ۵. دکمه‌های عملیاتی (امکان ویرایش متن یا حذف هر دکمه)
                </div>
                <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; color: var(--text-main);">
                  <input type="checkbox" id="hubShowActionCard" checked onchange="updateHubPreview()">
                  نمایش کادر دکمه‌ها
                </label>
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <label style="min-width: 130px; font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="checkbox" id="hubShowLeaderboardButton" checked onchange="updateHubPreview()">
                    دکمه ۱: جدول رقابت
                  </label>
                  <input type="text" id="hubLeaderboardButtonText" class="form-control" value="🏆 جدول رقابت" style="flex: 1;" oninput="updateHubPreview()">
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <label style="min-width: 130px; font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="checkbox" id="hubShowStartMatchButton" checked onchange="updateHubPreview()">
                    دکمه ۲: شروع مسابقه
                  </label>
                  <input type="text" id="hubStartMatchButtonText" class="form-control" value="⚔️ شروع رقابت (۲ سکه)" style="flex: 1;" oninput="updateHubPreview()">
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <label style="min-width: 130px; font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="checkbox" id="hubShowWinnersButton" checked onchange="updateHubPreview()">
                    دکمه ۳: برندگان مسابقه
                  </label>
                  <input type="text" id="hubWinnersButtonText" class="form-control" value="👑 مشاهده برندگان مسابقه (۳ نفر اول)" style="flex: 1;" oninput="updateHubPreview()">
                </div>
              </div>
            </div>

            <!-- Section 6: Server Indicator & Footer -->
            <div class="card">
              <div class="card-header" style="margin-bottom: 12px;">
                <div class="card-title" style="font-size: 15px;">
                  <span>🇮🇷</span> ۶. نشانگر سرور ایران و فوتر پایین صفحه (امکان حذف کامل)
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <label style="min-width: 140px; font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="checkbox" id="hubShowServerBadge" checked onchange="updateHubPreview()">
                    نمایش نشانگر سرور
                  </label>
                  <input type="text" id="hubServerConnectedText" class="form-control" value="🇮🇷 سرور ایران (ملی بدون فیلترشکن - فعال)" style="flex: 1;" oninput="updateHubPreview()">
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <label style="min-width: 140px; font-size: 13px; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="checkbox" id="hubShowFooterText" checked onchange="updateHubPreview()">
                    نمایش متن فوتر پایین
                  </label>
                  <input type="text" id="hubFooterText" class="form-control" value="توسعه‌دهندگان بازی کلمه‌ت ⭐" style="flex: 1;" oninput="updateHubPreview()">
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div style="display: flex; gap: 12px; margin-top: 8px;">
              <button class="btn btn-primary" style="flex: 2; padding: 12px; font-size: 14px;" onclick="saveHubUiSettings()">
                💾 ذخیره و انتشار آنی روی گوشی تمام کاربران
              </button>
              <button class="btn btn-outline" style="flex: 1; padding: 12px; font-size: 13px;" onclick="resetHubUiDefaults()">
                🔄 بازنشانی متون به پیش‌فرض
              </button>
            </div>

          </div>

          <!-- Phone Mockup Preview Column -->
          <div style="position: sticky; top: 20px;">
            <div style="text-align: center; margin-bottom: 8px; font-size: 13px; font-weight: bold; color: var(--primary);">
              📱 پیش‌نمایش زنده گوشی (Live Preview)
            </div>
            <!-- Phone shell -->
            <div style="width: 340px; background: #33180c; border: 4px solid #5a3018; border-radius: 28px; box-shadow: 0 16px 36px rgba(0,0,0,0.6); overflow: hidden; padding: 12px; font-family: system-ui, sans-serif; direction: rtl; position: relative;">
              
              <!-- Phone Status Bar -->
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #d49a37; margin-bottom: 8px; padding: 0 4px;">
                <span>۷:۰۱</span>
                <span>📶 🔋</span>
              </div>

              <!-- Top Bar inside preview -->
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <!-- Coins Pill -->
                <div id="prevCoinsPill" style="background: linear-gradient(180deg, #4e2612, #2c1409); border: 1.5px solid #d49a37; border-radius: 20px; padding: 3px 8px; font-size: 11px; font-weight: bold; color: #ffd700; display: flex; align-items: center; gap: 4px;">
                  <span>🪙 ۴ +</span>
                </div>
                <!-- Title -->
                <div id="prevScreenTitle" style="font-size: 15px; font-weight: bold; color: #ffd700; text-shadow: 1px 1px 2px #000;">
                  🏆 رقابت آنلاین
                </div>
                <!-- Icons -->
                <div style="display: flex; gap: 4px;">
                  <div style="width: 24px; height: 24px; border-radius: 50%; background: #2c1409; border: 1px solid #d49a37; display: flex; align-items: center; justify-content: center; font-size: 11px;">🛠️</div>
                  <div style="width: 24px; height: 24px; border-radius: 50%; background: #2c1409; border: 1px solid #d49a37; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #ffd700;">⬅️</div>
                </div>
              </div>

              <!-- Profile Card preview -->
              <div id="prevProfileCard" style="background: #2a1409; border: 1.5px solid #5a3018; border-radius: 12px; padding: 8px 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div style="width: 32px; height: 32px; border-radius: 50%; background: #ffd700; display: flex; align-items: center; justify-content: center; font-size: 15px;">🦁</div>
                  <div>
                    <div style="font-size: 12px; font-weight: bold; color: #ffd700;">میلاد</div>
                    <div id="prevProfileEditLabel" style="font-size: 9px; color: #e6c8a0;">ویرایش ✏️</div>
                  </div>
                </div>
                <div style="display: flex; gap: 4px;">
                  <div id="prevProfileRating" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(212,154,55,0.5); border-radius: 6px; padding: 2px 6px; font-size: 10px; color: #ffd700; font-weight: bold;">⭐ ۱۰۰۰</div>
                  <div id="prevProfileRank" style="background: rgba(0,0,0,0.4); border: 1px solid rgba(212,154,55,0.5); border-radius: 6px; padding: 2px 6px; font-size: 10px; color: #ffd700; font-weight: bold;">#۲۳</div>
                </div>
              </div>

              <!-- Prize Banner preview -->
              <div id="prevPrizeBanner" style="background: linear-gradient(180deg, #1f0d05, #110602); border: 1.5px solid #d49a37; border-radius: 12px; padding: 8px 10px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div id="prevPrizeBannerTitle" style="font-size: 11px; font-weight: bold; color: #ffd700;">🎁 جوایز برتر دوره</div>
                  <div id="prevPrizeDetailsBtn" style="font-size: 9px; background: rgba(0,0,0,0.6); border: 0.8px solid #d49a37; border-radius: 4px; padding: 1px 5px; color: #ffd700;">🏆 جزئیات جوایز</div>
                </div>
                <div style="display: flex; justify-content: space-around; background: rgba(0,0,0,0.5); border-radius: 6px; padding: 4px 2px; font-size: 9.5px; font-weight: bold; color: #fdf6ec;">
                  <div id="prevPrize1">🥇 ایرپاد</div>
                  <div id="prevPrize2">🥈 ۵۰۰ سکه</div>
                  <div id="prevPrize3">🥉 ۲۰۰ سکه</div>
                </div>
              </div>

              <!-- Tournament Card preview -->
              <div id="prevTournamentCard" style="background: linear-gradient(180deg, #3d1d0c, #220e05); border: 1.5px solid #d49a37; border-radius: 14px; padding: 10px; margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <div id="prevTournamentTitle" style="font-size: 12px; font-weight: bold; color: #ffd700;">🏆 رقابت فصل 2</div>
                  <div id="prevStatusBadge" style="background: #1b5e20; border: 1px solid #81c784; border-radius: 10px; padding: 1px 6px; font-size: 9px; font-weight: bold; color: #fff;">🟢 فعال</div>
                </div>
                <div style="background: #180a04; border: 1px solid #5a3018; border-radius: 8px; padding: 6px; text-align: center; margin-bottom: 6px;">
                  <div id="prevCountdownTitle" style="font-size: 9.5px; font-weight: bold; color: #f5e6d3; margin-bottom: 4px;">زمان باقیمانده تا پایان مسابقه:</div>
                  <div style="display: flex; justify-content: space-around; align-items: center; font-size: 12px; font-weight: bold; color: #ffd700;">
                    <div><div style="background:#2c1409; border:1px solid #d49a37; border-radius:4px; padding:2px 5px;">۳۶</div><div id="prevDayLabel" style="font-size:8px; color:#e6c8a0;">روز</div></div>
                    <span>:</span>
                    <div><div style="background:#2c1409; border:1px solid #d49a37; border-radius:4px; padding:2px 5px;">۱۶</div><div id="prevHourLabel" style="font-size:8px; color:#e6c8a0;">ساعت</div></div>
                    <span>:</span>
                    <div><div style="background:#2c1409; border:1px solid #d49a37; border-radius:4px; padding:2px 5px;">۵۳</div><div id="prevMinuteLabel" style="font-size:8px; color:#e6c8a0;">دقیقه</div></div>
                    <span>:</span>
                    <div><div style="background:#2c1409; border:1px solid #d49a37; border-radius:4px; padding:2px 5px;">۴۹</div><div id="prevSecondLabel" style="font-size:8px; color:#e6c8a0;">ثانیه</div></div>
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 9.5px; color: #e6c8a0; padding: 0 4px;">
                  <div><span id="prevScoreLabel">امتیاز شما:</span> <strong style="color: #ffd700;">۰</strong></div>
                  <div><span id="prevRankLabel">رتبه شما:</span> <strong style="color: #ffd700;">#۲۳</strong></div>
                </div>
              </div>

              <!-- Action Buttons preview -->
              <div id="prevActionCard" style="background: #2a1409; border: 1.5px solid #5a3018; border-radius: 12px; padding: 8px; margin-bottom: 10px;">
                <div style="display: flex; gap: 6px; margin-bottom: 6px;">
                  <button id="prevLeaderboardBtn" style="flex: 1; background: #4e2612; border: 1px solid #d49a37; border-radius: 8px; padding: 6px 2px; font-size: 10px; font-weight: bold; color: #ffd700;">🏆 جدول رقابت</button>
                  <button id="prevStartMatchBtn" style="flex: 1; background: #4e2612; border: 1px solid #d49a37; border-radius: 8px; padding: 6px 2px; font-size: 10px; font-weight: bold; color: #ffd700;">⚔️ شروع رقابت (۲ سکه)</button>
                </div>
                <button id="prevWinnersBtn" style="width: 100%; background: #1f0d05; border: 1px solid rgba(212,154,55,0.7); border-radius: 8px; padding: 6px; font-size: 9.5px; font-weight: bold; color: #ffd700;">👑 مشاهده برندگان مسابقه (۳ نفر اول)</button>
              </div>

              <!-- Server Badge preview -->
              <div id="prevServerBadge" style="background: rgba(0,0,0,0.6); border: 1px solid #4caf50; border-radius: 8px; padding: 4px 8px; font-size: 9px; color: #c8e6c9; text-align: center; margin-bottom: 8px;">
                <span id="prevServerText">🇮🇷 سرور ایران (ملی بدون فیلترشکن - فعال)</span>
              </div>

              <!-- Footer preview -->
              <div id="prevFooter" style="background: #2c1409; border: 0.8px solid rgba(212,154,55,0.7); border-radius: 6px; padding: 3px 6px; font-size: 8px; color: #ffd700; text-align: center;">
                👑 <span id="prevFooterText">توسعه‌دهندگان بازی کلمه‌ت ⭐</span>
              </div>

            </div>
          </div>
        </div>
      </div>
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

      <!-- TAB: PLAYERS & COINS MANAGEMENT -->
      <div id="tab-users" class="tab-pane">
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div class="card-title">
              <span>👥</span> مدیریت، جستجو و ویرایش بازیکنان و موجودی سکه‌ها
            </div>
            <button class="btn btn-outline btn-sm" onclick="fetchUsersData()">
              🔄 بروزرسانی لیست بازیکنان
            </button>
          </div>

          <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.6;">
            از این بخش می‌توانید هر کاربری را جستجو کرده، موجودی سکه او را ویرایش کنید (افزایش سکه هدیه یا کسر)، ریتینگ و امتیاز مسابقات را تغییر دهید و در صورت لزوم کاربر متخلف را مسدود نمایید.
          </p>

          <div style="display: flex; gap: 12px; margin-bottom: 20px;">
            <input type="text" id="userSearchInput" class="form-control" placeholder="🔍 جستجوی نام کاربری یا شناسه بازیکن..." oninput="filterUsersList()">
          </div>

          <div style="overflow-x: auto;">
            <table class="table" style="width: 100%;">
              <thead>
                <tr>
                  <th style="width: 50px;">ردیف</th>
                  <th>شناسه</th>
                  <th>نام کاربری</th>
                  <th>موجودی سکه</th>
                  <th>ریتینگ ELO</th>
                  <th>امتیاز دوره</th>
                  <th>برد/باخت</th>
                  <th>وضعیت</th>
                  <th style="text-align: center;">عملیات</th>
                </tr>
              </thead>
              <tbody id="usersTableBody">
                <tr>
                  <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 24px;">در حال بارگذاری لیست بازیکنان...</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- TAB: LUCKY WHEEL CONFIG -->
      <div id="tab-wheel" class="tab-pane">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>🎡</span> ویرایش جوایز و شانس‌های گردونه شانس روزانه
            </div>
            <button class="btn btn-primary btn-sm" onclick="saveWheelSettings()">
              💾 ذخیره تنظیمات گردونه
            </button>
          </div>

          <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.6;">
            گردونه شانس روزانه شامل ۸ خانه است. می‌توانید مقدار سکه هر خانه و درصد شانس (احتمال) برنده شدن آن خانه را در لحظه تغییر دهید (مجموع درصدها باید ۱۰۰٪ باشد).
          </p>

          <div style="overflow-x: auto; margin-bottom: 20px;">
            <table class="table" style="width: 100%;">
              <thead>
                <tr>
                  <th style="width: 60px;">خانه</th>
                  <th>برچسب نمایشی</th>
                  <th>مقدار سکه اهدایی</th>
                  <th>درصد شانس برد (%)</th>
                </tr>
              </thead>
              <tbody id="wheelTableBody">
                <!-- Dynamically populated 8 slices -->
              </tbody>
            </table>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="resetDefaultWheel()">
              🔄 بازگردانی به مقادیر پیش‌فرض
            </button>
            <button type="button" class="btn btn-primary" onclick="saveWheelSettings()">
              💾 اعمال و ذخیره جوایز گردونه
            </button>
          </div>
        </div>
      </div>

      <!-- TAB: PUSH & INACTIVITY NOTIFICATIONS -->
      <div id="tab-notifications" class="tab-pane">
        <!-- 1. Send Instant Push Notification Card -->
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div class="card-title">
              <span>🔔</span> ارسال فوری اعلان به گوشی کاربران (هر زمان که مایلید)
            </div>
            <button class="btn btn-primary btn-sm" onclick="sendCustomNotification()">
              🚀 ارسال فوری اعلان
            </button>
          </div>

          <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.6;">
            از این بخش می‌توانید در هر لحظه که اراده کنید، یک نوتیفیکیشن اختصاصی روی گوشی تمام کاربران ارسال کنید (حتی کاربرانی که چند روز است به برنامه سر نزده‌اند).
          </p>

          <!-- Quick Templates Pills -->
          <div style="margin-bottom: 20px;">
            <label class="form-label" style="margin-bottom: 8px;">قالب‌های آماده و سریع (برای بارگذاری با یک کلیک):</label>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="applyNotifPreset('coins')">🎁 سکه رایگان و گردونه</button>
              <button type="button" class="btn btn-outline btn-sm" onclick="applyNotifPreset('rival')">⚔️ حریفت منتظرته!</button>
              <button type="button" class="btn btn-outline btn-sm" onclick="applyNotifPreset('leaderboard')">👑 صدر لیدربورد</button>
              <button type="button" class="btn btn-outline btn-sm" onclick="applyNotifPreset('challenge')">🌟 چالش روزانه جدید</button>
              <button type="button" class="btn btn-outline btn-sm" onclick="applyNotifPreset('welcome_back')">💎 ۵۰ سکه هدیه بازگشت</button>
            </div>
          </div>

          <form id="instantNotifForm" onsubmit="event.preventDefault(); sendCustomNotification();">
            <div class="form-grid" style="margin-bottom: 16px;">
              <div class="form-group">
                <label class="form-label">عنوان اعلان (Notification Title)</label>
                <input type="text" id="notifTitleInput" class="form-control" placeholder="مثال: 🎁 سکه‌های رایگان امروزت رو گرفتی؟" oninput="updateNotifPreview()" required>
              </div>

              <div class="form-group">
                <label class="form-label">دسته‌بندی و نوع اعلان</label>
                <select id="notifTypeSelect" class="form-control" onchange="updateNotifPreview()">
                  <option value="REENGAGEMENT">🎁 یادآوری بازگشت و سکه رایگان</option>
                  <option value="TOURNAMENT">🏆 مسابقات آنلاین و جوایز</option>
                  <option value="CHALLENGE">⚔️ چالش و حریف آنلاین</option>
                  <option value="ALERT">⚠️ اطلاعیه مهم سرور</option>
                  <option value="GENERAL">📢 پیام عمومی مدیریت</option>
                </select>
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 20px;">
              <label class="form-label">متن کامل پیام اعلان (Body Message)</label>
              <textarea id="notifBodyInput" class="form-control" rows="3" placeholder="مثال: گردونه شانس و سکه رایگان امروز منتظرته! همین حالا بیا بازی کن و سکه بگیر." oninput="updateNotifPreview()" required></textarea>
            </div>

            <!-- Realistic Android Phone Notification Preview Card -->
            <div style="background: rgba(28, 21, 14, 0.95); border: 1.5px solid var(--card-border); border-radius: 16px; padding: 18px; margin-bottom: 22px;">
              <div style="font-weight: 700; font-size: 13px; color: var(--primary); margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
                <span>📱 پیش‌نمایش نوتیفیکیشن در نوار اعلان گوشی اندروید:</span>
                <span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">همین الان • کلمه‌ت</span>
              </div>
              <div style="background: #1e1b18; border: 1px solid #3d2f20; border-radius: 14px; padding: 14px; display: flex; gap: 12px; align-items: flex-start; box-shadow: 0 4px 15px rgba(0,0,0,0.4);">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #6b3e14, #d49a37); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; border: 1px solid #ffd700;">
                  🎮
                </div>
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span id="previewNotifTitle" style="font-weight: 800; font-size: 14px; color: #fdf6ec;">🎁 سکه‌های رایگان امروزت رو گرفتی؟</span>
                    <span style="font-size: 10px; color: #a38c76;">هم‌اکنون</span>
                  </div>
                  <p id="previewNotifBody" style="font-size: 12.5px; color: #d1c2b0; line-height: 1.5; margin: 0;">
                    گردونه شانس و سکه رایگان امروز منتظرته! همین حالا بیا بازی کن و سکه بگیر.
                  </p>
                </div>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 12px;">
              <button type="submit" class="btn btn-primary">
                🚀 ارسال فوری اعلان به تمام کاربران
              </button>
            </div>
          </form>
        </div>

        <!-- 2. Automated 24h Inactivity Reminder Engine Settings -->
        <div class="card" style="margin-bottom: 24px;">
          <div class="card-header">
            <div class="card-title">
              <span>⚙️</span> تنظیمات یادآوری خودکار غیبت کاربران (Automated Inactivity Reminders)
            </div>
            <button class="btn btn-outline btn-sm" onclick="saveNotificationSettingsForm()">
              💾 ذخیره تنظیمات خودکار
            </button>
          </div>

          <p style="font-size: 13.5px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.6;">
            اگر کاربری به مدت ۲۴ ساعت (یا بازه مشخص شده) وارد برنامه نشود، سیستم اندروید در پس‌زمینه به‌صورت هوشمند یکی از پیام‌های زیر را برای وی ارسال می‌کند.
          </p>

          <form id="notifSettingsForm" onsubmit="event.preventDefault(); saveNotificationSettingsForm();">
            <div class="form-grid" style="margin-bottom: 20px;">
              <div class="form-group">
                <label class="form-label">سیستم یادآوری خودکار کاربران غایب</label>
                <select id="autoNotifEnabled" class="form-control">
                  <option value="true">🟢 فعال (ارسال خودکار اعلان یادآوری فعال باشد)</option>
                  <option value="false">🔴 غیرفعال (هیچ اعلان خودکاری ارسال نشود)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">بازه زمانی غیبت کاربر برای ارسال پیام</label>
                <select id="autoNotifHours" class="form-control">
                  <option value="12">⏱️ هر ۱۲ ساعت غیبت</option>
                  <option value="24" selected>⏱️ هر ۲۴ ساعت غیبت (۱ روز)</option>
                  <option value="48">⏱️ هر ۴۸ ساعت غیبت (۲ روز)</option>
                  <option value="72">⏱️ هر ۷۲ ساعت غیبت (۳ روز)</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <label class="form-label" style="margin: 0;">پیام‌های چرخشی سیستم خودکار (متن‌هایی که به کاربر غایب نشان داده می‌شود):</label>
                <button type="button" class="btn btn-outline btn-sm" onclick="addReminderTemplateRow()">
                  ➕ افزودن پیام جدید
                </button>
              </div>
              <div id="reminderTemplatesList" style="display: flex; flex-direction: column; gap: 12px;">
                <!-- Dynamically populated -->
              </div>
            </div>

            <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
              <button type="submit" class="btn btn-primary">
                💾 ذخیره تنظیمات سیستم خودکار
              </button>
            </div>
          </form>
        </div>

        <!-- 3. Sent Notifications History Table -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>📜</span> تاریخچه اعلان‌های ارسالی مدیریت
            </div>
            <button class="btn btn-outline btn-sm" onclick="fetchNotificationsData()">
              🔄 بروزرسانی لیست
            </button>
          </div>

          <div style="overflow-x: auto;">
            <table class="table" style="width: 100%;">
              <thead>
                <tr>
                  <th style="width: 60px;">ردیف</th>
                  <th>زمان ارسال</th>
                  <th>فرستنده</th>
                  <th>عنوان اعلان</th>
                  <th>متن پیام</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody id="notificationsTableBody">
                <tr>
                  <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">در حال دریافت سابقه اعلان‌ها...</td>
                </tr>
              </tbody>
            </table>
          </div>
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

  <!-- USER EDIT MODAL -->
  <div id="userEditModal" class="modal-overlay">
    <div class="modal" style="max-width: 500px; text-align: right;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <div class="modal-title" style="margin: 0; font-size: 18px;">✏️ ویرایش اطلاعات بازیکن</div>
        <button class="btn btn-outline btn-sm" onclick="closeUserEditModal()">✕</button>
      </div>
      <form id="editUserForm" onsubmit="event.preventDefault(); saveEditedUser();">
        <input type="hidden" id="editUserId">
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label">نام کاربری</label>
          <input type="text" id="editUsername" class="form-control" readonly style="background: rgba(0,0,0,0.3); opacity: 0.8;">
        </div>
        <div class="form-group" style="margin-bottom: 12px;">
          <label class="form-label">موجودی سکه</label>
          <input type="number" id="editUserCoins" class="form-control" min="0" required>
          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <button type="button" class="btn btn-outline btn-sm" onclick="addCoinsToInput(50)">+۵۰</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="addCoinsToInput(100)">+۱۰۰</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="addCoinsToInput(500)">+۵۰۰</button>
            <button type="button" class="btn btn-outline btn-sm" onclick="addCoinsToInput(1000)">+۱۰۰۰</button>
          </div>
        </div>
        <div class="form-grid" style="margin-bottom: 12px;">
          <div class="form-group">
            <label class="form-label">ریتینگ آنلاین (ELO)</label>
            <input type="number" id="editUserRating" class="form-control" min="100">
          </div>
          <div class="form-group">
            <label class="form-label">امتیاز دوره مسابقات</label>
            <input type="number" id="editUserScore" class="form-control" min="0">
          </div>
        </div>
        <div class="form-group" style="margin-bottom: 20px;">
          <label class="form-label">وضعیت حساب کاربری</label>
          <select id="editUserBanStatus" class="form-control">
            <option value="false">🟢 فعال و عادی</option>
            <option value="true">🔴 مسدود (Banned)</option>
          </select>
        </div>
        <div class="modal-actions" style="margin: 0;">
          <button type="submit" class="btn btn-primary">💾 ذخیره تغییرات</button>
          <button type="button" class="btn btn-outline" onclick="closeUserEditModal()">انصراف</button>
        </div>
      </form>
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
      document.getElementById('adminUsernameDisplay').innerText = username || 'مدیر';
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
        fetchNotificationsData();
        fetchHubUiData();
        fetchUsersData();
        fetchWheelData();
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

    // -------------------------------------------------------------
    // Push & Inactivity Notification Functions
    // -------------------------------------------------------------
    const NOTIF_PRESETS = {
      coins: {
        title: "🎁 سکه‌های رایگان امروزت رو گرفتی؟",
        body: "گردونه شانس و سکه رایگان امروز منتظرته! همین حالا بیا بازی کن و سکه بگیر.",
        type: "REENGAGEMENT"
      },
      rival: {
        title: "⚔️ حریفت منتظرته!",
        body: "بازیکنان جدید توی رقابت آنلاین فعال شدن. بیا و قدرت کلماتت رو ثابت کن!",
        type: "CHALLENGE"
      },
      leaderboard: {
        title: "👑 صدر لیدربورد منتظر توست!",
        body: "امتیازت رو بالا ببر و اسم خودت رو بالای جدول برترین‌های کشور ثبت کن.",
        type: "TOURNAMENT"
      },
      challenge: {
        title: "🌟 چالش روزانه جدید آمادست",
        body: "امروز با چند دقیقه بازی می‌تونی سکه‌های هدیه برنده بشی. بیا کلمه‌ها رو بساز!",
        type: "REENGAGEMENT"
      },
      welcome_back: {
        title: "💎 دلتنگت شدیم! ۵۰ سکه هدیه بازگشت",
        body: "خیلی وقته به کلمه‌ت سر نزدی! وارد بازی شو و جایزه ویژه بازگشتت رو تحویل بگیر.",
        type: "REENGAGEMENT"
      }
    };

    function applyNotifPreset(key) {
      const preset = NOTIF_PRESETS[key];
      if (!preset) return;
      document.getElementById('notifTitleInput').value = preset.title;
      document.getElementById('notifBodyInput').value = preset.body;
      document.getElementById('notifTypeSelect').value = preset.type;
      updateNotifPreview();
      showToast('قالب اعلان بارگذاری شد', '📋');
    }

    function updateNotifPreview() {
      const title = document.getElementById('notifTitleInput').value.trim() || 'عنوان اعلان';
      const body = document.getElementById('notifBodyInput').value.trim() || 'متن پیام اعلان در این قسمت نمایش داده می‌شود...';
      document.getElementById('previewNotifTitle').innerText = title;
      document.getElementById('previewNotifBody').innerText = body;
    }

    async function fetchNotificationsData() {
      try {
        const res = await apiRequest('/admin/api/notifications');
        if (!res || !res.success) return;

        // Populate settings
        if (res.settings) {
          const s = res.settings;
          document.getElementById('autoNotifEnabled').value = String(Boolean(s.inactivityRemindersEnabled));
          document.getElementById('autoNotifHours').value = String(s.inactivityHours || 24);
          renderReminderTemplateRows(s.reminderTemplates || []);
        }

        // Render sent notifications table
        renderNotificationsTable(res.notifications || []);
      } catch (err) {
        console.error('Error fetching notifications data:', err);
      }
    }

    function renderReminderTemplateRows(templates) {
      const container = document.getElementById('reminderTemplatesList');
      container.innerHTML = '';
      if (!templates || templates.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px;">هیچ پیام خودکاری ثبت نشده است. با دکمه بالا پیام اضافه کنید.</div>';
        return;
      }
      templates.forEach((t, idx) => {
        addReminderTemplateRow(t.title || '', t.body || '', t.id || ('rem_' + (idx + 1)));
      });
    }

    function addReminderTemplateRow(title = '', body = '', id = '') {
      const container = document.getElementById('reminderTemplatesList');
      const rowId = id || ('rem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5));
      const card = document.createElement('div');
      card.className = 'template-row-item';
      card.style.background = 'rgba(212, 154, 55, 0.06)';
      card.style.border = '1px solid var(--card-border)';
      card.style.borderRadius = '10px';
      card.style.padding = '12px 14px';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '8px';
      card.dataset.id = rowId;

      const topDiv = document.createElement('div');
      topDiv.style.display = 'flex';
      topDiv.style.justifyContent = 'space-between';
      topDiv.style.alignItems = 'center';
      topDiv.style.gap = '8px';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-control template-title-input';
      input.style.fontSize = '13px';
      input.style.fontWeight = 'bold';
      input.style.flex = '1';
      input.placeholder = 'عنوان پیام (مثال: هدیه روزانه)';
      input.value = title;

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn btn-danger btn-sm';
      delBtn.style.padding = '4px 10px';
      delBtn.style.fontSize = '12px';
      delBtn.textContent = 'حذف';
      delBtn.onclick = function() { deleteReminderTemplateRow(delBtn); };

      topDiv.appendChild(input);
      topDiv.appendChild(delBtn);

      const textarea = document.createElement('textarea');
      textarea.className = 'form-control template-body-input';
      textarea.rows = 2;
      textarea.style.fontSize = '12.5px';
      textarea.placeholder = 'متن پیام یادآوری برای کاربران غایب...';
      textarea.value = body;

      card.appendChild(topDiv);
      card.appendChild(textarea);
      container.appendChild(card);
    }

    function deleteReminderTemplateRow(btn) {
      if (btn) {
        const row = btn.closest('.template-row-item');
        if (row) row.remove();
      }
    }

    async function saveNotificationSettingsForm() {
      const enabled = document.getElementById('autoNotifEnabled').value === 'true';
      const hours = parseInt(document.getElementById('autoNotifHours').value, 10) || 24;

      const templateCards = document.querySelectorAll('.template-row-item');
      const templates = [];
      templateCards.forEach((c, idx) => {
        const title = c.querySelector('.template-title-input').value.trim();
        const body = c.querySelector('.template-body-input').value.trim();
        if (title && body) {
          templates.push({
            id: c.dataset.id || ('rem_' + (idx + 1)),
            title,
            body
          });
        }
      });

      if (templates.length === 0) {
        showToast('حداقل یک پیام یادآوری خودکار باید تعریف شده باشد', '⚠️');
        return;
      }

      try {
        const res = await apiRequest('/admin/api/notifications/settings', {
          method: 'POST',
          body: JSON.stringify({
            inactivityRemindersEnabled: enabled,
            inactivityHours: hours,
            reminderTemplates: templates
          })
        });

        if (res.success) {
          showToast(res.message || 'تنظیمات یادآوری با موفقیت ذخیره شد', '💾');
          fetchNotificationsData();
        } else {
          showToast(res.error || 'خطا در ذخیره تنظیمات', '⚠️');
        }
      } catch (err) {
        showToast('خطا در برقراری ارتباط با سرور', '❌');
      }
    }

    async function sendCustomNotification() {
      const title = document.getElementById('notifTitleInput').value.trim();
      const body = document.getElementById('notifBodyInput').value.trim();
      const type = document.getElementById('notifTypeSelect').value;

      if (!title) {
        showToast('لطفاً عنوان اعلان را وارد کنید', '⚠️');
        return;
      }
      if (!body) {
        showToast('لطفاً متن پیام اعلان را وارد کنید', '⚠️');
        return;
      }

      openModal(
        '🚀 ارسال فوری اعلان به تمام کاربران',
        'آیا مطمئن هستید که می‌خواهید اعلان زیر را در لحظه برای تمام کاربران ارسال کنید؟<br><br><b>عنوان:</b> ' + escapeHtml(title) + '<br><b>متن:</b> ' + escapeHtml(body),
        async () => {
          try {
            const res = await apiRequest('/admin/api/notifications/send', {
              method: 'POST',
              body: JSON.stringify({
                title,
                body,
                type,
                target: 'ALL'
              })
            });

            if (res.success) {
              showToast(res.message || 'اعلان با موفقیت برای تمام کاربران ارسال گردید!', '🔔');
              fetchNotificationsData();
            } else {
              showToast(res.error || 'خطا در ارسال اعلان', '⚠️');
            }
          } catch (err) {
            showToast('خطا در برقراری ارتباط با سرور', '❌');
          }
        }
      );
    }

    function renderNotificationsTable(list) {
      const tbody = document.getElementById('notificationsTableBody');
      if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">هنوز هیچ اعلانی ارسال نشده است.</td></tr>';
        return;
      }

      tbody.innerHTML = list.map((n, idx) => 
        '<tr>' +
          '<td style="color: var(--text-muted); font-size: 12px;">#' + (idx + 1) + '</td>' +
          '<td style="white-space: nowrap; font-size: 12px; direction: ltr; text-align: right;">' + escapeHtml(n.dateString || new Date(n.timestamp).toLocaleString('fa-IR')) + '</td>' +
          '<td><span class="badge" style="background: rgba(212,154,55,0.2); color: var(--primary);">' + escapeHtml(n.sentBy || 'admin') + '</span></td>' +
          '<td style="font-weight: bold; color: #ffd700;">' + escapeHtml(n.title) + '</td>' +
          '<td style="font-size: 13px; color: var(--text-main); max-width: 320px;">' + escapeHtml(n.body) + '</td>' +
          '<td><span class="badge badge-active">✅ ارسال شده</span></td>' +
        '</tr>'
      ).join('');
    }

    // -------------------------------------------------------------
    // Users Management & Coin Editor
    // -------------------------------------------------------------
    let allUsersCache = [];

    async function fetchUsersData() {
      try {
        const res = await apiRequest('/admin/api/users');
        if (res && res.users) {
          allUsersCache = res.users;
          renderUsersTable(allUsersCache);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    }

    function renderUsersTable(list) {
      const tbody = document.getElementById('usersTableBody');
      if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 24px;">هیچ کاربری یافت نشد.</td></tr>';
        return;
      }

      tbody.innerHTML = list.map((u, idx) => {
        const statusBadge = u.isBanned 
          ? '<span class="badge" style="background: rgba(239,68,68,0.2); color: #ef4444;">🔴 مسدود</span>'
          : '<span class="badge badge-active">🟢 فعال</span>';

        return '<tr>' +
          '<td style="color: var(--text-muted);">' + (idx + 1) + '</td>' +
          '<td style="font-size: 11px; font-family: monospace; color: var(--text-muted);">' + escapeHtml(u.id || '') + '</td>' +
          '<td style="font-weight: 700; color: #fdf6ec;">' + escapeHtml(u.username || 'بدون نام') + '</td>' +
          '<td style="color: #ffd700; font-weight: 800;">💰 ' + (u.coins || 0).toLocaleString('fa-IR') + '</td>' +
          '<td>' + (u.rating || 1000) + '</td>' +
          '<td>' + (u.monthlyScore || 0) + '</td>' +
          '<td style="font-size: 12px;">' + (u.wins || 0) + ' برد / ' + (u.losses || 0) + ' باخت</td>' +
          '<td>' + statusBadge + '</td>' +
          '<td style="text-align: center;">' +
            '<button class="btn btn-outline btn-sm" onclick="openEditUserById(this)" data-userid="' + escapeHtml(u.id || '') + '">✏️ ویرایش و سکه</button>' +
          '</td>' +
        '</tr>';
      }).join('');
    }

    function openEditUserById(btn) {
      if (!btn) return;
      const userId = btn.getAttribute('data-userid');
      if (userId) openEditUserModal(userId);
    }

    function filterUsersList() {
      const q = (document.getElementById('userSearchInput').value || '').trim().toLowerCase();
      if (!q) {
        renderUsersTable(allUsersCache);
        return;
      }
      const filtered = allUsersCache.filter(u => 
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.id && u.id.toLowerCase().includes(q))
      );
      renderUsersTable(filtered);
    }

    function openEditUserModal(userId) {
      const user = allUsersCache.find(u => u.id === userId);
      if (!user) return;

      document.getElementById('editUserId').value = user.id;
      document.getElementById('editUsername').value = user.username || '';
      document.getElementById('editUserCoins').value = user.coins || 0;
      document.getElementById('editUserRating').value = user.rating || 1000;
      document.getElementById('editUserScore').value = user.monthlyScore || 0;
      document.getElementById('editUserBanStatus').value = String(Boolean(user.isBanned));

      document.getElementById('userEditModal').classList.add('active');
    }

    function closeUserEditModal() {
      document.getElementById('userEditModal').classList.remove('active');
    }

    function addCoinsToInput(amount) {
      const input = document.getElementById('editUserCoins');
      const cur = parseInt(input.value, 10) || 0;
      input.value = Math.max(0, cur + amount);
    }

    async function saveEditedUser() {
      const userId = document.getElementById('editUserId').value;
      const coins = parseInt(document.getElementById('editUserCoins').value, 10) || 0;
      const rating = parseInt(document.getElementById('editUserRating').value, 10) || 1000;
      const monthlyScore = parseInt(document.getElementById('editUserScore').value, 10) || 0;
      const isBanned = document.getElementById('editUserBanStatus').value === 'true';

      try {
        const res = await apiRequest('/admin/api/users/update', {
          method: 'POST',
          body: JSON.stringify({
            userId,
            coins,
            rating,
            monthlyScore,
            isBanned
          })
        });

        if (res.success) {
          showToast(res.message || 'اطلاعات بازیکن با موفقیت بروزرسانی شد', '👤');
          closeUserEditModal();
          fetchUsersData();
        } else {
          showToast(res.error || 'خطا در ویرایش', '⚠️');
        }
      } catch (err) {
        showToast('خطا در برقراری ارتباط با سرور', '❌');
      }
    }

    // -------------------------------------------------------------
    // Lucky Wheel Editor
    // -------------------------------------------------------------
    let currentWheelData = [];

    async function fetchWheelData() {
      try {
        const res = await apiRequest('/admin/api/wheel');
        if (res && res.wheel) {
          currentWheelData = res.wheel;
          renderWheelTable(currentWheelData);
        }
      } catch (err) {
        console.error('Error fetching wheel config:', err);
      }
    }

    function renderWheelTable(wheel) {
      const tbody = document.getElementById('wheelTableBody');
      if (!wheel || wheel.length === 0) return;

      tbody.innerHTML = wheel.map((slice, idx) => {
        return '<tr class="wheel-row" data-id="' + slice.id + '">' +
          '<td style="font-weight: bold; color: var(--primary); text-align: center;">#' + (idx + 1) + '</td>' +
          '<td><input type="text" class="form-control wheel-label" value="' + escapeHtml(slice.label || '') + '" style="font-size: 13px;"></td>' +
          '<td><input type="number" class="form-control wheel-coins" value="' + (slice.coins || 0) + '" min="1" max="10000" style="font-size: 13px;"></td>' +
          '<td><input type="number" step="0.1" class="form-control wheel-weight" value="' + (slice.weightPercent || 0) + '" min="0" max="100" style="font-size: 13px;"></td>' +
        '</tr>';
      }).join('');
    }

    async function saveWheelSettings() {
      const rows = document.querySelectorAll('.wheel-row');
      const wheel = [];
      let totalWeight = 0;

      rows.forEach(r => {
        const id = parseInt(r.dataset.id, 10);
        const label = r.querySelector('.wheel-label').value.trim();
        const coins = parseInt(r.querySelector('.wheel-coins').value, 10) || 0;
        const weightPercent = parseFloat(r.querySelector('.wheel-weight').value) || 0;
        totalWeight += weightPercent;

        wheel.push({ id, label, coins, weightPercent });
      });

      if (Math.abs(totalWeight - 100) > 1.0) {
        showToast('مجموع شانس‌های برد باید ۱۰۰٪ باشد (مجموع فعلی: ' + totalWeight.toFixed(1) + '٪)', '⚠️');
        return;
      }

      try {
        const res = await apiRequest('/admin/api/wheel/update', {
          method: 'POST',
          body: JSON.stringify({ wheel })
        });

        if (res.success) {
          showToast(res.message || 'جوایز گردونه شانس با موفقیت ذخیره شد', '🎡');
          fetchWheelData();
        } else {
          showToast(res.error || 'خطا در ذخیره جوایز', '⚠️');
        }
      } catch (err) {
        showToast('خطا در برقراری ارتباط با سرور', '❌');
      }
    }

    function resetDefaultWheel() {
      const defaults = [
        { id: 0, coins: 5, weightPercent: 42.0, label: "۵ سکه" },
        { id: 1, coins: 10, weightPercent: 5.0, label: "۱۰ سکه" },
        { id: 2, coins: 20, weightPercent: 22.0, label: "۲۰ سکه" },
        { id: 3, coins: 30, weightPercent: 15.0, label: "۳۰ سکه" },
        { id: 4, coins: 50, weightPercent: 9.0, label: "۵۰ سکه" },
        { id: 5, coins: 100, weightPercent: 5.0, label: "۱۰۰ سکه" },
        { id: 6, coins: 250, weightPercent: 1.5, label: "۲۵۰ سکه" },
        { id: 7, coins: 500, weightPercent: 0.5, label: "۵۰۰ سکه" }
      ];
      renderWheelTable(defaults);
      showToast('مقادیر پیش‌فرض بارگذاری شد. برای نهایی‌سازی دکمه ذخیره را بزنید.', '📋');
    }

    // -------------------------------------------------------------
    // Hub UI & Screen Text Customization Functions
    // -------------------------------------------------------------
    async function fetchHubUiData() {
      try {
        const res = await apiRequest('/admin/api/hub-ui');
        if (res && res.hubUi) {
          populateHubUiForm(res.hubUi);
        }
      } catch (err) {
        console.error('Error fetching hub UI data:', err);
      }
    }

    function populateHubUiForm(ui) {
      if (!ui) return;
      document.getElementById('hubScreenTitle').value = ui.screenTitle !== undefined ? ui.screenTitle : '🏆 رقابت آنلاین';
      document.getElementById('hubShowScreenTitle').checked = ui.showScreenTitle !== false;
      document.getElementById('hubShowCoinsPill').checked = ui.showCoinsPill !== false;

      document.getElementById('hubShowProfileCard').checked = ui.showProfileCard !== false;
      document.getElementById('hubProfileEditLabel').value = ui.profileEditLabel || 'ویرایش ✏️';
      document.getElementById('hubShowProfileRating').checked = ui.showProfileRating !== false;
      document.getElementById('hubShowProfileRank').checked = ui.showProfileRank !== false;

      document.getElementById('hubShowPrizeBanner').checked = ui.showPrizeBanner !== false;
      document.getElementById('hubPrizeBannerTitle').value = ui.prizeBannerTitle || '🎁 جوایز برتر دوره';
      document.getElementById('hubPrizeDetailsButtonText').value = ui.prizeDetailsButtonText || '🏆 جزئیات جوایز';
      document.getElementById('hubPrize1Text').value = ui.prize1Text || 'ایرپاد';
      document.getElementById('hubPrize2Text').value = ui.prize2Text || '۵۰۰ سکه';
      document.getElementById('hubPrize3Text').value = ui.prize3Text || '۲۰۰ سکه';

      document.getElementById('hubShowTournamentCard').checked = ui.showTournamentCard !== false;
      document.getElementById('hubTournamentTitle').value = ui.tournamentTitle || '🏆 رقابت فصل 2';
      document.getElementById('hubStatusActiveLabel').value = ui.statusActiveLabel || '🟢 فعال';
      document.getElementById('hubStatusInactiveLabel').value = ui.statusInactiveLabel || '🔒 متوقف';
      document.getElementById('hubCountdownTitle').value = ui.countdownTitle || 'زمان باقیمانده تا پایان مسابقه:';
      document.getElementById('hubCountdownDayLabel').value = ui.countdownDayLabel || 'روز';
      document.getElementById('hubCountdownHourLabel').value = ui.countdownHourLabel || 'ساعت';
      document.getElementById('hubCountdownMinuteLabel').value = ui.countdownMinuteLabel || 'دقیقه';
      document.getElementById('hubCountdownSecondLabel').value = ui.countdownSecondLabel || 'ثانیه';
      document.getElementById('hubScoreLabel').value = ui.scoreLabel || 'امتیاز شما:';
      document.getElementById('hubRankLabel').value = ui.rankLabel || 'رتبه شما:';

      document.getElementById('hubShowActionCard').checked = ui.showActionCard !== false;
      document.getElementById('hubShowLeaderboardButton').checked = ui.showLeaderboardButton !== false;
      document.getElementById('hubLeaderboardButtonText').value = ui.leaderboardButtonText || '🏆 جدول رقابت';
      document.getElementById('hubShowStartMatchButton').checked = ui.showStartMatchButton !== false;
      document.getElementById('hubStartMatchButtonText').value = ui.startMatchButtonText || '⚔️ شروع رقابت (۲ سکه)';
      document.getElementById('hubShowWinnersButton').checked = ui.showWinnersButton !== false;
      document.getElementById('hubWinnersButtonText').value = ui.winnersButtonText || '👑 مشاهده برندگان مسابقه (۳ نفر اول)';

      document.getElementById('hubShowServerBadge').checked = ui.showServerBadge !== false;
      document.getElementById('hubServerConnectedText').value = ui.serverConnectedText || '🇮🇷 سرور ایران (ملی بدون فیلترشکن - فعال)';

      document.getElementById('hubShowFooterText').checked = ui.showFooterText !== false;
      document.getElementById('hubFooterText').value = ui.footerText || 'توسعه‌دهندگان بازی کلمه‌ت ⭐';

      updateHubPreview();
    }

    function updateHubPreview() {
      // 1. Header
      const showTitle = document.getElementById('hubShowScreenTitle').checked;
      const titleEl = document.getElementById('prevScreenTitle');
      titleEl.style.display = showTitle ? 'block' : 'none';
      titleEl.innerText = document.getElementById('hubScreenTitle').value || '🏆 رقابت آنلاین';

      const showCoins = document.getElementById('hubShowCoinsPill').checked;
      document.getElementById('prevCoinsPill').style.display = showCoins ? 'flex' : 'none';

      // 2. Profile Card
      const showProfile = document.getElementById('hubShowProfileCard').checked;
      document.getElementById('prevProfileCard').style.display = showProfile ? 'flex' : 'none';
      document.getElementById('prevProfileEditLabel').innerText = document.getElementById('hubProfileEditLabel').value || 'ویرایش ✏️';
      document.getElementById('prevProfileRating').style.display = document.getElementById('hubShowProfileRating').checked ? 'block' : 'none';
      document.getElementById('prevProfileRank').style.display = document.getElementById('hubShowProfileRank').checked ? 'block' : 'none';

      // 3. Prize Banner
      const showPrize = document.getElementById('hubShowPrizeBanner').checked;
      document.getElementById('prevPrizeBanner').style.display = showPrize ? 'block' : 'none';
      document.getElementById('prevPrizeBannerTitle').innerText = document.getElementById('hubPrizeBannerTitle').value || '🎁 جوایز برتر دوره';
      document.getElementById('prevPrizeDetailsBtn').innerText = document.getElementById('hubPrizeDetailsButtonText').value || '🏆 جزئیات جوایز';
      document.getElementById('prevPrize1').innerText = '🥇 ' + (document.getElementById('hubPrize1Text').value || 'ایرپاد');
      document.getElementById('prevPrize2').innerText = '🥈 ' + (document.getElementById('hubPrize2Text').value || '۵۰۰ سکه');
      document.getElementById('prevPrize3').innerText = '🥉 ' + (document.getElementById('hubPrize3Text').value || '۲۰۰ سکه');

      // 4. Tournament Card
      const showTourn = document.getElementById('hubShowTournamentCard').checked;
      document.getElementById('prevTournamentCard').style.display = showTourn ? 'block' : 'none';
      document.getElementById('prevTournamentTitle').innerText = document.getElementById('hubTournamentTitle').value || '🏆 رقابت فصل 2';
      document.getElementById('prevStatusBadge').innerText = document.getElementById('hubStatusActiveLabel').value || '🟢 فعال';
      document.getElementById('prevCountdownTitle').innerText = document.getElementById('hubCountdownTitle').value || 'زمان باقیمانده تا پایان مسابقه:';
      document.getElementById('prevDayLabel').innerText = document.getElementById('hubCountdownDayLabel').value || 'روز';
      document.getElementById('prevHourLabel').innerText = document.getElementById('hubCountdownHourLabel').value || 'ساعت';
      document.getElementById('prevMinuteLabel').innerText = document.getElementById('hubCountdownMinuteLabel').value || 'دقیقه';
      document.getElementById('prevSecondLabel').innerText = document.getElementById('hubCountdownSecondLabel').value || 'ثانیه';
      document.getElementById('prevScoreLabel').innerText = document.getElementById('hubScoreLabel').value || 'امتیاز شما:';
      document.getElementById('prevRankLabel').innerText = document.getElementById('hubRankLabel').value || 'رتبه شما:';

      // 5. Actions Card
      const showActions = document.getElementById('hubShowActionCard').checked;
      const lbBtn = document.getElementById('prevLeaderboardBtn');
      const smBtn = document.getElementById('prevStartMatchBtn');
      const wnBtn = document.getElementById('prevWinnersBtn');

      lbBtn.style.display = document.getElementById('hubShowLeaderboardButton').checked ? 'block' : 'none';
      lbBtn.innerText = document.getElementById('hubLeaderboardButtonText').value || '🏆 جدول رقابت';

      smBtn.style.display = document.getElementById('hubShowStartMatchButton').checked ? 'block' : 'none';
      smBtn.innerText = document.getElementById('hubStartMatchButtonText').value || '⚔️ شروع رقابت (۲ سکه)';

      wnBtn.style.display = document.getElementById('hubShowWinnersButton').checked ? 'block' : 'none';
      wnBtn.innerText = document.getElementById('hubWinnersButtonText').value || '👑 مشاهده برندگان مسابقه (۳ نفر اول)';

      document.getElementById('prevActionCard').style.display = showActions ? 'block' : 'none';

      // 6. Server Badge
      const showServer = document.getElementById('hubShowServerBadge').checked;
      document.getElementById('prevServerBadge').style.display = showServer ? 'block' : 'none';
      document.getElementById('prevServerText').innerText = document.getElementById('hubServerConnectedText').value || '🇮🇷 سرور ایران (ملی بدون فیلترشکن - فعال)';

      // 7. Footer Text
      const showFooter = document.getElementById('hubShowFooterText').checked;
      document.getElementById('prevFooter').style.display = showFooter ? 'block' : 'none';
      document.getElementById('prevFooterText').innerText = document.getElementById('hubFooterText').value || 'توسعه‌دهندگان بازی کلمه‌ت ⭐';
    }

    async function saveHubUiSettings() {
      const payload = {
        screenTitle: document.getElementById('hubScreenTitle').value.trim(),
        showScreenTitle: document.getElementById('hubShowScreenTitle').checked,
        showCoinsPill: document.getElementById('hubShowCoinsPill').checked,

        showProfileCard: document.getElementById('hubShowProfileCard').checked,
        profileEditLabel: document.getElementById('hubProfileEditLabel').value.trim(),
        showProfileRating: document.getElementById('hubShowProfileRating').checked,
        showProfileRank: document.getElementById('hubShowProfileRank').checked,

        showPrizeBanner: document.getElementById('hubShowPrizeBanner').checked,
        prizeBannerTitle: document.getElementById('hubPrizeBannerTitle').value.trim(),
        prizeDetailsButtonText: document.getElementById('hubPrizeDetailsButtonText').value.trim(),
        prize1Text: document.getElementById('hubPrize1Text').value.trim(),
        prize2Text: document.getElementById('hubPrize2Text').value.trim(),
        prize3Text: document.getElementById('hubPrize3Text').value.trim(),

        showTournamentCard: document.getElementById('hubShowTournamentCard').checked,
        tournamentTitle: document.getElementById('hubTournamentTitle').value.trim(),
        statusActiveLabel: document.getElementById('hubStatusActiveLabel').value.trim(),
        statusInactiveLabel: document.getElementById('hubStatusInactiveLabel').value.trim(),
        countdownTitle: document.getElementById('hubCountdownTitle').value.trim(),
        countdownDayLabel: document.getElementById('hubCountdownDayLabel').value.trim(),
        countdownHourLabel: document.getElementById('hubCountdownHourLabel').value.trim(),
        countdownMinuteLabel: document.getElementById('hubCountdownMinuteLabel').value.trim(),
        countdownSecondLabel: document.getElementById('hubCountdownSecondLabel').value.trim(),
        scoreLabel: document.getElementById('hubScoreLabel').value.trim(),
        rankLabel: document.getElementById('hubRankLabel').value.trim(),

        showActionCard: document.getElementById('hubShowActionCard').checked,
        showLeaderboardButton: document.getElementById('hubShowLeaderboardButton').checked,
        leaderboardButtonText: document.getElementById('hubLeaderboardButtonText').value.trim(),
        showStartMatchButton: document.getElementById('hubShowStartMatchButton').checked,
        startMatchButtonText: document.getElementById('hubStartMatchButtonText').value.trim(),
        showWinnersButton: document.getElementById('hubShowWinnersButton').checked,
        winnersButtonText: document.getElementById('hubWinnersButtonText').value.trim(),

        showServerBadge: document.getElementById('hubShowServerBadge').checked,
        serverConnectedText: document.getElementById('hubServerConnectedText').value.trim(),

        showFooterText: document.getElementById('hubShowFooterText').checked,
        footerText: document.getElementById('hubFooterText').value.trim()
      };

      try {
        const res = await apiRequest('/admin/api/hub-ui', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (res && res.success) {
          showToast('متن‌ها و بخش‌های صفحه مسابقه با موفقیت ذخیره و برای کلیه کاربران ارسال شد!', '🚀');
        } else {
          showToast((res && res.error) || 'خطا در ذخیره‌سازی متون', '⚠️');
        }
      } catch (err) {
        showToast('خطا در برقراری ارتباط با سرور', '❌');
      }
    }

    function resetHubUiDefaults() {
      const defaults = {
        screenTitle: "🏆 رقابت آنلاین",
        showScreenTitle: true,
        showCoinsPill: true,
        showProfileCard: true,
        profileEditLabel: "ویرایش ✏️",
        showProfileRating: true,
        showProfileRank: true,
        showPrizeBanner: true,
        prizeBannerTitle: "🎁 جوایز برتر دوره",
        prizeDetailsButtonText: "🏆 جزئیات جوایز",
        prize1Text: "ایرپاد",
        prize2Text: "۵۰۰ سکه",
        prize3Text: "۲۰۰ سکه",
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
        winnersButtonText: "مشاهده برندگان مسابقه (۳ نفر اول)",
        showServerBadge: true,
        serverConnectedText: "🇮🇷 سرور ایران (ملی بدون فیلترشکن - فعال)",
        showFooterText: true,
        footerText: "توسعه‌دهندگان بازی کلمه‌ت ⭐"
      };
      populateHubUiForm(defaults);
      showToast('متون اولیه بازنشانی شد. برای ذخیره روی دکمه ذخیره کلیک کنید.', '📋');
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
