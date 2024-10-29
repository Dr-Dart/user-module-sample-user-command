/*
    BSD 3-Clause License    
    Copyright (c) 2023, Doosan Robotics Inc.
*/
import { UserComponentProps, RobotSpace, SixNumArray, TwoNumArray } from "dart-api";
import { Module } from "i18next";
import { ModuleContext } from "./ModuleContext";

type Enumerate<
  N extends number,
  Acc extends number[] = []
> = Acc["length"] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc["length"]]>;
type IntRange<F extends number, T extends number> = Exclude<
  Enumerate<T>,
  Enumerate<F>
>;
type TYPE_RANGE_101_TO_200 = IntRange<101, 201>;

export interface TaskPoseControlAPI {
  /**
   * Get Current Pose
   *
   * @param eSpaceType RobotSpace(Joint: 0, Task: 1)
   * @return Promise<SixNumArray> get current joint/task pose (J1, J2, J3, J4, J5, J6)/(X, Y, Z, RZ, RY, RX)
   *
   * @api-version 1
   * @user
   */
  getCurrentPos: (eSpaceType: RobotSpace) => Promise<SixNumArray | undefined>;

  /**
   * Get Current setting Pose
   *
   * @return Promise<SixNumArray> get current joint/task pose (J1, J2, J3, J4, J5, J6)/(X, Y, Z, RZ, RY, RX)
   *
   * @api-version 1
   * @user
   */
  getCurrentSettingPos: () => SixNumArray;

  /**
   * Hold to run
   * (movel) linear moving function
   *
   * @param targetPose set six positions(x,y,z,rz,ry,rx)
   * @param targetVelocity set two velocity (Linear, Rotational)
   * @param targetAcceleration set two acceleration (Linear, Rotational)
   * @param targetTime set time
   * @param moveMode set move mode
   * @param moveReference set coordinate
   * @param blendingRadius set blend radius
   * @param blendingType set blend type
   * @return Promise<boolean>
   *
   * @api-verion 1
   * @user
   */
  moveLinearH2R: (
    targetPose: SixNumArray,
    targetVelocity: TwoNumArray,
    targetAcceleration: TwoNumArray,
    targetTime: number,
    moveMode: number,
    moveReference: number,
    blendingRadius: number,
    blendingType: number
  ) => Promise<boolean | undefined>;

  /**
   * (stop) Move Stop
   *
   * @param stopType Stop Type(QUICK_STO: 0, QUICK: 1, SLOW: 2, EMERGENCY: 3)
   * @return Promise<boolean>
   *
   * @api-version 1
   * @user
   */
  moveStop: (stopType: StopType) => Promise<boolean | undefined>;

  /**
   * Set a callback to get a position when has been changed.
   *
   * @param otpions A option to get position of type SixNumArray
   * @type out
   */
  onChange: (onChangeCallback: (poseValue: SixNumArray) => void) => void;
}

export interface TaskPoseControlProps
  extends UserComponentProps<TaskPoseControlAPI> {
  /**
   * Change name of title
   * @group Properties
   * @inputType InputCustom
   * @defaultValue "Point Name"
   * @type string
   */
  pointName?: string;

  /**
   * Change name of button
   * @group Properties
   * @inputType InputCustom
   * @defaultValue "Get Position"
   * @type string
   */
  getPose?: string;

  /**
   * Change name of button
   * @group Properties
   * @inputType InputCustom
   * @defaultValue "Move To"
   * @type string
   */
  moveTo?: string;

  /**
   * Set movement velocity of Robot. Return data must be a TwoNumArray.
   * @group Properties
   * @inputType InputCustom
   * @type TwoNumArray
   */
  targetVelocity?: TwoNumArray;

  /**
   * Set acceleration of Robot. Return data must be a TwoNumArray.
   * @group Properties
   * @inputType InputCustom
   * @type TwoNumArray
   */
  targetAcceleration?: TwoNumArray;

  /**
   * Set time to reach expectation position. Return data must be decimal and integer number.
   * @group Properties
   * @inputType InputCustom
   * @type number
   */
  targetTime?: number;

  /**
   * Set move mode of Robot 0: Absolute| 1: Relative. Return data must be an integer number
   * @group Properties
   * @inputType InputCustom
   * @type number
   */
  moveMode?: number;

  /**
   * Set st Coordinate 0: Base|2: World|User_coordinate. This property is used for moveLinearH2R API only. Return data must be an integer number
   * @group Properties
   * @inputType InputCustom
   * @type number
   */
  moveReference?: 0 | 2 | TYPE_RANGE_101_TO_200;

  /**
   * Set radius for blending. Return data must be a decimal or integer number
   * @group Properties
   * @inputType InputCustom
   * @type number
   */
  blendingRadius?: number;

  /**
   * Set moving mode 0: Duplicate| 1 : Override. Return data must be an integer number
   * @group Properties
   * @inputType InputCustom
   * @type number
   */
  blendingType?: number;

  /**
   * Set motion pause type 0: Stop, 1: Quick, 2: Slow, 3: Emergency. Return data must be an integer number
   * @group Properties
   * @inputType InputCustom
   * @type StopType
   */
  stopType?: StopType;

  /**
   *
   * @type number
   * @group Properties
   * @inputType InputCustom
   * @exclude true
   */
  solutionSpace?: number;

  /**
   * Set initial value of position.
   * @group Properties
   * @inputType InputCustom
   * @type SixNumArray
   */
  targetPose?: SixNumArray;
}

declare const TaskPoseControl: (props: TaskPoseControlProps) => JSX.Element;
export default TaskPoseControl;
