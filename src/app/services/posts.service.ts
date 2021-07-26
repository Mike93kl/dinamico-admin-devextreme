import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { Post } from '../models/Post';
import {FirebaseService} from './FirebaseService'
import {POSTS} from '../utils/Collections'
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PostsService extends FirebaseService<Post> {

  constructor(fs: AngularFirestore) { 
    super(fs, POSTS)
  }

  getAll(): Observable<Post[]> {
    return this.fs.collection<Post>(this.collection, ref => ref.orderBy("createdAt", "desc")).valueChanges()
  }
}
