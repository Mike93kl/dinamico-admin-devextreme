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
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {ClientPackageModel} from '../../../models/ClientPackageModel';
import {ClientModel} from '../../../models/ClientModel';
import {Subscription} from 'rxjs';

declare var $: any;

@Component({
  selector: 'app-client-sessions',
  templateUrl: './client-sessions.component.html',
  styleUrls: ['./client-sessions.component.css']
})
export class ClientSessionsComponent implements OnInit, OnDestroy {
  i = 0;
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
  limit = 100;
  allSessions: SessionModel[];
  subSessions: { sessionId: string; canceled: boolean; uid: string } [];
  // subs
  sessionTypeSub: Subscription;
  allSessionsSub: Subscription;

  constructor(private clientService: ClientService,
              private popup: PopupService, private datePipe: DatePipe,
              private sessionService: SessionService) {
  }

  ngOnInit(): void {
    this.currentDate = new Date();
    this.fetchAllSessions();
  }

  ngOnDestroy(): void {
    try {
      this.sessionTypeSub.unsubscribe();
      this.allSessionsSub.unsubscribe();
    } catch (e) {
    }
  }

  fetchClientSessions(): void {
    this.clientService.getClientSessions(this.client.uid, this.limit)
      .pipe(take(1))
      .subscribe(clientSessions => {
        this.clientSessions = clientSessions;
        this.subSessions
          = Object.values(this.clientSessions.reduce((p, c, i) => {
          if (!p[c.sessionId]) {
            p[c.sessionId] = {sessionId: c.sessionId, canceled: c.canceled, uid: c.uid};
          } else {
            const temp = p[c.sessionId];
            p[c.sessionId] = temp.canceled && c.canceled ? temp :
              (!temp.canceled && c.canceled ? temp : (temp.canceled && !c.canceled) ? {
                sessionId: c.sessionId, canceled: c.canceled, uid: c.uid
              } : temp);
          }
          return p;
        }, {}));
        this.allSessions = this.allSessions.map(session => {
          session.sessionType = this.sessionTypes.find(t => t.uid === session.sessionTypeId);
          session.text = session.sessionType.title;
          session.startDate = new Date(session.startDate.seconds * 1000);
          session.endDate = new Date(session.endDate.seconds * 1000);
          const isClientInSession = this.subSessions.find(e => e.sessionId === session.uid);
          if (!isClientInSession) {
            session.disabled = true;
            if (session.isFull || session.subscriptions.length >= session.spots) {
              session.color = '#21890a';
            }
            return session;
          }

          if (isClientInSession.canceled) {
            session.disabled = true;
            session.color = '#a33232';
            return session;
          }

          if (session.subscriptions.includes(this.client.uid)) {
            session.color = '#895de7';
            return session;
          }
          session.color = '#2575a0';
          return session;
        });
        this.i++;
        console.table(this.allSessions);
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
    $event.cancel = deferred.promise();
    const clientSession = this.subSessions.find(cs => cs.sessionId ===
      $event.appointmentData.uid);

    if (!clientSession) {
      deferred.reject();
      return;
    }

    if (clientSession) {
      if (clientSession.canceled) {
        this.popup.info('Session already canceled');
        deferred.reject();
        return;
      }
    }

    confirm(`Are you sure you want to cancel session at
      ${this.datePipe.transform($event.appointmentData.startDate, 'EEE, dd MMM hh:mm')} ? `, 'Cancel Session')
      .then(c => {
        if (!c) {
          deferred.reject();
          return;
        }

        this.loadingVisible = true;
        this.clientService.cancelSession(clientSession.uid, this.client.uid)
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

  }


  onAppointmentFormOpening($event: any): void {
    const form = $event.form;
    const data = $event.appointmentData;
    const actions = $event.component._appointmentPopup._popup.option('toolbarItems');
    const popup = $event.component._appointmentPopup._popup;
    const items = this.getAppointmentFormItems(data, form, actions, popup);
    form.option('items', items.items);
  }

  private async scheduleSession(startDate: any, endDate: any): Promise<void> {
    const confirmation = await confirm(
      `Create Session:
      "${this.datePipe.transform(startDate, 'EEEE, dd MMM hh:mm a')} - ${this.datePipe.transform(endDate, 'EEEE, dd MMM hh:mm a')}".
        Confirm?`, 'Create Session');
    if (!confirmation) {
      return;
    }
    this.initNewSessionObject(startDate, endDate);
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
      ${data._package ? data._package.title : data.title} Package (1 usage will be subtracted). Are you sure?
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
          this.popup.success('Session booked successfully !');
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

  fetchAllSessions(): void {
    this.allSessionsSub = this.sessionService.getAllSessions(this.limit)
      .subscribe(sessions => {
        this.allSessions = sessions;
        this.fetchClientSessions();
      }, error => {
        console.log(error);
        this.popup.error('Error fetching sessions');
      });
  }


  private getAppointmentFormItems(data: any, form: any, actions: any, popup: any): { hasData: boolean; items: any } {
    if (!!data.uid) {
      return {
        hasData: true,
        items: [
          {
            label: {
              text: 'Session Type'
            },
            editorType: 'dxSelectBox',
            dataField: 'sessionTypeId',
            editorOptions: {
              items: this.sessionTypes,
              displayExpr: 'title',
              valueExpr: 'uid',
              disabled: true
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
              value: data.subscriptions.length,
              disabled: true
            }
          },
          {
            dataField: 'startDate',
            editorType: 'dxDateBox',
            editorOptions: {
              width: '100%',
              type: 'datetime',
              disabled: true
            }
          },
          {
            dataField: 'endDate',
            editorType: 'dxDateBox',
            editorOptions: {
              width: '100%',
              type: 'datetime',
              disabled: true
            }
          },
          {
            editorType: 'dxButton',
            editorOptions: {
              width: '200%',
              onClick: () => {
                this.chosenSession = data;
                this.fetchPackagesMatchesSession(data.sessionTypeId);
              },
              text: data.isFull || data.subscriptions.length >= data.spots ? 'Session is Full' : 'Subscribe to Session',
              disabled: (data.isFull || data.subscriptions.length >= data.spots)
                || data.subscriptions.includes(this.client.uid) || this.currentDate > data.startDate
            }
          },
        ]
      };
    }

    actions[0].options.text = 'Schedule Session';
    let startDate = data.startDate;
    let endDate = new Date(startDate.getTime() + (60 * 1000 * 60));
    form.getEditor('endDate')
      .option('value', endDate);
    actions[0].onClick = () => {
      this.scheduleSession(startDate, endDate)
        .then();
    };
    popup.option('toolbarItems', actions);
    return {
      hasData: false,
      items: [
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
      ]
    };
  }
}
