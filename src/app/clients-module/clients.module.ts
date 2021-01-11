import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ClientsComponent} from './components/clients/clients.component';
import {ClientsRoutingModule} from './clients-routing.module';
import {DxDataGridModule, DxDrawerModule, DxListModule, DxToolbarModule} from 'devextreme-angular';
import { MainComponent } from './components/main/main.component';
import {SideNavComponent} from '../shared/side-nav/side-nav.component';

@NgModule({
  declarations: [
    ClientsComponent,
    MainComponent,
    SideNavComponent
  ],
  imports: [
    ClientsRoutingModule,
    CommonModule,
    DxDataGridModule,
    DxDrawerModule,
    DxListModule,
    DxToolbarModule,
  ],
  exports: []
})
export class ClientsModule { }
