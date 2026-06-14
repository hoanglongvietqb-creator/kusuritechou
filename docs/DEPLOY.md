# Đưa クスリ飲み手帳 lên GitHub & chạy như website

Hướng dẫn deploy **miễn phí** với stack phổ biến:

| Dịch vụ | Vai trò | Miễn phí |
|---------|---------|----------|
| **GitHub** | Lưu mã nguồn | Có |
| **Vercel** | Host Next.js + domain | Có |
| **Neon** | PostgreSQL online | Có |
| **Google AI Studio** | API Gemini (AI) | Có hạn mức |

---

## Bước 1: Đẩy code lên GitHub

Trong terminal, tại thư mục project:

```bash
cd "/Users/hoanglongviet/Documents/クスリ飲み手帳"

# Khởi tạo git (chỉ lần đầu)
git init
git add .
git commit -m "Initial commit: クスリ飲み手帳 health app"

# Tạo repo trên GitHub (cần cài GitHub CLI: brew install gh)
gh auth login
Repo của bạn: **https://github.com/hoanglongvietqb-creator/kusuritechou**

```bash
cd "/Users/hoanglongviet/Documents/クスリ飲み手帳"
git remote add origin https://github.com/hoanglongvietqb-creator/kusuritechou.git
git push -u origin main
```

(Nếu đã add remote rồi, chỉ cần `git push -u origin main`.)

> `.env` **không** được đẩy lên GitHub (đã có trong `.gitignore`).

---

## Bước 2: Database PostgreSQL online (Neon)

1. Đăng ký https://neon.tech  
2. **New Project** → copy **Connection string** (dạng `postgresql://...@...neon.tech/...?sslmode=require`)  
3. Giữ string này cho bước 4 — đây là `DATABASE_URL` production.

Chạy schema trên DB cloud (một lần, từ máy local):

```bash
# Tạm thời set URL Neon
export DATABASE_URL="postgresql://....neon.tech/....?sslmode=require"
npm run db:push
npm run db:seed
```

**DB đã có `user_food_items` từ trước:** sau `db:push`, chạy backfill tên chuẩn hóa (một lần) trước khi dùng マスタ từ ảnh:

```sql
UPDATE user_food_items
SET normalized_name = lower(trim(name_ja))
WHERE normalized_name = '' OR normalized_name IS NULL;
```

**食事 TDEE / 写真マスタ:** Cần bảng `user_nutrition_profiles`, cột `meal_logs.source`, `user_food_items.normalized_name`. Vào **食事 → 栄養プロフィール** để đặt mục tiêu kcal; **写真から記録** tự thêm マイメニュー.

---

## Bước 3: Deploy website trên Vercel

1. Đăng ký https://vercel.com (đăng nhập bằng GitHub)  
2. **Add New Project** → Import repo `kusuri-nomitechou`  
3. Framework: **Next.js** (tự nhận)  
4. **Environment Variables** — thêm:

| Biến | Giá trị |
|------|---------|
| `DATABASE_URL` | Connection string Neon (bước 2) |
| `AUTH_SECRET` | Chạy `openssl rand -base64 32` |
| `AUTH_URL` | `https://ten-mien-cua-ban.vercel.app` (sửa sau khi có domain) |
| `GEMINI_API_KEY` | Key từ https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | `gemini-2.5-flash` (model có vision + quota) |
| `SMTP_HOST` | `smtp.gmail.com` (hoặc SMTP khác) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Email gửi |
| `SMTP_PASS` | App Password (Gmail) |
| `EMAIL_FROM` | `クスリ飲み手帳 <email@...>` |
| `CRON_SECRET` | `openssl rand -base64 32` — bảo vệ cron nhắc thuốc |
| `VAPID_PUBLIC_KEY` | Chạy `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY` | Cùng lệnh trên |
| `VAPID_SUBJECT` | `mailto:email-cua-ban@gmail.com` |

5. **Deploy** → đợi build xong → mở URL `https://xxx.vercel.app`

Sau deploy lần đầu, cập nhật `AUTH_URL` đúng URL Vercel production (vd. `https://kusuritechou.vercel.app`) rồi **Redeploy**.

