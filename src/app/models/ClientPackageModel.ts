import {ClientEligibleSessionTypeModel} from './ClientEligibleSessionTypeModel';
import {PackageModel} from './PackageModel';

export interface ClientPackageModel {
  uid: string;
  clientId: string;
  purchaseDate: any;
  expiryDate: any;
  expired: boolean;
  pricePaid: number;
  packageId: string;
  pricePaidString: string;
  eligibleSessionTypeIds: string[];
  eligibleSessionTypes: ClientEligibleSessionTypeModel[];
  dateLastUsed: any;
  canExpireByDate: boolean;
  _package: PackageModel;

}
