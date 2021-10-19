import { NgModule } from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {ClientsComponent} from './components/clients/clients.component';
import {ClientsRoutingModule} from './clients-routing.module';
import {DxButtonModule, DxDateBoxModule, DxSelectBoxModule, DxTextBoxModule} from "devextreme-angular";
import {
  DxDataGridModule,
  DxDrawerModule,
  DxFormModule,
  DxListModule, DxLoadPanelModule,
  DxPopupModule,
  DxSchedulerModule, DxScrollViewModule,
  DxToolbarModule
} from 'devextreme-angular';
import { MainComponent } from './components/main/main.component';
import {SideNavComponent} from '../shared/side-nav/side-nav.component';
import { ClientComponent } from './components/client/client.component';
import {SharedModule} from '../shared/shared.module';
import {FormsModule} from '@angular/forms';
import { ClientSessionsComponent } from './components/client-sessions/client-sessions.component';
import { ClientPackagesComponent } from './components/client-packages/client-packages.component';
import {ScrollingModule} from "@angular/cdk/scrolling";

// @ts-ignore
@NgModule({
  declarations: [
    ClientsComponent,
    MainComponent,
    ClientComponent,
    ClientSessionsComponent,
    ClientPackagesComponent
  ],
  imports: [
    ClientsRoutingModule,
    CommonModule,
    DxDataGridModule,
    SharedModule,
    DxFormModule,
    DxSchedulerModule,
    DxPopupModule,
    DxScrollViewModule,
    FormsModule,
    DxLoadPanelModule,
    DxListModule,
    ScrollingModule,
    DxSelectBoxModule,
    DxButtonModule,
    DxDateBoxModule,
    DxTextBoxModule
  ],
  exports: [],
  providers: [
    DatePipe
  ]
})
export class ClientsModule { }
