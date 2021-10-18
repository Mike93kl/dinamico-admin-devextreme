import {Model} from './Model';
import {SessionTypeModel} from './SessionTypeModel';

export type SessionStatus = 'attended' | 'cancelled' | 'upcoming';

export interface ClientSessionModelV1 extends Model {
  clientId: string;
  sessionId: string;
  usedPackageId: string;
  status: SessionStatus;
  startDate_ts: number;
  endDate_ts: number;
  startDate_str: string;
  startDateISO: string;
  endDateISO: string;
  sessionType: SessionTypeModel;
}
