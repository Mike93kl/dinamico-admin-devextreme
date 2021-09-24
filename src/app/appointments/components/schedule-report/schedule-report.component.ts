import {Component, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {map, take} from 'rxjs/operators';
import {SessionModel} from '../../../models/SessionModel';
import {ClientModel} from '../../../models/ClientModel';
import {SessionTypeService} from '../../../services/session-type.service';
import {PopupService} from '../../../services/popup.service';
import {MSG_UNEXPECTED_ERROR} from '../../../utils/ui_messages';
import {SessionTypeModel} from '../../../models/SessionTypeModel';

declare var $: any;

@Component({
  selector: 'app-schedule-report',
  templateUrl: './schedule-report.component.html',
  styleUrls: ['./schedule-report.component.css']
})
export class ScheduleReportComponent implements OnInit {

  schedule: {
    [key: string]: {
      dateStr: string;
      data: {
        session: SessionModel;
        clients: ClientModel[];
      }[]
    }
  };
  startDate: Date;
  endDate: Date;
  showClients: false;
  sessionTypes: SessionTypeModel[];

  constructor(private activatedRoute: ActivatedRoute, private sessionTypeService: SessionTypeService,
              private popup: PopupService) {
  }

  ngOnInit(): void {
    console.log(history.state);
    if (!!history.state.data.start && !!history.state.data.end) {
      this.startDate = new Date(history.state.data.start);
      this.endDate = new Date(history.state.data.end);
    }
    this.sessionTypeService.getAll().pipe(take(1)).subscribe(types => {
      this.sessionTypes = types;
      this.formatData(history.state.data.result);
    }, error => {
      console.log(error);
      this.popup.error(MSG_UNEXPECTED_ERROR);
    });
  }

  private formatData(data: { session: SessionModel; clients: ClientModel[] }[]): void {

    this.schedule = data.reduce((prev, curr) => {
      curr.session.sessionType = this.sessionTypes.find(e => e.uid === curr.session.sessionTypeId);
      const newData = {
        session: curr.session,
        clients: curr.clients
      };
      if (!prev.hasOwnProperty(curr.session.dateStr)) {
        prev[curr.session.dateStr] = {
          dateStr: curr.session.dateStr,
          data: [newData]
        };
      } else {
        prev[curr.session.dateStr].data.push(newData);
      }

      return prev;

    }, {});

    console.log(this.schedule);
  }

  printReport(): void {
    print();
  }


}
