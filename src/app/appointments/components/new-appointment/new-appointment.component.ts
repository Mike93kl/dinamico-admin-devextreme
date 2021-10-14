import {Component, OnDestroy, OnInit, ViewChild, AfterViewInit} from '@angular/core';
import {SessionServiceV1} from '../../../services/session.service-v1';
import {BehaviorSubject, firstValueFrom, Subscription} from 'rxjs';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {PopupService} from '../../../services/popup.service';
import {
  MSG_NAC_END_DATE_LESS_THAN_START_DATE,
  MSG_NAC_ENTER_VALID_SESSION_TYPE,
  MSG_NAC_PLEASE_SELECT_A_DATE, MSG_NAC_SESSIONS_CREATED, MSG_NAC_SPOTS_CANNOT_BE_0_OR_LESS,
  MSG_NAC_START_END_TIME_REQUIRED, MSG_UNEXPECTED_ERROR
} from '../../../utils/ui_messages';
import {Router} from '@angular/router';
import {SessionService} from '../../../services/session.service';
import {DxDataGridComponent, DxDateBoxComponent} from 'devextreme-angular';
import {SessionModelV1} from '../../../models/SessionModelV1';
import {SessionTypesV1Component} from '../../../shared/session-types/session-types-v1.component';

interface SessionGridItem {
  sessionTypeId: string;
  startDate: Date;
  endDate: Date;
  spots: number;
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

  existingSessions: SessionModelV1[];
  existingSessionsSub: Subscription | undefined;


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
        if (!this.existingSessions) {
          this.getExistingSessions();
        } else {
          this.loadingVisible = false;
        }
      },
      error: err => {
        console.log(err);
        this.popup.error(MSG_UNEXPECTED_ERROR);
        this.router.navigate(['../']);
      }
    });
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.sessionTypeSub?.unsubscribe();
    this.existingSessionsSub?.unsubscribe();
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
      e.data.startDate = new Date(endDate.getTime() + (1000 * 60 * 60));
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
      e.editorOptions.onFocusOut = (ev) => {
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
          this.createSession();
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
    this.dateSelected = $event;
    console.log(this.dateSelected);
    this.sessionTypeComponent?.showIcon();
    this.sessionsV1 = [];
    this.dxDataGrid?.instance.getDataSource().reload();
    this.minTimeDate = new Date(this.dateSelected);
    this.minTimeDate.setHours(6, 0, 0, 0);
    this.maxTimeDate = new Date(this.dateSelected);
    this.maxTimeDate.setHours(23, 0, 0, 0);
  }


  onSessionTypesFetched(sessionTypes: SessionTypeModel[]): void {
    this.sessionTypeBehSubject.next(sessionTypes);
  }

  private async getExistingSessions(): Promise<void> {
    this.existingSessionsSub = this.sessionService.getAllSessions(100).subscribe({
      next: sessions => {
        this.existingSessions = sessions;
        this.dxDateBox.disabledDates = this.existingSessions.map(d => new Date(d.startDate_ts));
        this.loadingVisible = false;
      },
      error: err => {
        console.log(err);
        this.loadingVisible = false;
        this.popup.error(MSG_UNEXPECTED_ERROR);
        this.router.navigate(['../']);
      }
    });
  }

  private createSession(): void {
    this.dxDataGrid?.instance.cancelEditData();
    this.loadingVisible = true;
    const sessions: SessionModelV1[] = this.gridSessions.map(gridItem => {
      return {
        startDate_str: gridItem.startDate.toLocaleString('el-GR'),
        spots: gridItem.spots,
        startDate_ts: gridItem.startDate.getTime(),
        endDate_ts: gridItem.endDate.getTime(),
        subscriptions: [],
        sessionType: this.sessionTypes.find(s => s.uid === gridItem.sessionTypeId),
        isFull: false
      };
    });
    this.sessionService.create(sessions)
      .then(() => {
        this.popup.success(MSG_NAC_SESSIONS_CREATED, () => {
          this.gridSessions = [];
          this.dxDataGrid?.instance.getDataSource().reload();
          if (this.dateSelected) {
            this.dateSelected = new Date(this.dateSelected.getTime() + (60 * 60 * 1000 * 24));
          }
        });
        this.loadingVisible = false;
      }).catch(e => {
      this.popup.error(MSG_UNEXPECTED_ERROR);
    });
  }
}

