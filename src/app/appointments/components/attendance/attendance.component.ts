import {Component, OnDestroy, OnInit} from '@angular/core';
import {SessionService} from '../../../services/session.service';
import {ClientModel} from '../../../models/ClientModel';
import {SessionTypeService} from '../../../services/session-type.service';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {take} from 'rxjs/operators';
import {SessionModel} from '../../../models/SessionModel';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css']
})
export class AttendanceComponent implements OnInit, OnDestroy {

  currDate: Date;
  beginDate: Date;
  endDate: Date;
  clients: ClientModel[];
  clockInterval: any;
  sessionTypes: SessionTypeModel[];
  todaySessions: SessionModel[];
  currentSessionIndex = 0;
  
  constructor(private sessionService: SessionService, private sessionTypeService: SessionTypeService) {
  }

  ngOnInit(): void {
    this.beginDate = new Date();
    this.beginDate.setHours(0, 1, 0);
    this.endDate = new Date();
    this.endDate.setHours(23, 59, 0);
    this.currDate = new Date();
    this.clockInterval = setInterval(() => {
      this.currDate = new Date();
    }, 1);
    this.sessionTypeService.getAll().pipe(take(1))
      .subscribe(types => {
        this.sessionTypes = types;
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
      });
  }
}
