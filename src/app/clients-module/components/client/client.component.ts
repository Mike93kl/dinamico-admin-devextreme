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

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.css']
})
export class ClientComponent implements OnInit, OnDestroy {

  constructor(private route: ActivatedRoute, private clientService: ClientService,
              private popup: PopupService, private router: Router,
              private sessionTypeService: SessionTypeService) {
  }

  clientUid: string;
  client: ClientModel;
  clientCopy: ClientModel;
  isInEditMode = false;
  updating = false;
  currentDate: any;
  sessionTypes: SessionTypeModel[];
  clientSessions: ClientSessionModel[];
  // subscriber
  clientSub: Subscription;
  sessionTypeSub: Subscription;
  clientSessionSub: Subscription;

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
    this.clientService.getClientSessions(this.client.uid).then(clientSessions => {
      this.clientSessions = clientSessions.map(cs => {
        cs.startDate = new Date(cs.sessionDate.seconds * 1000);
        const d = new Date(cs.startDate);
        d.setHours(cs.endTime.minutesAsInt, cs.endTime.minutesAsInt);
        cs.endDate = d;
        cs.text = cs.sessionType.title;
        return cs;
      });
      console.log('sss', this.clientSessions);
    }).catch(error => {
      console.log(error);
      this.popup.error('Could not fetch client sessions. Try refreshing the page');
    });
  }

  ngOnDestroy(): void {
    try {
      this.clientSub.unsubscribe();
      this.sessionTypeSub.unsubscribe();
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

  markWeekEnd(cellData): any {
    function isWeekEnd(date): boolean {
      const day = date.getDay();
      return day === 0 || day === 6;
    }

    const classObject = {};
    classObject['employee-1'] = true;
    classObject['employee-weekend-2'] = isWeekEnd(cellData.startDate);
    return classObject;
  }

  markTraining(cellData): any {
    const classObject = {
      'day-cell': true
    };

    classObject[this.getCurrentTraining(cellData.startDate.getDate(), 3)] = true;
    return classObject;
  }

  private fetchClient(): void {
    this.clientSub = this.clientService.getOne(this.clientUid).subscribe(client => {
      this.dateToTimestamp(client);
      this.client = client;
      console.log('client fetched', this.client);
      this.fetchClientSessions();
    }, error => this.showErrorAndExit(error));
  }
}
