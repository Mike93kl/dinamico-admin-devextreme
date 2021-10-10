import {Injectable} from '@angular/core';
import {FirebaseService} from './FirebaseService';
import {PackageModel} from '../models/PackageModel';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {FunctionService} from './function.service';
import {GetPackagesFnResponseData} from '../models/fn/GetPackagesFnResponse';
import {Observable} from 'rxjs';
import {ClientPackageModelV1} from '../models/ClientPackageModelV1';
import {CLIENT_PACKAGES} from '../utils/Collections';

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

  getPackagesOfClient(clientId: string, showOnlyValid: boolean, limit: number): Observable<ClientPackageModelV1[]> {
    return this.fs.collection<ClientPackageModelV1>(CLIENT_PACKAGES, ref => {
      let q = ref.where('clientId', '==', clientId);
      if (showOnlyValid) {
        q = ref.where('expired', '==', false);
      }
      return q.limit(limit).orderBy('createAt_ts', 'asc');
    }).valueChanges();
  }
}
