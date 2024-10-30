/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import { ModuleContext, Context, logger, SixNumArray } from 'dart-api';
import { EulerType, IMathLibrary } from 'dart-api/dart-api-math';
import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Box, TextField } from '@mui/material';
import TaskPoseControl, { TaskPoseControlAPI } from './uc/task.pose.control';
import Database, { IDBData, InitialDBData, TABLE_COLUMN_IP, TABLE_COLUMN_INIT_POSE } from './DatabaseManager';
interface IMainPage1 {
    moduleContext: ModuleContext;
}

export default function MainPage1(props: IMainPage1) {
    const [deviceIp, SetDeviceIp] = useState('');
    const mathLibrary = props.moduleContext.getSystemLibrary(Context.MATH_LIBRARY) as IMathLibrary;
    //const { t } = useTranslation();

    const db = new Database(props.moduleContext);

    useEffect(async () => {
        // ComponentDidMount timing

        // Get Ip from database
        await db.initialize();
        let data = await db.getDataAll();

        if (data === null) data = InitialDBData;
        // const ip = await db.getData(TABLE_COLUMN_IP);
        // const initPose = await db.getData(TABLE_COLUMN_INIT_POSE);

        // Update state for changing IP in TextField UI Component
        SetDeviceIp(data?.ip);

        // ComponentWillUnmount timing
        return () => {};
    }, []);

    return (
        <Box
            sx={{
                'height': '40px',
                'marginLeft': '20px',
                'marginTop': '20px',
            }}
            id="box_18c8"
        >
            <Box
                sx={{
                    alignItems: 'left',
                    display: 'flex',
                    'height': '60px',
                    'width': '460px',
                }}
                id="box_323e"
            >
                <Box
                    sx={{
                        'fontFamily': 'Noto Sans',
                        'fontWeight': 'bold',
                        'height': '40px',
                        'width': '250px',
                    }}
                >
                    1.Set your device IP
                </Box>
                <TextField
                    id="textfield_de61"
                    sx={{
                        '& .MuiFormLabel-root': {
                            'fontSize': '16px',
                        },
                    }}
                    value={deviceIp}
                    //6. Change the state value when the onChange Event occurs in TextField.
                    onChange={(event) => {
                        SetDeviceIp(event.target.value);
                    }}
                    // 7. When the onBlur (out of focus) Event occurs in the TextField, the value is saved in the DB.
                    // Call a function when a user leaves an input field  https://www.w3schools.com/jsref/event_onblur.asp#
                    onBlur={async (event) => {
                        const data = {
                            ip: event.target.value,
                        } as IDBData;
                        await db.saveData(TABLE_COLUMN_IP, data.ip);
                    }}
                    placeholder={'Device IP'}
                />
            </Box>
        </Box>
    );
}
