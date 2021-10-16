import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SessionTypeService} from '../../../services/session-type.service';
import {Subscription} from 'rxjs';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {PopupService} from '../../../services/popup.service';
import {SessionService} from '../../../services/session.service';
import {SessionModel} from '../../../models/SessionModel';
import {MSG_UNEXPECTED_ERROR} from '../../../utils/ui_messages';
import {ClientModel} from '../../../models/ClientModel';
import {ClientService} from '../../../services/client.service';
import {take} from 'rxjs/operators';
import {confirm} from 'devextreme/ui/dialog';
import {Router} from '@angular/router';
import {SessionTypesV1Component} from '../../../shared/session-types/session-types-v1.component';
import {SessionServiceV1} from "../../../services/session.service-v1";
import {SessionModelV1} from "../../../models/SessionModelV1";
import {DxSchedulerComponent} from "devextreme-angular";

declare var $: any;

interface CalendarItem {
  text: string;
  startDate: Date;
  endDate: Date;
  sessionId: string;
  color: string;
  subscribers: number;
  isFull: boolean;
  index: number;
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

  sessionTypes: SessionTypeModel[];
  sessions: SessionModel[];
  loadingVisible = false;
  limit = 100;
  sessionTypePopupVisible = false;
  showSubscribedClientsPopup = false;
  showPrintOptionsPopup = false;
  selectedSession: {
    session: SessionModel;
    subscribedClients: ClientModel[]
  } | null = null;
  printOptions: {
    today: boolean;
    printBeginDate: any;
    printEndDate: any;
  } = null;
  // subscribers
  sessionTypeSub: Subscription;
  sessionsSub: Subscription;

  constructor(private sessionTypeService: SessionTypeService,
              private popup: PopupService,
              private sessionService: SessionService,
              private clientService: ClientService,
              private router: Router,
              private service: SessionServiceV1) {
  }

  ngOnInit(): void {

    this.service.getAllSessionsAfterToday(100).pipe(take(1)).subscribe({
      next: sessions => {
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
            subscribers: s.subscriptions.length,
            isFull: s.isFull,
            index
          };
        });
        this.dxScheduler?.instance.repaint();
      }
    });

  }

  getAppointments(): void {
    this.sessionsSub = this.sessionService.getAllSessions(this.limit).subscribe(sessions => {
      this.sessions = sessions.map(s => {
        s.sessionType = this.sessionTypes.find(e => e.uid === s.sessionTypeId);
        s.text = s.sessionType.title;
        s.startDate = new Date(s.startDate.seconds * 1000);
        s.endDate = new Date(s.endDate.seconds * 1000);
        s.allowDeleting = s.subscriptions.length > 0 || this.currentDate > s.startDate;
        if (this.currentDate > s.startDate) {
          s.disabled = true;
          s.color = '#8f8c95';
        } else if (s.isFull || s.subscriptions.length >= s.spots) {
          s.color = '#099c15';
        } else {
          s.color = '#306CC7';
        }
        return s;
      });
    }, error => {
      console.log(error);
      this.popup.error('Could not fetch sessions. Please refresh the page');
    });
  }

  ngOnDestroy(): void {
    try {
      this.sessionTypeSub.unsubscribe();
      this.sessionsSub.unsubscribe();
    } catch (e) {
    }
  }

  onAppointmentFormOpening($event: any): void {
    console.log($event);
    $event.cancel = true;
    this.selectedSessionV1 = this.sessionsV1[$event.appointmentData.index];
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
    const today = new Date();
    if (this.printOptions.today) {
      today.setHours(0, 1, 0);
      this.printOptions.printBeginDate = new Date(today);
      today.setHours(23, 59, 0);
      this.printOptions.printEndDate = new Date(today);
    } else {
      const begin = new Date(Date.parse(this.printOptions.printBeginDate));
      const end = new Date(Date.parse(this.printOptions.printEndDate));
      begin.setHours(0, 1, 0);
      end.setHours(23, 59, 0);
      this.printOptions.printBeginDate = begin;
      this.printOptions.printEndDate = end;
    }
    this.loadingVisible = true;
    this.sessionService.fetchSessionsInRangeWithClients(this.printOptions.printBeginDate as Date, this.printOptions.printEndDate as Date)
      .then(result => {
        this.loadingVisible = false;
        if (result.length === 0) {
          this.popup.info('Nothing to show for selected dates');
          return;
        }
        this.router.navigateByUrl('/schedule-report', {
          state: {
            data: {
              result, start: this.printOptions.printBeginDate.getTime(), end: this.printOptions.printEndDate.getTime()
            }
          }
        });
      })
      .catch(error => {
        console.log(error);
        this.loadingVisible = false;
        this.popup.error(MSG_UNEXPECTED_ERROR);
      });
  }

  fetchByDateRange(start: Date, end: Date): void {

  }
}
