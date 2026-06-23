# LOMポータル セットアップ手順

## 1. Supabaseプロジェクトの作成

1. https://supabase.com にアクセスしてアカウント作成・ログイン
2. 「New project」でプロジェクトを作成
3. プロジェクト名（例: `lom-portal`）、パスワード、リージョン（Northeast Asia）を設定

## 2. データベーススキーマの適用

1. Supabaseダッシュボード → **SQL Editor** を開く
2. `supabase/schema.sql` の内容を貼り付けて実行

## 3. 環境変数の設定

1. Supabaseダッシュボード → **Project Settings** → **API**
2. 以下の値を `.env.local` にコピー:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxx...
```

## 4. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開く

## 5. 最初の管理者アカウントの作成

1. `/register` で新規アカウント登録
2. Supabaseダッシュボード → **Table Editor** → `profiles` テーブル
3. 自分のレコードの `role` を `admin` に変更

## 機能一覧

| ページ | URL | 説明 |
|--------|-----|------|
| ダッシュボード | `/dashboard` | 概要・最新情報 |
| お知らせ | `/announcements` | LOMからのお知らせ（管理者が投稿） |
| スケジュール | `/schedule` | 例会・行事の一覧（管理者が登録） |
| 出欠確認 | `/attendance` | 各イベントへの出欠登録 |
| 会員管理 | `/members` | 会員一覧・権限管理 |

## 本番デプロイ (Vercel)

```bash
# Vercel CLIでデプロイ
npx vercel
# 環境変数をVercelダッシュボードで設定
```
