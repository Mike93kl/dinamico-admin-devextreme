import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ClientSessionModel} from '../../../models/ClientSessionModel';
import {confirm} from 'devextreme/ui/dialog';
import {take} from 'rxjs/operators';
import {UNEXPECTED_ERROR} from '../../../utils/ui_messages';
import {ClientService} from '../../../services/client.service';
import {PopupService} from '../../../services/popup.service';
import {DatePipe} from '@angular/common';
import {SessionService} from '../../../services/session.service';
import {SessionModel} from '../../../models/SessionModel';
import {SessionTypeService} from '../../../services/session-type.service';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {ClientPackageModel} from '../../../models/ClientPackageModel';
import {ClientModel} from '../../../models/ClientModel';
import {from, Subscription} from 'rxjs';

declare var $: any;

@Component({
  selector: 'app-client-sessions',
  templateUrl: './client-sessions.component.html',
  styleUrls: ['./client-sessions.component.css']
})
export class ClientSessionsComponent implements OnInit, OnDestroy {
  @Input() client: ClientModel;
  @Input() sessionTypes: SessionTypeModel[];
  clientSessions: ClientSessionModel[];
  currentDate: any;
  loadingVisible = false;
  sessionsForDate: SessionModel[];
  newSession: SessionModel;
  showCreateNewSessionPopup = false;
  showActivePackagesPopup = false;
  showSessionsForDatePopup = false;
  clientsActivePackagesForSession: ClientPackageModel[];
  private chosenSession: SessionModel;
  // subs
  sessionTypeSub: Subscription;
  clientSessionSub: Subscription;

  constructor(private clientService: ClientService,
              private popup: PopupService, private datePipe: DatePipe,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.currentDate = new Date();
    this.fetchClientSessions();
  }

  ngOnDestroy(): void {
    try {
      this.sessionTypeSub.unsubscribe();
      this.clientSessionSub.unsubscribe();
    } catch (e) {
    }
  }

  private fetchClientSessions(): void {
    this.clientSessionSub = this.clientService.getClientSessions(this.client.uid).subscribe(clientSessions => {
      this.clientSessions = clientSessions.map(cs => {
        cs.sessionType = this.sessionTypes.find(e => e.uid === cs.sessionTypeId);
        cs.text = cs.sessionType.title + (cs.canceled ? ' (canceled) ' : '');
        cs.startDate = new Date(cs.startDate.seconds * 1000);
        cs.endDate = new Date(cs.endDate.seconds * 1000);
        cs.disabled = cs.canceled;
        if (cs.canceled) {
          cs.color = '#a33232';
        } else {
          cs.color = '#2575a0';
        }
        return cs;
      });
      console.log(this.clientSessions);
    }, error => {
      console.log(error);
      this.popup.error('Could not fetch client sessions. Try refreshing the page');
    });
  }

  onAppointmentRendered($event: any): void {
    $event.appointmentElement.style.backgroundColor = $event.appointmentData.color;
  }

  async onAppointmentDeleting($event: any): Promise<void> {
    const deferred = new $.Deferred();
    confirm(`Are you sure you want to cancel session at
      ${this.datePipe.transform($event.appointmentData.startDate, 'EEE, dd MMM hh:mm')} ? `, 'Cancel Session')
      .then(c => {
        if (!c) {
          deferred.reject();
          return;
        }

        this.loadingVisible = true;
        this.clientService.cancelSession($event.appointmentData.uid, $event.appointmentData.clientId)
          .pipe(take(1))
          .subscribe(result => {
            this.loadingVisible = false;
            if (result.success) {
              this.popup.success(`Session Canceled!`);
              deferred.resolve();
              return;
            }
            this.popup.error(result.data.uiMessage ?
              result.data.uiMessage : UNEXPECTED_ERROR);
            deferred.reject();
          }, error => {
            this.loadingVisible = false;
            console.log(error);
            this.popup.error(UNEXPECTED_ERROR);
            deferred.reject();
          });

      });
    $event.cancel = deferred.promise();
  }

  onAppointmentFormOpening($event: any): void {
    const form = $event.form;
    let startDate = $event.appointmentData.startDate;
    form.getEditor('endDate')
      .option('value', new Date(startDate.getTime() + (60 * 1000 * 60)));
    let endDate = $event.appointmentData.endDate;
    const actions = $event.component._appointmentPopup._popup.option('toolbarItems');
    const isNew = !$event.appointmentData.clientId && Object.keys($event.appointmentData).length === 2;
    if (isNew) {
      actions[0].onClick = () => {
        this.scheduleSession(startDate, endDate);
      };
      actions[0].options.text = 'Schedule Session';
    } else {
      actions[0].options = {text: 'Close'};
    }
    $event.component._appointmentPopup._popup.option('toolbarItems', actions);
    form.option('items', [
      {
        dataField: 'startDate',
        editorType: 'dxDateBox',
        editorOptions: {
          width: '100%',
          type: 'datetime',
          onValueChanged: (e) => {
            startDate = e.value;
            form.getEditor('endDate')
              .option('value', new Date(startDate.getTime() + (60 * 1000 * 60)));
          }
        }
      },
      {
        dataField: 'endDate',
        editorType: 'dxDateBox',
        editorOptions: {
          width: '100%',
          type: 'datetime',
          onValueChanged: (e) => {
            endDate = e.value;
          }
        }
      }
    ]);
  }

