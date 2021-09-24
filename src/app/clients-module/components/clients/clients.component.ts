import {Component, OnDestroy, OnInit} from '@angular/core';
import {ClientService} from '../../../services/client.service';
import {ClientModel} from '../../../models/ClientModel';
import DevExpress from 'devextreme';
import alert = DevExpress.ui.dialog.alert;
import {PopupService} from '../../../services/popup.service';
import {MSG_UNEXPECTED_ERROR} from '../../../utils/ui_messages';
import {handleFunctionResponseWithPromise, rejectFunctionResponsePromise} from '../../../utils/utils';
import {DatePipe} from '@angular/common';
import {Subscription} from 'rxjs';

declare var $: any;

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit, OnDestroy {

  clients: ClientModel[];

  // subscribers
  clientsSub: Subscription;

  constructor(private clientService: ClientService, private popup: PopupService, private datePipe: DatePipe) {
  }

  ngOnInit(): void {
    this.clientsSub = this.clientService.getAll().subscribe(clients => {
      this.clients = clients;
      console.log(this.clients);
    }, error => this.popup.error(error));
  }

  ngOnDestroy(): void {
    this.clientsSub.unsubscribe();
  }

  onInserting($event): any {
    const deferred = new $.Deferred();
    if ($event.data.__KEY__) {
      delete $event.data.__KEY__;
    }
    $event.data.dateOfBirth = Date.parse($event.data.dateOfBirth);
    $event.data.allowFreeSubscriptions = false;
    const sub = this.clientService.createNewClient($event.data)
      .subscribe(result => {
        handleFunctionResponseWithPromise(deferred, result);
        sub.unsubscribe();
      }, error => {
        rejectFunctionResponsePromise(deferred, error);
        sub.unsubscribe();
      });
    $event.cancel = deferred.promise();
  }

  onInserted($event: any): void {
    this.popup.success(`Client ${$event.data.fullName} created`);
  }

  populateDate(object: any): string {
    let date;
    if (!object) {
      return 'n/a';
    }
    if (typeof object === 'string') {
      date = Date.parse(object);
      if (isNaN(date)) {
        return 'n/a';
      }
    }
    if (object.seconds) {
      date = new Date(object.seconds * 1000);
    }
    return this.datePipe.transform(date, 'dd-MM-yyyy');
  }
}
