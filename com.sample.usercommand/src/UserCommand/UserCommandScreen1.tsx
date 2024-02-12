/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import { ModuleContext, IModuleChannel, ModuleScreenProps, ModuleScreen, logger } from 'dart-api';
//UI Setting
import { ThemeProvider } from '@mui/material/styles';
import styles from '../assets/styles/styles.scss';
import React from 'react';
import { Box, Divider, Grid, Switch, TextField, FormControlLabel } from '@mui/material';
import Database from '../DatabaseManager';

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
            initPose: [0, 0, 0, 0, 0, 0],
            //ip data from DB.
            globalInitPose: [0, 0, 0, 0, 0, 0],
            globalDeviceIp: '',
        };
    }

    //Update savedData recieved from Task Editor Module
    async componentDidMount() {
        //[Optional] Update data from the configured database on the main screen in this Module
        this.db = new Database(this.moduleContext);
        const dbData = await this.db.getDataAll();
        this.setState({
            globalDeviceIp: dbData?.ip,
            globalInitPose: dbData?.initPose,
        });
        
        if (!this.state.useOverridePose){
            this.setState({
                initPose: dbData?.initPose,
            });
        }

        if (this.message.data?.hasOwnProperty('savedData')) {
            // const version = this.message.data['savedVersion'];
            const savedData = this.message.data['savedData'];
            logger.debug(`savedData: ${JSON.stringify(savedData)}`);

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
        //logger.debug(`onScreenVisible: ${visible}`);
        this.db = new Database(this.moduleContext);
        const dbData = await this.db.getDataAll();
        this.setState({
            globalDeviceIp: dbData?.ip,
            globalInitPose: dbData?.initPose,
        });
        
        if (!this.state.useOverridePose){
            this.setState({
                initPose: dbData?.initPose,
            });
        }
    }

    //OnBind. When Task Editor save Task, Send saved data.
    onBind(message: Message, channel: IModuleChannel): boolean {
        this.channel = channel;

        // Task Editor Module: Send "get_current_data" message.
        // User Command Module: Receive "get_current_data" message and send "get_current_data" message with current data.
        channel.receive('get_current_data', () => {
            const data: Record<string, any> = this.getCurrentData();
            logger.debug(`channel receive : get_current_data(${JSON.stringify(data)})`);

            channel.send('get_current_data', data);
        });

        return true;
    }

    //Send "data_changed" message when the data changed.
    sendDataToTaskEditor = () => {
        if (this.channel.send !== undefined) {
            logger.debug('data_changed');
            const data: Record<string, any> = this.getCurrentData();

            // 4. Send data to Task Editor
            logger.debug(`Send current data : ${JSON.stringify(data)}`);
            this.channel.send('data_changed', data);
        }
    };

    getCurrentData = () => {
        const data: Record<string, any> = {};
        data['waitTime'] = this.state.waitTime;
        data['useOverridePose'] = this.state.useOverridePose;
        data['initPose'] = this.state.initPose;
        return data;
    };

    setCurrentData = (data : any) => {
        this.setState({
            waitTime: data.waitTime,
            useOverridePose: data.useOverridePose,
        });

        this.setState({
            initPose: data.useOverridePose? data.initPose : this.state.globalInitPose,
        });
    }

    handleChangeWaitTime = (event : any) => {
        this.setState({
            waitTime: event.target.value,
        })
    }

    handleChangeinitPose = (event : any) => {
        this.setState({
            initPose: event.target.value,
        })
    }

    handleChangeUseOverride = (event : any) => {
        let used = !this.state.useOverridePose;
        this.setState(
            {
                useOverridePose: used,
            },
            this.sendDataToTaskEditor,
        );
        
        if (!used){
            this.setState({
                initPose: this.state.globalInitPose,
            });
        }
    }

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
                        User Command Sample1 Name
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
                            'height': '40px',
                            'width': '440px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                        container={true}
                        id="box_323e"
                        rowSpacing={3}
                        columns={2}
                        direction="row"
                    >
                        <Grid
                            item={true}
                            sx={{
                                'width': '50%',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            1. Connect to device
                        </Grid>
                        <Grid
                            item={true}
                            sx={{
                                'width': '50%',
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            <TextField
                                id="textfield_de61"
                                sx={{
                                    'width': '100%',
                                }}
                                InputProps={{
                                    'readOnly': true,
                                }}
                                value={this.state.globalDeviceIp}
                            />
                        </Grid>
                        <Grid
                            item={true}
                            sx={{
                                'width': '50%',
                            }}
                        >
                            2. Wait for seconds
                        </Grid>
                        <Grid
                            item={true}
                            sx={{
                                'width': '50%',
                            }}
                        >
                            <TextField
                                id="textfield_de61"
                                sx={{
                                    'width': '100%',
                                }}
                                value={this.state.waitTime}
                                onChange={this.handleChangeWaitTime}
                                onBlur={this.sendDataToTaskEditor}
                                defaultValue={0}
                                type="number"
                            />
                        </Grid>
                        <Grid
                            item={true}
                            sx={{
                                'width': '50%',
                            }}
                        >
                            3. Move Initial Pose
                        </Grid>
                        <Grid
                            item={true}
                            sx={{
                                'width': '50%',
                                display: 'flex',
                                justifyContent: 'flex-end',
                            }}
                        >
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
                        <Grid
                            item={true}
                            sx={{
                                'width': '100%',
                            }}
                        >
                            <TextField
                                id="textfield_pose"
                                sx={{
                                    'width': '100%',
                                }}
                                InputProps={{
                                    'readOnly': !this.state.useOverridePose,
                                }}
                                value={this.state.initPose}
                                // 6. Change the state value when the onChange Event occurs in TextField.
                                onChange={this.handleChangeinitPose}
                                onBlur={this.sendDataToTaskEditor}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </ThemeProvider>
        );
    }
}
