import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {FirebaseService} from './FirebaseService';
import {SessionModel} from '../models/SessionModel';
import {Observable, of} from 'rxjs';
import {ClientModel} from '../models/ClientModel';
import {CLIENT_SESSIONS, CLIENTS, SESSIONS} from '../utils/Collections';
import {FunctionService} from './function.service';
import {FunctionResponse} from '../models/FunctionResponse';

@Injectable({
  providedIn: 'root'
})
export class SessionService extends FirebaseService<SessionModel> {

  constructor(fs: AngularFirestore, private fn: FunctionService) {
    super(fs, 'Sessions');
  }

  getAllSessions(limit: number): Observable<SessionModel[]> {
    return this.fs.collection<SessionModel>(this.collection, ref => {
      return ref.orderBy('date', 'desc').limit(limit);
    }).valueChanges();
  }

  async getByStartDate(date: Date): Promise<SessionModel[]> {
    const d = await this.fs.collection(this.collection, ref => {
      return ref.where('startDate', '==', date);
    }).get().toPromise();
    const result = [];
    for (const snap of d.docs) {
      const model: SessionModel = snap.data() as SessionModel;
      result.push(model);
    }
    return result;
  }

  async getSubscribedClients(s: SessionModel): Promise<ClientModel[]> {
    const session = (await this.fs.collection(this.collection)
      .doc(s.uid).get().toPromise()).data() as SessionModel;
    const clientDocs = await this.fs.collection<ClientModel>(CLIENTS, ref => {
      return ref.where('uid', 'in', session.subscriptions);
    }).get().toPromise();
    const result: ClientModel[] = [];
    for (const doc of clientDocs.docs) {
      result.push(doc.data());
    }
    return result;
  }

  updateSpots(uid: string, spots: number, isFull: boolean): Promise<boolean> {
    return this.set([{
      uid, spots, isFull
    }], true);
  }

  async fetchSessionsInRangeWithClients(beginDate: Date, endDate: Date): Promise<{
    session: SessionModel,
    clients: ClientModel[]
  }[]> {

    const sessionDocs = await this.fs.collection(this.collection, ref => {
      return ref.where('startDate', '>=', beginDate)
        .where('startDate', '<', endDate);
    }).get().toPromise();

    const result: { session: SessionModel; clients: ClientModel[] }[] = [];
    for (const doc of sessionDocs.docs) {
      const object: { session: SessionModel; clients: ClientModel[] } = {
        session: null, clients: []
      };
      object.session = doc.data() as SessionModel;
      if (object.session.subscriptions.length > 0) {
        object.clients = (await this.fs.collection('Clients', ref => {
          return ref.where('uid', 'in', object.session.subscriptions);
        }).get().toPromise()).docs.map(d => d.data() as ClientModel);
      }
      result.push(object);
    }
    return result;
  }

  getTodaysSessionsSorted(): Observable<SessionModel[]> {
    const start = new Date();
    start.setHours(0, 1, 0);
    const end = new Date();
    end.setHours(23, 59, 0);
    return this.fs.collection<SessionModel>(this.collection, ref => {
      return ref.where('startDate', '>=', start)
        .where('startDate', '<', end).orderBy('startDate');
    }).valueChanges();
  }

  getClientsOfSession(session: SessionModel): Observable<FunctionResponse> {
    return this.fn.getClientsOfSession(session.uid);
  }

  async toggleAttendance(clientSessionId: string, attended: boolean): Promise<boolean> {
    return await this.fs.collection(CLIENT_SESSIONS).doc(clientSessionId)
      .update({attended}).then(() => true)
      .catch(e => {
        console.log(e);
        return false;
      });
  }
}
