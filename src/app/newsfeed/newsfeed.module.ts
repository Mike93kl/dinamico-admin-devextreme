import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './components/main/main.component';
import {SharedModule} from '../shared/shared.module';
import {NewsFeedRoutingModule} from './newsfeed.routing.module';
import {FormsModule} from '@angular/forms'
import { DxTreeViewModule } from 'devextreme-angular';
import {UploadComponent} from './components/upload/upload.component'
import {AllpostsComponent} from './components/allposts/allposts.component'
import {PostComponent} from './components/post/post.component'
import {DxLoadPanelModule} from 'devextreme-angular'
import { DxButtonModule, DxDateBoxModule } from "devextreme-angular";

@NgModule({
  declarations: [MainComponent, UploadComponent, AllpostsComponent, PostComponent],
  imports: [
    CommonModule,
    SharedModule,
    NewsFeedRoutingModule,
    FormsModule,
    DxTreeViewModule,
    DxLoadPanelModule,
    DxButtonModule,
    DxDateBoxModule
  ]
})
export class NewsFeedModule { }
