import {Injectable} from '@angular/core';
import {FirebaseService} from './FirebaseService';
import {ClientModel} from '../models/ClientModel';
import {Observable} from 'rxjs';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {FunctionService} from './function.service';
import {CLIENT_PACKAGES, CLIENT_SESSIONS, CLIENTS, PACKAGES, SESSION_TYPES, SESSIONS} from '../utils/Collections';
import {FunctionResponse} from '../models/FunctionResponse';
import {ClientSessionModel} from '../models/ClientSessionModel';
import {map} from 'rxjs/operators';
import {SessionTypeModel} from '../models/SessionTypeModel';
import {ClientPackageModel} from '../models/ClientPackageModel';
import {PackageModel} from '../models/PackageModel';
import {SessionModel} from '../models/SessionModel';

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

  async unsubscribeClientFromSession(sessionId: string, clientId: string): Promise<FunctionResponse> {
    const query = await this.fs.collection(CLIENT_SESSIONS, ref => {
      return ref.where('sessionId', '==', sessionId)
        .where('clientId', '==', clientId);
    }).get().toPromise();
    const clientSessions: ClientSessionModel[] = query.docs.map(d => {
      return d.data() as ClientSessionModel;
    });
    const clientSession = clientSessions.find(cs => cs.sessionId === sessionId);

    if (!clientSession || clientSession.sessionId !== sessionId || clientSession.canceled) {
      return {
        success: false, error: true, code: 0, message: null, data: {
          uiMessage: 'We encountered an error while trying to unsubscribe the client from session.' +
            'Please contact support'
        }
      };
    }

    return this.fn.cancelSession(clientSession.uid, clientId).toPromise();

  }
}
