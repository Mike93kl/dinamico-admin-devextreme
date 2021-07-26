import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Post } from 'src/app/models/Post';
import { PopupService } from 'src/app/services/popup.service';
import { PostsService } from '../../../services/posts.service'

@Component({
  selector: 'app-allposts',
  templateUrl: './allposts.component.html',
  styleUrls: ['./allposts.component.css']
})
export class AllpostsComponent implements OnInit, OnDestroy {

  loadingVisible: boolean = false
  posts: Post[]

  // subs
  postsSub: Subscription

  constructor(private service: PostsService, private popup: PopupService) { }

  ngOnInit(): void {
    this.getPosts()
  }

  ngOnDestroy(): void {
    if (this.postsSub) {
      this.postsSub.unsubscribe()
    }
  }

  private getPosts() {
    this.postsSub = this.service.getAll().subscribe(posts => {
      console.log(posts)
      this.posts = posts;
    }, error => {
      console.log(error)
      this.popup.error('Could not fetch posts. Please try again later. If problem persists please contact support')
    })
  }




}
