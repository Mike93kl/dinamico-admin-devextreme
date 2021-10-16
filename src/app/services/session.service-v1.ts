import {Injectable} from '@angular/core';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {FirebaseService} from './FirebaseService';
import {Observable} from 'rxjs';
import {FunctionService} from './function.service';
import {SessionModelV1} from '../models/SessionModelV1';

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
}
