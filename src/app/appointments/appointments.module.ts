import {NgModule} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {AppointmentsComponent} from './components/appointments/appointments.component';
import {MainComponent} from './components/main/main.component';
import {SideNavComponent} from '../shared/side-nav/side-nav.component';
import {
  DxButtonModule,
  DxDrawerModule,
  DxFormModule,
  DxListModule,
  DxPopupModule, DxProgressBarModule,
  DxSchedulerModule,
  DxSelectBoxModule,
  DxToolbarModule
} from 'devextreme-angular';
import {AppointmentsRoutingModule} from './appointments-routing.module';
import {SharedModule} from '../shared/shared.module';
import { NewAppointmentComponent } from './components/new-appointment/new-appointment.component';
import {FormsModule} from '@angular/forms';
import { SessionTypesComponent } from './components/session-types/session-types.component';
import { SessionSubscribersComponent } from './components/session-subscribers/session-subscribers.component';


@NgModule({
  declarations: [
    AppointmentsComponent,
    MainComponent,
    NewAppointmentComponent,
    SessionTypesComponent,
    SessionSubscribersComponent
  ],
  imports: [
    AppointmentsRoutingModule,
    CommonModule,
    SharedModule,
    DxSchedulerModule,
    DxSelectBoxModule,
    DxFormModule,
    FormsModule,
    DxPopupModule,
    DxButtonModule,
    DxProgressBarModule
  ],
  exports: [],
  providers: [
    DatePipe
  ]
})
export class AppointmentsModule {
}
