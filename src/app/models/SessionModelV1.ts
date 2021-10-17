import {SessionTypeModel} from './SessionTypeModel';
import {Model} from './Model';
import {SessionSubscriptionModel} from './SessionSubscriptionModel';

export interface SessionModelV1 extends Model{
  subscriptions: SessionSubscriptionModel[];
  isFull: boolean;
  sessionType: SessionTypeModel;
  startDate_ts: number;
  endDate_ts: number;
  spots: number;
  startDate_str: string;
  startDateISO: string;
  endDateISO: string;
}
