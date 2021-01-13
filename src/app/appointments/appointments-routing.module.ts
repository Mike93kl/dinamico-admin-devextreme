import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AuthGuard} from '../guards/AuthGuard';
import {MainComponent} from './components/main/main.component';
import {AppointmentsComponent} from './components/appointments/appointments.component';
import {NewAppointmentComponent} from './components/new-appointment/new-appointment.component';

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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AppointmentsRoutingModule {
}
