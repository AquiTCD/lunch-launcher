import { SpreadsheetService } from './SpreadsheetService';
import { Preference, OperationResult } from '../types/spreadsheet';

/**
 * ランチ好み情報管理サービス
 */
export class PreferenceService {
  private spreadsheetService: SpreadsheetService;
  private sheetName: string;

  constructor(spreadsheetService: SpreadsheetService, sheetName: string) {
    this.spreadsheetService = spreadsheetService;
    this.sheetName = sheetName;
  }

  /**
   * 好み情報を追加
   */
  public addPreference(preference: Omit<Preference, 'created_at'>): OperationResult<void> {
    const preferenceData: Preference = {
      ...preference,
      created_at: new Date().toISOString()
    };

    return this.spreadsheetService.addData(this.sheetName, preferenceData);
  }

  /**
   * ユーザーの好み情報を取得
   */
  public getUserPreference(userId: string): OperationResult<Preference | null> {
    const result = this.spreadsheetService.getData(this.sheetName, [{
      column: 'user_id',
      operator: 'equals',
      value: userId
    }]);

    if (!result.success) {
      return {
        success: false,
        error: result.error || {
          message: 'ユーザー好み情報取得に失敗しました'
        }
      };
    }

    if (!result.data) {
      return {
        success: true,
        data: null
      };
    }

    const preference = result.data.rows[0] as Preference | undefined;
    return {
      success: true,
      data: preference || null
    };
  }

  /**
   * 特定の時間帯の好み情報を取得
   */
  public getPreferencesByTimeSlot(timeSlot: string): OperationResult<Preference[]> {
    const result = this.spreadsheetService.getData(this.sheetName, [{
      column: 'time_slots',
      operator: 'contains',
      value: timeSlot
    }]);

    if (!result.success) {
      return {
        success: false,
        error: result.error || {
          message: '時間帯別好み情報取得に失敗しました'
        }
      };
    }

    if (!result.data) {
      return {
        success: true,
        data: []
      };
    }

    return {
      success: true,
      data: result.data.rows as unknown as Preference[]
    };
  }

  /**
   * 特定のランチ種別の好み情報を取得
   */
  public getPreferencesByLunchType(lunchType: string): OperationResult<Preference[]> {
    const result = this.spreadsheetService.getData(this.sheetName, [{
      column: 'lunch_preferences',
      operator: 'contains',
      value: lunchType
    }]);

    if (!result.success) {
      return {
        success: false,
        error: result.error || {
          message: 'ランチ種別別好み情報取得に失敗しました'
        }
      };
    }

    if (!result.data) {
      return {
        success: true,
        data: []
      };
    }

    return {
      success: true,
      data: result.data.rows as unknown as Preference[]
    };
  }

  /**
   * 全好み情報を取得
   */
  public getAllPreferences(): OperationResult<Preference[]> {
    const result = this.spreadsheetService.getData(this.sheetName);

    if (!result.success) {
      return {
        success: false,
        error: result.error || {
          message: '全好み情報取得に失敗しました'
        }
      };
    }

    if (!result.data) {
      return {
        success: true,
        data: []
      };
    }

    return {
      success: true,
      data: result.data.rows as unknown as Preference[]
    };
  }

  /**
   * 好み情報を更新
   */
  public updatePreference(userId: string, updateData: Partial<Preference>): OperationResult<number> {
    return this.spreadsheetService.updateData(this.sheetName, [{
      column: 'user_id',
      operator: 'equals',
      value: userId
    }], updateData);
  }

  /**
   * 好み情報を削除
   */
  public deletePreference(userId: string): OperationResult<number> {
    return this.spreadsheetService.deleteData(this.sheetName, [{
      column: 'user_id',
      operator: 'equals',
      value: userId
    }]);
  }

  /**
   * マッチング用のデータを取得（時間帯・ランチ種別でグループ化）
   */
  public getMatchingData(): OperationResult<{ [key: string]: Preference[] }> {
    const result = this.getAllPreferences();

    if (!result.success) {
      return {
        success: false,
        error: result.error || {
          message: 'マッチングデータ取得に失敗しました'
        }
      };
    }

    const preferences = result.data || [];
    const groupedData: { [key: string]: Preference[] } = {};

    preferences.forEach(preference => {
      preference.time_slots.forEach(timeSlot => {
        preference.lunch_preferences.forEach(lunchType => {
          const key = `${timeSlot}_${lunchType}`;
          if (!groupedData[key]) {
            groupedData[key] = [];
          }
          groupedData[key].push(preference);
        });
      });
    });

    return {
      success: true,
      data: groupedData
    };
  }
}
