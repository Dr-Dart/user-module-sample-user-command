/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import { ModuleContext, SixNumArray } from 'dart-api';
import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import TaskPoseControl, { TaskPoseControlAPI } from './uc/task.pose.control';
import Database, {
  InitialDBData,
  TABLE_COLUMN_INIT_POSE,
} from './DatabaseManager';
interface IMainPage2 {
  moduleContext: ModuleContext;
}

export default function MainPage2(props: IMainPage2) {
  const [coord, SetCoord] = useState(0);
  const [pose, SetPose] = useState([0, 0, 0, 0, 0, 0] as SixNumArray);

  const taskPoseRef = useRef<TaskPoseControlAPI>(null);

  const db = new Database(props.moduleContext);

  useEffect(() => {
    // ComponentDidMount timing
    const isInit = async () => {
      // Get Ip from database
      await db.initialize();
      let data = await db.getDataAll();

      if (data === null) data = InitialDBData;

      SetPose(data.initPose.pose);
      SetCoord(data.initPose.coord);
      taskPoseRef.current?.onChange(savePoseCallback);
    };
    isInit();

    // ComponentWillUnmount timing
    //return () => {};
  }, []);

  const savePoseCallback = async (poseZyx: SixNumArray) => {
    // const mathLibrary = props.moduleContext.getSystemLibrary(
    //   Context.MATH_LIBRARY,
    // ) as IMathLibrary;
    // let zyz = mathLibrary.convertEuler(
    //     {
    //         pose: poseZyx,
    //         type: EulerType.ZYX,
    //     },
    //     EulerType.ZYZ,
    // );
    // logger.debug(`zyx: ${poseZyx}, zyz: ${zyz.pose}`);
    // logger.debug(`coord:${coord}`);
    // SetCoord(coord);
    // SetPose(poseZyx);
    await db.saveData(TABLE_COLUMN_INIT_POSE, {
      pose: poseZyx,
      coord: coord,
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
            ref={taskPoseRef}
            // moveReference={coord}
            targetPose={pose}
          />
        </Box>
      </Box>
    </Box>
  );
}
