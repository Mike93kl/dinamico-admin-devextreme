import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './components/main/main.component';
import {PackagesComponent} from './components/packages/packages.component';
import {SharedModule} from '../shared/shared.module';
import {PackagesRoutingModule} from './packages.routing.module';
import {DxListModule, DxPopupModule, DxScrollViewModule} from 'devextreme-angular';
import {FormsModule} from '@angular/forms';



@NgModule({
  declarations: [MainComponent, PackagesComponent],
  imports: [
    CommonModule,
    SharedModule,
    PackagesRoutingModule,
    DxListModule,
    FormsModule,
    DxPopupModule,
    DxScrollViewModule
  ]
})
export class PackagesModule { }
