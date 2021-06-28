import { Component, OnInit } from '@angular/core';
import {AngularFireStorage, AngularFireUploadTask} from '@angular/fire/storage';
import {Observable} from 'rxjs'

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnInit {

  // main task
  task: AngularFireUploadTask;
  // upload progress
  percentage: Observable<number>;

  snapshot: Observable<any>;

  // download url
  downloadURL: Promise<string>;

  isHovering: boolean;
  
  constructor(private storage: AngularFireStorage) { }

  ngOnInit(): void {
    console.log('upload ok')
  }

  toggleHover(event: boolean) {
    this.isHovering = event;
  }

  startUpload(event: FileList) {
    const file = event.item(0);

    if(file.type.split('/')[0] !== 'image') {
      // error
      return;
    }

    const path = `test/${new Date().getTime()}_${file.name.split(' ').join('')}`;

    const meta = {tesT:'case'}

    // upload
    this.task = this.storage.upload(path, file)

    this.percentage = this.task.percentageChanges();
    this.task.snapshotChanges().subscribe(e => {
      const uploaded = e.bytesTransferred >= e.totalBytes;
      if(uploaded) {
        this.downloadURL =  e.ref.getDownloadURL()
      }
    })
  }

  isActive(snapshot) {
    return snapshot?.state === 'running' && snapshot?.bytesTransferred < snapshot?.totalBytes;
  }

}
