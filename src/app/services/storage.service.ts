import { Injectable } from '@angular/core';
import * as firebase from 'firebase/compat';
import {AngularFireStorage} from '@angular/fire/compat/storage'

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor(private db: AngularFireStorage) { }
}
