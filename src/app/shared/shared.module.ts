import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DxDataGridModule, DxDrawerModule, DxFormModule, DxListModule, DxSchedulerModule, DxToolbarModule} from 'devextreme-angular';
import {SideNavComponent} from '../shared/side-nav/side-nav.component';
import {AppRoutingModule} from '../app-routing.module';


// @ts-ignore
@NgModule({
  declarations: [
    SideNavComponent,
  ],
  imports: [
    CommonModule,
    DxDataGridModule,
    DxDrawerModule,
    DxListModule,
    DxToolbarModule,
    DxFormModule,
    DxSchedulerModule,
  ],
  exports: [
    SideNavComponent
  ],
  providers: []
})
export class SharedModule {
}
