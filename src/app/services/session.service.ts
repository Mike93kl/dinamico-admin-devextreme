import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {FirebaseService} from './FirebaseService';
import {SessionModel} from '../models/SessionModel';
import {Observable} from 'rxjs';
import {ClientModel} from '../models/ClientModel';
import {CLIENTS} from '../utils/Collections';

@Injectable({
  providedIn: 'root'
})
export class SessionService extends FirebaseService<SessionModel> {

  constructor(fs: AngularFirestore) {
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
}
