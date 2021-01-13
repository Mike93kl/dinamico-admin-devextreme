import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/firestore';
import {FirebaseService} from './FirebaseService';
import {SessionModel} from '../models/SessionModel';
import {Observable} from 'rxjs';

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

  async getByDate(date: string): Promise<SessionModel[]> {
    const d = await this.fs.collection(this.collection, ref => {
      return ref.where('dateStr', '==', date);
    }).get().toPromise();
    const result = [];
    for (const snap of d.docs) {
      const model: SessionModel = snap.data() as SessionModel;
      result.push(model);
    }
    return result;
  }
}
