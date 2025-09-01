/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import {
  Context,
  IDartFileSystem,
  IProgramManager,
  ModuleContext,
  SubProgram,
  MonitoringVariable,
} from 'dart-api';

export default class DrlUtils {
  private fieldDataMap: Map<string, string | number | boolean>;
  private static instance: DrlUtils | null;

  // Get instance
  public static getInstance(): DrlUtils {
    if (!DrlUtils.instance) {
      DrlUtils.instance = new DrlUtils();
    }
    return DrlUtils.instance;
  }

  // Remove the DrlUtils instance before closing the module
  public static deleteInstance() {
    if (DrlUtils.instance) {
      DrlUtils.instance.clearFieldData();
      DrlUtils.instance = null;
    }
  }

  // private constructor
  private constructor() {
    this.fieldDataMap = new Map();
  }

  public setFieldValue(key: string, value: string | number | boolean) {
    this.fieldDataMap.set(key, value);
  }

  public getFieldValue(key: string): string | number | boolean | undefined {
    return this.fieldDataMap.get(key);
  }

  public getFieldData(): Map<string, string | number | boolean> {
    return this.fieldDataMap;
  }

  public deleteField(key: string): boolean {
    return this.fieldDataMap.delete(key);
  }

  public clearFieldData() {
    this.fieldDataMap.clear();
  }

  public async runProgram(
    moduleContext: ModuleContext,
    mainProgramFilePath: string,
    subProgram: SubProgram[] | null,
    monitoringVariables: MonitoringVariable[] | null,
    useDebug: boolean,
  ) {
    let result = false;
    const fileSystem = moduleContext.getSystemLibrary(
      Context.DART_FILE_SYSTEM,
    ) as IDartFileSystem;
    const rootFilePath = fileSystem.getModuleRootDirPath(moduleContext);
    const regex = new RegExp(`.*(${rootFilePath})`);
    const drlAbsolutePath = mainProgramFilePath.replace(regex, `$1`);
    if (await fileSystem.exists(drlAbsolutePath)) {
      let drlContent = await fileSystem.readFile(
        moduleContext,
        drlAbsolutePath,
      );
      // convert from JS boolean to number for python
      const appData = this.convertBooleanToNumberProps(
        Object.fromEntries(this.fieldDataMap),
      );
      drlContent =
        `app_data = ${JSON.stringify(appData) + '\r\n'}` + drlContent;
      const programManager = moduleContext.getSystemManager(
        Context.PROGRAM_MANAGER,
      ) as IProgramManager;
      result = await programManager.runProgram(
        drlContent,
        subProgram,
        monitoringVariables,
        useDebug,
      );
    }
    return result;
  }

  public convertBooleanToNumberProps(obj: {
    [k: string]: string | number | boolean;
  }) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'boolean') {
        obj[key] = value ? 1 : 0;
      }
    }
    return obj;
  }
}
