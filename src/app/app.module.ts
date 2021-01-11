import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {LoginComponent} from './shared/login/login.component';
import {FormsModule} from '@angular/forms';
import {AngularFireModule} from '@angular/fire';
import {environment} from '../environments/environment';
import {AngularFireAuthModule} from '@angular/fire/auth';
import {AngularFireDatabaseModule} from '@angular/fire/database';
import {AngularFirestoreModule} from '@angular/fire/firestore';
import {AngularFireFunctionsModule} from '@angular/fire/functions';
import { DashboardComponent } from './shared/dashboard/dashboard.component';
import { DxDrawerModule, DxListModule, DxToolbarModule} from 'devextreme-angular';
import {ClientsModule} from './clients-module/clients.module';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFireDatabaseModule,
    AngularFirestoreModule,
    AngularFireFunctionsModule,
    ClientsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
