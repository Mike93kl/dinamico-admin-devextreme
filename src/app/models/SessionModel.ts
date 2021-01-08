import {SessionTypeModel} from './SessionTypeModel';

export interface SessionTimeModel {
  hour: string;
  minutes: string;
  hourAsInt: number;
  minutesAsInt: number;
}

export interface SessionModel {
  spots: number;
  subscriptions: string[];
  endTime: SessionTimeModel;
  startTime: SessionTimeModel;
  isFull: boolean;
  uid: string;
  sessionTypeId: string;
  sessionType?: SessionTypeModel;
}
