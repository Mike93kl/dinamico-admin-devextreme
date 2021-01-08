import {Observable} from 'rxjs';
import {AngularFirestore} from '@angular/fire/firestore';
import firebase from 'firebase';
import CollectionReference = firebase.firestore.CollectionReference;
import {Model} from '../models/Model';

export class FirebaseService<T extends Model> {
  readonly collection;

  constructor(private fs: AngularFirestore, collection: string) {
    this.collection = collection;
    this.fs = fs;
  }

  private applyQuery(ref: CollectionReference<firebase.firestore.DocumentData>,
                     query?: [{ field: string; operator: '==' | '>' | '<' | '>=' | '<='; value: any }])
    : CollectionReference<firebase.firestore.DocumentData> {
    query.forEach(q => {
      ref.where(q.field, q.operator, q.value);
    });
    return ref;
  }

  getAll(query?: [{ field: string; operator: string; value: any }]): Observable<T[]> {
    return this.fs.collection<T>(this.collection, ref => query ? this.applyQuery(ref) : ref).valueChanges();
  }

  getOne(uid: string): Observable<T> {
    return this.fs.collection<T>(this.collection).doc(uid).valueChanges();
  }

  async update(objects: T[], merge: boolean): Promise<boolean> {
    for (const object of objects) {
      await this.fs.collection(this.collection).doc(object.uid).set(object, {merge});
    }
    return true;
  }

  async remove(objects: T[]): Promise<boolean> {
    for (const object of objects) {
      await this.fs.collection(this.collection).doc(object.uid).delete();
    }
    return true;
  }

  async create(objects: T[]): Promise<boolean> {
    for (const object of objects) {
      const uid = this.fs.collection(this.collection).doc().ref.id;
      await this.fs.collection(this.collection).doc(uid).set({
        ...object, uid
      });
    }
    return true;
  }
}
