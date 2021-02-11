import {Injectable} from '@angular/core';
import {AngularFireFunctions} from '@angular/fire/functions';
import {
  ALTER_MAX_USAGES, BOOK_SESSION, CANCEL_CLIENT_SESSION,
  CLIENTS_ACTIVE_PACKAGES,
  CREATE_CLIENT, GET_CLIENTS_OF_SESSION,
  GET_USER_CLAIMS,
  GRANT_ADMIN,
  GRANT_MANAGER,
  NULLIFY_CLAIMS,
  REVOKE_ADMIN,
  REVOKE_MANAGER,
  ROOT
} from '../utils/Functions';
import {Observable} from 'rxjs';
import {FunctionResponse} from '../models/FunctionResponse';
import {ClientModel} from '../models/ClientModel';

@Injectable({
  providedIn: 'root'
})
export class FunctionService {

  constructor(private fn: AngularFireFunctions) {
  }

  grandRoot(uid: string): Observable<any> {
    return this.fn.httpsCallable(ROOT)({uid});
  }

  grantAdmin(email: string): Observable<FunctionResponse> {
    return this.fn.httpsCallable(GRANT_ADMIN)({email});
  }

  grantManager(email: string): Observable<FunctionResponse> {
    return this.fn.httpsCallable(GRANT_MANAGER)({email});
  }

  getUserClaims(email: string): Observable<FunctionResponse> {
    return this.fn.httpsCallable(GET_USER_CLAIMS)({email});
  }

  revokeAdmin(email: string): Observable<FunctionResponse> {
    return this.fn.httpsCallable(REVOKE_ADMIN)({email});
  }

  revokeManager(email: string): Observable<FunctionResponse> {
    return this.fn.httpsCallable(REVOKE_MANAGER)({email});
  }

  nullifyClaims(email: string): Observable<FunctionResponse> {
    return this.fn.httpsCallable(NULLIFY_CLAIMS)({email});
  }

  createClient(client: ClientModel): Observable<FunctionResponse> {
    return this.fn.httpsCallable(CREATE_CLIENT)(client);
  }

  fetchClientsActivePackages(clientId: string, matchSession: boolean, sessionTypeId: string): Observable<FunctionResponse> {
    return this.fn.httpsCallable(CLIENTS_ACTIVE_PACKAGES)({
      date: new Date().getTime(),
      matchSession,
      sessionTypeId,
      cms: true,
      clientId
    });
  }

  alterClientsMaxUsagesOfEligibleSessionType(clientPackageId: string,
                                             maxUsages: number, sessionTypeId: string): Observable<FunctionResponse> {
    return this.fn.httpsCallable(ALTER_MAX_USAGES)({
      clientPackageId, maxUsages, sessionTypeId, date: new Date().getTime()
    });
  }

  bookSessionForClient(
    sessionId: string,
    clientPackageId: string
  ):
    Observable<FunctionResponse> {
    return this.fn.httpsCallable(BOOK_SESSION)({
      sessionId, clientPackageId
    });
  }

  cancelSession(clientSessionId: string, clientId: string): Observable<FunctionResponse> {
    return this.fn.httpsCallable(CANCEL_CLIENT_SESSION)({
      clientSessionId, clientId, cms: true, date: new Date().getTime()
    });
  }

  getClientsOfSession(sessionId: string): Observable<FunctionResponse> {
    return this.fn.httpsCallable(GET_CLIENTS_OF_SESSION)({sessionId});
  }
}
