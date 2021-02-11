import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {SessionService} from '../../../services/session.service';
import {ClientModel} from '../../../models/ClientModel';
import {SessionTypeService} from '../../../services/session-type.service';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {take} from 'rxjs/operators';
import {SessionModel} from '../../../models/SessionModel';
import {PopupService} from '../../../services/popup.service';

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
  currentSessionIndex = -1;
  currentSession: { session: SessionModel; clients: ClientModel[] };

  constructor(private sessionService: SessionService, private sessionTypeService: SessionTypeService,
              private popup: PopupService) {
  }

  ngAfterViewInit(): void {
    this.setContentMargin();
  }

  ngOnInit(): void {
    this.currentSession = {
      session: null, clients: []
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
         this.nextSession();
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
      this.currentSession.clients = [];
      return;
    }
    this.loadingVisible = true;
    this.sessionService.getSubscribedClients(this.currentSession.session)
      .then(clients => {
        this.loadingVisible = false;
        this.currentSession.clients = clients;
      })
      .catch(e => {
        this.loadingVisible = false;
        console.log(e);
        this.popup.error('Could not fetch clients of session!');
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
}
