import {Observable} from 'rxjs';
import {AngularFirestore} from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat';
import CollectionReference = firebase.firestore.CollectionReference;
import {Model} from '../models/Model';

export class FirebaseService<T extends Model> {
  readonly collection;

  constructor(protected fs: AngularFirestore, collection: string) {
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

  getAllOrderedByTs(): Observable<T[]> {
    return this.fs.collection<T>(this.collection, ref => ref.orderBy('createdAt_ts')).valueChanges();
  }

  getOne(uid: string): Observable<T> {
    return this.fs.collection<T>(this.collection).doc(uid).valueChanges();
  }

  async set(objects: { uid: string; [key: string]: any }[], merge: boolean): Promise<boolean> {
    for (const object of objects) {
      await this.fs.collection(this.collection).doc(object.uid).set(object, {merge});
    }
    return true;
  }

  async update(objects: T[], merge?: boolean): Promise<boolean> {
    for (const object of objects) {
      await this.fs.collection(this.collection).doc(object.uid).update({
        ...object, lastUpdated_ts: new Date().getTime()
      });
    }
    return true;
  }

  async remove(objects: T[]): Promise<boolean> {
    for (const object of objects) {
      await this.fs.collection(this.collection).doc(object.uid).delete();
    }
    return true;
  }

  async removeByIds(uids: string[]): Promise<boolean> {
    for (const uid of uids) {
      await this.fs.collection(this.collection).doc(uid).delete();
    }
    return true;
  }

  async create(objects: T[]): Promise<T[]> {
    const saved = [];
    for (const object of objects) {
      const uid = this.fs.collection(this.collection).doc().ref.id;
      const createAt = new Date().getTime();
      await this.fs.collection(this.collection).doc(uid).set({
        ...object, uid, createdAt_ts: createAt
      });
      saved.push({...object, uid, createdAt_ts: createAt});
    }
    return saved;
  }

  async createForOtherCollection<R>(collection: string, object: R): Promise<R> {
    const uid = this.fs.collection(collection).doc().ref.id;
    const createdAt = new Date().getTime();
    await this.fs.collection(collection).doc(uid).set({
      ...object, uid, createdAt_ts: createdAt
    });
    return {...object, uid, createdAt_ts: createdAt};
  }
}
