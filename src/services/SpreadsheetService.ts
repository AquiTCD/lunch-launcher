import {
  User,
  Preference,
  Match,
  SpreadsheetConfig,
  SpreadsheetData,
  OperationResult,
  QueryCondition,
  SortCondition,
  SpreadsheetError
} from '../types/spreadsheet';

/**
 * Google Apps Script スプレッドシート操作サービス
 */
export class SpreadsheetService {
  private config: SpreadsheetConfig;
  private spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

  constructor(config: SpreadsheetConfig) {
    this.config = config;
    this.spreadsheet = SpreadsheetApp.openById(config.spreadsheet_id);
  }

  /**
   * スプレッドシートの初期化（シート作成）
   */
  public initializeSpreadsheet(): OperationResult<void> {
    try {
      this.createSheetIfNotExists(this.config.users_sheet_name, ['user_id', 'username', 'created_at']);
      this.createSheetIfNotExists(this.config.preferences_sheet_name, ['user_id', 'time_slots', 'lunch_preferences', 'created_at']);
      this.createSheetIfNotExists(this.config.matches_sheet_name, ['match_id', 'user_ids', 'time_slot', 'lunch_type', 'created_at']);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'スプレッドシートの初期化に失敗しました',
          details: error
        }
      };
    }
  }

  /**
   * シートが存在しない場合に作成
   */
  private createSheetIfNotExists(sheetName: string, headers: string[]): void {
    let sheet = this.spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = this.spreadsheet.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
    }
  }

  /**
   * データを取得
   */
  public getData(sheetName: string, conditions?: QueryCondition[], sortConditions?: SortCondition[]): OperationResult<SpreadsheetData> {
    try {
      const sheet = this.spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        throw new Error(`シート "${sheetName}" が見つかりません`);
      }

      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();

      if (values.length <= 1) {
        return {
          success: true,
          data: { headers: [], rows: [] }
        };
      }

      const headers = values[0] as string[];
      const rows = values.slice(1).map(row => {
        const rowData: { [key: string]: any } = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index];
        });
        return rowData;
      });

      // 条件でフィルタリング
      let filteredRows = rows;
      if (conditions) {
        filteredRows = this.filterRows(rows, conditions);
      }

      // ソート
      if (sortConditions) {
        filteredRows = this.sortRows(filteredRows, sortConditions);
      }

      return {
        success: true,
        data: {
          headers,
          rows: filteredRows
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: `データの取得に失敗しました: ${sheetName}`,
          details: error
        }
      };
    }
  }

  /**
   * データを追加
   */
  public addData(sheetName: string, data: any): OperationResult<void> {
    try {
      const sheet = this.spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        throw new Error(`シート "${sheetName}" が見つかりません`);
      }

      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] as string[];
      const rowData = headers.map(header => data[header] || '');

      sheet.appendRow(rowData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: {
          message: `データの追加に失敗しました: ${sheetName}`,
          details: error
        }
      };
    }
  }

  /**
   * データを更新
   */
  public updateData(sheetName: string, conditions: QueryCondition[], updateData: any): OperationResult<number> {
    try {
      const sheet = this.spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        throw new Error(`シート "${sheetName}" が見つかりません`);
      }

      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      const headers = values[0] as string[];

      let updatedCount = 0;

      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row) continue; // undefinedチェックを追加

        const rowData: { [key: string]: any } = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index];
        });

        // 条件にマッチするかチェック
        if (this.matchesConditions(rowData, conditions)) {
          // 更新データを適用
          Object.keys(updateData).forEach(key => {
            const columnIndex = headers.indexOf(key);
            if (columnIndex !== -1) {
              sheet.getRange(i + 1, columnIndex + 1).setValue(updateData[key]);
            }
          });
          updatedCount++;
        }
      }

      return {
        success: true,
        data: updatedCount
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: `データの更新に失敗しました: ${sheetName}`,
          details: error
        }
      };
    }
  }

  /**
   * データを削除
   */
  public deleteData(sheetName: string, conditions: QueryCondition[]): OperationResult<number> {
    try {
      const sheet = this.spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        throw new Error(`シート "${sheetName}" が見つかりません`);
      }

      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      const headers = values[0] as string[];

      let deletedCount = 0;
      const rowsToDelete: number[] = [];

      for (let i = 1; i < values.length; i++) {
        const row = values[i];
        if (!row) continue; // undefinedチェックを追加

        const rowData: { [key: string]: any } = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index];
        });

        if (this.matchesConditions(rowData, conditions)) {
          rowsToDelete.push(i + 1);
        }
      }

      // 後ろから削除（インデックスがずれないように）
      for (let i = rowsToDelete.length - 1; i >= 0; i--) {
        const rowIndex = rowsToDelete[i];
        if (rowIndex !== undefined) { // undefinedチェックを追加
          sheet.deleteRow(rowIndex);
          deletedCount++;
        }
      }

      return {
        success: true,
        data: deletedCount
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: `データの削除に失敗しました: ${sheetName}`,
          details: error
        }
      };
    }
  }

  /**
   * 古いデータをクリーンアップ
   */
  public cleanupOldData(daysToKeep: number = 1): OperationResult<{ [sheetName: string]: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result: { [sheetName: string]: number } = {};
      const sheets = [this.config.users_sheet_name, this.config.preferences_sheet_name, this.config.matches_sheet_name];

      for (const sheetName of sheets) {
        const deleteResult = this.deleteData(sheetName, [{
          column: 'created_at',
          operator: 'less_than',
          value: cutoffDate.toISOString()
        }]);

        if (deleteResult.success) {
          result[sheetName] = deleteResult.data || 0;
        }
      }

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: 'データのクリーンアップに失敗しました',
          details: error
        }
      };
    }
  }

  /**
   * 行を条件でフィルタリング
   */
  private filterRows(rows: any[], conditions: QueryCondition[]): any[] {
    return rows.filter(row => this.matchesConditions(row, conditions));
  }

  /**
   * 条件にマッチするかチェック
   */
  private matchesConditions(row: any, conditions: QueryCondition[]): boolean {
    return conditions.every(condition => {
      const value = row[condition.column];

      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return String(value).includes(String(condition.value));
        case 'greater_than':
          return value > condition.value;
        case 'less_than':
          return value < condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(value);
        default:
          return false;
      }
    });
  }

  /**
   * 行をソート
   */
  private sortRows(rows: any[], sortConditions: SortCondition[]): any[] {
    return rows.sort((a, b) => {
      for (const condition of sortConditions) {
        const aValue = a[condition.column];
        const bValue = b[condition.column];

        if (aValue < bValue) {
          return condition.ascending ? -1 : 1;
        }
        if (aValue > bValue) {
          return condition.ascending ? 1 : -1;
        }
      }
      return 0;
    });
  }
}
