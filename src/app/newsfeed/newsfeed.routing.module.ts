import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AuthGuard} from '../guards/AuthGuard';
import {MainComponent} from './components/main/main.component';
import { UploadComponent } from './components/upload/upload.component';

const routes: Routes = [
  {
    path: 'newsfeed',
    component: MainComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '', component: UploadComponent, pathMatch: 'full'
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
