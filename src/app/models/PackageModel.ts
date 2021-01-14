import {EligibleSessionTypeModel} from './EligibleSessionTypeModel';

export interface PackageModel {
  uid?: string;
  active: boolean;
  price: number;
  title: string;
  daysToExpire: number;
  canExpire: boolean;
  description: string;
  eligibleSessionTypes: EligibleSessionTypeModel[];
  isInEditMode?: boolean;
}
