import { Injectable } from '@angular/core';
import {FirebaseService} from './FirebaseService';
import {PackageModel} from '../models/PackageModel';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import {FunctionService} from './function.service';
import {GetPackagesFnResponseData} from '../models/fn/GetPackagesFnResponse';

@Injectable({
  providedIn: 'root'
})
export class PackagesService extends FirebaseService<PackageModel>{

  constructor(fs: AngularFirestore, private fn: FunctionService) {
    super(fs, 'Packages');
  }

  getAllPackages(): Promise<GetPackagesFnResponseData[]> {
    return this.fn.getAllPackagesMapped();
  }
}
