import {Component, OnDestroy, OnInit} from '@angular/core';
import {SessionTypeService} from '../../../services/session-type.service';
import {Subscription} from 'rxjs';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {PopupService} from '../../../services/popup.service';
import {SessionService} from '../../../services/session.service';
import {SessionModel} from '../../../models/SessionModel';
import {UNEXPECTED_ERROR} from '../../../utils/ui_messages';
import {ClientModel} from '../../../models/ClientModel';
import {ClientService} from '../../../services/client.service';
import {take} from 'rxjs/operators';
import {confirm} from 'devextreme/ui/dialog';

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
  loadingVisible = false;
  limit = 100;
  sessionTypePopupVisible = false;
  showSubscribedClientsPopup = false;
  selectedSession: {
    session: SessionModel;
    subscribedClients: ClientModel[]
  } | null = null;
  // subscribers
  sessionTypeSub: Subscription;
  sessionsSub: Subscription;

  constructor(private sessionTypeService: SessionTypeService,
              private popup: PopupService,
              private sessionService: SessionService,
              private clientService: ClientService) {
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
          valueExpr: 'uid',
          disabled: $event.appointmentData.subscriptions.length > 0
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
          type: 'datetime',
          disabled: $event.appointmentData.subscriptions.length > 0
        }
      },
      {
        dataField: 'endDate',
        editorType: 'dxDateBox',
        editorOptions: {
          width: '100%',
          type: 'datetime',
          disabled: $event.appointmentData.subscriptions.length > 0
        }
      },
      {
        dataField: 'spots',
        editorType: 'dxTextBox',
        editorOptions: {
          width: '100%',
          type: 'number'
        }
      },
      {
        editorType: 'dxButton',
        editorOptions: {
          width: '200%',
          onClick: () => {
            this.getSubscribedClients($event.appointmentData);
          },
          text: 'View Subscribers',
          disabled: $event.appointmentData.subscriptions.length === 0
        }
      },
      // {
      //   editorType: 'dxButton',
      //   editorOptions: {
      //     width: '200%',
      //     onClick: () => {
      //       alert('asdad');
      //     },
      //     text: 'Add client to session',
      //     disabled: $event.appointmentData.subscriptions.length >= $event.appointmentData.spots
      //   }
      // }
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
    const deferred = new $.Deferred();
    if ($event.oldData.subscriptions.length > 0) {
      if ($event.oldData.spots === $event.newData.spots) {
        this.popup.info('Nothing to update');
        $event.cancel = true;
        return;
      } else if ($event.oldData.subscriptions.length < $event.newData.spots) {
        this.popup.error('Spots cannot be 0 or less than the number of current subscribers');
        $event.cancel = true;
        return;
      }
      this.sessionService.updateSpots($event.oldData.uid, $event.newData.spots,
        $event.newData.subscriptions.length >= $event.newData.spots)
        .then(done => {
          if (done) {
            deferred.resolve();
          } else {
            this.popup.error(UNEXPECTED_ERROR);
            deferred.reject();
          }
        })
        .catch(error => {
          console.log(error);
          this.popup.error(UNEXPECTED_ERROR);
          deferred.reject();
        });
      $event.cancel = deferred.promise();
      return;
    }
    if ($event.newData.startDate >= $event.newData.endDate) {
      $event.cancel = true;
      this.popup.error('End date cannot be less than start date');
      return;
    }
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

  private getSubscribedClients(appointmentData: SessionModel): void {
    this.selectedSession = null;
    this.sessionService.getSubscribedClients(appointmentData)
      .then((clients) => {
        console.log('s clients: ', clients);
        this.selectedSession = {
          session: appointmentData,
          subscribedClients: clients
        };
        this.showSubscribedClientsPopup = true;
      })
      .catch(error => {
        console.log(error);
        this.popup.error(UNEXPECTED_ERROR);
      });
  }

  async unsubscribeClientFromSession(session: SessionModel, c: ClientModel): Promise<void> {
    alert('Comming soon');
    // console.log('unsub', session, c);
    // const confirmation = await confirm(`Unsubscribe ${c.fullName} from session?`, '');
    // if (!confirmation) {
    //   return;
    // }
    // this.loadingVisible = true;
    // this.clientService.unsubscribeClientFromSession(session.uid, c.uid)
    //   .pipe(take(1)).subscribe((result) => {
    //   this.loadingVisible = false;
    //   if (result.success) {
    //     this.popup.success(`Unsubscribed ${c.fullName} from session`);
    //     return;
    //   }
    //
    //   this.popup.error(result.data && result.data.uiMessage ? result.data.uiMessage : UNEXPECTED_ERROR);
    // }, error => {
    //   this.loadingVisible = false;
    //   console.log(error);
    //   this.popup.error(UNEXPECTED_ERROR);
    // });
  }
}
