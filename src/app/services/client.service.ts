import {Injectable} from '@angular/core';
import {FirebaseService} from './FirebaseService';
import {ClientModel} from '../models/ClientModel';
import {Observable} from 'rxjs';
import {AngularFirestore} from '@angular/fire/firestore';
import {FunctionService} from './function.service';
import {CLIENT_SESSIONS, CLIENTS, SESSION_TYPES} from '../utils/Collections';
import {FunctionResponse} from '../models/FunctionResponse';
import {ClientSessionModel} from '../models/ClientSessionModel';
import {map} from 'rxjs/operators';
import {SessionTypeModel} from '../models/SessionTypeModel';

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


  getClientSessions(uid: string): Observable<ClientSessionModel[]> {
    return this.fs.collection<ClientSessionModel>(CLIENT_SESSIONS, ref => {
      return ref.where('clientId', '==', uid);
    }).valueChanges();
  }
}
