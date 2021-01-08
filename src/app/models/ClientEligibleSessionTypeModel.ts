import {EligibleSessionTypeModel} from './EligibleSessionTypeModel';

export interface ClientEligibleSessionTypeModel extends EligibleSessionTypeModel{
  timesUsed: number;
}
