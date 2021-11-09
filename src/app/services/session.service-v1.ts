import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {FirebaseService} from './FirebaseService';
import {Observable} from 'rxjs';
import {FunctionService} from './function.service';
import {SessionModelV1} from '../models/SessionModelV1';
import {ClientSessionModelV1, SessionStatus} from "../models/ClientSessionModelV1";
import {CLIENTS, CLIENT_SESSIONS} from "../utils/Collections";
import {SessionSubscriptionModel} from "../models/SessionSubscriptionModel";
import {SessionTypeModel} from "../models/SessionTypeModel";
import {MSG_AC_SPOTS_CANNOT_BE_LESS_THAN_SUB_OR_ZERO} from "../utils/ui_messages";

@Injectable({
  providedIn: 'root'
})
export class SessionServiceV1 extends FirebaseService<SessionModelV1> {

  constructor(fs: AngularFirestore, private fn: FunctionService) {
    super(fs, 'Sessions');
  }

  getAllSessions(limit: number): Observable<SessionModelV1[]> {
    return this.fs.collection<SessionModelV1>(this.collection, ref => {
      return ref.orderBy('startDate_ts', 'desc').limit(limit);
    }).valueChanges();
  }

  getAllSessionsAfterToday(limit: number): Observable<SessionModelV1[]> {
    const today = new Date();
    today.setHours(0, 1, 0, 0);
    return this.fs.collection<SessionModelV1>(this.collection, ref => {
      return ref.where('startDate_ts', '>', today.getTime())
        .orderBy('startDate_ts', 'asc').limit(limit);
    }).valueChanges();
  }

  getExistingSessionsOf(date: Date): Observable<SessionModelV1[]> {
    date.setHours(0, 1, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 0);
    return this.fs.collection<SessionModelV1>(this.collection, ref => {
      return ref.where('startDate_ts', '>', date.getTime())
        .where('startDate_ts', '<', endDate.getTime())
        .orderBy('startDate_ts', 'asc');
    }).valueChanges();
  }

  getByDateRange(start: Date, end: Date): Observable<SessionModelV1[]> {
    start.setHours(0, 1, 0, 0);
    end.setHours(23, 59, 59, 0);
    return this.fs.collection<SessionModelV1>(this.collection, ref => {
      return ref.where('startDate_ts', '>', start.getTime())
        .where('startDate_ts', '<', end.getTime())
        .orderBy('startDate_ts', 'asc');
    }).valueChanges();
  }

  getSessionsOfClient(uid: string, status: SessionStatus | 'all',
                      limit = -1, from?: Date, to?: Date): Observable<ClientSessionModelV1[]> {
    if (from) {
      from.setHours(0, 1, 0, 0);
    }
    if (to) {
      to.setHours(23, 59, 59, 0);
    }
    return this.fs.collection<ClientSessionModelV1>(CLIENT_SESSIONS, ref => {
      let q = ref.orderBy('startDate_ts', 'asc');
      if (from && to) {
        q = q.where('startDate_ts', '>', from.getTime())
          .where('startDate_ts', '<', to.getTime());
      } else {
        q = q.where('startDate_ts', '>', new Date().getTime());
      }
      if (status !== 'all') {
        q = q.where('status', '==', status);
      }
      if (limit !== -1) {
        q = q.limit(limit);
      }
      return q;
    }).valueChanges();
  }

  bookSessionForClient(clientId: string, clientPackageId: string, sessionId: string): Promise<{
    clientSession: ClientSessionModelV1;
    sessionSubscription: SessionSubscriptionModel
  }> {
    return this.fn.bookSessionForClient(clientId, clientPackageId, sessionId);
  }

  cancelCessionForClient(clientId: string, clientSessionId: string, sessionId: string): Promise<ClientSessionModelV1> {
    return this.fn.cancelSessionForClient(clientId, clientSessionId, sessionId);
  }

  async updateSession(session: SessionModelV1, newSessionType: SessionTypeModel, newSpots: number, spotsErr: () => void): Promise<boolean> {
    const subLength = session.subscriptions.length;
    if (newSpots < subLength || newSpots <= 0) {
      spotsErr();
      return false;
    }
    session.spots = newSpots;
    session.full = session.spots <= subLength;
    if (newSessionType.uid !== session.sessionType.uid) {
      session.sessionType = newSessionType;
    }
    return this.update([session]);
  }

  // getClientsNotInSession(sessionId: String): Observable<ClientModel[]> {
  //   return this.fs.collection(CLIENTS, ref => ref.where('uid', ))
  // }

}
