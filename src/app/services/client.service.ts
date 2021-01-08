import {Injectable} from '@angular/core';
import {FirebaseService} from './FirebaseService';
import {ClientModel} from '../models/ClientModel';
import {Observable} from 'rxjs';
import {AngularFirestore} from '@angular/fire/firestore';
import {FunctionService} from './function.service';
import {CLIENTS} from '../utils/Collections';
import {FunctionResponse} from '../models/FunctionResponse';

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
}
