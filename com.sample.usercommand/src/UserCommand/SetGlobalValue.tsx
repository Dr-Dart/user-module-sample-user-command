/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import React, { useState, useEffect, useRef } from 'react';
import { MonitoringVariable, IToast, Toast, logger } from 'dart-api';
import {
    MenuItem,
    Select,
    SelectChangeEvent,
    FormControl,
    FormGroup,
    Container,
} from '@mui/material';
// const divisionName = ['system', 'global'];
// const typeName = ['bool', 'int', 'float', 'string', 'posj', 'posx', 'array', 'unknown'];
// const noSelectName = 'Unselected';
// export const noSelectData = {
//     name: noSelectName,
//     division: 0,
//     type: 0,
//     data: '',
// } as MonitoringVariable;
interface setReturnValueProps {
    visible: boolean;
    typeFilter: Number[];
    variableList: MonitoringVariable[];
    selectedVarName: string;
    ChangeGlobalValue: (GlobalValue: string) => void;
}
export default function SetGlobalValue(props: setReturnValueProps) {
    const {visible, variableList, selectedVarName, ChangeGlobalValue, typeFilter } = props;
    const [selected, setselected] = useState("");

    // select type that use return value
    // bool: 0, int: 1, flaot: 2, string: 3, posj: 4, posx: 5, list: 6, unknonwn: 7
    // const typeFilter = [0, 1, 2, 3, 7] as Number[];

    useEffect(() => {
        if (!selectedVarName){
            ChangeGlobalValue("");
            setselected("");
            return;
        }

        const variable = variableList.find((item: MonitoringVariable) => item.name === selectedVarName);
        logger.debug(`variable: `+JSON.stringify(variable))
        setselected(variable? variable.name : "")
    }, [selectedVarName, variableList])

    // Select Global Value
    const handleChangeGlobalValue = (e: SelectChangeEvent) => {
        const name = e.target.value;
        const variable = variableList.find((item: MonitoringVariable) => item.name === name);
        ChangeGlobalValue(name);
        setselected(variable? variable.name : "");
    };

    return (
        <>
            <Container
                style={{
                    paddingLeft: '10px',
                    paddingRight: '10px',
                }}
            >
                <FormControl
                    sx={
                        visible
                            ? {
                                display: 'flex',
                            }
                            : {
                                display: 'none',
                            }
                    }
                >
                    <FormGroup
                        sx={{
                            'width': '100%',
                        }}
                    >
                        <Select
                            value={selected}
                            onChange={handleChangeGlobalValue}
                            label="Select Global Value.."
                            sx={{
                                'width': '100%',
                            }}
                        >
                            {variableList && variableList?.map((globalvalue: MonitoringVariable, index: Number) => (
                                <MenuItem key={index} value={globalvalue.name}>
                                    {globalvalue.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormGroup>
                </FormControl>
            </Container>
        </>
    );
}
