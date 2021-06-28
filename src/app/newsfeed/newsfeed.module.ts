import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './components/main/main.component';
import {SharedModule} from '../shared/shared.module';
import {NewsFeedRoutingModule} from './newsfeed.routing.module';
import {FormsModule} from '@angular/forms'
import { DxTreeViewModule } from 'devextreme-angular';
import {UploadComponent} from './components/upload/upload.component'

@NgModule({
  declarations: [MainComponent, UploadComponent],
  imports: [
    CommonModule,
    SharedModule,
    NewsFeedRoutingModule,
    FormsModule,
    DxTreeViewModule
  ]
})
export class NewsFeedModule { }
