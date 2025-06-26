import { SpreadsheetService } from './SpreadsheetService';
import { Match, OperationResult } from '../types/spreadsheet';

/**
 * マッチング結果管理サービス
 */
export class MatchService {
  private spreadsheetService: SpreadsheetService;
  private sheetName: string;

  constructor(spreadsheetService: SpreadsheetService, sheetName: string) {
    this.spreadsheetService = spreadsheetService;
    this.sheetName = sheetName;
  }

  /**
   * マッチング結果を追加
   */
  public addMatch(match: Omit<Match, 'created_at'>): OperationResult<void> {
    const matchData: Match = {
      ...match,
      created_at: new Date().toISOString()
    };

    return this.spreadsheetService.addData(this.sheetName, matchData);
  }

  /**
   * マッチング結果を取得
   */
  public getMatch(matchId: string): OperationResult<Match | null> {
    const result = this.spreadsheetService.getData(this.sheetName, [{
      column: 'match_id',
      operator: 'equals',
      value: matchId
    }]);

    if (!result.success) {
      return {
        success: false,
        error: result.error || {
          message: 'マッチング結果取得に失敗しました'
        }
      };
    }

    if (!result.data) {
      return {
        success: true,
        data: null
      };
    }

    const match = result.data.rows[0] as Match | undefined;
    return {
      success: true,
      data: match || null
    };
  }

  /**
   * ユーザーのマッチング結果を取得
   */
  public getUserMatches(userId: string): OperationResult<Match[]> {
    const result = this.spreadsheetService.getData(this.sheetName, [{
      column: 'user_ids',
      operator: 'contains',
      value: userId
    }]);

    if (!result.success) {
      return {
        success: false,
        error: result.error || {
          message: 'ユーザーマッチング結果取得に失敗しました'
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
      data: result.data.rows as unknown as Match[]
    };
  }

  /**
   * 特定の時間帯のマッチング結果を取得
   */
  public getMatchesByTimeSlot(timeSlot: string): OperationResult<Match[]> {
    const result = this.spreadsheetService.getData(this.sheetName, [{
      column: 'time_slot',
      operator: 'equals',
      value: timeSlot
    }]);

    if (!result.success) {
      return {
        success: false,
        error: result.error || {
          message: '時間帯別マッチング結果取得に失敗しました'
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
      data: result.data.rows as unknown as Match[]
    };
  }

  /**
   * 特定のランチ種別のマッチング結果を取得
   */
  public getMatchesByLunchType(lunchType: string): OperationResult<Match[]> {
    const result = this.spreadsheetService.getData(this.sheetName, [{
      column: 'lunch_type',
      operator: 'equals',
      value: lunchType
    }]);

    if (!result.success) {
      return {
        success: false,
        error: result.error || {
          message: 'ランチ種別別マッチング結果取得に失敗しました'
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
      data: result.data.rows as unknown as Match[]
    };
  }

  /**
   * 全マッチング結果を取得
   */
  public getAllMatches(): OperationResult<Match[]> {
    const result = this.spreadsheetService.getData(this.sheetName);

    if (!result.success) {
      return {
        success: false,
        error: result.error || {
          message: '全マッチング結果取得に失敗しました'
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
      data: result.data.rows as unknown as Match[]
    };
  }

  /**
   * マッチング結果を更新
   */
  public updateMatch(matchId: string, updateData: Partial<Match>): OperationResult<number> {
    return this.spreadsheetService.updateData(this.sheetName, [{
      column: 'match_id',
      operator: 'equals',
      value: matchId
    }], updateData);
  }

  /**
   * マッチング結果を削除
   */
  public deleteMatch(matchId: string): OperationResult<number> {
    return this.spreadsheetService.deleteData(this.sheetName, [{
      column: 'match_id',
      operator: 'equals',
      value: matchId
    }]);
  }

  /**
   * 当日のマッチング結果を取得
   */
  public getTodayMatches(): OperationResult<Match[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const result = this.spreadsheetService.getData(this.sheetName, [
      {
        column: 'created_at',
        operator: 'greater_than',
        value: startOfDay
      },
      {
        column: 'created_at',
        operator: 'less_than',
        value: endOfDay
      }
    ]);

    if (!result.success) {
      return {
        success: false,
        error: result.error || {
          message: '当日マッチング結果取得に失敗しました'
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
      data: result.data.rows as unknown as Match[]
    };
  }

  /**
   * 複数のマッチング結果を一括追加
   */
  public addMatches(matches: Omit<Match, 'created_at'>[]): OperationResult<void> {
    try {
      matches.forEach(match => {
        const result = this.addMatch(match);
        if (!result.success) {
          throw new Error(`マッチング結果の追加に失敗しました: ${result.error?.message}`);
        }
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          message: '複数マッチング結果の追加に失敗しました',
          details: error
        }
      };
    }
  }
}
