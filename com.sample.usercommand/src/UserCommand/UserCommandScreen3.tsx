/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import {
  IModuleChannel,
  ModuleScreenProps,
  ModuleScreen,
  logger,
  Message,
} from 'dart-api';
//UI Setting
import { ThemeProvider } from '@mui/material/styles';
import React from 'react';
import {
  Box,
  Button,
  Divider,
  Grid,
  TextField,
} from '@mui/material';
import {
  CHANNEL_GET_CURRENT_DATA,
  CHANNEL_DATA_CHANGED
} from './ChannelConstants';
import styles from './UserCommandScreen.scss';

interface userCommandState3 {
  folderName: string;
  description: string;
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
export default class UserCommandScreen3 extends ModuleScreen {
  private static readonly TAG = 'UserCommandScreen3';
  //Use for data change
  private channel = {} as IModuleChannel;

  // Initialize state in PIP Screen.
  constructor(props: ModuleScreenProps) {
    super(props);
    this.state = {
      folderName: 'MyFolder',
      description: '',
      hasError: false,
      errorMessage: '',
    } as userCommandState3;
  }

  //Update savedData recieved from Task Editor Module
  async componentDidMount() {
    if (Object.prototype.hasOwnProperty.call(this.message.data, 'savedData')) {
      const savedData = this.message.data?.savedData;
      logger.debug(`[${UserCommandScreen3.TAG}] savedData: ${JSON.stringify(savedData)}`);

      if (savedData === null) return;

      //update state from savedData in Task Editor Module.
      this.setCurrentData(savedData);
    }
  }

  // Called when screen's visible state has been changed.
  onScreenVisible(visible: boolean): void {
    //logger.debug(`[${UserCommandScreen3.TAG}] onScreenVisible: ${visible}`);
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Catch errors from child components
    logger.error(`[${UserCommandScreen3.TAG}] Error caught: ${error.message}, Component Stack: ${errorInfo.componentStack}`);
    this.setState({
      hasError: true,
      errorMessage: error.message,
    });
  }

  // Check validity: -1 (Error), 0 (Invalid), 1 (Valid)
  // TODO: Customize this validation logic for your use case
  getValidity = (data: any): number => {
    // Check for errors (critical issues that prevent execution)
    if (!data.folderName || data.folderName.trim() === '') {
      return -1; // Error: folder name is required
    }

    // Check if folderName is a valid string
    if (typeof data.folderName !== 'string') {
      return -1; // Error: folderName must be string
    }

    // Check if folderName contains only valid characters (alphanumeric and underscore)
    const validNamePattern = /^[a-zA-Z0-9_]+$/;
    if (!validNamePattern.test(data.folderName)) {
      return -1; // Error: folderName contains invalid characters
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
        logger.debug(`[${UserCommandScreen3.TAG}] get_current_data(receive):`);
        const currentData = this.getCurrentData();
        const validity = this.getValidity(currentData);

        // V2 response format with validity and summary
        // summary: Displayed next to command in Task Tree
        // Note: Task Editor will automatically create "End Custom Folder" command
        const response = {
          data: currentData,
          validity: validity,
          summary: `Folder: ${currentData.folderName}${currentData.description ? ' - ' + currentData.description : ''}` // TODO: Customize this message shown in Task Tree
        };

        logger.debug(
          `[${UserCommandScreen3.TAG}] get_current_data(response): ${JSON.stringify(response)}`,
        );

        channel.send(CHANNEL_GET_CURRENT_DATA, response);
      } catch (error: any) {
        logger.error(`[${UserCommandScreen3.TAG}] Error in get_current_data: ${error.message}`);
      }
    });

    return true;
  }

  //Send "data_changed" message when the data changed.
  sendDataToTaskEditor = () => {
    try {
      if (this.channel.send !== undefined) {
        logger.debug(`[${UserCommandScreen3.TAG}] data_changed`);
        const currentData = this.getCurrentData();
        const validity = this.getValidity(currentData);

        // V2 response format with validity and summary
        // summary: Displayed next to command in Task Tree
        // Note: Task Editor will automatically create "End Custom Folder" command
        const response = {
          data: currentData,
          validity: validity,
          summary: `Folder: ${currentData.folderName}${currentData.description ? ' - ' + currentData.description : ''}` // TODO: Customize this message shown in Task Tree
        };

        // 4. Send data to Task Editor with V2 format
        logger.debug(`[${UserCommandScreen3.TAG}] Send current data : ${JSON.stringify(response)}`);
        this.channel.send(CHANNEL_DATA_CHANGED, response);
      }
    } catch (error: any) {
      logger.error(`[${UserCommandScreen3.TAG}] Error in sendDataToTaskEditor: ${error.message}`);
    }
  };

  getCurrentData = () => {
    const data: Record<string, any> = {};
    data['folderName'] = this.state.folderName;
    data['description'] = this.state.description;
    return data;
  };

  setCurrentData = (data: any) => {
    this.setState({
      folderName: data.folderName || 'MyFolder',
      description: data.description || '',
    });
  };

  handleChangeFolderName = (event: any) => {
    this.setState({
      folderName: event.target.value,
    });
  };

  handleChangeDescription = (event: any) => {
    this.setState({
      description: event.target.value,
    });
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
            Custom Folder
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
              Folder Name
            </Grid>
            <Grid item className={styles['pip-grid-item']}>
              <TextField
                id="textfield_folder_name"
                fullWidth
                value={this.state.folderName}
                onChange={this.handleChangeFolderName}
                onBlur={this.sendDataToTaskEditor}
                placeholder="Enter folder name"
              />
            </Grid>
          </Grid>
          <Box className={styles['note-box']}>
            <strong>Note:</strong> This command creates a start-end folder structure. Task Editor will automatically create an "End Custom Folder" command. All tasks between Start and End will be grouped under this folder.
          </Box>
        </Box>
      </ThemeProvider>
    );
  }
}
