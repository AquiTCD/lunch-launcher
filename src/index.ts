/**
 * Lunch Launcher - Main entry point
 * Slack app for lunch matching system using Google Apps Script
 */

// Google Apps Script の型定義
declare const SpreadsheetApp: any;
declare const PropertiesService: any;
declare const Logger: any;
declare const UrlFetchApp: any;
declare const Utilities: any;
declare const ContentService: any;

// スプレッドシート関連のインポート
import { SpreadsheetService } from './services/SpreadsheetService';
import { UserService } from './services/UserService';
import { PreferenceService } from './services/PreferenceService';
import { MatchService } from './services/MatchService';
import { getSpreadsheetConfig, validateConfig } from './config/spreadsheet';

// グローバル変数としてサービスを初期化
let spreadsheetService: SpreadsheetService;
let userService: UserService;
let preferenceService: PreferenceService;
let matchService: MatchService;

/**
 * アプリケーションの初期化
 */
function initializeApp(): void {
  try {
    const config = getSpreadsheetConfig();

    if (!validateConfig(config)) {
      throw new Error('スプレッドシート設定が無効です。spreadsheet_idを設定してください。');
    }

    // サービスを初期化
    spreadsheetService = new SpreadsheetService(config);
    userService = new UserService(spreadsheetService, config.users_sheet_name);
    preferenceService = new PreferenceService(spreadsheetService, config.preferences_sheet_name);
    matchService = new MatchService(spreadsheetService, config.matches_sheet_name);

    // スプレッドシートを初期化
    const initResult = spreadsheetService.initializeSpreadsheet();
    if (!initResult.success) {
      throw new Error(`スプレッドシートの初期化に失敗しました: ${initResult.error?.message}`);
    }

    Logger.log('アプリケーションが正常に初期化されました');
  } catch (error) {
    Logger.log(`アプリケーション初期化エラー: ${String(error as Error)}`);
    throw error;
  }
}

/**
 * Slack イベントハンドラー
 */
function handleSlackEvent(event: any): any {
  try {
    // アプリが初期化されていない場合は初期化
    if (!spreadsheetService) {
      initializeApp();
    }

    const eventType = event.type;
    const eventSubtype = event.subtype;

    // ボットメッセージは無視
    if (eventSubtype === 'bot_message') {
      return { ok: true };
    }

    switch (eventType) {
      case 'app_mention':
        return handleAppMention(event);
      case 'message':
        return handleMessage(event);
      default:
        Logger.log(`未対応のイベントタイプ: ${eventType}`);
        return { ok: true };
    }
  } catch (error) {
    Logger.log(`イベントハンドリングエラー: ${error}`);
    return { ok: false, error: error.message };
  }
}

/**
 * アプリメンションの処理
 */
function handleAppMention(event: any): any {
  const text = event.text;
  const userId = event.user;
  const channel = event.channel;

  Logger.log(`アプリメンション受信: ${text} from ${userId}`);

  // 時間選択UIを表示
  return {
    text: 'ランチの時間を選択してください！',
    attachments: [
      {
        text: '希望する時間を選んでください',
        fallback: '時間選択ボタンが表示できません',
        callback_id: 'lunch_time_selection',
        actions: [
          {
            name: 'time',
            text: '11:00',
            type: 'button',
            value: '11:00'
          },
          {
            name: 'time',
            text: '11:30',
            type: 'button',
            value: '11:30'
          },
          {
            name: 'time',
            text: '12:00',
            type: 'button',
            value: '12:00'
          },
          {
            name: 'time',
            text: '12:30',
            type: 'button',
            value: '12:30'
          },
          {
            name: 'time',
            text: '13:00',
            type: 'button',
            value: '13:00'
          }
        ]
      }
    ]
  };
}

/**
 * メッセージの処理
 */
function handleMessage(event: any): any {
  const text = event.text;
  const userId = event.user;

  Logger.log(`メッセージ受信: ${text} from ${userId}`);

  // 基本的なメッセージ処理
  return { ok: true };
}

/**
 * インタラクティブコンポーネントの処理
 */
function handleInteractive(payload: any): any {
  try {
    const callbackId = payload.callback_id;
    const actions = payload.actions;
    const userId = payload.user.id;
    const username = payload.user.username;

    Logger.log(`インタラクティブ受信: ${callbackId} from ${userId}`);

    switch (callbackId) {
      case 'lunch_time_selection':
        return handleLunchTimeSelection(userId, username, actions);
      default:
        Logger.log(`未対応のコールバックID: ${callbackId}`);
        return { text: '申し訳ありません。この操作は現在サポートされていません。' };
    }
  } catch (error) {
    Logger.log(`インタラクティブ処理エラー: ${error}`);
    return { text: 'エラーが発生しました。もう一度お試しください。' };
  }
}

/**
 * ランチ時間選択の処理
 */
