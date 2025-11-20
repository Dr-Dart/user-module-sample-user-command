/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-console */
/* eslint-disable no-magic-numbers */
import {
  IDartDatabase,
  Context,
  ModuleContext,
  logger,
  SixNumArray,
} from 'dart-api';

// TODO: Customize table name and columns for your module
export const TABLE_NAME = 'table_usercommand_global_setting';
// -----------------------------------------------------
// Colums |  TABLE_COLUMN_IP   | TABLE_COLUMN_INIT_POSE |
// -----------------------------------------------------
// Values | '192.168.137.100'  | [0,0,0,0,0,0]          |
// -----------------------------------------------------
// you can add new DB Columns in here
export const TABLE_COLUMN_IP = 'ip';
export const TABLE_COLUMN_INIT_POSE = 'initPose';
export const TABLE_COLUMNS = [TABLE_COLUMN_IP, TABLE_COLUMN_INIT_POSE];

// TODO: Customize database data structure for your module
export interface IDBData {
  ip: string;
  initPose: {
    pose: SixNumArray;
    coord: number;
  };
  //you can add another data in here
}

// TODO: Customize initial database values for your module
export const InitialDBData = {
  ip: '192.168.137.1',
  initPose: {
    pose: [0, 0, 0, 0, 0, 0] as SixNumArray,
    coord: 0,
  },
  //you can add another initial data in here
} as IDBData;

export default class Database {
  private static readonly TAG = 'Database';
  private static instance: Database | null = null;
  private static currentModuleContext: ModuleContext | null = null;
  private db: IDartDatabase | null;
  private initializationPromise: Promise<boolean>;
  private moduleContext: ModuleContext;

  // private constructor
  private constructor(moduleContext: ModuleContext) {
    this.moduleContext = moduleContext;
    this.db = moduleContext.getSystemLibrary(
      Context.DART_DATABASE,
    ) as IDartDatabase;
    this.initializationPromise = this.initialize();
  }

  // Static method to get instance with moduleContext validation
  public static getInstance(moduleContext: ModuleContext): Database {
    // Check if moduleContext has changed
    if (Database.instance && Database.currentModuleContext !== moduleContext) {
      logger.warn(
        `[${Database.TAG}] ModuleContext has changed. Reinitializing Database instance.`
      );
      Database.instance = null;
    }

    if (!Database.instance) {
      Database.currentModuleContext = moduleContext;
      Database.instance = new Database(moduleContext);
    }
    return Database.instance;
  }

  // Method to reset instance (useful for testing or cleanup)
  public static resetInstance(): void {
    Database.instance = null;
    Database.currentModuleContext = null;
  }

  private initialize = async (): Promise<boolean> => {
    if (!this.db) {
      return false;
    }

    // Check DB exist
    const hasTable = await this.db.hasTable(TABLE_NAME);
    logger.debug(`[${Database.TAG}] hasTable: ${hasTable}`);
    if (hasTable) {
      return true;
    }

    // Create table
    const createResult = await this.db.createTable(
      TABLE_NAME,
      TABLE_COLUMNS,
      false,
    );
    logger.debug(`[${Database.TAG}] createTable: ${createResult}`);
    if (!createResult) return false;

    // Insert initial data
    const values = [
      JSON.stringify(InitialDBData.ip),
      JSON.stringify(InitialDBData.initPose),
    ];
    const result = await this.db.insert(TABLE_NAME, values);
    logger.debug(`[${Database.TAG}] initialize | result: ${result}`);

    return result;
  };

  public getDataAll = async (): Promise<IDBData | null> => {
    await this.initializationPromise;
    if (!this.db) {
      return null;
    }

    //Query DB Data
    const result = await this.db.query(TABLE_NAME, TABLE_COLUMNS, {});
    logger.debug(`[${Database.TAG}] getDataAll | result: ${JSON.stringify(result)}`);

    if (result.length === 0) return null;

    const data = {
      ip: JSON.parse(result[0].data.ip),
      initPose: JSON.parse(result[0].data.initPose),
    } as IDBData;

    return data;
  };

  public getData = async (
    tableColumnName: string,
  ): Promise<Record<string, any> | null> => {
    await this.initializationPromise;
    if (!this.db) {
      return null;
    }

    //Query DB Data
    const result = await this.db.query(TABLE_NAME, [tableColumnName], {});
    logger.debug(`[${Database.TAG}] getData | result: ${JSON.stringify(result)}`);

    if (result.length === 0) return null;

    return result[0].data;
  };

  public saveDataAll = async (data: IDBData): Promise<boolean> => {
    await this.initializationPromise;
    if (!this.db) {
      return false;
    }

    const obj = {} as Record<string, any>;
    obj[TABLE_COLUMN_IP] = JSON.stringify(data.ip);
    obj[TABLE_COLUMN_INIT_POSE] = JSON.stringify(data.initPose);

    const result = await this.db.update(TABLE_NAME, {}, obj);
    logger.debug(`[${Database.TAG}] saveDataAll | Update result: ${result}`);

    return Boolean(result);
  };

  public saveData = async (
    tableColumnName: string,
    data: any,
  ): Promise<boolean> => {
    await this.initializationPromise;
    if (!this.db) {
      return false;
    }

    const obj = {} as Record<string, any>;
    obj[tableColumnName] = JSON.stringify(data);

    const result = await this.db.update(TABLE_NAME, {}, obj);
    logger.debug(`[${Database.TAG}] saveData | Update result: ${result}`);

    return Boolean(result);
  };
}
