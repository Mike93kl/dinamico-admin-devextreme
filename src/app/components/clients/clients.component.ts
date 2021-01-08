import {Component, OnInit} from '@angular/core';
import {ClientService} from '../../services/client.service';
import {ClientModel} from '../../models/ClientModel';
import DevExpress from 'devextreme';
import alert = DevExpress.ui.dialog.alert;
import {PopupService} from '../../services/popup.service';
import {UNEXPECTED_ERROR} from '../../utils/ui_messages';
import {handleFunctionResponseWithPromise, rejectFunctionResponsePromise} from '../../utils/utils';

declare var $: any;

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit {

  clients: ClientModel[];

  constructor(private clientService: ClientService, private popup: PopupService) {
  }

  ngOnInit(): void {
    this.clientService.getAll().subscribe(clients => {
      this.clients = clients;
      console.log(this.clients);
    }, error => this.popup.error(error));
  }

  onInserting($event): any {
    const promise = new $.Deferred();
    const sub = this.clientService.createNewClient($event.data)
      .subscribe(result => {
        handleFunctionResponseWithPromise(promise, result);
        sub.unsubscribe();
      }, error => {
        rejectFunctionResponsePromise(promise, error);
        sub.unsubscribe();
      });
    $event.cancel = promise.promise();
  }

  onInserted($event: any): void {
    this.popup.success(`Client ${$event.data.fullName} created`);
  }
}
