import {Model} from './Model';

export interface PackagePaymentModel extends Model {
    clientId: string;
    packageId: string;
    amount: number;
}