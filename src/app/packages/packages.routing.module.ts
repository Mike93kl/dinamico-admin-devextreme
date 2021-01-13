import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {AuthGuard} from '../guards/AuthGuard';
import {MainComponent} from './components/main/main.component';
import {PackagesComponent} from './components/packages/packages.component';

const routes: Routes = [
  {
    path: 'packages',
    component: MainComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '', component: PackagesComponent, pathMatch: 'full'
      },
      // {
      //   path: ':uid', component: ClientComponent
      // }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PackagesRoutingModule {
}
