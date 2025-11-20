/*
    BSD 3-Clause License
    Copyright (c) 2023, Doosan Robotics Inc.
*/

/**
 * Channel message constants for User Command V2 interface
 * These constants define the message channel names used for communication
 * between Task Editor and User Command Module.
 */

// Screen-Side Interfaces (ModuleScreen)
export const CHANNEL_GET_CURRENT_DATA = 'get_current_data';
export const CHANNEL_DATA_CHANGED = 'data_changed';
export const CHANNEL_GET_VARIABLES = 'get_variables';

// Service-Side Interfaces (ModuleService)
export const CHANNEL_GEN_COMMAND_CALL = 'gen_command_call';
export const CHANNEL_REQ_TO_SAVE_COMMANDS_DEF_AS_SUB_PROGRAM = 'req_to_save_commands_def_as_sub_program';
export const CHANNEL_START_COMMAND_DATA_MONITOR = 'start_command_data_monitor';
export const CHANNEL_STOP_COMMAND_DATA_MONITOR = 'stop_command_data_monitor';
export const CHANNEL_UPDATE_TASK_DATA_TO_MONITOR = 'update_task_data_to_monitor';
export const CHANNEL_GET_COMMAND_DEFINED_DATA = 'get_command_defined_data';

// Common Interfaces (Both Screen and Service)
export const CHANNEL_COMMAND_DATA_VALIDITY_CHANGED = 'command_data_validity_changed';