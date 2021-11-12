import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SessionTypeService } from '../../../services/session-type.service';
import { PopupService } from '../../../services/popup.service';
import { SessionService } from '../../../services/session.service';
import {
  MSG_AC_CONFIRM_BOOK_SESSION_FOR_CLIENT,
  MSG_AC_CONFIRM_CANCEL_SESSION, MSG_AC_CONFIRM_DELETE_SESSION,
  MSG_AC_END_DATE_MUST_BE_EQUAL_OR_GREATER, MSG_AC_PLEASE_SELECTED_A_CLIENT_PACKAGE, MSG_AC_SESSION_BOOKED_SUCCESS, MSG_AC_SPOTS_CANNOT_BE_LESS_THAN_SUB_OR_ZERO,
  MSG_AC_START_N_END_DATE_REQUIRED,
  MSG_UNEXPECTED_ERROR,
  MSG_UNEXPECTED_ERROR_REFRESH_PAGE
} from '../../../utils/ui_messages';
import { ClientService } from '../../../services/client.service';
import { take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { SessionTypesV1Component } from '../../../shared/session-types/session-types-v1.component';
import { SessionServiceV1 } from '../../../services/session.service-v1';
import { SessionModelV1 } from '../../../models/SessionModelV1';
import { DxDataGridComponent, DxSchedulerComponent } from 'devextreme-angular';
import { SessionTypeModel } from '../../../models/SessionTypeModel';
import { SessionSubscriptionModel } from '../../../models/SessionSubscriptionModel';
import { FnError } from "../../../models/fn/FnResponseHandler";
import { ClientModel } from 'src/app/models/ClientModel';
import {DxListComponent} from 'devextreme-angular';
import { PackagesService } from 'src/app/services/packages.service';
import { ClientPackageModelV1 } from 'src/app/models/ClientPackageModelV1';

declare var $: any;

interface SelectedSession {
  subscriptions: SessionSubscriptionModel[];
  full: boolean;
  sessionType: SessionTypeModel;
  startDate: Date;
  endDate: Date;
  spots: number;
  allowUpdate: boolean;
  uid: string;
}

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
  isPastDate: boolean;
}

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  @ViewChild(DxSchedulerComponent) dxScheduler: DxSchedulerComponent | undefined;
  @ViewChild(SessionTypesV1Component) sessionTypeComponent: SessionTypesV1Component | undefined;
  @ViewChild(DxListComponent) clientListComponent: DxListComponent | undefined;
  @ViewChild('matchingSessionClientPackages') matchingSessionClientPackagesGrid: DxDataGridComponent | undefined;

  currentDate = new Date();
  calendarItems: CalendarItem[] = [];
  showDateRange = false;
  sessionsV1: SessionModelV1[] = [];
  showSelectedSessionPopup = false;

  selectedSession: {
    originalSession: SessionModelV1;
    session: SelectedSession,
    calendarItem: CalendarItem;
  } | undefined;

  loadingVisible = false;
  limit = 100;
  sessionTypePopupVisible = false;
  showPrintOptionsPopup = false;
  printOptions: {
    today: boolean;
    printBeginDate: any;
    printEndDate: any;
  } = {
    today: true,
    printBeginDate: null,
    printEndDate: null
  };;
  sessionTypes: SessionTypeModel[];


  // clients to subscribe to session
  clients: ClientModel[] = []
  showClientsPopup = false
  clientsForSessionPopup: ClientModel[] = [];
  selectedClient: ClientModel | undefined;
  selectedClientPackages: ClientPackageModelV1[] = []
  showFilteredPackagesPopup = false


  constructor(
    private popup: PopupService,
    private clientService: ClientService,
    private router: Router,
    private service: SessionServiceV1,
    private packageService: PackagesService) {
  }

  ngOnInit(): void {

    this.clientService.getAll().pipe(take(1)).subscribe({
      next: clients => {
        this.clients = clients;
      },
      error: error => {
        console.log(error);
        this.clients = null
      }
    })

    this.getSessionsAfterToday();
  }

  getSessionsAfterToday(): void {
    this.loadingVisible = true;
    this.service.getAllSessionsAfterToday(this.limit).pipe(take(1)).subscribe({
      next: sessions => {
        this.onSessionsFetched(sessions);
      },
      error: err => {
        this.onSessionsFetchedError(err);
      }
    });
  }

  ngOnDestroy(): void {

  }

  onAppointmentFormOpening($event: any): void {
    console.log($event);
    $event.cancel = true;
    const session = this.sessionsV1[$event.appointmentData.index];
    if (!session) {
      this.popup.error(MSG_UNEXPECTED_ERROR);
      return;
    }
    this.selectedSession = {
      originalSession: session,
      session: {
        uid: session.uid,
        allowUpdate: session.subscriptions.length === 0,
        spots: session.spots,
        full: session.full,
        startDate: new Date(session.startDate_ts),
        endDate: new Date(session.endDate_ts),
        sessionType: { ...session.sessionType },
        subscriptions: session.subscriptions.map(s => {
          return {
            ...s
          };
        })
      },
      calendarItem: $event.appointmentData
    };
    this.showSelectedSessionPopup = true;
  }


  onAppointmentRendered($event: any): void {
    $event.appointmentElement.style.backgroundColor = $event.appointmentData.color;
  }


  showPrintOptions(): void {
    this.showPrintOptionsPopup = true;
  }

  generateScheduleReport(): void {
    let start;
    let end;

    if(this.printOptions.today) {
      start = new Date();
      end = new Date()
    } else {
      if(!this.printOptions.printBeginDate || !this.printOptions.printEndDate) {
        this.popup.error('Please select valid dates');
        return;
      }

      start = new Date(this.printOptions.printBeginDate)
      end = new Date(this.printOptions.printEndDate)
    }

    this.loadingVisible = true
    this.service.getByDateRange(start, end).pipe(take(1))
    .subscribe({
      next: sessions => {
        this.loadingVisible = false
        if(sessions.length == 0) {
          this.popup.info('Nothing to show for the selected dates');
          return;
        }
        this.router.navigateByUrl('/schedule-report', {state: {data: sessions}})
      },
      error: e => {
        this.loadingVisible = false
        console.log(e);
        this.popup.error(MSG_UNEXPECTED_ERROR);
      }
    })
  }

  fetchByDateRange(start: Date, end: Date): void {
    if (!start || !end) {
      this.popup.error(MSG_AC_START_N_END_DATE_REQUIRED);
      return;
    }
    if (start.getTime() > end.getTime()) {
      this.popup.error(MSG_AC_END_DATE_MUST_BE_EQUAL_OR_GREATER);
      return;
    }
    start.setHours(0, 1, 0, 0);
    end.setHours(23, 59, 59);
    this.loadingVisible = true;
    this.service.getByDateRange(start, end).pipe(take(1))
      .subscribe({
        next: sessions => {
          this.onSessionsFetched(sessions);
        },
        error: err => {
          this.onSessionsFetchedError(err);
        }
      });
  }

  onLimitResultsChanged($event: any): void {
    this.limit = $event;
    this.getSessionsAfterToday();
  }

  onSessionsFetched(sessions: SessionModelV1[]): void {
    this.sessionsV1 = sessions;
    this.mapSessionsToCalendarItems();
    this.loadingVisible = false;
  }

  private mapSessionsToCalendarItems(): void {
    this.calendarItems = this.sessionsV1.map((s, index) => {
      return {
        text: s.sessionType.title,
        startDate: new Date(s.startDate_ts),
        endDate: new Date(s.endDate_ts),
        sessionId: s.uid,
        color: s.full || s.subscriptions.length >= s.spots
          ? '#099c15' : (s.startDate_ts < this.currentDate.getTime()
            ? '#8f8c95'
            : '#306CC7'),
        subscriptions: s.subscriptions.length,
        full: s.full,
        index,
        spots: s.spots,
        isPastDate: this.currentDate.getTime() > new Date(s.startDate_ts).getTime()
      };
    });
    this.dxScheduler?.instance.repaint();
  }

  onSessionsFetchedError(e: any): void {
    console.log(e);
    this.loadingVisible = false;
    this.popup.error(MSG_UNEXPECTED_ERROR_REFRESH_PAGE);
  }

  onSessionTypesFetched($event: SessionTypeModel[]): void {
    this.sessionTypes = $event;
  }

  onRemoveClientFromSession(c: SessionSubscriptionModel, i: number): void {
    this.popup.confirm(MSG_AC_CONFIRM_CANCEL_SESSION(c.clientFullName), confirmed => {
      if (!confirmed) {
        return;
      }
      this.loadingVisible = true;
      this.service.cancelCessionForClient(c.clientId, c.clientSessionId, c.sessionId)
        .then((ignored) => {
          this.selectedSession.originalSession.subscriptions.splice(i, 1);
          const subLength = this.selectedSession.originalSession.subscriptions.length;
          this.selectedSession.calendarItem.subscriptions = subLength;
          this.selectedSession.session.subscriptions = this.selectedSession.originalSession.subscriptions;
          this.selectedSession.originalSession.full = subLength >= this.selectedSession.originalSession.spots;
          this.selectedSession.session.full = this.selectedSession.originalSession.full
          this.selectedSession.session.allowUpdate = this.selectedSession.originalSession.subscriptions.length == 0
          this.mapSessionsToCalendarItems();
        }).catch((e: FnError) => {
          this.popup.error(e.message);
        }).finally(() => {
          this.loadingVisible = false;
        });
    });
  }

  onSessionUpdate(): void {
    const { spots, sessionType } = this.selectedSession.session;
    this.loadingVisible = true;
    this.service.updateSession(this.selectedSession.originalSession, sessionType, spots, () => {
      this.popup.error(MSG_AC_SPOTS_CANNOT_BE_LESS_THAN_SUB_OR_ZERO);
    }).then((updated) => {
      if (updated) {
        this.selectedSession.calendarItem.spots = spots;
        this.selectedSession.calendarItem.text = sessionType.title;
        this.selectedSession.calendarItem.full = this.selectedSession.originalSession.full;
        this.selectedSession = undefined;
        this.mapSessionsToCalendarItems();
        this.showSelectedSessionPopup = false;
        return;
      }
    }).catch(e => {
      console.log(e);
      this.popup.error(MSG_UNEXPECTED_ERROR);
    }).finally(() => {
      this.loadingVisible = false;
    });

  }

  onDeleteSession(): void {
    if (!this.selectedSession || !this.selectedSession.originalSession) {
      return;
    }
    this.popup.confirm(MSG_AC_CONFIRM_DELETE_SESSION(this.selectedSession.originalSession.startDate_str), confirmed => {
      if (!confirmed) {
        return;
      }
      this.loadingVisible = true;
      this.service.remove([this.selectedSession.originalSession])
        .then((removed) => {
          if (removed) {
            const index = this.sessionsV1.findIndex(s => s.uid === this.selectedSession.originalSession.uid);
            if (index !== -1) {
              this.sessionsV1.splice(index, 1);
            }
            this.mapSessionsToCalendarItems();
            this.selectedSession = undefined;
            this.showSelectedSessionPopup = false;
          }
        }).catch(e => {
          console.log(e);
          this.popup.error(MSG_UNEXPECTED_ERROR);
        }).finally(() => {
          this.loadingVisible = false;
        });
    });
  }


  /**
   * 
   *  Select client for session flow
   */

  showAddSubscribersPopup(): void {
    if(!this.selectedSession || !this.selectedSession.originalSession){
      this.popup.error(MSG_UNEXPECTED_ERROR_REFRESH_PAGE);
      return;
    }
    if(this.clients != null) {
      const subscribedClients = this.selectedSession.originalSession.subscriptions.map(s => s.clientId);
      this.clientsForSessionPopup = this.clients.filter(c => !subscribedClients.includes(c.uid))
    } else {
      this.clientsForSessionPopup = null
    }
    this.showClientsPopup = true
  }

  selectClientForSession() {
    if(!this.clientListComponent) {
      this.popup.error(MSG_UNEXPECTED_ERROR_REFRESH_PAGE);
      return;
    }

    const selectedItems = this.clientListComponent.selectedItems;
    if(selectedItems.length == 0) {
      this.popup.error('Please select a client');
      return;
    }

    this.selectedClient = selectedItems[0];

    this.loadingVisible = true;
    this.packageService.getActiveClientPackagesForSession(this.selectedClient.uid!, this.selectedSession.originalSession.sessionType.uid)
      .then((packages) => {
        this.selectedClientPackages = packages
        console.log(packages)
      }).catch((e: FnError) => {
        this.selectedClientPackages = null
        this.popup.error(e.message)
      }).finally(() => {
        this.loadingVisible = false;
        this.showFilteredPackagesPopup = true
      })
  }

  onFilteredPackagesToolbarPreparing(e: any): void {
    e.toolbarOptions.items.unshift({
      location: 'before',
      widget: 'dxButton',
      options: {
        type: 'outlined',
        text: 'SELECT',
        onClick: () => {
          this.subscribeClientToSession()
        }
      }
    });
  }

  subscribeClientToSession(): void {
    if(!this.matchingSessionClientPackagesGrid || !this.selectedClient 
      || !this.selectedSession || !this.selectedSession.originalSession) {
      this.popup.error(MSG_UNEXPECTED_ERROR_REFRESH_PAGE);
      return;
    }

    let selectedRow: any = this.matchingSessionClientPackagesGrid?.instance.getSelectedRowsData();
    if(selectedRow.length == 0) {
      this.popup.error(MSG_AC_PLEASE_SELECTED_A_CLIENT_PACKAGE);
      return;
    }
    selectedRow = selectedRow[0] as ClientPackageModelV1
    this.popup.confirm(MSG_AC_CONFIRM_BOOK_SESSION_FOR_CLIENT(selectedRow._package.title, this.selectedClient.fullName, 
      this.selectedSession.session.sessionType.title, this.selectedSession.originalSession.startDate_str), confirmed => {

        if(!confirmed) {
          return
        }
        this.loadingVisible = true;
        this.service.bookSessionForClient(this.selectedClient.uid, selectedRow.uid, this.selectedSession.originalSession.uid)
        .then((result) => {
              this.selectedSession.originalSession.subscriptions.push(result.sessionSubscription)
              const subLength = this.selectedSession.originalSession.subscriptions.length;
              this.selectedSession.calendarItem.subscriptions = subLength;
              this.selectedSession.session.subscriptions = this.selectedSession.originalSession.subscriptions;
              this.selectedSession.originalSession.full = subLength >= this.selectedSession.originalSession.spots;
              this.selectedSession.session.full = this.selectedSession.originalSession.full
              this.selectedSession.session.allowUpdate = this.selectedSession.originalSession.subscriptions.length == 0
              this.mapSessionsToCalendarItems();
              this.showFilteredPackagesPopup = false
              this.popup.success(MSG_AC_SESSION_BOOKED_SUCCESS)
        }).catch((e: FnError) => {
          this.popup.error(e.message)
        }).finally(() => {
          this.loadingVisible = false
        })


      })
  }

}

