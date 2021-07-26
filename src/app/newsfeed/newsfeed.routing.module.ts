import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AuthGuard} from '../guards/AuthGuard';
import { AllpostsComponent } from './components/allposts/allposts.component';
import {MainComponent} from './components/main/main.component';
import { UploadComponent } from './components/upload/upload.component';
import {PostComponent} from './components/post/post.component'

const routes: Routes = [
  {
    path: 'newsfeed',
    component: MainComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '', component: AllpostsComponent, pathMatch: 'full'
      },
      {
        path: 'post', component: UploadComponent, pathMatch: 'full'
      },
      {
        path: 'post/:uid', component: UploadComponent, pathMatch: 'full'
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class NewsFeedRoutingModule {
}
