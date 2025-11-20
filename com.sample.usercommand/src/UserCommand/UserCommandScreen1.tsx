/*
    BSD 3-Clause License
    Copyright (c) 2025, Doosan Robotics Inc.
*/
import {
  IModuleChannel,
  ModuleScreenProps,
  ModuleScreen,
  logger,
  Message,
  SixNumArray,
} from 'dart-api';
//UI Setting
import { ThemeProvider } from '@mui/material/styles';
import React, { ChangeEvent } from 'react';
import {
  Box,
  Divider,
  Grid,
  Switch,
  TextField,
  FormControlLabel,
  Button,
} from '@mui/material';
import Database from '../DatabaseManager';
import {
  CHANNEL_GET_CURRENT_DATA,
  CHANNEL_DATA_CHANGED,
} from './ChannelConstants';
import styles from './UserCommandScreen.scss';

interface userCommandState1 {
  waitTime: number;
  useOverridePose: boolean;
  //initPose data from DB but it will be overwritten with the user-input value.
  initPose: {
    pose: SixNumArray;
    coord: number;
  };
  //ip data from DB.
  globalInitPose: {
    pose: SixNumArray;
    coord: number;
  };
  globalDeviceIp: string;
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
export default class UserCommandScreen1 extends ModuleScreen {
  private static readonly TAG = 'UserCommandScreen1';
  //Use for data change
  private channel = {} as IModuleChannel;
  private db = {} as Database;


  // Initialize state in PIP Screen.
  constructor(props: ModuleScreenProps) {
    super(props);
    this.state = {
      waitTime: 0,
      useOverridePose: false,
      //initPose data from DB but it will be overwritten with the user-input value.
      initPose: {
        pose: [0, 0, 0, 0, 0, 0],
        coord: 0,
      },
      //ip data from DB.
      globalInitPose: {
        pose: [0, 0, 0, 0, 0, 0],
        coord: 0,
      },
      globalDeviceIp: '',
      hasError: false,
      errorMessage: '',
    } as userCommandState1;
  }

  //Update savedData recieved from Task Editor Module
  async componentDidMount() {
    //[Optional] Update data from the configured database on the main screen in this Module
    this.db = Database.getInstance(this.moduleContext);
    const dbData = await this.db.getDataAll();
    this.setState({
      globalDeviceIp: dbData?.ip,
      globalInitPose: {
        pose: dbData?.initPose.pose,
        coord: dbData?.initPose.coord,
      },
    });

    if (!this.state.useOverridePose) {
      this.setState({
        initPose: {
          pose: dbData?.initPose.pose,
          coord: dbData?.initPose.coord,
        },
      });
    }

    if (Object.prototype.hasOwnProperty.call(this.message.data, 'savedData')) {
      // const version = this.message.data['savedVersion'];
      const savedData = this.message.data?.savedData;
      logger.debug(`[${UserCommandScreen1.TAG}] savedData: ${JSON.stringify(savedData)}`);

      if (savedData === null) return;

      //update state from savedData in Task Editor Module.
      this.setCurrentData(savedData);
    }
  }

  // Called when screen's focus state has been changed.
  // onScreenFocused(focused: boolean): void {
  //     // empty
  // };

  // Called when screen's visible state has been changed.
  onScreenVisible(visible: boolean): void {
    //logger.debug(`[${UserCommandScreen1.TAG}] onScreenVisible: ${visible}`);
    if (!visible) return;

    this.db = Database.getInstance(this.moduleContext);
    this.db.getDataAll().then((dbData) => {
      this.setState({
        globalDeviceIp: dbData?.ip,
        globalInitPose: {
          pose: dbData?.initPose.pose,
          coord: dbData?.initPose.coord,
        },
      });

      if (!this.state.useOverridePose) {
        this.setState({
          initPose: {
            pose: dbData?.initPose.pose,
            coord: dbData?.initPose.coord,
          },
        });
      }
    });
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Catch errors from child components
    logger.error(`[${UserCommandScreen1.TAG}] Error caught: ${error.message}, Component Stack: ${errorInfo.componentStack}`);
    this.setState({
      hasError: true,
      errorMessage: error.message,
    });
  }

