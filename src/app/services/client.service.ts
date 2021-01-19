import {Injectable} from '@angular/core';
import {FirebaseService} from './FirebaseService';
import {ClientModel} from '../models/ClientModel';
import {Observable} from 'rxjs';
import {AngularFirestore} from '@angular/fire/firestore';
import {FunctionService} from './function.service';
import {CLIENT_PACKAGES, CLIENT_SESSIONS, CLIENTS, PACKAGES, SESSION_TYPES} from '../utils/Collections';
import {FunctionResponse} from '../models/FunctionResponse';
import {ClientSessionModel} from '../models/ClientSessionModel';
import {map} from 'rxjs/operators';
import {SessionTypeModel} from '../models/SessionTypeModel';
import {ClientPackageModel} from '../models/ClientPackageModel';
import {PackageModel} from '../models/PackageModel';

@Injectable({
  providedIn: 'root'
})
export class ClientService extends FirebaseService<ClientModel> {

  constructor(fs: AngularFirestore, private fn: FunctionService) {
    super(fs, CLIENTS);
  }

  createNewClient(client: ClientModel): Observable<FunctionResponse> {
    return this.fn.createClient(client);
  }

  cancelSession(clientSessionId: string, clientId: string): Observable<FunctionResponse> {
    return this.fn.cancelSession(clientSessionId, clientId);
  }

  getClientSessions(uid: string, limit: number): Observable<ClientSessionModel[]> {
    return this.fs.collection<ClientSessionModel>(CLIENT_SESSIONS, ref => {
      return ref.where('clientId', '==', uid)
        .orderBy('startDate', 'desc').orderBy('endDate', 'desc')
        .limit(limit);
    }).valueChanges();
  }

  getActivePackagesMatchedSession(sessionTypeId: string, clientId: string): Observable<FunctionResponse> {
    return this.fn.fetchClientsActivePackages(clientId, true, sessionTypeId);
  }

  bookSession(sessionId: string, packageId: string): Observable<FunctionResponse> {
    return this.fn.bookSessionForClient(sessionId, packageId);
  }

  getClientPackages(uid: string, limit: number): Observable<ClientPackageModel[]> {
    return this.fs.collection<ClientPackageModel>(CLIENT_PACKAGES, ref => {
      return ref.where('clientId', '==', uid)
        .orderBy('createdAt', 'desc').limit(limit);
    }).valueChanges();
  }

  alterPackageMaxUsages(clientPackageId: string, maxUsages: number, sessionTypeId: string): Observable<FunctionResponse> {
    return this.fn.alterClientsMaxUsagesOfEligibleSessionType(clientPackageId, maxUsages, sessionTypeId);
  }
}
