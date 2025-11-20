/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import {
  Context,
  IModuleChannel,
  ModuleScreenProps,
  ModuleScreen,
  logger,
  SixNumArray,
  Message,
} from 'dart-api';
//UI Setting
import { ThemeProvider } from '@mui/material/styles';
import React, { createRef } from 'react';
import { Box, Button, Divider, Grid } from '@mui/material';
import Database from '../DatabaseManager';
import TaskPoseControl, { TaskPoseControlAPI } from '../uc/task.pose.control';
import { EulerType, IMathLibrary } from 'dart-api/dart-api-math';
import SetGlobalValue from './SetGlobalValue';
import {
  CHANNEL_GET_CURRENT_DATA,
  CHANNEL_DATA_CHANGED,
  CHANNEL_GET_VARIABLES,
} from './ChannelConstants';
import styles from './UserCommandScreen.scss';

interface userCommandState2 {
  zyxPose: SixNumArray;
  typeFilter: any[];
  globalSystemVariable: any[];
  variableSelected: string;
  hasError: boolean;
  errorMessage: string;
}

/*****
 * Main Life Cycle
 *
 * 1) First Initial
 * 1.constructor -> 2.render -> 3.componentDidMount -> componentDidUpdate -> OnBind
 *
 * 2) SetState occured
 * setstate -> render -> ComponentDidUpdate
 *
 *****/
export default class UserCommandScreen2 extends ModuleScreen {
  private static readonly TAG = 'UserCommandScreen2';
  //Use for data change
  private channel = {} as IModuleChannel;
  private db = {} as Database;

  private taskPoseRef = createRef<TaskPoseControlAPI>();
  private mathLibrary = this.moduleContext.getSystemLibrary(
    Context.MATH_LIBRARY,
  ) as IMathLibrary;

  // Initialize state in PIP Screen.
  constructor(props: ModuleScreenProps) {
    super(props);
    this.state = {
      zyxPose: [0, 0, 0, 0, 0, 0],
      //for Global/System Variable
      typeFilter: [],
      globalSystemVariable: [],
      variableSelected: '',
      hasError: false,
      errorMessage: '',
    } as userCommandState2;
  }

