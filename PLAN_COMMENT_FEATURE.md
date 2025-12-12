# コメント機能実装計画

## 概要
ブログ記事にコメント機能を追加する。Cloudflare Turnstile によるスパム対策を含む。

## 要件
- スパム対策: Cloudflare Turnstile
- 表示順: 新しい順
- モデレーション: なし（即時表示）
- 編集・削除: なし
- 返信（ネスト）: なし

## 既存リソース
- comments テーブルは既に定義済み（migrations/0002_comment_good.sql）
- いいね機能の実装パターンが参考になる

## 実装ファイル

### 新規作成（6ファイル）

1. `src/lib/turnstile.ts` - Turnstile トークン検証ユーティリティ
2. `src/components/comments/index.tsx` - CommentSection メインコンポーネント
3. `src/components/comments/comment-list.tsx` - コメント一覧表示
4. `src/components/comments/comment-form.tsx` - コメント投稿フォーム
5. `src/components/comments/styles.module.css` - スタイル
6. `src/routes/api/comments/[...id]/index.ts` - コメント API（GET/POST）

### 修正（2ファイル）

1. `qwik.env.d.ts` - TURNSTILE_SECRET_KEY, TURNSTILE_SITE_KEY の型追加
2. `src/routes/post/[...id]/index.tsx` - routeLoader でコメント取得、CommentSection 配置

### Cloudflare Dashboard 設定
- Turnstile ウィジェット作成して Site Key / Secret Key 取得
- Workers Settings で TURNSTILE_SECRET_KEY を Secret として追加
- Workers Settings で TURNSTILE_SITE_KEY を追加

## 実装詳細

### 1. src/lib/turnstile.ts
Cloudflare Turnstile の siteverify API を呼び出し、valibot でレスポンスを検証する。

### 2. src/routes/api/comments/[...id]/index.ts
- **GET**: コメント一覧取得（新しい順）
- **POST**: コメント投稿（Turnstile 検証後、UUID生成してINSERT）

### 3. コメントコンポーネント
- **CommentSection**: postId, initialComments, turnstileSiteKey を受け取り、投稿後に再取得
- **CommentForm**: useVisibleTask で Turnstile スクリプト読み込み、投稿後にリセット
- **CommentList**: 日時を Intl.DateTimeFormat でフォーマット

### 4. 記事ページ統合
`src/routes/post/[...id]/index.tsx` の usePost routeLoader を修正:
- コメント一覧を並行取得
- turnstileSiteKey を env から取得
- CommentSection コンポーネントを article の下に配置

## 実装順序

1. Turnstile 準備: Cloudflare Dashboard でウィジェット作成、シークレット設定
2. 型定義更新: qwik.env.d.ts
3. ユーティリティ作成: src/lib/turnstile.ts
4. API エンドポイント作成: src/routes/api/comments/[...id]/index.ts
5. コンポーネント作成: src/components/comments/*
6. 記事ページ統合: src/routes/post/[...id]/index.tsx
7. 動作確認とデプロイ
