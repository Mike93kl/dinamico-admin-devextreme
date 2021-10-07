import {Injectable} from '@angular/core';
import {FirebaseService} from './FirebaseService';
import {SessionTypeModel} from '../models/SessionTypeModel';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {SESSION_TYPES} from '../utils/Collections';

@Injectable({
  providedIn: 'root'
})
export class SessionTypeService extends FirebaseService<SessionTypeModel> {

  constructor(fs: AngularFirestore) {
    super(fs, SESSION_TYPES);
  }

  createOrUpdate(s: SessionTypeModel): Promise<boolean> {
    if (s.uid) {
      return this.update([s]);
    }
    return this.create([s]).then(() => true).catch(e => false);
  }
}
