import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {ClientService} from '../../../services/client.service';
import {Subscription} from 'rxjs';
import {ClientModel} from '../../../models/ClientModel';
import {PopupService} from '../../../services/popup.service';
import {UNEXPECTED_ERROR} from '../../../utils/ui_messages';
import {ClientSessionModel} from '../../../models/ClientSessionModel';
import {SessionTypeService} from '../../../services/session-type.service';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {confirm} from 'devextreme/ui/dialog';
import {DatePipe} from '@angular/common';
import {take} from 'rxjs/operators';
import {SessionService} from '../../../services/session.service';
import {SessionModel} from '../../../models/SessionModel';
import {ClientPackageModel} from '../../../models/ClientPackageModel';

declare var $: any;

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.css']
})
export class ClientComponent implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute, private clientService: ClientService,
              private popup: PopupService, private router: Router,
              private sessionTypeService: SessionTypeService,
              private datePipe: DatePipe,
              private sessionService: SessionService) {
  }

  clientUid: string;
  client: ClientModel;
  clientCopy: ClientModel;
  isInEditMode = false;
  updating = false;
  currentDate: any;
  sessionTypes: SessionTypeModel[];
  clientSessions: ClientSessionModel[];
  newSession: SessionModel;
  showCreateNewSessionPopup = false;
  showActivePackagesPopup = false;
  private chosenSession: SessionModel;
  sessionsForDate: SessionModel[];
  showSessionsForDatePopup = false;
  clientsActivePackagesForSession: ClientPackageModel[];
  // subscriber
  clientSub: Subscription;
  sessionTypeSub: Subscription;
  clientSessionSub: Subscription;
  loadingVisible: boolean;

  getCurrentTraining(date, employeeID): string {
    const result = (date + employeeID) % 3;
    return 'training-background-' + result;
  }

  showErrorAndExit(error: any): void {
    console.log(error);
    this.popup.error(UNEXPECTED_ERROR, () => {
      this.router.navigate(['/clients']);
    });
  }

  ngOnInit(): void {
    this.currentDate = new Date();
    this.clientUid = this.route.snapshot.paramMap.get('uid');
    this.sessionTypeSub = this.sessionTypeService.getAll().subscribe(sessionTypes => {
      this.sessionTypes = sessionTypes;
      this.fetchClient();
    }, error => this.showErrorAndExit(error));
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

  ngOnDestroy(): void {
    try {
      this.clientSub.unsubscribe();
      this.sessionTypeSub.unsubscribe();
      this.clientSessionSub.unsubscribe();
    } catch (e) {
    }

  }

  dateToTimestamp(client: ClientModel): void {
    if (!client.dateOfBirth || typeof client.dateOfBirth === 'number') {
      return;
    }
    if (client.dateOfBirth.seconds) {
      client.dateOfBirth = new Date(client.dateOfBirth.seconds * 1000);
    }
  }

  editClientDetails(): void {
    if (this.isInEditMode) {
      this.client = Object.assign({}, this.clientCopy);
    } else {
      this.clientCopy = Object.assign({}, this.client);
    }
    this.isInEditMode = !this.isInEditMode;
  }

  updateClient(): void {
    this.updating = true;
    this.clientService.update([this.client], true)
      .then(success => {
        this.clientCopy = null;
        this.isInEditMode = false;
        this.updating = false;
        if (success) {
          this.popup.success(`Client Updated`);
        }
      })
      .catch(e => {
        console.log('Error updating client: ', e);
        this.updating = false;
        this.popup.error(UNEXPECTED_ERROR);
      });
  }

  private fetchClient(): void {
    this.clientSub = this.clientService.getOne(this.clientUid).subscribe(client => {
      this.dateToTimestamp(client);
      this.client = client;
      console.log('client fetched', this.client);
      this.fetchClientSessions();
    }, error => this.showErrorAndExit(error));
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

  private initNewSessionObject(startDate: any, endDate: any): void {
    this.newSession = {
      date: startDate, dateStr: startDate.getMonth() + 1 + '/' + startDate.getDate() + '/' + startDate.getFullYear()
      , endTime: undefined, isFull: false, startTime: undefined, uid: '',
      startDate, endDate, spots: 0, sessionTypeId: '', subscriptions: []
    };
    this.showCreateNewSessionPopup = true;
  }

  formatStartAndEndTime(newSession: SessionModel): string {
    return `${newSession.startDate.getHours() >= 10 ? newSession.startDate.getHours() : '0' + newSession.startDate.getHours()}:${newSession.startDate.getMinutes() >= 10 ? newSession.startDate.getMinutes() : '0' + newSession.startDate.getMinutes()} - ${newSession.endDate.getHours() >= 10 ? newSession.endDate.getHours() : '0' + newSession.endDate.getHours()}:${newSession.endDate.getMinutes() >= 10 ? newSession.endDate.getMinutes() : '0' + newSession.endDate.getMinutes()}`;
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

  selectSessionToBook(data: SessionModel): void {
    this.chosenSession = data;
    this.popup.success('Session selected, press ok to fetch active client packages', () => {
      this.fetchPackagesMatchesSession(this.chosenSession.sessionTypeId);
    });
  }
}
