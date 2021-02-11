import {SessionTimeModel} from './SessionModel';
import {SessionTypeModel} from './SessionTypeModel';

export interface ClientSessionModel {
  attended?: boolean;
  disabled?: boolean;
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
