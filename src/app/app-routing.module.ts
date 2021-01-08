import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {LoginComponent} from './components/login/login.component';
import {DashboardComponent} from './components/dashboard/dashboard.component';
import {AuthGuard} from './guards/AuthGuard';
import {MainComponent} from './components/main/main.component';
import {ClientsComponent} from './components/clients/clients.component';

const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {
    path: '', component: MainComponent, canActivate: [AuthGuard],
    children: [
      {path: '', component: DashboardComponent, pathMatch: 'full'},
      {path: 'clients', component: ClientsComponent},
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
