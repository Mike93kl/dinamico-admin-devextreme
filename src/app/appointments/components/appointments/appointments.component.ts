import {Component, OnDestroy, OnInit} from '@angular/core';
import {SessionTypeService} from '../../../services/session-type.service';
import {Subscription} from 'rxjs';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {PopupService} from '../../../services/popup.service';
import {SessionService} from '../../../services/session.service';
import {SessionModel} from '../../../models/SessionModel';
import {UNEXPECTED_ERROR} from '../../../utils/ui_messages';

declare var $: any;

@Component({
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  styleUrls: ['./appointments.component.css']
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  currentDate;
  sessionTypes: SessionTypeModel[];
  sessions: SessionModel[];
  limit = 100;
  sessionTypePopupVisible = false;
  // subscribers
  sessionTypeSub: Subscription;
  sessionsSub: Subscription;

  constructor(private sessionTypeService: SessionTypeService,
              private popup: PopupService,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.currentDate = new Date();
    this.sessionTypeSub = this.sessionTypeService.getAll().subscribe(sessionTypes => {
      this.sessionTypes = sessionTypes;
      this.getAppointments();
    }, error => {
      console.log(error);
      this.popup.error('Could not fetch session types. Please refresh the page');
    });
  }

  getAppointments(): void {
    this.sessionsSub = this.sessionService.getAllSessions(this.limit).subscribe(sessions => {
      this.sessions = sessions.map(s => {
        s.sessionType = this.sessionTypes.find(e => e.uid === s.sessionTypeId);
        s.text = s.sessionType.title;
        s.startDate = new Date(s.startDate.seconds * 1000);
        s.endDate = new Date(s.endDate.seconds * 1000);
        if (s.isFull || s.subscriptions.length >= s.spots) {
          s.color = '#099c15';
        }else {
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
    const that = this;
    const form = $event.form;
    console.log($event);
    form.option('items', [
      {
        label: {
          text: 'Session Type'
        },
        editorType: 'dxSelectBox',
        dataField: 'sessionTypeId',
        editorOptions: {
          items: that.sessionTypes,
          displayExpr: 'title',
          valueExpr: 'uid'
        }
      },
      {
        label: {
          text: 'Number of subscriptions'
        },
        editorType: 'dxTextBox',
        editorOptions: {
          width: '100%',
          type: 'number',
          value: $event.appointmentData.subscriptions.length,
          disabled: true
        }
      },
      {
        dataField: 'startDate',
        editorType: 'dxDateBox',
        editorOptions: {
          width: '100%',
          type: 'datetime'
        }
      },
      {
        dataField: 'endDate',
        editorType: 'dxDateBox',
        editorOptions: {
          width: '100%',
          type: 'datetime'
        }
      },
      {
        editorType: 'dxButton',
        editorOptions: {
          width: '200%',
          onClick: () => {
            alert('asdad');
          },
          text: 'View Subscribers',
          disabled: $event.appointmentData.subscriptions.length === 0
        }
      },
      {
        editorType: 'dxButton',
        editorOptions: {
          width: '200%',
          onClick: () => {
            alert('asdad');
          },
          text: 'Add client to session',
          disabled: $event.appointmentData.subscriptions.length >= $event.appointmentData.spots
        }
      }
    ]);
  }

  onAppointmentDeleting($event: any): void {
    if ($event.appointmentData.subscriptions.length > 0) {
      this.popup.error('Cannot delete session while there are subscribed clients to that session!');
      $event.cancel = true;
      return;
    }
    const deferred = new $.Deferred();
    this.sessionService.remove([$event.appointmentData])
      .then(() => deferred.resolve())
      .catch(e => {
        console.log(e);
        deferred.reject(e);
        this.popup.error(UNEXPECTED_ERROR);
      });
    $event.cancel = deferred.promise();
  }

  onAppointmentUpdating($event: any): void {
    if ($event.oldData.subscriptions.length > 0) {
      $event.cancel = true;
      this.popup.error('Cannot update session when there are clients subscribed to this session');
      return;
    }
    if ($event.newData.startDate >= $event.newData.endDate) {
      $event.cancel = true;
      this.popup.error('End date cannot be less than start date');
      return;
    }
    const deferred = new $.Deferred();
    this.sessionService.update([$event.newData])
      .then(() => deferred.resolve())
      .catch(e => {
        console.log(e);
        deferred.reject();
        this.popup.error(UNEXPECTED_ERROR);
      });
    $event.cancel = deferred.promise();
  }

  onAppointmentRendered($event: any): void {
    $event.appointmentElement.style.backgroundColor = $event.appointmentData.color;
  }
}
