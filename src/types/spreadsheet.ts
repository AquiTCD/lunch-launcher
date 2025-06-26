// スプレッドシート関連の型定義

export interface User {
  user_id: string;
  username: string;
  created_at: string;
}

export interface Preference {
  user_id: string;
  time_slots: string[];
  lunch_preferences: string[];
  created_at: string;
}

export interface Match {
  match_id: string;
  user_ids: string[];
  time_slot: string;
  lunch_type: string;
  created_at: string;
}

export interface SpreadsheetConfig {
  spreadsheet_id: string;
  users_sheet_name: string;
  preferences_sheet_name: string;
  matches_sheet_name: string;
}

export interface SpreadsheetRow {
  [key: string]: string | number | boolean;
}

export interface SpreadsheetData {
  headers: string[];
  rows: SpreadsheetRow[];
}

// エラー型
export interface SpreadsheetError {
  message: string;
  code?: string;
  details?: any;
}

// 操作結果型
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: SpreadsheetError;
}

// クエリ条件型
export interface QueryCondition {
  column: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: string | string[] | number;
}

// ソート条件型
export interface SortCondition {
  column: string;
  ascending: boolean;
}
