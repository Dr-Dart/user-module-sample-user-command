/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import { ModuleContext } from 'dart-api';
import React, { useState, useEffect } from 'react';
import { Box, TextField, Paper, Typography, InputAdornment } from '@mui/material';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Database, {
  IDBData,
  InitialDBData,
  TABLE_COLUMN_IP,
} from './DatabaseManager';
import styles from './MainPage1.scss';

interface IMainPage1 {
  moduleContext: ModuleContext;
}

export default function MainPage1(props: IMainPage1) {
  const [deviceIp, SetDeviceIp] = useState('');

  const db = Database.getInstance(props.moduleContext);

  useEffect(() => {
    const isInit = async () => {
      let data = await db.getDataAll();
      if (data === null) data = InitialDBData;
      SetDeviceIp(data.ip);
    };
    isInit();
  }, []);

  return (
    <Paper elevation={0} className={styles['content-card']}>
      <Box className={styles['card-header']}>
        <SettingsInputAntennaIcon className={styles['card-header-icon']} />
        <Typography variant="h5" component="h2" className={styles['card-title']}>
          Device IP Setting
        </Typography>
      </Box>
      <Typography variant="body2" className={styles['card-subtitle']}>
        Configure the IP address of your device to establish connection
      </Typography>
      <Box className={styles['input-container']}>
        <Box className={styles['input-row']}>
          <Typography className={styles['input-label']} component="label">
            Device IP Address
          </Typography>
          <TextField
            id="textfield_de61"
            variant="outlined"
            size="medium"
            fullWidth
            value={deviceIp}
            onChange={(event) => {
              SetDeviceIp(event.target.value);
            }}
            onBlur={async (event) => {
              const data = {
                ip: event.target.value,
              } as IDBData;
              await db.saveData(TABLE_COLUMN_IP, data.ip);
            }}
            placeholder="e.g., 192.168.1.100"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SettingsInputAntennaIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: deviceIp && (
                <InputAdornment position="end">
                  <CheckCircleIcon className={styles['success-icon']} />
                </InputAdornment>
              ),
            }}
            className={styles['fancy-textfield']}
          />
        </Box>
      </Box>
    </Paper>
  );
}
