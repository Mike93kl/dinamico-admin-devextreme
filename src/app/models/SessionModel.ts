import {SessionTypeModel} from './SessionTypeModel';

export interface SessionTimeModel {
  hour: string;
  minutes: string;
  hourAsInt: number;
  minutesAsInt: number;
}

export interface SessionModel {
  color?: string;
  text?: string;
  endDate: any;
  startDate: any;
  date: Date;
  dateStr: string;
  spots: number;
  subscriptions: string[];
  endTime: SessionTimeModel;
  startTime: SessionTimeModel;
  isFull: boolean;
  uid: string;
  sessionTypeId: string;
  sessionType?: SessionTypeModel;
}
