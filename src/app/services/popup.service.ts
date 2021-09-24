import {alert, custom} from 'devextreme/ui/dialog';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PopupService {

  constructor() {
  }

  error(error: any, cb?: () => any): void {
    console.log('e: ', error);
    let msg;
    if (typeof error === 'string') {
      msg = error;
    } else if (!!error.code && error.data && error.data.uiMessage) {
      msg = error.data.uiMessage;
    } else  {
      msg = 'Unexpected Error! Please contact support!!'
    }

    const dialog = custom({
      showTitle: false,
      messageHtml: `
        <div class="container text-center">
            <h5 style="color: chocolate"> Error! </h5>
            <hr>
            <p>
                <strong>${msg}</strong>
            </p>
        </div>
      `,
      buttons: [{
        text: 'OK'
      }]
    });
    dialog.show().then(closed => {
      if (cb) {
        cb();
      }
    });
  }

  success(msg: string, cb?: () => any): void {
    const dialog = custom({
      showTitle: false,
      messageHtml: `
        <div class="container text-center">
            <h5 style="color: darkgreen"> Success! </h5>
            <hr>
            <p>
                <strong>${msg}</strong>
            </p>
        </div>
      `,
      buttons: [{
        text: 'OK'
      }]
    });
    dialog.show().then(closed => {
      if (cb) {
        cb();
      }
    });
  }

  info(msg: string, cb?: () => any): void {
    const dialog = custom({
      showTitle: false,
      messageHtml: `
        <div class="container text-center">
            <h5 style="color: royalblue"> Info! </h5>
            <hr>
            <p>
                <strong>${msg}</strong>
            </p>
        </div>
      `,
      buttons: [{
        text: 'OK'
      }]
    });
    dialog.show().then(closed => {
      if (cb) {
        cb();
      }
    });
  }


  confirm(msg: string, onResult: (confirmed: boolean) => void) {
    const dialog = custom({
      showTitle: false,
      messageHtml: `
        <div class="container text-center">
            <h5 style="color: royalblue"> Are you sure? </h5>
            <hr>
            <p>
                <strong>${msg}</strong>
            </p>
        </div>
      `,
      buttons: [{
        text: 'CANCEL',
        onClick: () => {
          onResult(false);
        }
      }, {
        text: 'OK',
        onClick: () => onResult(true)
      }]
    });
    dialog.show();
  }
}
