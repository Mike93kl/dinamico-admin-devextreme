import {Injectable} from '@angular/core';
import {FirebaseService} from './FirebaseService';
import {PackageModel} from '../models/PackageModel';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {FunctionService} from './function.service';
import {GetPackagesFnResponseData} from '../models/fn/GetPackagesFnResponse';
import {Observable} from 'rxjs';
import {ClientPackageModelV1} from '../models/ClientPackageModelV1';
import {CLIENT_PACKAGES} from '../utils/Collections';
import {PaymentModel} from "../models/PaymentModel";
import {ClientEligibleSessionTypeModel} from "../models/ClientEligibleSessionTypeModel";

@Injectable({
  providedIn: 'root'
})
export class PackagesService extends FirebaseService<PackageModel> {

  constructor(fs: AngularFirestore, private fn: FunctionService) {
    super(fs, 'Packages');
  }

  getAllPackages(): Promise<GetPackagesFnResponseData[]> {
    return this.fn.getAllPackagesMapped();
  }

  getPackagesOfClient(clientId: string, showOnlyValid: boolean, limit: number = -1): Observable<ClientPackageModelV1[]> {
    return this.fs.collection<ClientPackageModelV1>(CLIENT_PACKAGES, ref => {
      let q = ref.where('clientId', '==', clientId)
        .where('expired', '==', !showOnlyValid);
      if (limit !== -1) {
        q = q.limit(limit);
      }
      return q.orderBy('createdAt_ts', 'desc');
    }).valueChanges();
  }

  addPaymentToClientPackage(clientId: string, clientPackageId: string, payment: number): Promise<PaymentModel> {
    return this.fn.addClientPackagePayment(clientId, clientPackageId, payment, new Date().getTime());
  }

  removePaymentFromClientPackage(clientId: string, clientPackageId: string, uniqueKey: string): Promise<boolean> {
    return this.fn.removeClientPackagePayment(clientId, clientPackageId, uniqueKey);
  }

  updateEstMaxUsages(clientId: string, clientPackageId: string, eligibleSessionTypeId: string, maxUsages: number): Promise<ClientEligibleSessionTypeModel> {
    return this.fn.updateEstMaxUsages(clientId, clientPackageId, eligibleSessionTypeId, maxUsages);
  }

  getActiveClientPackagesForSession(clientId: string, sessionTypeId: string): Promise<ClientPackageModelV1[]> {
    return this.fn.getActiveClientPackagesForSession(clientId, sessionTypeId)
  }
}
