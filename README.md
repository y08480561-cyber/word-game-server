# Persian Word Battle Backend Server (سرور بازی کلمات آنلاین)

سرور چندنفره بلادرنگ (Real-Time Multiplayer Server) با پشتیبانی کامل از WebSocket و سیستم امتیازدهی معتبر سمت سرور (Authoritative Anti-Cheat Game Engine).

---

## 🚀 مشخصات سرور و پورت پیش‌فرض
- **پورت پیش‌فرض:** `8080` (قابل تغییر با متغیر محیطی `PORT`)
- **پروتکل ارتباطی:** `WebSocket (ws:// و wss://)` و `HTTP REST API`
- **محیط اجرا:** `Node.js (نسخه 16 به بالا)`

---

## 📦 فایل‌های لازم برای Deploy و اجرا روی سرور
برای راه‌اندازی و دیپلوی روی هر سرور یا هاست ابری (مانند VPS، Liara، Heroku، Railway، Render، یا Docker)، تنها ۳ فایل زیر کافی است:

1. **`server.js`**: هسته اصلی سرور (مدیریت WebSocket، اتاق‌های بازی، صف Matchmaking، جدول برترین‌ها و جوایز ماهانه).
2. **`package.json`**: وابستگی‌های پروژه (`ws`).
3. **`puzzles.json`**: بانک مراحل، حروف تصادفی و کلمات مجاز فارسی.

---

## 🛠️ نحوه اجرا روی سرور

### روش ۱: اجرای مستقیم با Node.js / PM2
```bash
# ۱. رفتن به پوشه سرور
cd server

# ۲. نصب وابستگی‌ها
npm install

# ۳. اجرای تست خودکار
npm test

# ۴. اجرای سرور در پس‌زمینه با PM2
npm install -g pm2
pm2 start server.js --name "word-battle-server"
```

### روش ۲: اجرا با Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
```

---

## 🔗 اتصال از اپلیکیشن اندروید
در صفحه **«رقابت آنلاین»** اپلیکیشن، بازیکن یا مدیر می‌تواند با زدن روی آیکون ⚙️ تنظیمات در بالای صفحه، آدرس سرور را به آدرس دامنه یا آی‌پی عمومی خود تغییر دهد:
- آدرس سرور محلی (در شبیه‌ساز): `ws://10.0.2.2:8080`
- آدرس سرور اینترنتی: `wss://your-domain.com` یا `ws://YOUR_SERVER_IP:8080`
