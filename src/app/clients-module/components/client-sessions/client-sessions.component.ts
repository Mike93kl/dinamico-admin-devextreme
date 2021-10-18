import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ClientService} from '../../../services/client.service';
import {PopupService} from '../../../services/popup.service';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {ClientModel} from '../../../models/ClientModel';
import {firstValueFrom, Subscription} from 'rxjs';
import {ClientSessionModelV1, SessionStatus} from '../../../models/ClientSessionModelV1';
import {SessionServiceV1} from '../../../services/session.service-v1';
import {DxDataGridComponent, DxSchedulerComponent} from 'devextreme-angular';
import {SessionModelV1} from '../../../models/SessionModelV1';
import {PackagesService} from '../../../services/packages.service';
import {ClientPackageModelV1} from '../../../models/ClientPackageModelV1';
import {ClientEligibleSessionTypeModel} from '../../../models/ClientEligibleSessionTypeModel';

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
  sessionTypeId: string;
  clientSession?: ClientSessionModelV1;
}

@Component({
  selector: 'app-client-sessions',
  templateUrl: './client-sessions.component.html',
  styleUrls: ['./client-sessions.component.css']
})
export class ClientSessionsComponent implements OnInit, OnDestroy {
  @ViewChild(DxSchedulerComponent) dxScheduler: DxSchedulerComponent | undefined;
  @ViewChild('filteredClientPackagesGrid') dxFilteredPackagesGrid: DxDataGridComponent | undefined;
  @Input() client: ClientModel;

  currentDate = new Date();
  loadingVisible = false;
  allSessionLimit = 100;
  showDateRangeOfAllSessions = false;

  clientSessionsLimit = 100;
  showDateRangeOfClientSessions = false;

  sessionStatus: SessionStatus | 'all' = 'upcoming';

  calendarItems: CalendarItem[] = [];

  allSessions: SessionModelV1[] = [];
  clientSessions: ClientSessionModelV1[] = [];

  packages: ClientPackageModelV1[] = [];

  filteredPackages: ClientPackageModelV1[];
  showFilteredPackagesPopup = false;
  packagesSub: Subscription | undefined;

  sessionTypes: SessionTypeModel[];

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

    this.packagesSub = this.packagesService.getPackagesOfClient(this.client.uid, true, -1)
      .subscribe({
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
    this.packagesSub?.unsubscribe();
  }


  onSessionTypesFetched($event: SessionTypeModel[]): void {
    this.sessionTypes = $event;
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

  onLimitResultsChanged($event: any, sessions: 'all' | 'client-sessions'): void {
  }

  fetchAllSessionsByDateRange(start: Date, end: Date): void {
  }

  async fetchClientSessionsByDateRange(start: Date, end: Date): Promise<void> {
  }

  onAppointmentRendered($event: any): void {
  }

  onAppointmentFormOpening($event: any): void {
    $event.cancel = true;
    const data = $event.appointmentData as CalendarItem;
    this.filteredPackages = this.packages.filter(p => {
      const ests = p.eligibleSessionTypes.filter(e => e.sessionTypeId === data.sessionTypeId);
      for (const est of ests) {
        if (est.timesUsed < est.maxUsages) {
          return true;
        }
      }
      return false;
    });
    this.showFilteredPackagesPopup = true;
  }

  onSessionStatusChanged($event: any): void {
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
        sessionTypeId: s.sessionType.uid,
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

  populateSessionTypeTitle(est: ClientEligibleSessionTypeModel): string {
    if (!this.sessionTypes || this.sessionTypes.length === 0) {
      return 'loading ...';
    }

    const st = this.sessionTypes.find(s => s.uid === est.sessionTypeId);
    return st ? st.title : 'N/A';
  }

  onFilteredPackagesToolbarPreparing(e: any): void {
    e.toolbarOptions.items.unshift({
      location: 'before',
      widget: 'dxButton',
      options: {
        type: 'outlined',
        text: 'SELECT',
        onClick: () => {
          console.log(this.dxFilteredPackagesGrid.instance.getSelectedRowsData())
        }
      }
    });
  }
}
