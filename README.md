# Persian Word Battle Backend Server (سرور و پنل مدیریت راه دور مسابقات کلمات)

سرور چندنفره بلادرنگ (Real-Time Multiplayer Server) با پشتیبانی کامل از WebSocket، سیستم امتیازدهی معتبر سمت سرور (Authoritative Anti-Cheat Game Engine)، **پنل مدیریت تحت وب اختصاصی** و **دیتابیس پایدار تنظیمات مسابقات بدون نیاز به انتشار آپدیت اپلیکیشن اندروید**.

---

## 🛡️ پنل مدیریت راه دور تحت وب (Remote Web Admin Panel)

مدیر بازی می‌تواند از طریق مرورگر وب (موبایل یا کامپیوتر) تمام ابعاد مسابقات آنلاین را از راه دور کنترل نماید:

- **آدرس دسترسی در سرور:**
  - `https://your-service.onrender.com/admin`
  - یا از طریق دامنه اختصاصی: `https://game.kalametgame.ir/admin`
- **احراز هویت امن (Zero Default Password):**
  - هیچ نام کاربری یا رمز عبور پیش‌فرضی در پروژه وجود ندارد (Fail-Closed).
  - احراز هویت منحصراً از طریق متغیرهای محیطی در Render انجام می‌شود:
    - `ADMIN_USERNAME`: نام کاربری امن دلخواه
    - `ADMIN_PASSWORD`: کلمه عبور قوی و اختصاصی
- **امکانات پنل مدیریت:**
  - 🚀 **شروع دوره جدید مسابقه (Start Tournament):** ایجاد دوره ۳۰ روزه با ثبت در لاگ
  - ⏰ **تمدید ۷ روزه یا تعداد روز دلخواه (Extend Tournament):** افزودن مهلت بدون تغییر امتیازات بازیکنان
  - 🔒 **بستن مسابقه و دوره استراحت (Close Tournament):** فعال‌سازی فاز ۲۴ ساعته اهدای جوایز
  - 🔓 **بازگشایی مجدد (Reopen Tournament):** فعال‌سازی فوری وضعیت رقابت
  - 🏁 **پایان فوری مسابقه (End Tournament):** صفر کردن زمان باقیمانده و بستن ثبت امتیاز
  - 🔄 **آغاز فصل بعدی (Start Next Season):** ارتقای شماره فصل و شمارش از نو
  - 🪙 **هزینه ورودی مسابقه (Entry Cost):** تنظیم تعداد سکه‌های ورودی (مثلاً ۲ یا ۵ سکه) و اعمال آنی در اپ بدون آپدیت
  - 🎁 **جوایز برندگان (Prizes):** تغییر جوایز رتبه‌های اول، دوم و سوم
  - 👥 **جدول برترین‌ها و لاگ اقدامات (Audit Log):** مشاهده لیست اقدامات همراه با ثبت نام مدیر، زمان دقیق، مقادیر قبلی و جدید

---

## 🔒 امنیت و زمان‌بندی قطعی سمت سرور (Server-Authoritative)

1. **مصونیت از تغییر ساعت گوشی:** زمان پایان مسابقه و زمان باقیمانده منحصراً توسط ساعت سرور کنترل می‌شود. تغییر تاریخ یا ساعت گوشی بازیکن هیچ تأثیری در زمان مسابقه ندارد.
2. **عدم افشای اطلاعات مدیر در اندروید:** رمز عبور و توکن مدیر در کدهای اپلیکیشن اندروید قرار ندارد و بازیکنان عادی فقط به خروجی عمومی `/api/tournament` دسترسی دارند.
3. **عدم امکان دستکاری توسط بازیکن:** متد POST در مسیر `/api/tournament` نیاز به احراز هویت مدیر داشته و تلاش بازیکنان برای ویرایش جوایز یا زمانبندی با خطای ۴۰۱ رد می‌شود.
4. **ذخیره‌سازی اتمیک (Atomic File Writes):** کلیه تغییرات در پوشه `/server/data/` ذخیره شده و پس از ری‌استارت سرور نیز حفظ می‌گردند.

---

## 🚀 نحوه اجرا و دیپلوی روی سرور و هاست دامنه .ir

### ۱. نصب و راه‌اندازی با Node.js

```bash
cd server
npm install

# اجرای تست‌های خودکار پنل مدیریت و سرور
node test_admin.js

# اجرای سرور
ADMIN_USERNAME="admin" ADMIN_PASSWORD="YourSecurePasswordHere!" node server.js
```

### ۲. اجرای پایدار با PM2

```bash
npm install -g pm2
ADMIN_USERNAME="admin" ADMIN_PASSWORD="YourSecurePasswordHere!" pm2 start server.js --name "kalamet-server"
pm2 save
```

### ۳. تنظیم دامنه .ir با Nginx (Reverse Proxy)

برای اتصال ساب‌دامین `admin.kalametgame.ir` و `game.kalametgame.ir`:

```nginx
# دامنه عمومی بازی و وب‌سوکت
server {
    server_name game.kalametgame.ir;
    listen 80;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}

# ساب‌دامین اختصاصی پنل مدیریت
server {
    server_name admin.kalametgame.ir;
    listen 80;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📱 عملکرد در اپلیکیشن اندروید

اپلیکیشن کلمه‌ت بلافاصله پس از اتصال به سرور:
1. وضعیت مسابقه (`tournament_state`)، هزینه ورودی و جوایز را دریافت کرده و در کارت مسابقه نمایش می‌دهد.
2. هرگونه تغییر در پنل مدیریت از طریق وب‌سوکت به‌صورت زنده و بدون بستن بازی در کارت مسابقه اعمال می‌شود.
