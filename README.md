# BitLite System (v1.0.0)

**End-to-end management console for miners, mining farms, pool proxies, self-hosted pool nodes, and configurable device-level access control**  
**سامانه جامع مدیریت ماینرها، فارم‌های استخراج، پروکسی استخر، نودهای اختصاصی و کنترل دسترسی سطح دستگاه**

## Core Capabilities / قابلیت‌های کلیدی

| Feature | توضیح (فارسی) | Description (English) |
| --- | --- | --- |
| **Device-Level Access Control** | کنترل دسترسی دقیق بر اساس ترکیب `Wallet.Worker.Device`، صف تایید درخواست‌ها و محدودیت اتصال همزمان بر اساس پرداخت | Strict `Wallet.Worker.Device` access control, pending approval queue, and payment-based simultaneous connection limits |
| **Pool Proxy** | مدیریت یکپارچه اتصال ماینرها، پورت‌ها و سیاست‌های فوروارد به استخرهای معتبر | Connect miners to upstream pools and manage connections, ports, and forwarding policies in one place |
| **Self-Hosted Pool Node** | تبدیل سرور به نود مستقل استخر ماینینگ با قابلیت استخراج ترکیبی | Turn your server into an independent mining pool node with merged mining support |
| **Custom Fee Rate** | تنظیم و بروزرسانی آنی نرخ کارمزد (DevFee) بدون قطع اتصال ماینرها | Configure and hot-update custom fee rates without dropping active miner connections |
| **BLC Secure Tunnel** | رمزنگاری و فشرده‌سازی ترافیک شبکه با کلاینت امنیتی BLC | Encrypt and compress stratum traffic using the companion BLC security client |

## Running the Full-Stack Application / اجرای سامانه

```bash
npm install
npm run dev
```

The BitLite System v1.0.0 server listens on `http://0.0.0.0:3000`.
