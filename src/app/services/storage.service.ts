import { Injectable } from '@angular/core';
import * as firebase from 'firebase';
import {AngularFireStorage} from '@angular/fire/storage'

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor(private db: AngularFireStorage) { }
}
