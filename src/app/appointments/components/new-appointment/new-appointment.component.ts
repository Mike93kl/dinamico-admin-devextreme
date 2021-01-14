import {Component, OnDestroy, OnInit} from '@angular/core';
import {SessionModel} from '../../../models/SessionModel';
import {SessionTypeService} from '../../../services/session-type.service';
import {Subscription} from 'rxjs';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {PopupService} from '../../../services/popup.service';
import {UNEXPECTED_ERROR} from '../../../utils/ui_messages';
import {Router} from '@angular/router';
import {SessionService} from '../../../services/session.service';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'app-new-appointment',
  templateUrl: './new-appointment.component.html',
  styleUrls: ['./new-appointment.component.css']
})
export class NewAppointmentComponent implements OnInit, OnDestroy {

  date: Date;
  sessions: SessionModel[] = [];
  sessionTypes: SessionTypeModel[];
  newSession: SessionModel;
  repeatNo = 0;
  includeSat = false;
  includeSan = false;
  creating = false;
  maxSessionsValue = 0;
  sessionsCreatedValue = 0;
  // subs
  sessionTypeSub: Subscription;

  constructor(private sessionTypeService: SessionTypeService,
              private popup: PopupService, private router: Router,
              private sessionService: SessionService,
              private datePipe: DatePipe) {
  }

  ngOnInit(): void {
    this.sessionTypeSub = this.sessionTypeService.getAll().subscribe(types => {
      this.sessionTypes = types;
    }, error => this.popup.error('Could not get session types.', () => {
      this.router.navigate(['/appointments']);
    }));
  }

  ngOnDestroy(): void {
    try {
      this.sessionTypeSub.unsubscribe();
    } catch (e) {
    }
  }

  pushNewSession(): void {
    const previous = this.sessions.length > 0 ? this.sessions[this.sessions.length - 1] : null;
    this.newSession = {
      startDate: null,
      endDate: null,
      date: null,
      dateStr: null,
      sessionTypeId: previous ? previous.sessionTypeId : this.sessionTypes[0].uid,
      spots: previous ? previous.spots : 1,
      startTime: previous ? {
        hour: (previous.startTime.hourAsInt + 1).toString(),
        hourAsInt: previous.startTime.hourAsInt + 1,
        minutesAsInt: previous.startTime.minutesAsInt,
        minutes: previous.startTime.minutes
      } : {hour: '7', hourAsInt: 7, minutes: '00', minutesAsInt: 0},
      endTime: previous ? {
        hour: (previous.endTime.hourAsInt + 1).toString(),
        hourAsInt: previous.endTime.hourAsInt + 1,
        minutesAsInt: previous.endTime.minutesAsInt,
        minutes: previous.endTime.minutes
      } : {hour: '8', hourAsInt: 8, minutes: '00', minutesAsInt: 0},
      subscriptions: [],
      isFull: false,
      uid: ''
    };
  }

  push(): void {
    if (this.newSession.spots === 0) {
      this.popup.info('Available spots cannot be Zero!');
      return;
    }
    this.newSession.sessionType = this.sessionTypes.find(e => e.uid === this.newSession.sessionTypeId);
    this.sessions.push({...this.newSession});
    this.newSession = null;
  }

  private formatDateStr(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }

  async create(): Promise<void> {
    if (this.repeatNo === 0) {
      this.repeatNo = 1;
    }
    this.maxSessionsValue = this.sessions.length * this.repeatNo;
    this.creating = true;
    if (this.repeatNo > 14 || this.repeatNo < 0) {
      this.popup.error('Repeat days must be between 0 and 14');
      this.repeatNo = 14;
      this.creating = false;
      return;
    }
    const creatingSessions = [...this.sessions];
    const sessionDate = new Date(this.date);
    sessionDate.setHours(0, 0, 0);
    for (let i = 0; i < this.repeatNo; i++) {
      const d = new Date(sessionDate.getTime() + ((1000 * 60 * 60 * 24) * i));
      if (d.getDay() === 6 && !this.includeSat && this.repeatNo > 1) {
        continue;
      }
      if (d.getDay() === 0 && !this.includeSan && this.repeatNo > 1) {
        continue;
      }
      const skipped: number[] = [];
      let index = 0;
      for (const session of creatingSessions) {
        if (session.uid) {
          delete session.uid;
        }
        if (session.sessionType) {
          delete session.sessionType;
        }
        session.date = d;
        session.dateStr = this.formatDateStr(d);
        session.startTime.hourAsInt = parseInt(session.startTime.hour, 10);
        session.startTime.minutesAsInt = parseInt(session.startTime.minutes, 10);
        session.endTime.hourAsInt = parseInt(session.endTime.hour, 10);
        session.endTime.minutesAsInt = parseInt(session.endTime.minutes, 10);
        const startDate = new Date(d);
        startDate.setHours(session.startTime.hourAsInt, session.startTime.minutesAsInt);
        const existingSession = await this.sessionService.getByStartDate(startDate);
        if (existingSession.length > 0) {
          skipped.push(index);
          this.popup.info(`${this.datePipe.transform(startDate, 'dd/MM/yyyy hh:mm')} Session already
           exists. Skipping creating session`);
        }
        session.startDate = startDate;
        const endDate = new Date(d);
        endDate.setHours(session.endTime.hourAsInt, session.endTime.minutesAsInt);
        session.endDate = endDate;
        index++;
      }
      for (const j of skipped) {
        creatingSessions.splice(j, 1);
      }
      await this.sessionService.create(creatingSessions);
      this.sessionsCreatedValue += creatingSessions.length;
    }
    this.router.navigate(['/appointments']);
  }

  getSessionTypeTitle(sessionTypeId: string): string {
    return this.sessionTypes.find(e => e.uid === sessionTypeId).title;
  }

  formatProgressBarValue(v): string {
    return `Creating, Please wait: ${(v * 100).toFixed(2)}% done`;
  }

}

