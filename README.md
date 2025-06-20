# Lunch Launcher 🍽️

Slackアプリでオフィスでのランチマッチングを簡単にするシステムです。Google Apps Script (GAS) で動作し、同じ時間帯にランチに行きたい人同士を自動でマッチングします。

## 🎯 概要

オフィスで「今日ランチ誰と行こう...」と悩む時間をなくし、新しい人との出会いを促進するSlackアプリです。

## ✨ 主な機能

### MVP機能
- **時間選択**: 11:00〜15:00の間で30分おきのランチ開始時刻を選択
- **複数選択**: 複数の時間帯を選択可能
- **自動マッチング**: 同じ時間帯を選んだ人同士を最大4人でグループ化
- **DM通知**: マッチング結果をDMで通知

### NiceToHave機能
- **ランチ傾向選択**: 食べたい料理の傾向を複数選択可能
- **人数制限**: 環境変数で最大人数を可変設定

## 🛠️ 技術スタック

- **Slack App**: Bot Token認証
- **Google Apps Script (GAS)**: バックエンド処理
- **Google Spreadsheet**: データ保存
- **Slack API**: アプリ連携
- **Node.js**: 開発環境・ビルドツール
- **TypeScript**: 型安全な開発

## 📋 要件

### 機能要件
- ランチ時間: 1時間固定
- 時間選択範囲: 11:00〜15:00（30分おき）
- 最大グループ人数: 4人（環境変数で可変）
- データ保持期間: 1日
- 予約: 当日のみ

### 技術要件
- Slack Bot Token
- Google Apps Script実行権限
- Google Spreadsheet編集権限
- Node.js 18+

## 🚀 セットアップ

### 1. 開発環境準備
```bash
# Node.jsのインストール（macOS）
brew install node

# プロジェクトのクローン
git clone <repository-url>
cd lunch-launcher

# 依存関係のインストール
npm install

# バージョン確認
node --version
npm --version
```

### 2. Slack App作成
1. [Slack API](https://api.slack.com/apps)でアプリを作成
2. Bot Token Scopesを設定:
   - `chat:write` (DM送信)
   - `commands` (スラッシュコマンド)
   - `users:read` (ユーザー情報取得)
3. Bot Tokenを取得

### 3. Google Apps Script設定
1. [Google Apps Script](https://script.google.com/)でプロジェクト作成
2. 環境変数を設定:
   - `SLACK_BOT_TOKEN`
   - `MAX_GROUP_SIZE` (デフォルト: 4)

### 4. Google Spreadsheet設定
1. 新しいスプレッドシートを作成
2. 以下のシートを作成:
   - `users`: ユーザー情報
   - `preferences`: 時間選択・ランチ傾向
   - `matches`: マッチング結果

### 5. Clasp設定
```bash
# Claspのインストール
npm install -g @google/clasp

# Googleアカウントでログイン
clasp login

# プロジェクトの初期化
clasp create --type standalone --title "Lunch Launcher"
```

## 📖 使用方法

### 開発コマンド
```bash
# コードのフォーマット
npm run format

# リントチェック
npm run lint

# 型チェック
npm run type-check

# ビルド
npm run build

# デプロイ
npm run deploy

# 開発モード（ウォッチ）
npm run watch
```

### スラッシュコマンド
```
/lunch-launch
```
- ランチ時間選択画面を表示
- 複数時間帯を選択可能

### ワークフロー
- ボタンクリックで時間選択
- リアルタイムでマッチング結果を確認

## 🔧 設定

### 環境変数
| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `SLACK_BOT_TOKEN` | Slack Bot Token | - |
| `MAX_GROUP_SIZE` | 最大グループ人数 | 4 |
| `LUNCH_DURATION` | ランチ時間（分） | 60 |
| `DATA_RETENTION_DAYS` | データ保持期間 | 1 |

### 時間設定
- 開始時刻: 11:00, 11:30, 12:00, 12:30, 13:00, 13:30, 14:00, 14:30, 15:00
- ランチ時間: 1時間
- 選択可能時間: 当日のみ

## 📊 データ構造

### スプレッドシート構造
```
users シート:
- user_id: SlackユーザーID
- username: ユーザー名
- created_at: 作成日時

preferences シート:
- user_id: SlackユーザーID
- time_slots: 選択時間帯（JSON配列）
- lunch_preferences: ランチ傾向（JSON配列）
- created_at: 作成日時

matches シート:
- match_id: マッチングID
- user_ids: マッチングユーザー（JSON配列）
- time_slot: 時間帯
- created_at: 作成日時
```

## 🔄 処理フロー

1. ユーザーが時間選択
2. スプレッドシートにデータ保存
3. 定期的にマッチング処理実行
4. マッチング結果をDMで通知
5. 1日後にデータ自動削除

## 🚧 今後の拡張予定

- [ ] ランチ傾向によるマッチング
- [ ] 過去のマッチング履歴表示
- [ ] グループ分割機能
- [ ] 統計ダッシュボード
- [ ] カスタム時間設定

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'feat: add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🆘 サポート

問題や質問がある場合は、Issuesを作成してください。

---

**Lunch Launcher** - オフィスランチをもっと楽しく！ 🍜✨
