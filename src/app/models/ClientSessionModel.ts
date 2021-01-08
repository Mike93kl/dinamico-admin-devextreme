import {SessionTimeModel} from './SessionModel';
import {SessionTypeModel} from './SessionTypeModel';

export interface ClientSessionModel {
  uid: string;
  sessionId: string;
  clientId: string;
  startTime: SessionTimeModel;
  endTime: SessionTimeModel;
  sessionTypeId: string;
  sessionType?: SessionTypeModel;
  sessionDate: any;
  usedPackageId: string;
  appointmentId: string;
  canceled?: boolean;
}
