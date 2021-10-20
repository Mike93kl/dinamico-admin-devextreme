import {NgModule} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {AppointmentsComponent} from './components/appointments/appointments.component';
import {MainComponent} from './components/main/main.component';
import {SideNavComponent} from '../shared/side-nav/side-nav.component';
import {DxDataGridModule, DxNumberBoxModule} from "devextreme-angular";

import {
    DxButtonModule, DxDateBoxModule,
    DxDrawerModule,
    DxFormModule,
    DxListModule, DxLoadPanelModule,
    DxPopupModule, DxProgressBarModule,
    DxSchedulerModule, DxScrollViewModule,
    DxSelectBoxModule,
    DxToolbarModule
} from 'devextreme-angular';
import {AppointmentsRoutingModule} from './appointments-routing.module';
import {SharedModule} from '../shared/shared.module';
import { NewAppointmentComponent } from './components/new-appointment/new-appointment.component';
import {FormsModule} from '@angular/forms';
import { SessionTypesComponent } from './components/session-types/session-types.component';
import { SessionSubscribersComponent } from './components/session-subscribers/session-subscribers.component';
import { ScheduleReportComponent } from './components/schedule-report/schedule-report.component';

@NgModule({
  declarations: [
    AppointmentsComponent,
    MainComponent,
    NewAppointmentComponent,
    SessionTypesComponent,
    SessionSubscribersComponent,
    ScheduleReportComponent,
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
        DxProgressBarModule,
        DxScrollViewModule,
        DxLoadPanelModule,
        DxDateBoxModule,
        DxDataGridModule,
        DxNumberBoxModule
    ],
  exports: [],
  providers: [
    DatePipe
  ]
})
export class AppointmentsModule {
}
