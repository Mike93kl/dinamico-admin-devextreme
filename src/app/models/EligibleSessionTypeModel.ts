import {SessionTypeModel} from './SessionTypeModel';

export interface EligibleSessionTypeModel {
  maxUsages: number;
  sessionTypeId: string;
  sessionType?: SessionTypeModel;
}
