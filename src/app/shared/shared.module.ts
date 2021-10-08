import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DxDataGridModule, DxDrawerModule, DxFormModule, DxListModule, DxSchedulerModule, DxToolbarModule} from 'devextreme-angular';
import {SideNavComponent} from './side-nav/side-nav.component';
import {AppRoutingModule} from '../app-routing.module';
import { SessionTypesV1Component } from './session-types/session-types-v1.component';
import {DxPopupModule, DxScrollViewModule} from 'devextreme-angular';
import {FormsModule} from '@angular/forms';

// @ts-ignore
@NgModule({
  declarations: [
    SideNavComponent,
    SessionTypesV1Component,
  ],
  imports: [
    CommonModule,
    DxDataGridModule,
    DxDrawerModule,
    DxListModule,
    DxToolbarModule,
    DxFormModule,
    DxSchedulerModule,
    DxPopupModule,
    DxScrollViewModule,
    FormsModule
  ],
  exports: [
    SideNavComponent,
    SessionTypesV1Component
  ],
  providers: []
})
export class SharedModule {
}
