import { SpreadsheetConfig } from '../types/spreadsheet';

/**
 * スプレッドシート設定
 * 実際のスプレッドシートIDに置き換えてください
 */
export const SPREADSHEET_CONFIG: SpreadsheetConfig = {
  // スプレッドシートID（実際のIDに置き換え）
  spreadsheet_id: 'YOUR_SPREADSHEET_ID_HERE',

  // シート名
  users_sheet_name: 'users',
  preferences_sheet_name: 'preferences',
  matches_sheet_name: 'matches'
};

/**
 * 開発環境用の設定
 */
export const DEV_SPREADSHEET_CONFIG: SpreadsheetConfig = {
  spreadsheet_id: 'DEV_SPREADSHEET_ID_HERE',
  users_sheet_name: 'users',
  preferences_sheet_name: 'preferences',
  matches_sheet_name: 'matches'
};

/**
 * 環境に応じた設定を取得
 */
export function getSpreadsheetConfig(): SpreadsheetConfig {
  // 本番環境かどうかを判定（実際の環境変数に応じて調整）
  const isProduction = (process.env as any)['NODE_ENV'] === 'production';

  return isProduction ? SPREADSHEET_CONFIG : DEV_SPREADSHEET_CONFIG;
}

/**
 * 設定の検証
 */
export function validateConfig(config: SpreadsheetConfig): boolean {
  return !!(
    config.spreadsheet_id &&
    config.users_sheet_name &&
    config.preferences_sheet_name &&
    config.matches_sheet_name &&
    config.spreadsheet_id !== 'YOUR_SPREADSHEET_ID_HERE' &&
    config.spreadsheet_id !== 'DEV_SPREADSHEET_ID_HERE'
  );
}