function handleLunchTimeSelection(userId: string, username: string, actions: any[]): any {
  try {
    const selectedTime = actions[0].value;

    Logger.log(`時間選択: ${userId} -> ${selectedTime}`);

    // ユーザーが存在しない場合は追加
    const userExistsResult = userService.userExists(userId);
    if (!userExistsResult.success) {
      throw new Error(`ユーザー存在チェックに失敗: ${userExistsResult.error?.message}`);
    }

    if (!userExistsResult.data) {
      const addUserResult = userService.addUser({
        user_id: userId,
        username: username
      });

      if (!addUserResult.success) {
        throw new Error(`ユーザー追加に失敗: ${addUserResult.error?.message}`);
      }
    }

    // 好み情報を更新（既存の情報がある場合は更新、ない場合は新規作成）
    const preferenceData = {
      user_id: userId,
      time_slots: [selectedTime],
      lunch_preferences: ['和食', 'イタリアン', '中華'] // デフォルト値
    };

    const existingPreference = preferenceService.getUserPreference(userId);
    let result;

    if (existingPreference.success && existingPreference.data) {
      // 既存の好み情報を更新
      const updatedTimeSlots = [...existingPreference.data.time_slots, selectedTime];
      result = preferenceService.updatePreference(userId, {
        time_slots: updatedTimeSlots
      });
    } else {
      // 新しい好み情報を作成
      result = preferenceService.addPreference(preferenceData);
    }

    if (!result.success) {
      throw new Error(`好み情報の保存に失敗: ${result.error?.message}`);
    }

    return {
      text: `✅ ${selectedTime}のランチに登録しました！\nマッチング結果は15分前に通知されます。`,
      replace_original: true
    };

  } catch (error) {
    Logger.log(`時間選択処理エラー: ${error}`);
    return {
      text: `❌ エラーが発生しました: ${error.message}`,
      replace_original: true
    };
  }
}

/**
 * 定期的なマッチング処理
 */
function runMatchingProcess(): void {
  try {
    Logger.log('マッチング処理を開始します');

    // 現在時刻を取得
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // 10:45から30分ごとの実行タイミングをチェック
    const executionTimes = [
      { hour: 10, minute: 45 },
      { hour: 11, minute: 15 },
      { hour: 11, minute: 45 },
      { hour: 12, minute: 15 },
      { hour: 12, minute: 45 },
      { hour: 13, minute: 15 },
      { hour: 13, minute: 45 },
      { hour: 14, minute: 15 },
      { hour: 14, minute: 45 }
    ];

    const shouldExecute = executionTimes.some(time =>
      currentHour === time.hour && currentMinute === time.minute
    );

    if (!shouldExecute) {
      Logger.log('マッチング処理の実行時刻ではありません');
      return;
    }

    // マッチング処理を実行
    executeMatching();

  } catch (error) {
    Logger.log(`マッチング処理エラー: ${error}`);
  }
}

/**
 * マッチング処理の実行
 */
function executeMatching(): void {
  try {
    Logger.log('マッチング処理を実行中...');

    // 好み情報を取得
    const matchingDataResult = preferenceService.getMatchingData();
    if (!matchingDataResult.success) {
      throw new Error(`マッチングデータ取得に失敗: ${matchingDataResult.error?.message}`);
    }

    const matchingData = matchingDataResult.data || {};

    // 各時間帯・ランチ種別でマッチングを実行
    Object.keys(matchingData).forEach(key => {
      const parts = key.split('_');
      if (parts.length !== 2) {
        Logger.log(`無効なキー形式: ${key}`);
        return;
      }

      const timeSlot = parts[0];
      const lunchType = parts[1];
      const preferences = matchingData[key];

      if (preferences && preferences.length >= 2) {
        // 4人単位でグループ化
        const groups = createGroups(preferences, 4);

        // マッチング結果を保存
        groups.forEach((group, index) => {
          const matchId = `M${Date.now()}_${index}`;
          const userIds = group.map(p => p.user_id);

          const matchResult = matchService.addMatch({
            match_id: matchId,
            user_ids: userIds,
            time_slot: timeSlot,
            lunch_type: lunchType
          });

          if (!matchResult.success) {
            Logger.log(`マッチング結果保存に失敗: ${matchResult.error?.message}`);
          }
        });
      }
    });

    Logger.log('マッチング処理が完了しました');

  } catch (error) {
    Logger.log(`マッチング実行エラー: ${String(error as Error)}`);
  }
}

/**
 * グループ作成
 */
function createGroups(preferences: any[], maxGroupSize: number): any[][] {
  const groups: any[][] = [];
  const shuffled = [...preferences].sort(() => Math.random() - 0.5);

  for (let i = 0; i < shuffled.length; i += maxGroupSize) {
    groups.push(shuffled.slice(i, i + maxGroupSize));
  }

  return groups;
}

/**
 * データクリーンアップ処理
 */
function cleanupOldData(): void {
  try {
    Logger.log('データクリーンアップを開始します');

    const result = spreadsheetService.cleanupOldData(1); // 1日前のデータを削除

    if (result.success) {
      Logger.log(`クリーンアップ完了: ${JSON.stringify(result.data)}`);
    } else {
      Logger.log(`クリーンアップエラー: ${result.error?.message}`);
    }

  } catch (error) {
    Logger.log(`クリーンアップエラー: ${String(error as Error)}`);
  }
}

// グローバル関数として公開（Google Apps Script用）
(globalThis as any).handleSlackEvent = handleSlackEvent;
(globalThis as any).handleInteractive = handleInteractive;
(globalThis as any).runMatchingProcess = runMatchingProcess;
(globalThis as any).cleanupOldData = cleanupOldData;
(globalThis as any).initializeApp = initializeApp;
