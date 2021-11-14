import {Component, OnInit, ViewChild, OnDestroy} from '@angular/core';
import {ClientService} from '../../../services/client.service';
import {ClientModel} from '../../../models/ClientModel';
import {PopupService} from '../../../services/popup.service';
import {DatePipe} from '@angular/common';
import {DxDataGridComponent} from 'devextreme-angular';
import {take} from 'rxjs/operators';
import {Subscription} from 'rxjs'
import {FnError} from '../../../models/fn/FnResponseHandler';
import {
  MSG_CLIENT_NAME_REQUIRED,
  MSG_EMAIL_INVALID_FORMAT,
  MSG_EMAIL_REQUIRED,
  MSG_PHONE_NUMBER_REQUIRED,
  MSG_UNEXPECTED_ERROR
} from '../../../utils/ui_messages';

declare var $: any;

@Component({
  selector: 'app-clients',
  templateUrl: './clients.component.html',
  styleUrls: ['./clients.component.css']
})
export class ClientsComponent implements OnInit, OnDestroy {

  @ViewChild(DxDataGridComponent) dxDataGrid: DxDataGridComponent | undefined;

  clients: ClientModel[];
  clientsSub: Subscription | undefined;

  constructor(private clientService: ClientService, private popup: PopupService, private datePipe: DatePipe) {
  }

  ngOnDestroy(): void {
    this.clientsSub?.unsubscribe()
  }

  ngOnInit(): void {
    this.clientsSub = this.clientService.getAll()
      .subscribe({
        next: clients => {
          this.clients = clients;
        },
        error: err => {
          console.log(err)
          this.popup.error(MSG_UNEXPECTED_ERROR)
        }
      });
  }

  private validClientObject(data: ClientModel): boolean {
    if (!data.fullName || data.fullName.trim().length < 4) {
      this.popup.error(MSG_CLIENT_NAME_REQUIRED);
      return false;
    }

    if (!data.phone || !/\d+/.test(data.phone)) {
      this.popup.error(MSG_PHONE_NUMBER_REQUIRED);
      return false;
    }
    const emailRe = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    if (!data.email) {
      this.popup.error(MSG_EMAIL_REQUIRED);
      return false;
    }

    if (!emailRe.test(data.email)) {
      this.popup.error(MSG_EMAIL_INVALID_FORMAT);
      return false;
    }
    return true;
  }

  onInserting($event): any {

    if (!this.validClientObject($event.data)) {
      $event.cancel = true;
      return;
    }

    const deferred = new $.Deferred();
    let rowKey = null;
    if ($event.data.__KEY__) {
      rowKey = $event.data.__KEY__;
      delete $event.data.__KEY__;
    }
    this.clientService.createNewClient({
      fullName: $event.data.fullName,
      allowFreeSubscriptions: false,
      email: $event.data.email,
      dateOfBirth: this.populateDate($event.data.dateOfBirth),
      active: $event.data.active,
      phone: $event.data.phone
    } as ClientModel)
      .then(res => {
        $event.data = res;
        if (rowKey) {
          $event.data.__KEY__ = rowKey;
        }
        deferred.resolve();
      })
      .catch((e: FnError) => {
        this.popup.error(e.message);
        deferred.reject();
      });
    $event.cancel = deferred.promise();
  }

  onInserted($event: any): void {
    this.popup.success(`Client ${$event.data.fullName} created`);
  }

  populateDate(object: any): number {
    if (typeof object === 'number') {
      return object;
    }

    if (object instanceof Date) {
      return object.getTime();
    }
    return 0;
  }

  onInitNewRow($event: any): void {
    $event.data.active = true;
  }
}
