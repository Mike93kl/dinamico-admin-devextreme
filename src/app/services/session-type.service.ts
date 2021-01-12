import {Injectable} from '@angular/core';
import {FirebaseService} from './FirebaseService';
import {SessionTypeModel} from '../models/SessionTypeModel';
import {AngularFirestore} from '@angular/fire/firestore';
import {SESSION_TYPES} from '../utils/Collections';

@Injectable({
  providedIn: 'root'
})
export class SessionTypeService extends FirebaseService<SessionTypeModel> {

  constructor(fs: AngularFirestore) {
    super(fs, SESSION_TYPES);
  }
}
