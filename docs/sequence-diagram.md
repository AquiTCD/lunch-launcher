# Lunch Launcher - シーケンス図

## 1. ユーザーがランチ時間を選択する流れ

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant S as Slack
    participant GAS as Google Apps Script
    participant SS as Google Spreadsheet

    U->>S: アプリをメンション or スラッシュコマンド実行
    S->>GAS: イベント送信 (app_mention / slash_command)
    GAS->>GAS: イベント解析
    GAS->>S: 時間選択UI表示 (ボタン形式)
    S->>U: 時間選択画面表示
    
    U->>S: 時間ボタンクリック
    S->>GAS: インタラクティブイベント送信
    GAS->>GAS: 選択時間を解析
    GAS->>SS: ユーザー情報・時間選択を保存
    GAS->>S: 選択完了メッセージ送信
    S->>U: 選択完了通知
```

## 2. マッチング処理の流れ（更新版）

```mermaid
sequenceDiagram
    participant GAS as Google Apps Script
    participant SS as Google Spreadsheet
    participant S as Slack
    participant U as ユーザー

    Note over GAS: 定期的にマッチング処理実行 (10:45から30分ごと)
    Note over GAS: 例: 10:45, 11:15, 11:45, 12:15...
    
    GAS->>SS: 当日の時間選択データ取得
    SS->>GAS: ユーザー・時間選択・ランチ種別データ
    
    GAS->>GAS: マッチングアルゴリズム実行
    Note over GAS: 1. 時間帯別・ランチ種別でユーザーをグループ化<br/>2. 4人単位になるよう最適化<br/>3. 15分前のランチ時間に通知
    
    GAS->>SS: マッチング結果を保存
    SS->>GAS: 保存完了
    
    loop 各マッチンググループ
        GAS->>S: グループメンバーにDM送信
        S->>U: マッチング結果通知 (15分前)
    end
```

## 3. データ管理の流れ

```mermaid
sequenceDiagram
    participant GAS as Google Apps Script
    participant SS as Google Spreadsheet

    Note over GAS: 毎日午前0時にデータクリーンアップ実行
    
    GAS->>SS: 1日前のデータを検索
    SS->>GAS: 古いデータ一覧
    
    GAS->>SS: 古いデータを削除
    SS->>GAS: 削除完了
    
    Note over GAS: ログ出力: 削除したデータ数
```

## 4. エラーハンドリングの流れ

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant S as Slack
    participant GAS as Google Apps Script
    participant SS as Google Spreadsheet

    U->>S: 操作実行
    S->>GAS: イベント送信
    
    alt 正常処理
        GAS->>SS: データ操作
        SS->>GAS: 成功レスポンス
        GAS->>S: 成功メッセージ
        S->>U: 成功通知
    else エラー発生
        GAS->>GAS: エラーログ記録
        GAS->>S: エラーメッセージ
        S->>U: エラー通知
    end
```

## 5. スプレッドシート構造（更新版）

### users シート
| user_id | username | created_at |
|---------|----------|------------|
| U123456 | john_doe | 2024-01-15 10:30:00 |

### preferences シート
| user_id | time_slots | lunch_preferences | created_at |
|---------|------------|-------------------|------------|
| U123456 | ["12:00", "12:30"] | ["和食", "イタリアン"] | 2024-01-15 10:30:00 |

### matches シート
| match_id | user_ids | time_slot | lunch_type | created_at |
|----------|----------|-----------|------------|------------|
| M001 | ["U123456", "U789012"] | "12:00" | "和食" | 2024-01-15 11:45:00 |

## 6. マッチングアルゴリズム詳細（更新版）

### 実行タイミング
- **頻度**: 10:45から30分ごと実行
- **実行時刻**: 10:45, 11:15, 11:45, 12:15, 12:45, 13:15, 13:45, 14:15, 14:45
- **通知タイミング**: 各ランチ時間の15分前

### 絶対条件
1. **時間**: 同じランチ開始時刻
2. **ランチ種別**: 同じランチ傾向（和食、イタリアン、中華など）

### マッチング優先順位
1. **人数最適化**: 4人単位になるよう最適化
2. **時間帯**: 早い時間帯を優先
3. **登録順**: 先に登録したユーザーを優先

### 処理ステップ
1. **データ取得**: 当日の時間選択・ランチ種別データを取得
2. **グループ化**: 時間・ランチ種別でユーザーをグループ化
3. **人数最適化**: 各グループを4人単位に最適化
   - 4人未満の場合は他の時間帯と統合を検討
   - 4人超過の場合はランダム分割
4. **結果生成**: マッチング結果をスプレッドシートに保存
5. **通知送信**: 各グループメンバーにDM送信（15分前）

### 実行例
```
10:45実行 → 11:00ランチの15分前通知
11:15実行 → 11:30ランチの15分前通知
11:45実行 → 12:00ランチの15分前通知
12:15実行 → 12:30ランチの15分前通知
...
```

### 例: 11:00ランチのマッチング
```
時間: 11:00
ランチ種別: 和食
ユーザー: 6人 (A, B, C, D, E, F)

結果:
- グループ1: A, B, C, D (4人)
- グループ2: E, F (2人) → 他の時間帯と統合を検討
```

### 例: 12:00ランチのマッチング
```
時間: 12:00
ランチ種別: イタリアン
ユーザー: 3人 (G, H, I)

結果:
- グループ1: G, H, I (3人) → 他の時間帯と統合を検討
```