  private async scheduleSession(startDate: any, endDate: any): Promise<void> {
    const sessionsFound = await this.sessionService.getByStartDate(startDate);
    if (sessionsFound.length === 0) {
      const confirmation = await confirm(
        `No sessions found at "${this.datePipe.transform(startDate, 'EEEE, dd MMM hh:mm a')}".
        Create it ?`, 'No sessions found!');
      if (!confirmation) {
        return;
      }
      this.initNewSessionObject(startDate, endDate);
      return;
    }

    this.popup.success('Some sessions Already exists press ok to view them', () => {
      this.sessionsForDate = sessionsFound.map(e => {
        e.sessionType = this.sessionTypes.find(t => t.uid === e.sessionTypeId);
        return e;
      });
      this.showSessionsForDatePopup = true;
    });
  }

  initNewSessionObject(startDate: any, endDate: any, fromSessionList?: boolean): void {
    this.newSession = {
      date: startDate, dateStr: startDate.getMonth() + 1 + '/' + startDate.getDate() + '/' + startDate.getFullYear()
      , endTime: undefined, isFull: false, startTime: undefined, uid: '',
      startDate, endDate, spots: 0, sessionTypeId: '', subscriptions: []
    };
    this.showCreateNewSessionPopup = true;
    if (fromSessionList) {
      this.showSessionsForDatePopup = false;
    }
  }

  selectSessionToBook(data: SessionModel): void {
    this.chosenSession = data;
    this.popup.success('Session selected, press ok to fetch active client packages', () => {
      this.fetchPackagesMatchesSession(this.chosenSession.sessionTypeId);
    });
  }

  private fetchPackagesMatchesSession(sessionTypeId: string): void {
    this.loadingVisible = true;
    this.clientService.getActivePackagesMatchedSession(sessionTypeId, this.client.uid)
      .pipe(take(1))
      .subscribe(result => {
        this.loadingVisible = false;
        console.log('active packages for session: ', result);
        if (!result.success) {
          this.popup.error(result.data.uiMessage ? result.data.uiMessage : UNEXPECTED_ERROR);
          return;
        }
        if (result.data.packages.length === 0) {
          this.popup.info(`Client has no active packages for "${this.chosenSession.sessionType.title} session". You can link a new package from the 'Packages' Section, or
          you can let the client know to that him self from the app`);
          return;
        }
        this.clientsActivePackagesForSession = result.data.packages.map(e => {
          e.collapsed = false;
          return e;
        });
        this.showActivePackagesPopup = true;
      }, error => {
        this.loadingVisible = false;
        console.log(error);
        this.popup.error(UNEXPECTED_ERROR);
      });
  }

  async selectPackageForSession(data: ClientPackageModel): Promise<void> {
    const confirmation = await confirm(
      `You are about to book a ${this.chosenSession.sessionType.title}
      session for ${this.client.fullName} with the
      ${data._package.title} Package (1 usage will be subtracted). Are you sure?
      <br>Press "No" to choose another package Or "Yes" to confirm`, ''
    );
    if (!confirmation) {
      this.showActivePackagesPopup = true;
      return;
    }
    this.loadingVisible = true;
    this.clientService.bookSession(this.chosenSession.uid, data.uid)
      .pipe(take(1))
      .subscribe(result => {
        this.loadingVisible = false;
        if (result.success) {
          this.popup.success('Session booked successfuly !');
          this.clientsActivePackagesForSession = null;
          this.showActivePackagesPopup = false;
          this.showSessionsForDatePopup = false;
          this.sessionsForDate = null;
          this.chosenSession = null;
          return;
        }
        this.popup.error(result.data.uiMessage ? result.data.uiMessage : UNEXPECTED_ERROR);
      }, error => {
        this.loadingVisible = false;
        console.log(error);
        this.popup.error(UNEXPECTED_ERROR);
      });
  }

  async createSession(): Promise<void> {
    if (this.newSession.spots <= 0) {
      this.popup.error('Spots cannot be 0');
      return;
    }
    if (this.newSession.sessionTypeId === '') {
      this.popup.error('Please choose a session type');
      return;
    }

    this.sessionService.create([{
      ...this.newSession,
      endTime: {
        hourAsInt: this.newSession.endDate.getHours(),
        minutesAsInt: this.newSession.endDate.getMinutes(),
        hour: this.newSession.endDate.getHours().toString(),
        minutes: this.newSession.endDate.getMinutes().toString()
      },
      startTime: {
        hourAsInt: this.newSession.startDate.getHours(),
        minutesAsInt: this.newSession.startDate.getMinutes(),
        hour: this.newSession.startDate.getHours().toString(),
        minutes: this.newSession.startDate.getMinutes().toString()
      }
    }])
      .then((saved) => {
        this.showCreateNewSessionPopup = false;
        this.chosenSession = saved[0];
        this.chosenSession.sessionType = this.sessionTypes.find(e => e.uid === this.chosenSession.sessionTypeId);
        this.popup.success('Session Created. Press OK to fetch client packages',
          () => {
            this.fetchPackagesMatchesSession(this.chosenSession.sessionTypeId);
          });
      })
      .catch((e) => {
        console.log(e);
        this.popup.error(UNEXPECTED_ERROR);
      });
  }

  formatStartAndEndTime(newSession: SessionModel): string {
    return `${newSession.startDate.getHours() >= 10 ? newSession.startDate.getHours() : '0' + newSession.startDate.getHours()}:${newSession.startDate.getMinutes() >= 10 ? newSession.startDate.getMinutes() : '0' + newSession.startDate.getMinutes()} - ${newSession.endDate.getHours() >= 10 ? newSession.endDate.getHours() : '0' + newSession.endDate.getHours()}:${newSession.endDate.getMinutes() >= 10 ? newSession.endDate.getMinutes() : '0' + newSession.endDate.getMinutes()}`;
  }

  getDate(firebaseDate: { seconds: number; nanoseconds: number }): Date {
    return new Date(firebaseDate.seconds * 1000);
  }
}
