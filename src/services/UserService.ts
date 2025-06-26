import { SpreadsheetService } from './SpreadsheetService';
import { User, OperationResult } from '../types/spreadsheet';

/**
 * ユーザー情報管理サービス
 */
export class UserService {
  private spreadsheetService: SpreadsheetService;
  private sheetName: string;

  constructor(spreadsheetService: SpreadsheetService, sheetName: string) {
    this.spreadsheetService = spreadsheetService;
    this.sheetName = sheetName;
  }

  /**
   * ユーザーを追加
   */
  public addUser(user: Omit<User, 'created_at'>): OperationResult<void> {
    const userData: User = {
      ...user,
      created_at: new Date().toISOString()
    };

    return this.spreadsheetService.addData(this.sheetName, userData);
  }

  /**
   * ユーザーを取得
   */
  public getUser(userId: string): OperationResult<User | null> {
    const result = this.spreadsheetService.getData(this.sheetName, [{
      column: 'user_id',
      operator: 'equals',
      value: userId
    }]);

    if (!result.success) {
      return {
        success: false,
        error: result.error || {
          message: 'ユーザー取得に失敗しました'
        }
      };
    }

    if (!result.data) {
      return {
        success: true,
        data: null
      };
    }

    const user = result.data.rows[0] as User | undefined;
    return {
      success: true,
      data: user || null
    };
  }

  /**
   * 全ユーザーを取得
   */
  public getAllUsers(): OperationResult<User[]> {
    const result = this.spreadsheetService.getData(this.sheetName);

    if (!result.success) {
      return {
        success: false,
        error: result.error || {
          message: '全ユーザー取得に失敗しました'
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
      data: result.data.rows as unknown as User[]
    };
  }

  /**
   * ユーザーを更新
   */
  public updateUser(userId: string, updateData: Partial<User>): OperationResult<number> {
    return this.spreadsheetService.updateData(this.sheetName, [{
      column: 'user_id',
      operator: 'equals',
      value: userId
    }], updateData);
  }

  /**
   * ユーザーを削除
   */
  public deleteUser(userId: string): OperationResult<number> {
    return this.spreadsheetService.deleteData(this.sheetName, [{
      column: 'user_id',
      operator: 'equals',
      value: userId
    }]);
  }

  /**
   * ユーザーが存在するかチェック
   */
  public userExists(userId: string): OperationResult<boolean> {
    const result = this.getUser(userId);

    if (!result.success) {
      return {
        success: false,
        error: result.error || {
          message: 'ユーザー存在チェックに失敗しました'
        }
      };
    }

    return {
      success: true,
      data: result.data !== null
    };
  }
}
