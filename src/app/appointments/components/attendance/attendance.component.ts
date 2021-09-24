import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SessionService} from '../../../services/session.service';
import {ClientModel} from '../../../models/ClientModel';
import {SessionTypeService} from '../../../services/session-type.service';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {take} from 'rxjs/operators';
import {SessionModel} from '../../../models/SessionModel';
import {PopupService} from '../../../services/popup.service';
import {ClientSessionModel} from '../../../models/ClientSessionModel';
import {MSG_UNEXPECTED_ERROR} from '../../../utils/ui_messages';

declare var $: any;

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css']
})
export class AttendanceComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('header') headerView: ElementRef;
  loadingVisible = false;
  currDate: Date;
  beginDate: Date;
  endDate: Date;
  clients: ClientModel[];
  clockInterval: any;
  sessionTypes: SessionTypeModel[];
  todaySessions: SessionModel[];
  currentSessionIndex = 0;
  currentSession: { session: SessionModel; subscribed: { client: ClientModel; clientSession: ClientSessionModel }[] };

  constructor(private sessionService: SessionService, private sessionTypeService: SessionTypeService,
              private popup: PopupService) {
  }

  ngAfterViewInit(): void {
    this.setContentMargin();
  }

  ngOnInit(): void {
    this.currentSession = {
      session: null, subscribed: []
    };
    this.currDate = new Date();
    this.clockInterval = setInterval(() => {
      this.currDate = new Date();
    }, 1);
    this.sessionTypeService.getAll().pipe(take(1))
      .subscribe(stypes => {
        this.sessionTypes = stypes;
        this.getSessions();
      });
  }

  ngOnDestroy(): void {
    clearInterval(this.clockInterval);
  }

  getSessions(): void {
    this.sessionService.getTodaysSessionsSorted().pipe(take(1))
      .subscribe(sessions => {
        this.todaySessions = sessions.map(s => {
          s.sessionType = this.sessionTypes.find(e => e.uid === s.sessionTypeId);
          return s;
        });
        console.log(this.todaySessions);
        if (this.todaySessions.length > 0) {
          this.currentSession.session = this.todaySessions[this.currentSessionIndex];
          this.setContentMargin();
          this.getCurrentSessionClients();
        }
      });
  }

  previousSession(): void {
    if (this.currentSessionIndex <= 0) {
      return;
    }
    this.currentSession.session = this.todaySessions[--this.currentSessionIndex];
    this.setContentMargin();
    this.getCurrentSessionClients();
  }

  nextSession(): void {
    if (this.currentSessionIndex >= this.todaySessions.length - 1) {
      return;
    }
    this.currentSession.session = this.todaySessions[++this.currentSessionIndex];
    this.setContentMargin();
    this.getCurrentSessionClients();
  }

  private getCurrentSessionClients(): void {
    if (this.currentSession.session.subscriptions.length <= 0) {
      this.currentSession.subscribed = [];
      return;
    }
    this.loadingVisible = true;
    this.sessionService.getClientsOfSession(this.currentSession.session)
      .pipe(take(1))
      .subscribe(result => {
        console.log(result);
        this.loadingVisible = false;
        if (result.success) {
          this.currentSession.subscribed = result.data;
        } else {
          this.popup.error('Could not get clients of session');
        }
      }, error => {
        console.log(error);
        this.loadingVisible = false;
        this.popup.error('Could not get clients of session');
      });
  }

  private setContentMargin(): void {
    if (!this.headerView) {
      return;
    }
    const content = $('#content');
    setTimeout(() => {
      content.css('margin-top', this.headerView.nativeElement.offsetHeight + 20);
    }, 200);
  }

  toggleAttendance(client: ClientModel, clientSession: ClientSessionModel): void {
    this.loadingVisible = true;
    this.sessionService.toggleAttendance(clientSession.uid, !clientSession.attended)
      .then((ok) => {
        this.loadingVisible = false;
        if (!ok) {
          this.popup.error(MSG_UNEXPECTED_ERROR);
        } else {
          clientSession.attended = !clientSession.attended;
        }
      }).catch(e => {
      console.log(e);
      this.loadingVisible = false;
      this.popup.error(MSG_UNEXPECTED_ERROR);
    });
  }
}
