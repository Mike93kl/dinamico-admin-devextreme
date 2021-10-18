import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ClientSessionModel} from '../../../models/ClientSessionModel';
import {confirm} from 'devextreme/ui/dialog';
import {take} from 'rxjs/operators';
import {MSG_UNEXPECTED_ERROR} from '../../../utils/ui_messages';
import {ClientService} from '../../../services/client.service';
import {PopupService} from '../../../services/popup.service';
import {DatePipe} from '@angular/common';
import {SessionService} from '../../../services/session.service';
import {SessionModel} from '../../../models/SessionModel';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {ClientPackageModel} from '../../../models/ClientPackageModel';
import {ClientModel} from '../../../models/ClientModel';
import {firstValueFrom, Subscription} from 'rxjs';
import {ClientSessionModelV1} from "../../../models/ClientSessionModelV1";
import {SessionServiceV1} from "../../../services/session.service-v1";
import {DxSchedulerComponent} from "devextreme-angular";
import {SessionModelV1} from "../../../models/SessionModelV1";
import {PackagesService} from "../../../services/packages.service";
import {ClientPackageModelV1} from "../../../models/ClientPackageModelV1";

declare var $: any;

interface CalendarItem {
  text: string;
  startDate: Date;
  endDate: Date;
  sessionId: string;
  color: string;
  subscriptions: number;
  isFull: boolean;
  index: number;
  spots: number;
  clientSession?: ClientSessionModelV1;
}

@Component({
  selector: 'app-client-sessions',
  templateUrl: './client-sessions.component.html',
  styleUrls: ['./client-sessions.component.css']
})
export class ClientSessionsComponent implements OnInit, OnDestroy {
  @ViewChild(DxSchedulerComponent) dxScheduler: DxSchedulerComponent | undefined;
  @Input() client: ClientModel;
  @Input() sessionTypes: SessionTypeModel[];

  currentDate = new Date();
  loadingVisible = false;
  allSessionLimit = 100;
  showDateRangeOfAllSessions = false;

  clientSessionsLimit = 100;
  showDateRangeOfClientSessions = false;

  sessionStatus: 'attended' | 'cancelled' | 'upcoming' | 'all' = 'upcoming';

  calendarItems: CalendarItem[] = [];

  allSessions: SessionModelV1[] = [];
  clientSessions: ClientSessionModelV1[] = [];

  packages: ClientPackageModelV1[] = [];

  constructor(private clientService: ClientService,
              private popup: PopupService,
              private service: SessionServiceV1,
              private packagesService: PackagesService) {
  }

  ngOnInit(): void {
    this.getClientSessionsAfterToday()
      .then(() => {
        this.getAllSessionsAfterToday()
          .then(() => this.mapClientSessionsToSessions());
      });

    this.packagesService.getPackagesOfClient(this.client.uid, true, -1)
      .pipe(take(1)).subscribe({
      next: packages => {
        this.packages = packages;
      },
      error: err => {
        console.log(err);
        this.packages = undefined;
      }
    });
  }

  ngOnDestroy(): void {
  }


  onSessionTypesFetched($event: SessionTypeModel[]) {

  }

  async getAllSessionsAfterToday(): Promise<void> {
    this.allSessions = await firstValueFrom(
      this.service.getAllSessionsAfterToday(this.allSessionLimit)
    );
  }

  async getClientSessionsAfterToday(): Promise<void> {
    this.clientSessions = await firstValueFrom(
      this.service.getSessionsOfClient(this.client.uid, this.sessionStatus, this.clientSessionsLimit)
    );
  }

  onLimitResultsChanged($event: any, sessions: 'all' | 'client-sessions') {

  }

  fetchAllSessionsByDateRange(value: Date, value2: Date) {

  }

  async fetchClientSessionsByDateRange(value: Date, value2: Date) {
  }

  onAppointmentRendered($event: any) {

  }

  onAppointmentFormOpening($event: any) {

  }

  onSessionStatusChanged($event: any) {

  }

  private mapClientSessionsToSessions(): void {
    const mapped = this.clientSessions.reduce((r, c) => {
      r[c.sessionId] = c;
      return r;
    }, {});

    this.calendarItems = this.allSessions.map((s, index) => {
      return {
        text: s.sessionType.title,
        isFull: s.isFull || s.subscriptions.length >= s.spots,
        startDate: new Date(s.startDate_ts),
        endDate: new Date(s.endDate_ts),
        clientSession: mapped[s.uid],
        sessionId: s.uid,
        index,
        subscriptions: s.subscriptions.length,
        spots: s.spots,
        color: this.getCellColor(s, mapped[s.uid])
      };
    });
    this.dxScheduler?.instance.repaint();
  }

  private getCellColor(session: SessionModelV1, clientSession?: ClientSessionModelV1): string {
    if (!clientSession) {
      if (this.currentDate.getTime() > session.startDate_ts) {
        return '#8f8c95';
      }
      if (session.isFull) {
        return '#099c15';
      }

      return '#306CC7';

    }

    const subscription = session.subscriptions.find(s => s.sessionId === clientSession.sessionId);
    if (!subscription) {
      return '#000000';
    }

    if (clientSession.status === 'cancelled') {
      return '#e77070';
    }

    if (this.currentDate.getTime() > session.startDate_ts) {
      return '#c2abec';
    }

    if (session.isFull) {
      return '#326433';
    }

    return 'blueviolet';
  }

}
