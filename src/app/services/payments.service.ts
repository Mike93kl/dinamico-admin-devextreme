import { Injectable } from '@angular/core';
import { FirebaseService } from './FirebaseService';
import { PackagePaymentModel } from '../models/PackagePaymentModel';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { PACKAGE_PAYMENTS } from '../utils/Collections'
import { Observable } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class PaymentsService extends FirebaseService<PackagePaymentModel> {

  constructor(fs: AngularFirestore) {
    super(fs, PACKAGE_PAYMENTS)
  }

  getByDateRange(start: Date, end: Date): Observable<PackagePaymentModel[]> {
    start.setHours(0, 0, 1, 0);
    end.setHours(23, 59, 59, 0);

    return this.fs.collection<PackagePaymentModel>(this.collection, ref => {
      return ref.where('createdAt_ts', '>', start.getTime())
      .where('createdAt_ts', '<', end.getTime())
      .orderBy('createdAt_ts', 'asc')
    }).valueChanges();

  }

}
