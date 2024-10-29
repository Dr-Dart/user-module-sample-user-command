/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
/* eslint-disable no-console */
/* eslint-disable no-magic-numbers */
import { IDartDatabase, Context, ModuleContext, logger, SixNumArray } from 'dart-api';

export const TABLE_NAME = 'table_usercommand_global_setting'
// -----------------------------------------------------
// Colums |  TABLE_COLUMN_IP   | TABLE_COLUMN_INIT_POSE |
// -----------------------------------------------------
// Values | '192.168.137.100'  | [0,0,0,0,0,0]          |
// -----------------------------------------------------
// you can add new DB Columns in here
export const TABLE_COLUMN_IP = 'ip'
export const TABLE_COLUMN_INIT_POSE = 'initPose'
export const TABLE_COLUMNS  = [TABLE_COLUMN_IP, TABLE_COLUMN_INIT_POSE]

export interface IDBData{
  ip : string,
  initPose : {
    pose: SixNumArray,
    coord: number
  }
  //you can add another data in here
}
export const  InitialDBData = {
  ip : '192.168.137.1',
  initPose : {
    pose: [0,0,0,0,0,0] as SixNumArray,
    coord: 0
  }
  //you can add another initial data in here
} as IDBData

export default class Database {
  private db :IDartDatabase | null

  constructor(moduleContext:ModuleContext){
    this.db = moduleContext.getSystemLibrary(Context.DART_DATABASE) as IDartDatabase;
  }

  public initialize = async () : Promise<boolean> => {
    // Check DB exist
    let hasTable = await this.db.hasTable(TABLE_NAME)
    logger.debug(`[DB] hasTable: ${ hasTable}`);
    if (hasTable) return false;

    // Create table
    let createResult = await this.db.createTable(TABLE_NAME, TABLE_COLUMNS, false)
    logger.debug(`[DB] createTable: ${createResult}`);
    if (!createResult) return false;

    // Insert initial data
    // Enter the values in order to TABLE_COLUMNS[TABLE_COLUMN_IP, TABLE_COLUMN_INIT_POSE]
    // If it is a array or object, it must be saved as json.
    const values = [
      JSON.stringify(InitialDBData.ip),
      JSON.stringify(InitialDBData.initPose)
    ]
    let result = await this.db.insert(TABLE_NAME, values) // insert(tableName: string, values: any[]): Promise<boolean>;
    logger.debug(`[DB] initialize | result: ${result}`);

    return result;
  }

  public getDataAll = async () : Promise<IDBData|null> => {
    //Query DB Data
    let result = await this.db.query(TABLE_NAME, TABLE_COLUMNS, {}) //query(tableName: string, projection: string[], where: Record<string, any>): Promise<TableRow[]>;
    logger.debug(`[DB] getDataAll | result: ${JSON.stringify(result)}`);

    if (result.length === 0) return null;

    const data = {
      ip : JSON.parse(result[0].data.ip),
      initPose : JSON.parse(result[0].data.initPose)
    } as IDBData;

    return data;
  };

  public getData = async (tableColumnName:string) : Promise<any> => {
    //Query DB Data
    let result = await this.db.query(TABLE_NAME, [tableColumnName], {})//query(tableName: string, projection: string[], where: Record<string, any>): Promise<TableRow[]>;
    logger.debug(`[DB] getData | result: ${JSON.stringify(result)}`);

    if (result.length === 0) return null;

    return JSON.parse(result[0].data);
  };

  public saveDataAll = async (data:IDBData) : Promise<boolean> => {
    const obj = {} as Record<string, any>;
    obj[TABLE_COLUMN_IP] = JSON.stringify(data.ip)
    obj[TABLE_COLUMN_INIT_POSE] = JSON.stringify(data.initPose)

    let result = await this.db.update(TABLE_NAME, {}, obj) // update(tableName: string, where: Record<string, any>, data: Record<string, any>): Promise<number>;
    logger.debug(`[DB] saveDataAll | Update result: ${result}`);

    return result;
  }

  public saveData = async (tableColumnName:string, data:any) : Promise<boolean> => {
    const obj = {} as Record<string, any>;
    obj[tableColumnName] = JSON.stringify(data)

    let result = await this.db.update(TABLE_NAME, {}, obj) // update(tableName: string, where: Record<string, any>, data: Record<string, any>): Promise<number>;
    logger.debug(`[DB] saveData | Update result: ${result}`);

    return result;
  }
}


