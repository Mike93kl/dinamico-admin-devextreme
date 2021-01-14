import {SessionTimeModel} from './SessionModel';
import {SessionTypeModel} from './SessionTypeModel';

export interface ClientSessionModel {
  endDate: any;
  text?: string;
  startDate?: any;
  uid: string;
  sessionId: string;
  clientId: string;
  sessionTypeId: string;
  sessionType?: SessionTypeModel;
  sessionDate: any;
  usedPackageId: string;
  canceled?: boolean;
  color?: string;
}
