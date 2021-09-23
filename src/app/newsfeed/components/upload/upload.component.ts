import { Component, OnInit } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { Observable } from 'rxjs'
import { Post } from 'src/app/models/Post';
import { PopupService } from 'src/app/services/popup.service';
import { PostsService } from 'src/app/services/posts.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {

  post: Post = {
    title: '',
    text: '',
    imageURL: null,
    visible: false,
    createdAt: null,
    lastUpdatedAt: null,
    likes: [],
    notifyUsers: false,
  }
  loadingVisible = false;
  // main task
  task: AngularFireUploadTask;
  // upload progress
  percentage: Observable<number>;

  snapshot: Observable<any>;

  // download url
  downloadURL: Promise<string>;

  isHovering: boolean;

  constructor(private storage: AngularFireStorage, private popup: PopupService, private service: PostsService,
    private route: ActivatedRoute, private router: Router, private location: Location) { }

  ngOnInit(): void {
    const uid = this.route.snapshot.paramMap.get('uid');
    if (uid) {
      this.loadingVisible = true;
      this.service.getOne(uid).subscribe(post => {
        this.post = post
        this.loadingVisible = false;
      }, error => {
        console.log(error)
        this.popup.error('Could not fetch post! If problem persists please contact support', () => {
          this.loadingVisible = false;
          this.location.back()
        })
      })
    }
  }

  toggleHover(event: boolean) {
    this.isHovering = event;
  }

  startUpload(event: FileList) {

    this.loadingVisible = true

    const file = event.item(0);

    if (file.type.split('/')[0] !== 'image') {
      this.loadingVisible = false;
      this.popup.error('Files allowed: .png, .jpg, .jpeg');
      return;
    }

    const path = `test/${new Date().getTime()}_${file.name.split(' ').join('')}`;

    const meta = { tesT: 'case' }

    // upload
    this.task = this.storage.upload(path, file)

    this.percentage = this.task.percentageChanges();
    this.task.snapshotChanges().subscribe(e => {
      const uploaded = e.bytesTransferred >= e.totalBytes;
      if (uploaded) {
        this.downloadURL = e.ref.getDownloadURL()
        this.loadingVisible = false;
      }
    })
  }

  isActive(snapshot) {
    return snapshot?.state === 'running' && snapshot?.bytesTransferred < snapshot?.totalBytes;
  }


  savePost() {
    const isNew = !this.post.uid
    console.log(isNew, this.post.uid)
    if (this.downloadURL) {
      this.downloadURL.then(url => {
        if (isNew) {
          this.createPost(url)
        } else {
          this.updatePost(url)
        }
      })
        .catch(e => {
          console.log(e)
          this.popup.error('Error uploading file')
        })
      return
    }

    if (isNew) {
      this.createPost(null)
    } else {
      this.updatePost(null)
    }
  }


  private updatePost(url: string) {
    if (url)
      this.post.imageURL = url
    this.service.update([this.post]).then(() => {
      this.popup.success('Post updated!', () => {
        this.location.back()
      })
    }).catch(e => {
      console.log(e)
      this.popup.error('Could not update post')
    })
  }

  private createPost(url: string) {
    if (url) {
      this.post.imageURL = url
    }
    console.log(this.post)
    this.post.createdAt = Date.now()
    this.post.lastUpdatedAt = Date.now()
    this.service.create([this.post]).then(() => {
      this.popup.success('Post created', () => {
        this.location.back()
      })
    }, error => {
      console.log(error)
      this.popup.error('Could not create post, if problem persists please contact support')
    })
  }

}
