import {SessionTypeModel} from './SessionTypeModel';
import {Model} from './Model';

export interface SessionModelV1 extends Model{
  subscriptions: string[];
  isFull: boolean;
  sessionType: SessionTypeModel;
  startDate_ts: number;
  endDate_ts: number;
  spots: number;
  startDate_str: string;
  startDateISO: string;
  endDateISO: string;
}
