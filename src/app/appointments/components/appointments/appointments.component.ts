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
import {Router} from '@angular/router';

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
  showPrintOptionsPopup = false;
  selectedSession: {
    session: SessionModel;
    subscribedClients: ClientModel[]
  } | null = null;
  printOptions: {
    today: boolean;
    printBeginDate: any;
    printEndDate: any;
  } = null;
  // subscribers
  sessionTypeSub: Subscription;
  sessionsSub: Subscription;

  constructor(private sessionTypeService: SessionTypeService,
              private popup: PopupService,
              private sessionService: SessionService,
              private clientService: ClientService,
              private router: Router) {
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
      } else if ($event.newData.spots < $event.oldData.subscriptions.length) {
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
    if (appointmentData.subscriptions.length === 0) {
      this.popup.info('Session has no subscribers');
      return;
    }
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
    const confirmation = await confirm(`Unsubscribe ${c.fullName} from session?`, '');
    if (!confirmation) {
      return;
    }
    this.loadingVisible = true;
    this.clientService.unsubscribeClientFromSession(session.uid, c.uid)
      .then(result => {
        this.loadingVisible = false;
        if (result.success) {
          this.popup.success(`Client ${c.fullName} unsubscribed from session`);
          if (this.selectedSession && this.selectedSession.subscribedClients) {
            const index = this.selectedSession.subscribedClients.indexOf(c);
            if (index !== -1) {
              this.selectedSession.subscribedClients.splice(index, 1);
            }
          }
          return;
        }
        this.popup.error(result.data && result.data.uiMessage ? result.data.uiMessage : UNEXPECTED_ERROR);
      })
      .catch(error => {
        this.loadingVisible = false;
        console.log(error);
        this.popup.error(UNEXPECTED_ERROR);
      });
  }

  showPrintOptions(): void {
    this.printOptions = {
      today: true,
      printBeginDate: null,
      printEndDate: null
    };
    this.showPrintOptionsPopup = true;
  }

  generateScheduleReport(): void {
    const today = new Date();
    if (this.printOptions.today) {
      today.setHours(0, 1, 0);
      this.printOptions.printBeginDate = new Date(today);
      today.setHours(23, 59, 0);
      this.printOptions.printEndDate = new Date(today);
    } else {
      const begin = new Date(Date.parse(this.printOptions.printBeginDate));
      const end = new Date(Date.parse(this.printOptions.printEndDate));
      begin.setHours(0, 1, 0);
      end.setHours(23, 59, 0);
      this.printOptions.printBeginDate = begin;
      this.printOptions.printEndDate = end;
    }
    this.loadingVisible = true;
    this.sessionService.fetchSessionsInRangeWithClients(this.printOptions.printBeginDate as Date, this.printOptions.printEndDate as Date)
      .then(result => {
        this.loadingVisible = false;
        if (result.length === 0) {
          this.popup.info('Nothing to show for selected dates');
          return;
        }
        this.router.navigateByUrl('/schedule-report', {
          state: {
            data: {
              result, start: this.printOptions.printBeginDate.getTime(), end: this.printOptions.printEndDate.getTime()
            }
          }
        });
      })
      .catch(error => {
        console.log(error);
        this.loadingVisible = false;
        this.popup.error(UNEXPECTED_ERROR);
      });
  }
}