**Cron nhắc thuốc (trước giờ uống 5 phút):** App nhắc **trước 5 phút** mỗi cữ thuốc, nên cron phải chạy **mỗi 5 phút**. Vercel Hobby chỉ cho cron **1 lần/ngày** → không đủ. Dùng cron ngoài **miễn phí** gọi vào API:

- Đăng ký https://cron-job.org → **Create cronjob**
- URL: `https://ten-mien-cua-ban.vercel.app/api/cron/med-reminders`
- Schedule: **Every 5 minutes** (`*/5 * * * *`)
- Header: `Authorization: Bearer <CRON_SECRET>` (đúng giá trị `CRON_SECRET` đã đặt trên Vercel)

Vẫn cần `CRON_SECRET` trên Vercel để bảo vệ endpoint.

**Web Push:** User vào **服薬 → 通知** → 「通知を許可」. iPhone cần **Thêm vào Màn hình chính** (PWA).

**Seed bài viết dinh dưỡng** (một lần trên Neon):

```bash
export DATABASE_URL="postgresql://...@neon.tech/...?sslmode=require"
npm run db:push
npm run db:seed
```

**DB đã có `user_food_items` từ trước:** sau `db:push`, backfill tên chuẩn hóa (một lần):

```sql
UPDATE user_food_items
SET normalized_name = lower(trim(name_ja))
WHERE normalized_name = '' OR normalized_name IS NULL;
```

**食事 TDEE / 写真マスタ:** Bảng `user_nutrition_profiles`, `meal_logs.source`, `user_food_items.normalized_name`. Vào **食事 → 栄養プロフィール**; **写真から記録** tự thêm マイメニュー.

---

## Bước 4: Gắn domain riêng (tùy chọn)

Ví dụ domain `kusuri.example.com`:

1. Vercel → Project → **Settings** → **Domains** → Add domain  
2. Tại nhà đăng ký domain (GoDaddy, Cloudflare, …), thêm bản ghi DNS theo hướng dẫn Vercel (thường CNAME → `cname.vercel-dns.com`)  
3. Sửa `AUTH_URL` = `https://kusuri.example.com` → Redeploy  

Người dùng mở domain trên **điện thoại** → dùng như web app; có thể **Thêm vào Màn hình chính** (PWA).

---

## Luồng sau khi online

```
Điện thoại / PC
    → https://domain-cua-ban.com
    → Vercel (Next.js)
        → API /api/* (server)
        → Neon PostgreSQL (dữ liệu)
        → Google Gemini (chỉ server, có GEMINI_API_KEY)
```

---

## Checklist trước khi public

- [ ] `AUTH_SECRET` mạnh, không dùng giá trị dev  
- [ ] `DATABASE_URL` trỏ Neon (không phải localhost)  
- [ ] `AUTH_URL` khớp domain production (có `https://`)  
- [ ] Đã `db:push` + `db:seed` trên DB Neon  
- [ ] `GEMINI_API_KEY` chỉ trong Vercel Env (không commit)  
- [ ] Test: đăng ký, thuốc, nước, ăn, AI trên URL production  

---

## Lỗi thường gặp

| Lỗi | Cách sửa |
|-----|----------|
| Đăng nhập redirect loop | `AUTH_URL` sai — phải đúng URL site |
| `TypeError: Invalid URL` | `AUTH_URL` thiếu `https://`, có khoảng trắng, hoặc sai — sửa hoặc **xóa** biến (dùng `trustHost`) |
| API 500 / DB | `DATABASE_URL` sai hoặc chưa `db:push` trên Neon |
| AI 503 / 429 | Thiếu `GEMINI_API_KEY` hoặc hết quota — đổi `GEMINI_MODEL=gemini-2.5-flash` |
| Quên MK / nhắc thuốc mail | Thiếu SMTP_* / EMAIL_FROM trên Vercel |
| Push không hoạt động | Thiếu VAPID_* hoặc chưa cài PWA / chưa bấm 通知を許可 |
| Build fail | Chạy `npm run build` local để xem lỗi trước |

---

## Cập nhật code sau này

```bash
git add .
git commit -m "Mo ta thay doi"
git push
```

Vercel tự build lại mỗi lần push lên `main`.
