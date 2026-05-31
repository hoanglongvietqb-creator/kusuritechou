# クスリ飲み手帳

服薬・水分・食事を記録し、AIで健康アドバイスを受けられるモバイル向けWebアプリです。

## 機能

- **服薬管理** — 薬の登録、服用時間、食事との関係、服用済みチェック
- **水分記録** — 目標2000ml、クイック追加（+150/250/400/自由）、グラスUI
- **食事・カロリー** — ベトナム料理プリセットからワンタップ記録
- **今日のスケジュール** — 朝/昼/夕/夜のタイムライン（Asia/Tokyo）
- **AI栄養レポート** — Gemini（サーバー側のみ）で3タブ分析
- **AI相談チャット** — ストリーミング応答、レート制限あり

## セットアップ

### 1. PostgreSQL

```bash
docker compose up -d
```

### 2. 環境変数

```bash
cp .env.example .env
```

`.env` を編集:

- `DATABASE_URL` — 例: `postgresql://kusuri:kusuri_dev@localhost:5432/kusuri_nomitechou`
- `AUTH_SECRET` — `openssl rand -base64 32` で生成
- `GEMINI_API_KEY` — [Google AI Studio](https://aistudio.google.com/apikey)
- `GEMINI_MODEL` — 任意（既定: `gemini-2.0-flash`）

### 3. DBマイグレーション & シード

```bash
npm run db:push
npm run db:seed
```

### 4. 開発サーバー

```bash
npm run dev
```

http://localhost:3000 を開き、新規登録から利用開始してください。

## セキュリティ

- `GEMINI_API_KEY` はサーバー環境変数のみ。クライアントに公開しません。
- 全APIはログイン必須（認証ミドルウェア）。
- AI出力は医療助言の代替ではありません（アプリ内に免責表示）。

## 本番デプロイ（GitHub + Vercel + domain）

コードを GitHub に push し、Vercel でホストすれば **https://your-domain.com** として公開できます。

詳細（ベトナム語）: [docs/DEPLOY.md](docs/DEPLOY.md)

**概要:**

1. GitHub に push
2. [Neon](https://neon.tech) で PostgreSQL → `DATABASE_URL`
3. [Vercel](https://vercel.com) でリポジトリを Import → 環境変数を設定 → Deploy
4. 任意: カスタムドメインを Vercel に接続、`AUTH_URL` を本番 URL に更新

## 技術スタック

- Next.js 15 · React 19 · TypeScript
- Tailwind CSS 4
- PostgreSQL · Drizzle ORM
- Auth.js v5（Credentials）
- Google Gen AI SDK (`@google/genai`)
