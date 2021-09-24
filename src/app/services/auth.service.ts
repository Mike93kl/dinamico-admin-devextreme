import { Injectable } from '@angular/core';
import {Router} from '@angular/router';
import {AngularFireAuth} from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreDocument
} from '@angular/fire/compat/firestore';
import {Observable, of, } from 'rxjs';
import {switchMap, take} from 'rxjs/operators';
import {UserModel} from '../models/UserModel';

// @ts-ignore
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  fbUser: any;
  user$: Observable<any>;
  userData: UserModel;
  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private router: Router
  ) {
    this.user$ = this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          console.log('user auth ok', user)
          this.fbUser = user;
          return this.afs.doc<UserModel>(`Users/${user.uid}`).valueChanges();
        }
        return of(null);
      })
    );
  }
  logInWithEmailAndPassword(email: string, password: string): void {
    this.afAuth.signInWithEmailAndPassword(email, password)
      .then(user => {
        this.router.navigate(['/']);
      });
  }
  signOut(): void {
    this.afAuth.signOut().then(res => {
      this.router.navigate(['/login']);
    });
  }
}