  //Update savedData recieved from Task Editor Module
  async componentDidMount() {
    this.taskPoseRef.current?.onChange(this.handleChangePoseCallback);

    //[Optional] Update data from the configured database on the main screen in this Module
    this.db = Database.getInstance(this.moduleContext);
    const dbData = await this.db.getDataAll();
    if (dbData) {
      this.setState({
        //initPose value will be overwritten with the user-input value.
        zyxPose: dbData.initPose.pose,
      });
    }

    if (Object.prototype.hasOwnProperty.call(this.message.data, 'savedData')) {
      // const version = this.message.data['savedVersion'];
      const savedData = this.message.data?.savedData;
      logger.debug(`[${UserCommandScreen2.TAG}] savedData: ${JSON.stringify(savedData)}`);

      if (savedData === null) return;

      //update state from savedData in Task Editor Module.
      this.setCurrentData(savedData);
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Catch errors from child components
    logger.error(`[${UserCommandScreen2.TAG}] Error caught: ${error.message}, Component Stack: ${errorInfo.componentStack}`);
    this.setState({
      hasError: true,
      errorMessage: error.message,
    });
  }

  handleChangePoseCallback = async (zyxPose: SixNumArray) => {
    // let zyzPose = this.convertPoseZyxToZyz(zyxPose)
    this.setState(
      {
        zyxPose: zyxPose,
      },
      this.sendDataToTaskEditor,
    );
  };

  convertPoseZyxToZyz = (zyxPose: SixNumArray) => {
    const zyz = this.mathLibrary.convertEuler(
      {
        pose: zyxPose,
        type: EulerType.ZYX,
      },
      EulerType.ZYZ,
    );
    logger.debug(`[${UserCommandScreen2.TAG}] zyx: ${zyxPose} / zyz: ${zyz.pose}`);
    return zyz.pose;
  };

  // Check validity: -1 (Error), 0 (Invalid), 1 (Valid)
  // TODO: Customize this validation logic for your use case
  getValidity = (data: any): number => {
    // Check for errors (critical issues that prevent execution)
    // Check zyxPose validity
    if (!data.zyxPose) {
      return -1; // Error: zyxPose not defined
    }

    // Check if zyxPose is an array with 6 elements
    if (!Array.isArray(data.zyxPose) || data.zyxPose.length !== 6) {
      return -1; // Error: zyxPose must be array of 6 numbers
    }

    // Check if all pose values are valid numbers
    for (const value of data.zyxPose) {
      if (typeof value !== 'number' || isNaN(value)) {
        return -1; // Error: invalid pose value
      }
    }

    // Check for invalid states (incomplete but not critical)
    // Check if variable is selected
    if (data.variableSelected === '') {
      return 0; // Invalid: no variable selected
    }

    // All checks passed
    return 1; // Valid
  };

  //OnBind. When Task Editor save Task, Send saved data.
  onBind(message: Message, channel: IModuleChannel): boolean {
    this.channel = channel;

    // V2: Task Editor Module: Send "get_current_data" message.
    // User Command Module: Receive "get_current_data" message and send v2 format response
    channel.receive(CHANNEL_GET_CURRENT_DATA, () => {
      try {
        const currentData = this.getCurrentData();
        const validity = this.getValidity(currentData);

        // V2 response format with validity and summary
        // summary: Displayed next to command in Task Tree
        const poseArray = currentData.zyxPose || [0, 0, 0, 0, 0, 0];
        const poseStr = `[${poseArray.map((v: number) => v.toFixed(1)).join(',')}]`;
        const response = {
          data: currentData,
          validity: validity,
          summary: currentData.variableSelected !== '' // TODO: Customize this message shown in Task Tree
            ? `Convert ${poseStr} → ${currentData.variableSelected}`
            : `Convert ZYX ${poseStr} to ZYZ`
        };

        logger.debug(`[${UserCommandScreen2.TAG}] get_current_data(response): ${JSON.stringify(response)}`);

        //Send current data to Task Editor with V2 format
        channel.send(CHANNEL_GET_CURRENT_DATA, response);
      } catch (error: any) {
        logger.error(`[${UserCommandScreen2.TAG}] Error in get_current_data: ${error.message}`);
      }
    });

    // Get global variables
    channel.receive(CHANNEL_GET_VARIABLES, (data) => {
      try {
        logger.debug(`[${UserCommandScreen2.TAG}] get_variables(receive) : ${JSON.stringify(data)}`);
        if (data) {
          this.setState({ globalSystemVariable: data });
        }
      } catch (error: any) {
        logger.error(`[${UserCommandScreen2.TAG}] Error in get_variables: ${error.message}`);
      }
    });

    // Send 'get_variables' request to the task editor module after add receive callback in onBind
    setTimeout(() => {
      logger.debug(`[${UserCommandScreen2.TAG}] get_variables(response)`);
      this.channel.send(CHANNEL_GET_VARIABLES);
    }, 1000);

    return true;
  }

  //Send "data_changed" message when the data changed.
  sendDataToTaskEditor = () => {
    try {
      if (this.channel.send !== undefined) {
        logger.debug(`[${UserCommandScreen2.TAG}] data_changed`);
        const currentData = this.getCurrentData();
        const validity = this.getValidity(currentData);

        // V2 response format with validity and summary
        // summary: Displayed next to command in Task Tree
        const poseArray = currentData.zyxPose || [0, 0, 0, 0, 0, 0];
        const poseStr = `[${poseArray.map((v: number) => v.toFixed(1)).join(',')}]`;
        const response = {
          data: currentData,
          validity: validity,
          summary: currentData.variableSelected !== '' // TODO: Customize this message shown in Task Tree
            ? `Convert ${poseStr} → ${currentData.variableSelected}`
            : `Convert ZYX ${poseStr} to ZYZ`
        };

        //Send changed data to Task Editor with V2 format
        logger.debug(`[${UserCommandScreen2.TAG}] data_changed response: ${JSON.stringify(response)}`);
        this.channel.send(CHANNEL_DATA_CHANGED, response);
      }
    } catch (error: any) {
      logger.error(`[${UserCommandScreen2.TAG}] Error in sendDataToTaskEditor: ${error.message}`);
    }
  };

  getCurrentData = () => {
    const data: Record<string, any> = {};
    data['zyxPose'] = this.state.zyxPose;
    data['variableSelected'] = this.state.variableSelected;
    data['globalSystemVariable'] = this.state.globalSystemVariable;

    logger.debug(`[${UserCommandScreen2.TAG}] Send current data : ${JSON.stringify(data)}`);
    return data;
  };

  setCurrentData = (data: any) => {
    this.setState({
      zyxPose: data.zyxPose,
      //for Global/System Variable
      variableSelected: data.variableSelected,
      globalSystemVariable: data.globalSystemVariable,
    });
  };

  callbackSelectGlobalValue = (value: string) => {
    this.setState(
      {
        variableSelected: value,
      },
      this.sendDataToTaskEditor,
    );
  };
  /*****
   * Render Screen UI
   * Please make PiP Screen interface in the ThemeProvider. It'll make default design of PiP Screen.
   *****/
  render() {
    if (this.state.hasError) {
      return (
        <ThemeProvider theme={this.systemTheme}>
          <Box className={styles['error-container']}>
            <Box className={styles['error-title']}>
              Error Occurred
            </Box>
            <Box className={styles['error-message']}>
              {this.state.errorMessage}
            </Box>
            <Button
              variant="contained"
              onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            >
              Retry
            </Button>
          </Box>
        </ThemeProvider>
      );
    }

    return (
      <ThemeProvider theme={this.systemTheme}>
        <Box className={styles['pip-screen-container']}>
          <Box className={styles['pip-header']}>
            Convert Pose
          </Box>
          <Divider className={styles['pip-divider']}></Divider>
          <Grid
            container={true}
            rowSpacing={1}
            columns={1}
            direction="row"
            className={styles['pip-grid-container']}
          >
            <Grid item={true} className={styles['pip-grid-item-top']}>
              1. Enter zyx pose.
            </Grid>
            <Grid item={true} className={styles['task-pose-container']}>
              <TaskPoseControl
                pointName={'Point Name'}
                getPose={'Get Position'}
                moveTo={'Move To'}
                moduleContext={this.moduleContext}
                ref={this.taskPoseRef}
                targetPose={this.state.zyxPose}
              />
            </Grid>
            <Grid item={true} className={`${styles['pip-grid-item-full']} ${styles['pip-grid-item-spacing']}`}>
              2. Select a Global/System Variable to store the converted zyz
            </Grid>
            <Grid item={true} className={`${styles['pip-grid-item-full']} ${styles['pip-grid-item-spacing-small']}`}>
              <SetGlobalValue
                visible={true}
                // bool: 0, int: 1, flaot: 2, string: 3, posj: 4, posx: 5, list: 6, unknonwn: 7
                // e.g. const typeFilter = [0, 1, 2, 3, 7] as Number[];
                typeFilter={[5, 6] as number[]}
                variableList={this.state.globalSystemVariable}
                selectedVarName={this.state.variableSelected}
                ChangeGlobalValue={this.callbackSelectGlobalValue}
              />
            </Grid>
          </Grid>
        </Box>
      </ThemeProvider>
    );
  }
}
