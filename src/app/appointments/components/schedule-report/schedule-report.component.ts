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
import { SessionModelV1 } from 'src/app/models/SessionModelV1';
import { DatePipe } from '@angular/common';

declare var $: any;

@Component({
  selector: 'app-schedule-report',
  templateUrl: './schedule-report.component.html',
  styleUrls: ['./schedule-report.component.css']
})
export class ScheduleReportComponent implements OnInit {

  dateOptions =  { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  map = new Map()
  mapArray = []
  schedule: {
    [key: string]:  {sessions: SessionModelV1[]}
  } = {}
  allData: SessionModelV1[] = []
  startDate: Date;
  endDate: Date;
  showClients: false;
  

  constructor(private activatedRoute: ActivatedRoute, private sessionTypeService: SessionTypeService,
              private popup: PopupService, private datePipe: DatePipe) {
  }

  ngOnInit(): void {
    
    if(!history.state && (!history.state.data || history.state.data.length == 0)) {
      this.popup.error(MSG_UNEXPECTED_ERROR);
      return;
    }
    
    this.allData = history.state.data as SessionModelV1[];
    const length = this.allData.length
    this.startDate = new Date(this.allData[0].startDate_ts)
<<<<<<< HEAD
    this.startDate = new Date(this.allData[length -1].startDate_ts)
=======
    this.endDate = new Date(this.allData[length -1].startDate_ts)
>>>>>>> develop
    this.formatSchedule()
    
  }


  formatSchedule() {
    for(const s of this.allData) {

      const date = new Date(s.startDate_ts)
      const day = this.datePipe.transform(date, 'fullDate', 'Europe/Athens')

      if(!this.map.get(day)) {
        this.map.set(day, []);
      }

      this.map.get(day).push(s)

    }

    for(const [k,v] of this.map) {
      this.mapArray.push([k,v])
    } 
  }


  printReport(): void {
    print();
  }


}
