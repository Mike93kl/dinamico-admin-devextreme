import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ClientsComponent} from './components/clients/clients.component';
import {AuthGuard} from '../guards/AuthGuard';
import {MainComponent} from './components/main/main.component';

const routes: Routes = [
  {
    path: 'clients',
    component: MainComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '', component: ClientsComponent, pathMatch: 'full'
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ClientsRoutingModule {
}
