import {Component, OnDestroy, OnInit} from '@angular/core';
import {SessionTypeModel} from '../../models/SessionTypeModel';
import {Subscription} from 'rxjs';
import {PopupService} from '../../services/popup.service';
import {MSG_STC_ERROR_CREATING_SESSION_TYPE} from '../../utils/ui_messages';
import {SessionTypeV1Service} from '../../services/sessiontypes-v1.service';

@Component({
  selector: 'app-abc',
  templateUrl: './abc.component.html',
  styleUrls: ['./abc.component.css']
})
export class AbcComponent implements OnInit, OnDestroy {
  showPopup = false;
  sessionTypes: SessionTypeModel[] = [];
  sub: Subscription | undefined;

  constructor(private service: SessionTypeV1Service, private popup: PopupService) {
  }

  ngOnInit(): void {
    this.sub = this.service.getAll().subscribe(sessionTypes => {
      this.sessionTypes = sessionTypes.map(s => {
        return {
          ...s,
          locked: true,
          isNew: false
        };
      });
    }, error => {
      console.log(error);
      this.sessionTypes = null;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  unshiftSessionType(): void {
    if (this.sessionTypes.length === 0) {
      return;
    }
    if (!this.sessionTypes[0].uid || this.sessionTypes[0].uid === '') {
      return;
    }
    this.sessionTypes.unshift({
      title: '',
      uid: null,
      isNew: true,
      locked: false
    });
  }

  doubleClicked(s: SessionTypeModel): void {
    if (s.isNew) {
      return;
    }

    s.locked = false;
  }

  addOrUpdate(s: SessionTypeModel): void {
    if (s.hasOwnProperty('locked')) {
      delete s.locked;
    }
    if (s.hasOwnProperty('isNew')) {
      delete s.isNew;
    }
    this.service.createOrUpdate(s)
      .catch(e => {
        console.log(e);
        this.popup.error(MSG_STC_ERROR_CREATING_SESSION_TYPE);
      });
  }

  public show(): void {
    this.showPopup = true;
  }
}


