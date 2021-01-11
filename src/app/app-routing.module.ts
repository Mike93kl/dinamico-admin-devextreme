import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {LoginComponent} from './shared/login/login.component';
import {DashboardComponent} from './shared/dashboard/dashboard.component';
import {AuthGuard} from './guards/AuthGuard';
import {SideNavComponent} from './shared/side-nav/side-nav.component';
import {ClientsComponent} from './clients-module/components/clients/clients.component';

const routes: Routes = [
  {path: 'login', component: LoginComponent},
  {
    path: '', component: SideNavComponent, canActivate: [AuthGuard],
    children: [
      {path: '', component: DashboardComponent, pathMatch: 'full'}
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
