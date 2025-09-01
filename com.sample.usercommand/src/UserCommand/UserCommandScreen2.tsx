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
import { Box, Divider, Grid } from '@mui/material';
import Database from '../DatabaseManager';
import TaskPoseControl, { TaskPoseControlAPI } from '../uc/task.pose.control';
import { EulerType, IMathLibrary } from 'dart-api/dart-api-math';
import SetGlobalValue from './SetGlobalValue';

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
    };
  }

  //Update savedData recieved from Task Editor Module
  async componentDidMount() {
    this.taskPoseRef.current?.onChange(this.handleChangePoseCallback);

    //[Optional] Update data from the configured database on the main screen in this Module
    this.db = new Database(this.moduleContext);
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
      logger.debug(`savedData: ${JSON.stringify(savedData)}`);

      if (savedData === null) return;

      //update state from savedData in Task Editor Module.
      this.setCurrentData(savedData);
    }
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
    logger.debug(`zyx: ${zyxPose} / zyz: ${zyz.pose}`);
    return zyz.pose;
  };

  //OnBind. When Task Editor save Task, Send saved data.
  onBind(message: Message, channel: IModuleChannel): boolean {
    this.channel = channel;

    // Task Editor Module: Send "get_current_data" message.
    // User Command Module: Receive "get_current_data" message and send "get_current_data" message with current data.
    channel.receive('get_current_data', () => {
      const data: Record<string, any> = this.getCurrentData();

      //Send current data to Task Editor
      channel.send('get_current_data', data);
    });

    // Get global variables
    channel.receive('get_variables', (data) => {
      logger.debug(`get variables receive : ${JSON.stringify(data)}`);
      if (data) {
        this.setState({ globalSystemVariable: data });
      }
    });

    // Send 'get_variables' request to the task editor module after add receive callback in onBind
    setTimeout(() => {
      logger.debug('get variables send');
      this.channel.send('get_variables');
    }, 1000);

    channel.receive('changed_variables', (data) => {
      logger.debug(
        `changed_variables request with data: ${JSON.stringify(data)}`,
      );
      if (data) {
        this.setState({ globalSystemVariable: data });
      }
    });

    return true;
  }

  //Send "data_changed" message when the data changed.
  sendDataToTaskEditor = () => {
    if (this.channel.send !== undefined) {
      logger.debug('data_changed');
      const data: Record<string, any> = this.getCurrentData();

      //Send changed data to Task Editor
      this.channel.send('data_changed', data);
    }
  };

  getCurrentData = () => {
    const data: Record<string, any> = {};
    data['zyxPose'] = this.state.zyxPose;
    data['variableSelected'] = this.state.variableSelected;
    data['globalSystemVariable'] = this.state.globalSystemVariable;

    logger.debug(`Send current data : ${JSON.stringify(data)}`);
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
    return (
      <ThemeProvider theme={this.systemTheme}>
        <Box
          sx={{
            'height': '600px',
            'marginLeft': '0px',
            'marginTop': '0px',
            'minHeight': '100px',
            'paddingLeft': '20px',
            'paddingTop': '20px',
            'width': '484px',
          }}
          id="box_101d"
        >
          <Box
            id="typography_3f57"
            sx={{
              'fontSize': '20px',
              'fontWeight': 'bold',
              'height': '40px',
              'marginTop': '0px',
              'paddingTop': '0px',
            }}
          >
            User Command Sample2 Name
          </Box>
          <Divider
            id="divider_1839"
            sx={{
              'marginBottom': '20px',
              'marginRight': '20px',
              'marginTop': '10px',
            }}
          ></Divider>
          <Grid
            sx={{
              'width': '440px',
              display: 'flex',
              alignItems: 'top',
            }}
            container={true}
            id="box_323e"
            rowSpacing={1}
            columns={1}
            direction="row"
          >
            <Grid
              item={true}
              sx={{
                'width': '100%',
                display: 'flex',
                alignItems: 'center',
                'zIndex': 2,
              }}
            >
              1. Enter zyx pose.
            </Grid>
            <Grid
              item={true}
              sx={{
                'width': '100%',
                'height': '260px',
                'marginLeft': '-10px',
                'marginTop': '-10px',
                'zIndex': 1,
              }}
            >
              <TaskPoseControl
                pointName={'Point Name'}
                getPose={'Get Position'}
                moveTo={'Move To'}
                moduleContext={this.moduleContext}
                ref={this.taskPoseRef}
                targetPose={this.state.zyxPose}
              />
            </Grid>
            <Grid
              item={true}
              sx={{
                'width': '100%',
                'marginTop': '20px',
              }}
            >
              2. Select a Global/System Variable to store the converted zyz
            </Grid>
            <Grid
              item={true}
              sx={{
                'width': '100%',
                'marginTop': '10px',
              }}
            >
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
