import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SessionTypeService} from '../../../services/session-type.service';
import {PopupService} from '../../../services/popup.service';
import {SessionService} from '../../../services/session.service';
import {
  MSG_AC_END_DATE_MUST_BE_EQUAL_OR_GREATER,
  MSG_AC_START_N_END_DATE_REQUIRED,
  MSG_UNEXPECTED_ERROR,
  MSG_UNEXPECTED_ERROR_REFRESH_PAGE
} from '../../../utils/ui_messages';
import {ClientService} from '../../../services/client.service';
import {take} from 'rxjs/operators';
import {Router} from '@angular/router';
import {SessionTypesV1Component} from '../../../shared/session-types/session-types-v1.component';
import {SessionServiceV1} from '../../../services/session.service-v1';
import {SessionModelV1} from '../../../models/SessionModelV1';
import {DxSchedulerComponent} from 'devextreme-angular';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {SessionSubscriptionModel} from '../../../models/SessionSubscriptionModel';

declare var $: any;

interface SelectedSession {
  subscriptions: SessionSubscriptionModel[];
  isFull: boolean;
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
  isFull: boolean;
  index: number;
  spots: number;
}

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  @ViewChild(DxSchedulerComponent) dxScheduler: DxSchedulerComponent | undefined;
  @ViewChild(SessionTypesV1Component) sessionTypeComponent: SessionTypesV1Component | undefined;

  currentDate = new Date();
  calendarItems: CalendarItem[] = [];
  showDateRange = false;
  sessionsV1: SessionModelV1[] = [];
  selectedSessionV1: SessionModelV1 | undefined;
  showSelectedSessionPopup = false;

  selectedSession: {
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
  } = null;
  sessionTypes: SessionTypeModel[];

  constructor(private sessionTypeService: SessionTypeService,
              private popup: PopupService,
              private sessionService: SessionService,
              private clientService: ClientService,
              private router: Router,
              private service: SessionServiceV1) {
  }

  ngOnInit(): void {
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
      session: {
        uid: session.uid,
        allowUpdate: session.subscriptions.length === 0,
        spots: session.spots,
        isFull: session.isFull,
        startDate: new Date(session.startDate_ts),
        endDate: new Date(session.endDate_ts),
        sessionType: {...session.sessionType},
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
    this.printOptions = {
      today: true,
      printBeginDate: null,
      printEndDate: null
    };
    this.showPrintOptionsPopup = true;
  }

  generateScheduleReport(): void {
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
    this.calendarItems = this.sessionsV1.map((s, index) => {
      return {
        text: s.sessionType.title,
        startDate: new Date(s.startDate_ts),
        endDate: new Date(s.endDate_ts),
        sessionId: s.uid,
        color: s.isFull || s.subscriptions.length >= s.spots
          ? '#099c15' : (s.startDate_ts < this.currentDate.getTime()
            ? '#8f8c95'
            : '#306CC7'),
        subscriptions: s.subscriptions.length,
        isFull: s.isFull,
        index,
        spots: s.spots
      };
    });
    this.dxScheduler?.instance.repaint();
    this.loadingVisible = false;
  }

  onSessionsFetchedError(e: any): void {
    console.log(e);
    this.loadingVisible = false;
    this.popup.error(MSG_UNEXPECTED_ERROR_REFRESH_PAGE);
  }

  onSessionTypesFetched($event: SessionTypeModel[]): void {
    this.sessionTypes = $event;
  }

  onRemoveClientFromSession(c: SessionSubscriptionModel): void {
  }

  onSessionUpdate(): void {
  }
}
