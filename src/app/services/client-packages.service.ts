import { Injectable } from '@angular/core';
import {FirebaseService} from './FirebaseService';
import {ClientPackageModel} from '../models/ClientPackageModel';
import {AngularFirestore} from '@angular/fire/firestore';
import {CLIENT_PACKAGES} from '../utils/Collections';

@Injectable({
  providedIn: 'root'
})
export class ClientPackagesService extends FirebaseService<ClientPackageModel>{

  constructor(fs: AngularFirestore) {
    super(fs, CLIENT_PACKAGES);
  }
}
