import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AuthGuard} from '../guards/AuthGuard';
import {MainComponent} from './components/main/main.component';
import {AppointmentsComponent} from './components/appointments/appointments.component';
import {NewAppointmentComponent} from './components/new-appointment/new-appointment.component';
import {ScheduleReportComponent} from './components/schedule-report/schedule-report.component';
import {AttendanceComponent} from './components/attendance/attendance.component';

const routes: Routes = [
  {
    path: 'appointments',
    component: MainComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '', component: AppointmentsComponent, pathMatch: 'full'
      },
      {
        path: 'new', component: NewAppointmentComponent
      }
    ]
  },
  {
    path: 'schedule-report',
    component: ScheduleReportComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'attendance',
    component: AttendanceComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppointmentsRoutingModule {
}
