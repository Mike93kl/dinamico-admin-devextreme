import {Component, OnDestroy, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import {SessionServiceV1} from '../../../services/session.service-v1';
import {BehaviorSubject, firstValueFrom, Subscription} from 'rxjs';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {PopupService} from '../../../services/popup.service';

import {
  MSG_NAC_END_DATE_LESS_THAN_START_DATE,
  MSG_NAC_ENTER_VALID_SESSION_TYPE,
  MSG_NAC_PLEASE_SELECT_A_DATE,
  MSG_NAC_REPEAT_NO_GREATER_THAN_0,
  MSG_NAC_REPEAT_NO_LIMIT,
  MSG_NAC_SPOTS_CANNOT_BE_0_OR_LESS,
  MSG_NAC_START_END_TIME_REQUIRED,
  MSG_UNEXPECTED_ERROR,
  MSG_UNEXPECTED_ERROR_REFRESH_PAGE
} from '../../../utils/ui_messages';
import {Router} from '@angular/router';
import {DxDataGridComponent, DxDateBoxComponent} from 'devextreme-angular';
import {SessionModelV1} from '../../../models/SessionModelV1';
import {SessionTypesV1Component} from '../../../shared/session-types/session-types-v1.component';

interface SessionGridItem {
  sessionTypeId: string;
  startDate: Date;
  endDate: Date;
  spots: number;
}

const MAX_DAYS_FROM_TODAY = 31;
const SUNDAY_DAY_INDEX = 0;
const SATURDAY_DAY_INDEX = 6;

const DATE_MIN_HOUR = 6;
const DATE_MAX_HOUR = 23;

function stripHoursFromDate(d: Date): void {
  d.setHours(0, 1, 0, 0);
}

function setDateMinHour(d: Date): void {
  d.setHours(DATE_MIN_HOUR, 0, 0, 0);
}

function setDateMaxHour(d: Date): void {
  d.setHours(DATE_MAX_HOUR, 0, 0, 0);
}

function addDaysToDate(d: Date, days: number): Date {
  return new Date(d.getTime() + ((1000 * 60 * 60 * 24) * days));
}

@Component({
  selector: 'app-new-appointment',
  templateUrl: './new-appointment.component.html',
  styleUrls: ['./new-appointment.component.css']
})
export class NewAppointmentComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild(DxDataGridComponent) dxDataGrid: DxDataGridComponent | undefined;
  @ViewChild(SessionTypesV1Component) sessionTypeComponent: SessionTypesV1Component | undefined;


  @ViewChild('date') dxDateBox: DxDateBoxComponent | undefined;

  loadingVisible = false;
  dateSelected: Date;
  minTimeDate: Date;
  maxTimeDate: Date;
  sessionsV1: SessionModelV1[] = [];

  gridSessions: SessionGridItem[] = [];

  sessionTypes: SessionTypeModel[] = [];
  sessionTypeSub: Subscription;
  sessionTypeBehSubject: BehaviorSubject<SessionTypeModel[]> =
    new BehaviorSubject<SessionTypeModel[]>(this.sessionTypes);


  repeatNo = 1;
  includeSat = false;
  includeSun = false;


  static getSessionDayCreated(d: Date): string {
    return `<p><small class="text-success">+</small> Session Day ${d.toLocaleString()} created.</p>`;
  }

  static getSessionDaySkipped(d: Date): string {
    return `<p><small class="text-warning">-</small> Session Day ${d.toLocaleString()} exists, thus it is skipped.</p>`;
  }

  static getSessionDayFailed(d: Date): string {
    return `<p><small class="text-danger">-</small> Sessions for ${d.toLocaleDateString()} failed to be created.</p>`;
  }

  constructor(
    private popup: PopupService, private router: Router,
    private sessionService: SessionServiceV1) {
  }


  /////////////////////////
  // Component lifecycle//
  /////////////////////////
  ngOnInit(): void {
    this.loadingVisible = true;
    this.sessionTypeSub = this.sessionTypeBehSubject.subscribe({
      next: sessionTypes => {
        this.sessionTypes = sessionTypes;
        this.loadingVisible = false;
      },
      error: err => {
        console.log(err);
        this.loadingVisible = false;
        this.popup.error(MSG_UNEXPECTED_ERROR, () => {
          this.router.navigateByUrl('/appointments').then();
        });
      }
    });
  }

  ngAfterViewInit(): void {
    this.dxDateBox.min = new Date();
    const max = new Date();
    max.setDate(max.getDate() + MAX_DAYS_FROM_TODAY);
    this.dxDateBox.max = max;
  }

  ngOnDestroy(): void {
    this.sessionTypeSub?.unsubscribe();
  }

  //// End of lifecycle //////////////////////

  onNewRowInit(e: any): void {
    if (!this.dateSelected) {
      this.popup.error(MSG_NAC_PLEASE_SELECT_A_DATE, () => {
        e.component.cancelEditData();
      });
      return;
    }
    if (this.gridSessions.length > 0) {
      const endDate = this.gridSessions[this.gridSessions.length - 1].endDate;
      e.data.startDate = new Date(endDate);
    } else {
      e.data.startDate = this.dateSelected;
    }
  }

  onRowInserting(e: any): void {
    if (!this.sessionTypes.find(s => s.uid === e.data.sessionTypeId)) {
      e.cancel = true;
      this.popup.error(MSG_NAC_ENTER_VALID_SESSION_TYPE);
      return;
    }

    if (!e.data.startDate || !e.data.endDate) {
      e.cancel = true;
      this.popup.error(MSG_NAC_START_END_TIME_REQUIRED);
      return;
    }

    if (e.data.endDate.getTime() < e.data.startDate.getTime()) {
      e.cancel = true;
      this.popup.error(MSG_NAC_END_DATE_LESS_THAN_START_DATE);
      return;
    }

    if (!e.data.spots || e.data.spots <= 0) {
      e.cancel = true;
      this.popup.error(MSG_NAC_SPOTS_CANNOT_BE_0_OR_LESS);
    }
  }

  onRowInserted(e: any): void {
    e.component.addRow();
    const cell = e.component.getCellElement(0, 0);
    this.dxDataGrid?.instance.focus(cell);
  }

  onEditorPreparing(e: any): void {
    if (e.parentType === 'dataRow' && e.dataField === 'startDate') {
      e.editorOptions.onFocusOut = () => {
        const start = e.component.cellValue(e.row.rowIndex, 'startDate');
        const end = new Date(start.getTime() + (1000 * 60 * 60));
        e.component.cellValue(e.row.rowIndex, 'endDate', end);
      };
    }
  }

  onToolbarPreparing(e: any): void {
    e.toolbarOptions.items.unshift({
      location: 'before',
      template: 'totalSessionsCount'
    }, {
      location: 'before',
      widget: 'dxButton',
      options: {
        icon: 'save',
        text: 'create',
        onClick: () => {
          this.createSessions().then();
        }
      }
    }, {
      location: 'before',
      widget: 'dxButton',
      options: {
        icon: 'refresh',
        text: 'clear',
        onClick: () => {
          this.gridSessions = [];
          this.dxDataGrid?.instance.getDataSource().reload();
        }
      }
    });
  }

  onDateSelected($event: any): void {
    if (!$event) {
      return;
    }
    this.dateSelected = $event;
    this.sessionTypeComponent?.showIcon();
    this.sessionsV1 = [];
    this.dxDataGrid?.instance.getDataSource().reload();
    setDateMinHour(this.dateSelected);
    this.minTimeDate = new Date(this.dateSelected);
    this.maxTimeDate = new Date(this.dateSelected);
    setDateMaxHour(this.maxTimeDate);
  }


  onSessionTypesFetched(sessionTypes: SessionTypeModel[]): void {
    this.sessionTypeBehSubject.next(sessionTypes);
  }


  private async createSessions(): Promise<void> {
    if (this.gridSessions.length === 0) {
      return;
    }
    this.dxDataGrid?.instance.cancelEditData();
    this.loadingVisible = true;

    const initialDate = new Date(this.dateSelected);

    if (this.repeatNo <= 0) {
      this.popup.error(MSG_NAC_REPEAT_NO_GREATER_THAN_0);
      return;
    }
    if (this.repeatNo > MAX_DAYS_FROM_TODAY) {
      this.popup.error(MSG_NAC_REPEAT_NO_LIMIT(MAX_DAYS_FROM_TODAY));
      return;
    }
    let finalMsg = '';
    let increment = 0;
    for (let i = 0; i < this.repeatNo;) {
      const date = addDaysToDate(initialDate, increment++);
      stripHoursFromDate(date);

      const existingDaySessions = await firstValueFrom(this.sessionService.getExistingSessionsOf(date));
      const existingTimestamps = existingDaySessions.map(e => e.startDate_ts);

      const gridItems = this.gridSessions.map(g => {
        g.startDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        g.endDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        return g;
      });

      const day = date.getDay();

      if (day === SUNDAY_DAY_INDEX && !this.includeSun) {
        continue;
      }
      if (day === SATURDAY_DAY_INDEX && !this.includeSat) {
        continue;
      }

      for (let g = gridItems.length - 1; g >= 0; g--) {
        const start = gridItems[g].startDate.getTime();
        if (existingTimestamps.includes(start)) {
          finalMsg += NewAppointmentComponent.getSessionDaySkipped(gridItems[g].startDate);
          gridItems.splice(g, 1);
        }
      }

      i++;
      try {
        await this.createDaySessions(gridItems);
        gridItems.forEach(g => {
          finalMsg += NewAppointmentComponent.getSessionDayCreated(g.startDate);
        });
      } catch (e) {
        console.log(e);
        finalMsg += NewAppointmentComponent.getSessionDayFailed(date);
      }

    }
    this.loadingVisible = false;
    this.onSessionsCreated(finalMsg);
  }


  private onSessionsCreated(msg: string): void {
    this.popup.info(msg, () => {
      this.gridSessions = [];
      this.dxDataGrid?.instance.getDataSource().reload();
      this.dateSelected = undefined;
      this.dxDateBox.value = this.dateSelected;
    });
  }

  private async createDaySessions(gridItems: SessionGridItem[]): Promise<void> {
    const sessions: SessionModelV1[] = gridItems.map(gridItem => {
      return {
        startDate_str: gridItem.startDate.toLocaleString('el-GR'),
        spots: gridItem.spots,
        startDate_ts: gridItem.startDate.getTime(),
        endDate_ts: gridItem.endDate.getTime(),
        subscriptions: [],
        sessionType: this.sessionTypes.find(s => s.uid === gridItem.sessionTypeId),
        isFull: false,
        startDateISO: gridItem.startDate.toISOString(),
        endDateISO: gridItem.endDate.toISOString()
      };
    });
    await this.sessionService.create(sessions);
  }

  onRepeatNoChanged(e: any): void {
    const value = +e.target.value;
    if (!value || value < 1) {
      this.repeatNo = 1;
    } else {
      if (value > MAX_DAYS_FROM_TODAY) {
        this.repeatNo = MAX_DAYS_FROM_TODAY;
      }
    }
    e.target.value = value;
  }
}

