/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import {
  ModuleContext,
  BaseModule,
  ModuleScreen,
  ModuleScreenProps,
  System,
  logger,
  ModuleService,
} from 'dart-api';
import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Box, Button, Grid } from '@mui/material';
import DrlUtils from './DrlUtils';
import IconImageYourCompanyLogo from './assets/images/image_your_company_logo.png';
import UserCommandPipScreen1 from './UserCommand/UserCommandScreen1';
import UserCommandPipScreen2 from './UserCommand/UserCommandScreen2';
import UserCommandService from './UserCommand/UserCommandService';
import MainPage1 from './MainPage1';
import MainPage2 from './MainPage2';

// IIFE for register a function to create an instance of main class which is inherited BaseModule.
(() => {
  System.registerModuleMainClassCreator(
    (packageInfo) => new Module(packageInfo),
  );
})();
class Module extends BaseModule {
  /*********
   * getModuleScreen
   * Select screen according to Screen componentId
   * Return Main Screen or PIP Screen
   * 1. Returns the screen (PIP Screen) Class of Screen's component ID.
   * reference. If you leave a log with logger.debug, you can check the log in 'C:\DART-Platform\logs'. To use logger, import {logger} from 'dart-api'; should be added.
   *********/
  getModuleScreen(componentId: string) {
    logger.debug(
      `getModuleScreen: ${this.packageInfo.packageName}, ${componentId}`,
    );

    //for main screen that opened when user clicked the module icon in the home module of dart-platform.
    if (componentId === 'MainScreen') {
      return MainScreen;
    }

    //for pip screen that opened when usr clicked the property tab in task editor module of dart-platform.
    if (componentId === 'usercommand_id1') {
      return UserCommandPipScreen1;
    }
    if (componentId === 'usercommand_id2') {
      return UserCommandPipScreen2;
    }
    return null;
  }

  /*********
   * getModuleService
   * Select Service according to Service componentId
   * Return User Command Service
   * 2. Add a getModuleService function, which returns a service Class.
   *********/
  getModuleService(componentId: string): typeof ModuleService | null {
    logger.debug(
      `getModuleService: ${this.packageInfo.packageName}, ${componentId}`,
    );
    return UserCommandService;
  }
}
class MainScreen extends ModuleScreen {
  constructor(props: ModuleScreenProps) {
    //Add State. One state is required for each input component on the screen.
    super(props);
    this.state = {
      page: 0,
    };
  }
  async componentDidMount() {
    logger.debug(`componentDidMount: ${this.moduleContext.componentId}`);
  }
  componentWillUnmount() {
    // Must delete DrlUtils Instance to free up memory
    DrlUtils.deleteInstance();
  }
  handleSetPage = (page: number) => {
    this.setState({
      page: page,
    });
  };
  render() {
    return (
      <ThemeProvider theme={this.systemTheme}>
        <Box
          sx={{
            'height': '80px',
            'width': '100%',
            'border': '0.1px solid #ccc',
            'borderRadius': 0,
            'boxShadow': '0 0 0 1px #ccc',
            'display': 'flex',
          }}
        >
          <Box
            id="typography_3f57"
            sx={{
              flex: '0.9',
              'fontSize': '24px',
              'fontWeight': 'bold',
              'paddingLeft': '20px',
              'paddingTop': '24px',
            }}
          >
            Global Settings Sample
          </Box>
          <Box
            id="box_img"
            sx={{
              flex: '0.1',
              'fontSize': '24px',
              'fontWeight': 'bold',
              'paddingRight': '20px',
              'paddingTop': '18px',
            }}
          >
            <img
              alt={'alternative'}
              id="img_19bf"
              src={IconImageYourCompanyLogo}
              style={{
                width: '200px',
                height: '41.31px',
              }}
            />
          </Box>
        </Box>
        <Box
          sx={{
            'height': 'calc(100% - 80px)',
            'width': '100%',
            'display': 'flex',
          }}
        >
          <Box
            sx={{
              'width': '190px',
              'padding': '10px',
              'border': '0.1px solid #ccc',
              'borderRadius': 0,
              'boxShadow': '0 0 0 1px #ccc',
            }}
          >
            <PageButtons page={this.state.page} setPage={this.handleSetPage} />
          </Box>
          <Box
            sx={{
              'width': 'calc(100% - 190px)',
              'border': '0.1px solid #ccc',
              'borderRadius': 0,
              'boxShadow': '0 0 0 1px #ccc',
            }}
          >
            <Page moduleContext={this.moduleContext} page={this.state.page} />
          </Box>
        </Box>
      </ThemeProvider>
    );
  }
}
interface IPageButtons {
  page: number;
  setPage: (page: number) => void;
}
function PageButtons(props: IPageButtons) {
  const { page, setPage } = props;
  // const { t } = useTranslation();
  return (
    <Grid>
      <Button
        sx={{
          'width': '100%',
          'height': '50px',
          'display': 'inline',
          'textAlign': 'left',
        }}
        onClick={() => {
          setPage(0);
        }}
        disabled={page === 0 ? true : false}
      >
        1. Set Device IP
      </Button>
      <Button
        sx={{
          'marginTop': '10px',
          'width': '100%',
          'height': '50px',
          'display': 'inline',
          'textAlign': 'left',
        }}
        onClick={() => {
          setPage(1);
        }}
        disabled={page === 1 ? true : false}
      >
        2. Set Initial Pose
      </Button>
    </Grid>
  );
}
interface IPageProps {
  moduleContext: ModuleContext;
  page: number;
}
function Page(props: IPageProps) {
  if (props.page === 0) {
    return <MainPage1 moduleContext={props.moduleContext} />;
  } else if (props.page === 1) {
    return <MainPage2 moduleContext={props.moduleContext} />;
  } else {
    return <MainPage1 moduleContext={props.moduleContext} />;
  }
}
