import {Model} from './Model';
import {PackageModel} from './PackageModel';
import {ClientEligibleSessionTypeModel} from './ClientEligibleSessionTypeModel';
import {PaymentModel} from './PaymentModel';

export interface ClientPackageModelV1 extends Model {
  _package: PackageModel;
  clientId: string;
  purchasedDate_ts: number;
  expiryDate_ts: number;
  eligibleSessionTypeIds: string[];
  eligibleSessionTypes: ClientEligibleSessionTypeModel[];
  dateLastUsed_ts: number;
  canExpireByDate: boolean;
  isCustom?: boolean;
  paid: boolean;
  payments?: PaymentModel[];
  expired: boolean;
}
