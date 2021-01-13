import { NgModule } from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {ClientsComponent} from './components/clients/clients.component';
import {ClientsRoutingModule} from './clients-routing.module';
import {DxDataGridModule, DxDrawerModule, DxFormModule, DxListModule, DxSchedulerModule, DxToolbarModule} from 'devextreme-angular';
import { MainComponent } from './components/main/main.component';
import {SideNavComponent} from '../shared/side-nav/side-nav.component';
import { ClientComponent } from './components/client/client.component';
import {SharedModule} from '../shared/shared.module';

// @ts-ignore
@NgModule({
  declarations: [
    ClientsComponent,
    MainComponent,
    ClientComponent
  ],
    imports: [
        ClientsRoutingModule,
        CommonModule,
        DxDataGridModule,
        SharedModule,
        DxFormModule,
        DxSchedulerModule,
    ],
  exports: [],
  providers: [
    DatePipe
  ]
})
export class ClientsModule { }
