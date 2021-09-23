import { Injectable } from '@angular/core';
import {FirebaseService} from './FirebaseService';
import {PackageModel} from '../models/PackageModel';
import {AngularFirestore} from '@angular/fire/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class PackagesService extends FirebaseService<PackageModel>{

  constructor(fs: AngularFirestore) {
    super(fs, 'Packages');
  }
}
