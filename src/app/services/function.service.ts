import {Injectable} from '@angular/core';
import {AngularFireFunctions} from '@angular/fire/compat/functions';
import {
  ADD_CLIENT_PACKAGE_PAYMENT,
  ALTER_MAX_USAGES, BOOK_SESSION, BOOK_SESSION_FOR_CLIENT, CANCEL_CLIENT_SESSION,
  CLIENTS_ACTIVE_PACKAGES,
  CREATE_CLIENT, GET_ALL_PACKAGES_V1, GET_CLIENTS_OF_SESSION,
  GET_USER_CLAIMS,
  GRANT_ADMIN,
  GRANT_MANAGER,
  NULLIFY_CLAIMS, REMOVE_CLIENT_PACKAGE_PAYMENT,
  REVOKE_ADMIN,
  REVOKE_MANAGER,
  ROOT, UPDATE_EST_MAX_USAGES
} from '../utils/Functions';
import {firstValueFrom, Observable} from 'rxjs';
import {FunctionResponse} from '../models/fn/FunctionResponse';
import {ClientModel} from '../models/ClientModel';
import {CreateClientFnResponse} from '../models/fn/CreateClientFnResponse';
import {GetPackagesFnResponse, GetPackagesFnResponseData} from '../models/fn/GetPackagesFnResponse';
import * as fn_handler from '../models/fn/FnResponseHandler';
import {FnResponse} from "../models/fn/FnResponse_v1";
import {AddClientPackagePaymentFnResponse} from "../models/fn/AddClientPackagePaymentFnResponse";
import {PaymentModel} from "../models/PaymentModel";
import {ClientEligibleSessionTypeModel} from "../models/ClientEligibleSessionTypeModel";
import {ClientSessionModelV1} from "../models/ClientSessionModelV1";
import {SessionSubscriptionModel} from "../models/SessionSubscriptionModel";

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

  createClient(client: ClientModel): Observable<CreateClientFnResponse> {
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


  cancelSession(clientSessionId: string, clientId: string): Observable<FunctionResponse> {
    return this.fn.httpsCallable(CANCEL_CLIENT_SESSION)({
      clientSessionId, clientId, cms: true, date: new Date().getTime()
    });
  }

  getClientsOfSession(sessionId: string): Observable<FunctionResponse> {
    return this.fn.httpsCallable(GET_CLIENTS_OF_SESSION)({sessionId});
  }

  getAllPackagesMapped(): Promise<GetPackagesFnResponseData[]> {
    const fn = this.fn.httpsCallable(GET_ALL_PACKAGES_V1);
    return this.handle_fn_response(fn({}));
  }

  addClientPackagePayment(
    clientId: string,
    clientPackageId: string,
    payment: number,
    datePaid: number,
  ): Promise<PaymentModel> {
    return this.handle_fn_response(
      this.fn.httpsCallable(ADD_CLIENT_PACKAGE_PAYMENT)({
        clientId, clientPackageId, payment, datePaid_ts: datePaid
      })
    );
  }

  removeClientPackagePayment(clientId: string,
                             clientPackageId: string, uniqueKey: string): Promise<boolean> {
    return this.handle_fn_response(
      this.fn.httpsCallable(REMOVE_CLIENT_PACKAGE_PAYMENT)({
        clientId, clientPackageId, uniqueKey
      })
    );
  }

  updateEstMaxUsages(clientId: string, clientPackageId: string, eligibleSessionTypeId: string, maxUsages: number): Promise<ClientEligibleSessionTypeModel> {
    return this.handle_fn_response(
      this.fn.httpsCallable(UPDATE_EST_MAX_USAGES)({
        clientId, clientPackageId, eligibleSessionTypeId, maxUsages
      })
    );
  }

  bookSessionForClient(clientId: string, clientPackageId: string, sessionId: string): Promise<{
    clientSession: ClientSessionModelV1;
    sessionSubscription: SessionSubscriptionModel
  }> {
    return this.handle_fn_response(
      this.fn.httpsCallable(BOOK_SESSION_FOR_CLIENT)({
        clientId, clientPackageId, sessionId
      })
    );
  }

  private handle_fn_response<R, T extends FnResponse<R>>(fn: Observable<T>): Promise<R> {
    return firstValueFrom(fn).then((res) => fn_handler.handle<R>(res))
      .catch(e => {
        throw fn_handler.error(e);
      });
  }
}
