import {Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {ClientService} from '../../../services/client.service';
import {PopupService} from '../../../services/popup.service';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {ClientModel} from '../../../models/ClientModel';
import {firstValueFrom, Subscription} from 'rxjs';
import {ClientSessionModelV1, SessionStatus} from '../../../models/ClientSessionModelV1';
import {SessionServiceV1} from '../../../services/session.service-v1';
import {DxDataGridComponent, DxDateBoxComponent, DxSchedulerComponent} from 'devextreme-angular';
import {SessionModelV1} from '../../../models/SessionModelV1';
import {PackagesService} from '../../../services/packages.service';
import {ClientPackageModelV1} from '../../../models/ClientPackageModelV1';
import {ClientEligibleSessionTypeModel} from '../../../models/ClientEligibleSessionTypeModel';
import {
  MSG_CSC_CANCEL_SESSION_SUCCESSFUL_BUT_FAILED_TO_UPDATE,
  MSG_CSC_CLIENT_SESSION_REQUESTED_LIMIT_MUST_BE_LESS_OR_EQUAL_TO_ALL_SESSIONS_LIMIT,
  MSG_CSC_CONFIRM_CANCEL_SESSION,
  MSG_CSC_CONFIRM_SESSION_BOOK,
  MSG_CSC_DATE_RANGE_SELECTED_BUT_NOT_FILLED,
  MSG_CSC_PLEASE_SELECT_A_CLIENT_PACKAGE_TO_SUB_TO_SESSION,
  MSG_CSC_REQUESTED_CLIENT_SESSION_DATES_MUST_BE_BETWEEN_SELECTED_ALL_SESSIONS_DATE,
  MSG_UNEXPECTED_ERROR_REFRESH_PAGE
} from '../../../utils/ui_messages';
import {FnError} from '../../../models/fn/FnResponseHandler';

declare var $: any;

interface CalendarItem {
  text: string;
  startDate: Date;
  endDate: Date;
  sessionId: string;
  color: string;
  subscriptions: number;
  full: boolean;
  index: number;
  spots: number;
  sessionTypeId: string;
  clientSession?: ClientSessionModelV1;
  originalSession: SessionModelV1;
}

@Component({
  selector: 'app-client-sessions',
  templateUrl: './client-sessions.component.html',
  styleUrls: ['./client-sessions.component.css']
})
export class ClientSessionsComponent implements OnInit, OnDestroy {
  @ViewChild(DxSchedulerComponent) dxScheduler: DxSchedulerComponent | undefined;
  @ViewChild('filteredClientPackagesGrid') dxFilteredPackagesGrid: DxDataGridComponent | undefined;
  @ViewChild('clientSessionDateStart') dxClientSessionDateStart: DxDateBoxComponent | undefined;
  @ViewChild('clientSessionDateEnd') dxClientSessionDateEnd: DxDateBoxComponent | undefined;
  @ViewChild('allSessionsDateStart') dxAllSessionsDateStart: DxDateBoxComponent | undefined;
  @ViewChild('allSessionsDateEnd') dxAllSessionsDateEnd: DxDateBoxComponent | undefined;

  @Output() onUsedPackageEvent: EventEmitter<boolean> = new EventEmitter<boolean>();

  @Input() client: ClientModel;

  currentDate = new Date();
  loadingVisible = false;
  allSessionLimit = 100;
  showDateRangeOfAllSessions = false;

  clientSessionsLimit = 100;
  showDateRangeOfClientSessions = false;

  sessionStatus: SessionStatus | 'all' = 'upcoming';

  calendarItems: CalendarItem[] = [];

  allSessions: SessionModelV1[] = undefined;
  clientSessions: ClientSessionModelV1[] = [];

  packages: ClientPackageModelV1[] = [];

  filteredPackages: ClientPackageModelV1[];
  showFilteredPackagesPopup = false;
  packagesSub: Subscription | undefined;

  showSelectedCalendarItemPopup = false;

  sessionTypes: SessionTypeModel[];

  selectedCalendarItem: CalendarItem;

  constructor(private clientService: ClientService,
              private popup: PopupService,
              private service: SessionServiceV1,
              private packagesService: PackagesService) {
  }

  ngOnInit(): void {
    this.getClientSessionsAfterToday()
      .then();

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
    this.loadingVisible = true;
    try {
      this.allSessions = await firstValueFrom(
        this.service.getAllSessionsAfterToday(this.allSessionLimit)
      );
      this.loadingVisible = false;
      this.mapClientSessionsToSessions();
    } catch (e) {
      console.log(e);
      this.loadingVisible = false;
      this.popup.error(MSG_UNEXPECTED_ERROR_REFRESH_PAGE);
    }
    this.loadingVisible = false;
  }

  async getClientSessionsAfterToday(): Promise<void> {
    this.loadingVisible = true;
    try {
      this.clientSessions = await firstValueFrom(
        this.service.getSessionsOfClient(this.client.uid, this.sessionStatus, this.clientSessionsLimit)
      );
      if (!this.allSessions) {
        await this.getAllSessions();
      }
      this.mapClientSessionsToSessions();
      this.loadingVisible = false;
    } catch (e) {
      console.log(e);
      this.loadingVisible = false;
      this.popup.error(MSG_UNEXPECTED_ERROR_REFRESH_PAGE);
    }

  }

  onLimitResultsChanged($event: any, sessions: 'all' | 'client-sessions'): void {
    if (sessions === 'client-sessions') {
      if ($event > this.allSessionLimit) {
        this.popup.error(MSG_CSC_CLIENT_SESSION_REQUESTED_LIMIT_MUST_BE_LESS_OR_EQUAL_TO_ALL_SESSIONS_LIMIT);
        return;
      }
      this.clientSessionsLimit = $event;
      this.getClientSessions().then();
      return;
    }
    this.allSessionLimit = $event;
    this.getAllSessions().then();
  }

  async fetchAllSessionsByDateRange(start: Date, end: Date): Promise<void> {
    let clientSessionStart: Date;
    if (!this.showDateRangeOfClientSessions) {
      clientSessionStart = new Date(this.currentDate);
      clientSessionStart.setHours(0, 1, 0, 0);
    } else {
      clientSessionStart = this.dxClientSessionDateStart?.value as Date;
      if (!clientSessionStart) {
        this.popup.error(MSG_CSC_DATE_RANGE_SELECTED_BUT_NOT_FILLED + ` (client sessions)`);
        return;
      }
    }

    if (clientSessionStart.getTime() < start.getTime()) {
      this.popup.error(MSG_CSC_REQUESTED_CLIENT_SESSION_DATES_MUST_BE_BETWEEN_SELECTED_ALL_SESSIONS_DATE);
      return;
    }

    if (this.showDateRangeOfClientSessions) {
      const clientSessionEndDate = this.dxClientSessionDateEnd?.value as Date;
      if (!clientSessionEndDate) {
        this.popup.error(MSG_CSC_DATE_RANGE_SELECTED_BUT_NOT_FILLED + ` (client sessions)`);
        return;
      }

      if (clientSessionEndDate.getTime() > end.getTime()) {
        this.popup.error(MSG_CSC_REQUESTED_CLIENT_SESSION_DATES_MUST_BE_BETWEEN_SELECTED_ALL_SESSIONS_DATE);
        return;
      }
    }

    this.loadingVisible = true;
    try {
      this.allSessions = await firstValueFrom(
        this.service.getByDateRange(start, end)
      );
      this.loadingVisible = false;
      this.mapClientSessionsToSessions();
    } catch (e) {
      console.log(e);
      this.loadingVisible = false;
      this.popup.error(MSG_UNEXPECTED_ERROR_REFRESH_PAGE);
    } finally {
      this.loadingVisible = false;
    }
  }

  async fetchClientSessionsByDateRange(start: Date, end: Date): Promise<void> {
    start.setHours(0, 1, 0, 0);
    end.setHours(23, 59, 59, 0);
    let allSessionsStart: Date;
    if (!this.showDateRangeOfAllSessions) {
      allSessionsStart = new Date(this.currentDate);
      allSessionsStart.setHours(0, 1, 0, 0);
    } else {
      allSessionsStart = this.dxAllSessionsDateStart?.value as Date;
      if (!allSessionsStart) {
        this.popup.error(MSG_CSC_DATE_RANGE_SELECTED_BUT_NOT_FILLED + ` (all sessions)`);
        return;
      }
    }

    if (allSessionsStart.getTime() > start.getTime()) {
      this.popup.error(MSG_CSC_REQUESTED_CLIENT_SESSION_DATES_MUST_BE_BETWEEN_SELECTED_ALL_SESSIONS_DATE);
      return;
    }

    if (this.showDateRangeOfAllSessions) {
      const allSessionsDateEnd = this.dxAllSessionsDateEnd?.value as Date;
      if (!allSessionsDateEnd) {
        this.popup.error(MSG_CSC_DATE_RANGE_SELECTED_BUT_NOT_FILLED + ` (all sessions)`);
        return;
      }

      if (allSessionsDateEnd.getTime() < end.getTime()) {
        this.popup.error(MSG_CSC_REQUESTED_CLIENT_SESSION_DATES_MUST_BE_BETWEEN_SELECTED_ALL_SESSIONS_DATE);
        return;
      }
    }

    try {
      this.loadingVisible = true;
      this.clientSessions = await firstValueFrom(
        this.service.getSessionsOfClient(this.client.uid, this.sessionStatus, -1, start, end)
      );
      if (!this.allSessions) {
        await this.getAllSessions();
      }
      this.mapClientSessionsToSessions();
    } catch (e) {
      console.log(e);
      this.popup.error(MSG_UNEXPECTED_ERROR_REFRESH_PAGE);
    } finally {
      this.loadingVisible = false;
    }
  }


  onSessionStatusChanged($event: SessionStatus | 'all'): void {
    this.sessionStatus = $event;
    this.getClientSessions().then().catch();
  }

  private mapClientSessionsToSessions(): void {
    const mapped = this.clientSessions.reduce((r, c) => {
      r[c.sessionId] = c;
      return r;
    }, {});

    this.calendarItems = this.allSessions.map((s, index) => {
      return {
        text: s.sessionType.title,
        full: s.full || s.subscriptions.length >= s.spots,
        startDate: new Date(s.startDate_ts),
        endDate: new Date(s.endDate_ts),
        clientSession: mapped[s.uid],
        sessionId: s.uid,
        index,
        subscriptions: s.subscriptions.length,
        spots: s.spots,
        sessionTypeId: s.sessionType.uid,
        color: this.getCellColor(s, mapped[s.uid]),
        originalSession: s
      };
    });
    this.dxScheduler?.instance.repaint();
  }

  private getCellColor(session: SessionModelV1, clientSession?: ClientSessionModelV1): string {
    if (!clientSession) {
      if (this.currentDate.getTime() > session.startDate_ts) {
        return '#8f8c95';
      }
      if (session.full) {
        return '#099c15';
      }

      return '#306CC7';

    }

    const subscription = session.subscriptions.find(s => s.sessionId === clientSession.sessionId);
    if (clientSession && !subscription && clientSession.status !== 'cancelled') {
      return '#000000';
    }

    if (clientSession.status === 'cancelled') {
      return '#e77070';
    }

    if (this.currentDate.getTime() > session.startDate_ts) {
      return '#c2abec';
    }

    if (session.full) {
      return '#326433';
    }

    return 'blueviolet';
  }

  onAppointmentRendered($event: any): void {
    $event.appointmentElement.style.backgroundColor = $event.appointmentData.color;
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
          this.subscribeClientToSession().then().catch();
        }
      }
    });
  }

  private async subscribeClientToSession(): Promise<void> {
    if (!this.selectedCalendarItem) {
      this.popup.error(MSG_UNEXPECTED_ERROR_REFRESH_PAGE);
      return;
    }
    let selectedRow: any = this.dxFilteredPackagesGrid?.instance.getSelectedRowsData();
    if (!selectedRow || selectedRow.length === 0) {
      this.popup.error(MSG_CSC_PLEASE_SELECT_A_CLIENT_PACKAGE_TO_SUB_TO_SESSION);
      return;
    }
    selectedRow = selectedRow[0]; // as ClientPackageModelV1;
    this.popup.confirm(MSG_CSC_CONFIRM_SESSION_BOOK(this.client.fullName, selectedRow._package.title,
        new Date(this.selectedCalendarItem.originalSession.startDate_ts), this.selectedCalendarItem.originalSession.sessionType.title)
      , (confirmed) => {
        if (!confirmed) {
          return;
        }
        this.loadingVisible = true;
        this.service.bookSessionForClient(this.client.uid, selectedRow.uid, this.selectedCalendarItem.sessionId)
          .then(({clientSession, sessionSubscription}) => {
            this.clientSessions.push(clientSession);
            this.selectedCalendarItem.originalSession.subscriptions.push(sessionSubscription);
            const length = this.selectedCalendarItem.originalSession.subscriptions.length;
            this.selectedCalendarItem.originalSession.full = length >= this.selectedCalendarItem.originalSession.spots;
            this.selectedCalendarItem = undefined;
            this.mapClientSessionsToSessions();
            this.onUsedPackageEvent.emit(true);
          }).catch((e: FnError) => {
          this.popup.error(e.message);
        }).finally(() => {
          this.loadingVisible = false;
          this.showFilteredPackagesPopup = false;
          this.filteredPackages = undefined;
        });
      });
  }

  populateUsedPackageTitle(usedPackageId: string): string {
    if (!this.packages || this.packages.length === 0) {
      return 'N/A';
    }

    const pkg = this.packages.find(p => p.uid === usedPackageId);
    if (!pkg) {
      return 'N/A';
    }
    return pkg._package.title;
  }

  onSubscribeClientToSession(): void {
    if (!this.selectedCalendarItem.clientSession
      || (this.selectedCalendarItem.clientSession.status === 'cancelled'
        && this.currentDate.getTime() < new Date(this.selectedCalendarItem.clientSession.startDate_ts).getTime())) {
      this.filteredPackages = this.packages.filter(p => {
        const ests = p.eligibleSessionTypes.filter(e => e.sessionTypeId === this.selectedCalendarItem.sessionTypeId);
        for (const est of ests) {
          if (est.timesUsed < est.maxUsages) {
            return true;
          }
        }
        return false;
      });
      this.showFilteredPackagesPopup = true;
    }
  }

  onAppointmentFormOpening($event: any): void {
    $event.cancel = true;
    this.selectedCalendarItem = $event.appointmentData as CalendarItem;
    this.showSelectedCalendarItemPopup = true;
  }

  populatesSessionInfoOfClient(clientSession: ClientSessionModelV1): string {
    if (clientSession.status === 'upcoming') {
      return 'is subscribed to this session';
    }
    const cls = clientSession.status === 'cancelled' ? 'danger' : 'primary';

    return `has <i class="text-${cls}">${clientSession.status} this session</i>`;
  }

  onCancelSession(): void {
    this.popup.confirm(MSG_CSC_CONFIRM_CANCEL_SESSION(this.selectedCalendarItem.startDate), confirmed => {
      if (!confirmed) {
        return;
      }

      this.loadingVisible = true;
      this.service.cancelCessionForClient(this.client.uid,
        this.selectedCalendarItem.clientSession.uid,
        this.selectedCalendarItem.sessionId)
        .then((session: ClientSessionModelV1) => {
          const index = this.clientSessions.findIndex(c => c.uid === session.uid);
          if (index === -1) {
            this.popup.error(MSG_CSC_CANCEL_SESSION_SUCCESSFUL_BUT_FAILED_TO_UPDATE);
            return;
          }
          this.clientSessions[index] = session;
          const {sessionId, uid} = this.clientSessions[index];
          const aSession = this.allSessions.find(s => s.uid === sessionId);
          if (aSession) {
            const cSessionIndex = aSession.subscriptions.findIndex(s => s.clientSessionId === uid);
            if (cSessionIndex !== -1) {
              aSession.subscriptions.splice(cSessionIndex, 1);
            }
          }
          this.selectedCalendarItem = undefined;
          this.showSelectedCalendarItemPopup = false;
          this.mapClientSessionsToSessions();
          this.onUsedPackageEvent.emit(true);
        }).catch((e: FnError) => {
        this.popup.error(e.message);
      }).finally(() => {
        this.loadingVisible = false;
      });


    });
  }

  private async getClientSessions(): Promise<void> {
    if (!this.showDateRangeOfClientSessions) {
      await this.getClientSessionsAfterToday();
      return;
    }

    const start = this.dxClientSessionDateStart?.value as Date;
    const end = this.dxClientSessionDateEnd?.value as Date;
    if (!start || !end) {
      this.popup.error(MSG_CSC_DATE_RANGE_SELECTED_BUT_NOT_FILLED + ` (client sessions) `);
      return;
    }
    await this.fetchClientSessionsByDateRange(start, end);
  }

  private async getAllSessions(): Promise<void> {
    if (!this.showDateRangeOfAllSessions) {
      await this.getAllSessionsAfterToday();
      return;
    }

    const start = this.dxAllSessionsDateStart?.value as Date;
    const end = this.dxAllSessionsDateStart?.value as Date;
    if (!start || !end) {
      this.popup.error(MSG_CSC_DATE_RANGE_SELECTED_BUT_NOT_FILLED + ` (All sessions)`);
      return;
    }
    await this.fetchAllSessionsByDateRange(start, end);

  }
}
