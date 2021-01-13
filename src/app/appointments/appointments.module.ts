import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AppointmentsComponent} from './components/appointments/appointments.component';
import {MainComponent} from './components/main/main.component';
import {SideNavComponent} from '../shared/side-nav/side-nav.component';
import {DxDrawerModule, DxFormModule, DxListModule, DxSchedulerModule, DxSelectBoxModule, DxToolbarModule} from 'devextreme-angular';
import {AppointmentsRoutingModule} from './appointments-routing.module';
import {SharedModule} from '../shared/shared.module';
import { NewAppointmentComponent } from './components/new-appointment/new-appointment.component';
import {FormsModule} from '@angular/forms';


@NgModule({
  declarations: [
    AppointmentsComponent,
    MainComponent,
    NewAppointmentComponent
  ],
  imports: [
    AppointmentsRoutingModule,
    CommonModule,
    SharedModule,
    DxSchedulerModule,
    DxSelectBoxModule,
    DxFormModule,
    FormsModule
  ],
  exports: []
})
export class AppointmentsModule {
}
