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
    }, error => this.showErrorAndExit(error));
  }
}
