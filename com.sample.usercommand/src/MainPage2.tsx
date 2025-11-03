/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import { ModuleContext, SixNumArray } from 'dart-api';
import React, { useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import RouteIcon from '@mui/icons-material/Route';
import TaskPoseControl, { TaskPoseControlAPI } from './uc/task.pose.control';
import Database, {
  InitialDBData,
  TABLE_COLUMN_INIT_POSE,
} from './DatabaseManager';
import styles from './MainPage2.scss';

interface IMainPage2 {
  moduleContext: ModuleContext;
}

export default function MainPage2(props: IMainPage2) {
  const [coord, SetCoord] = useState(0);
  const [pose, SetPose] = useState([0, 0, 0, 0, 0, 0] as SixNumArray);

  const taskPoseRef = useRef<TaskPoseControlAPI>(null);

  const db = Database.getInstance(props.moduleContext);

  useEffect(() => {
    const isInit = async () => {
      let data = await db.getDataAll();
      if (data === null) data = InitialDBData;

      SetPose(data.initPose.pose);
      SetCoord(data.initPose.coord);
      taskPoseRef.current?.onChange(savePoseCallback);
    };
    isInit();
  }, []);

  const savePoseCallback = async (poseZyx: SixNumArray) => {
    await db.saveData(TABLE_COLUMN_INIT_POSE, {
      pose: poseZyx,
      coord: coord,
    });
  };

  return (
    <Paper elevation={0} className={styles['content-card']}>
      <Box className={styles['card-header']}>
        <RouteIcon className={styles['card-header-icon']} />
        <Typography variant="h5" component="h2" className={styles['card-title']}>
          Initial Pose Setting
        </Typography>
      </Box>
      <Typography variant="body2" className={styles['card-subtitle']}>
        Define the initial robot pose for your application workflow
      </Typography>
      <Box className={styles['pose-control-wrapper']}>
        <Box className={styles['pose-control-container']}>
          <Typography className={styles['input-label']} component="label">
            Robot Position Configuration
          </Typography>
          <Box className={styles['pose-control-inner']}>
            <TaskPoseControl
              pointName={'Point Name'}
              getPose={'Get Position'}
              moveTo={'Move To'}
              moduleContext={props.moduleContext}
              ref={taskPoseRef}
              targetPose={pose}
            />
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