  // Check validity: -1 (Error), 0 (Invalid), 1 (Valid)
  // TODO: Customize this validation logic for your use case
  getValidity = (data: any): number => {
    // Check for errors (critical issues that prevent execution)
    if (data.waitTime < 0) {
      return -1; // Error: negative wait time
    }

    // Check initPose validity
    if (!data.initPose || !data.initPose.pose) {
      return -1; // Error: initPose not defined
    }

    // Check if initPose.pose is an array with 6 elements
    if (!Array.isArray(data.initPose.pose) || data.initPose.pose.length !== 6) {
      return -1; // Error: initPose must be array of 6 numbers
    }

    // Check if all pose values are valid numbers
    for (const value of data.initPose.pose) {
      if (typeof value !== 'number' || isNaN(value)) {
        return -1; // Error: invalid pose value
      }
    }

    // Check if useOverridePose is a boolean
    if (typeof data.useOverridePose !== 'boolean') {
      return -1; // Error: useOverridePose must be boolean
    }

    // TODO: Add invalid state checks (incomplete but not critical)
    // Example: if (data.someOptionalField === '') { return 0; }

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
        logger.debug(`[${UserCommandScreen1.TAG}] get_current_data(receive):`);
        const currentData = this.getCurrentData();
        const validity = this.getValidity(currentData);

        // V2 response format with validity and summary
        // summary: Displayed next to command in Task Tree
        const poseArray = currentData.initPose?.pose || [0, 0, 0, 0, 0, 0];
        const response = {
          data: currentData,
          validity: validity,
          summary: `Wait ${currentData.waitTime}s, ${currentData.useOverridePose ? 'Custom' : 'Global'} pose [${poseArray.map((v: number) => v.toFixed(1)).join(',')}]` // TODO: Customize this message shown in Task Tree
        };

        logger.debug(
          `[${UserCommandScreen1.TAG}] get_current_data(response): ${JSON.stringify(response)}`,
        );

        channel.send(CHANNEL_GET_CURRENT_DATA, response);
      } catch (error: any) {
        logger.error(`[${UserCommandScreen1.TAG}] Error in get_current_data: ${error.message}`);
      }
    });

    return true;
  }

  //Send "data_changed" message when the data changed.
  sendDataToTaskEditor = () => {
    try {
      if (this.channel.send !== undefined) {
        logger.debug(`[${UserCommandScreen1.TAG}] data_changed`);
        const currentData = this.getCurrentData();
        const validity = this.getValidity(currentData);

        // V2 response format with validity and summary
        // summary: Displayed next to command in Task Tree
        const poseArray = currentData.initPose?.pose || [0, 0, 0, 0, 0, 0];
        const response = {
          data: currentData,
          validity: validity,
          summary: `Wait ${currentData.waitTime}s, ${currentData.useOverridePose ? 'Custom' : 'Global'} pose [${poseArray.map((v: number) => v.toFixed(1)).join(',')}]` // TODO: Customize this message shown in Task Tree
        };

        // 4. Send data to Task Editor with V2 format
        logger.debug(`[${UserCommandScreen1.TAG}] Send current data : ${JSON.stringify(response)}`);
        this.channel.send(CHANNEL_DATA_CHANGED, response);
      }
    } catch (error: any) {
      logger.error(`[${UserCommandScreen1.TAG}] Error in sendDataToTaskEditor: ${error.message}`);
    }
  };

  getCurrentData = () => {
    const data: Record<string, any> = {};
    data['waitTime'] = this.state.waitTime;
    data['useOverridePose'] = this.state.useOverridePose;
    data['initPose'] = this.state.initPose;
    return data;
  };

  setCurrentData = (data: any) => {
    this.setState({
      waitTime: data.waitTime,
      useOverridePose: data.useOverridePose,
    });

    const pose = data.useOverridePose
      ? data.initPose.pose
      : [...this.state.globalInitPose.pose];
    const coord = this.state.initPose.coord;
    this.setState({
      initPose: { pose, coord },
    });
  };

  handleChangeWaitTime = (event: any) => {
    this.setState({
      waitTime: event.target.value,
    });
  };

  handleChangeInitPose = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    this.setState((prevState: userCommandState1) => ({
      initPose: {
        ...prevState.initPose,
        pose: event.target.value,
      },
    }));
  };

  handleChangeUseOverride = (event: ChangeEvent<HTMLInputElement>) => {
    const used = event.target.checked;
    this.setState(
      {
        useOverridePose: used,
      },
      this.sendDataToTaskEditor,
    );

    if (!used) {
      this.setState({
        initPose: { ...this.state.globalInitPose },
      });
    }
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
            Connect & Move
          </Box>
          <Divider className={styles['pip-divider']} />
          <Grid
            container
            rowSpacing={3}
            columns={2}
            direction="row"
            className={styles['pip-grid-container']}
          >
            <Grid item className={styles['pip-grid-item']}>
              1. Connect to device
            </Grid>
            <Grid item className={styles['pip-grid-item']}>
              <TextField
                id="textfield_de61"
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
                value={this.state.globalDeviceIp}
              />
            </Grid>
            <Grid item className={styles['pip-grid-item']}>
              2. Wait for seconds
            </Grid>
            <Grid item className={styles['pip-grid-item']}>
              <TextField
                id="textfield_de61"
                fullWidth
                value={this.state.waitTime}
                onChange={this.handleChangeWaitTime}
                onBlur={this.sendDataToTaskEditor}
                defaultValue={0}
                type="number"
              />
            </Grid>
            <Grid item className={styles['pip-grid-item']}>
              3. Move Initial Pose
            </Grid>
            <Grid item className={styles['pip-grid-item-end']}>
              <FormControlLabel
                control={
                  <Switch
                    id="switch_837a"
                    checked={this.state.useOverridePose}
                    onChange={this.handleChangeUseOverride}
                  />
                }
                label="Use Override"
                labelPlacement="start"
              />
            </Grid>
            <Grid item className={styles['pip-grid-item-full']}>
              <TextField
                id="textfield_pose"
                fullWidth
                InputProps={{
                  readOnly: !this.state.useOverridePose,
                }}
                value={this.state.initPose.pose}
                onChange={this.handleChangeInitPose}
                onBlur={this.sendDataToTaskEditor}
              />
            </Grid>
          </Grid>
        </Box>
      </ThemeProvider>
    );
  }
}
