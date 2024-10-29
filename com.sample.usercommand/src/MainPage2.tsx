/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import { ModuleContext, Context, logger, SixNumArray } from 'dart-api';
import { EulerType, IMathLibrary } from 'dart-api/dart-api-math';
import React, { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Box, Divider, TextField, Typography } from '@mui/material';
import IconImageYourCompanyLogo from './assets/images/image_your_company_logo.png';
import TaskPoseControl, { TaskPoseControlAPI } from './uc/task.pose.control';
import Database, { IDBData, InitialDBData, TABLE_COLUMN_IP, TABLE_COLUMN_INIT_POSE } from './DatabaseManager';
interface IMainPage2 {
    moduleContext: ModuleContext;
}

export default function MainPage2(props: IMainAppProps) {
    const [coord, SetCoord] = useState(0);
    const [pose, SetPose] = useState([0, 0, 0, 0, 0, 0] as SixNumArray);

    const taskPoseRef = useRef<TaskPoseControlAPI>(null);
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

        SetPose(data?.initPose.pose);
        SetCoord(data?.initPose.coord);
        taskPoseRef.current?.onChange(savePoseCallback);

        // ComponentWillUnmount timing
        return () => {};
    }, []);

    const savePoseCallback = async (poseZyx: SixNumArray) => {
        // let zyz = mathLibrary.convertEuler(
        //     {
        //         pose: poseZyx,
        //         type: EulerType.ZYX,
        //     },
        //     EulerType.ZYZ,
        // );
        // logger.debug(`zyx: ${poseZyx}, zyz: ${zyz.pose}`);
        // logger.debug(`coord:${coord}`);
        SetCoord(coord);
        SetPose(poseZyx);
        await db.saveData(TABLE_COLUMN_INIT_POSE, {
            pose: poseZyx,
            coord: coord
        });
    };

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
                    display: 'block',
                    'height': '300px',
                    'width': '460px',
                }}
                id="box_323f"
            >
                <Box
                    sx={{
                        'fontFamily': 'Noto Sans',
                        'fontWeight': 'bold',
                        'height': '40px',
                        'width': '200px',
                    }}
                >
                    2.Set initial pose
                </Box>
                <Box
                    sx={{
                        'height': '40px',
                        'width': '200px',
                    }}
                >
                    <TaskPoseControl
                        pointName={'Point Name'}
                        getPose={'Get Position'}
                        moveTo={'Move To'}
                        moduleContext={props.moduleContext}
                        id="taskposecontrol_81d7"
                        ref={taskPoseRef}
                        // moveReference={coord}
                        targetPose={pose}
                    ></TaskPoseControl>
                </Box>
            </Box>
        </Box>
    );
}
