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
gh repo create kusuri-nomitechou --private --source=. --push
```

**Hoặc thủ công:**

1. Vào https://github.com/new → tạo repo `kusuri-nomitechou` (không tick README)
2. Chạy:

```bash
git remote add origin https://github.com/TEN_GITHUB_CUA_BAN/kusuri-nomitechou.git
git branch -M main
git push -u origin main
```

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
| `GEMINI_MODEL` | `gemini-2.0-flash` |

5. **Deploy** → đợi build xong → mở URL `https://xxx.vercel.app`

Sau deploy lần đầu, cập nhật `AUTH_URL` đúng URL Vercel rồi **Redeploy**.

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
| API 500 / DB | `DATABASE_URL` sai hoặc chưa `db:push` trên Neon |
| AI 503 | Thiếu `GEMINI_API_KEY` trên Vercel |
| Build fail | Chạy `npm run build` local để xem lỗi trước |

---

## Cập nhật code sau này

```bash
git add .
git commit -m "Mo ta thay doi"
git push
```

Vercel tự build lại mỗi lần push lên `main`.
