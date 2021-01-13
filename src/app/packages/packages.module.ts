import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainComponent } from './components/main/main.component';
import {PackagesComponent} from './components/packages/packages.component';
import {SharedModule} from '../shared/shared.module';
import {PackagesRoutingModule} from './packages.routing.module';



@NgModule({
  declarations: [MainComponent, PackagesComponent],
  imports: [
    CommonModule,
    SharedModule,
    PackagesRoutingModule
  ]
})
export class PackagesModule { }
