import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {SessionTypeService} from '../../services/session-type.service';
import {SessionTypeModel} from '../../models/SessionTypeModel';
import {Subscription} from 'rxjs';
import {PopupService} from '../../services/popup.service';
import {
  MSG_STC_ERROR_CREATING_SESSION_TYPE,
  MSG_STC_ERROR_SESSION_TYPE_TITLE_CANNOT_BE_EMPTY
} from '../../utils/ui_messages';

@Component({
  selector: 'app-session-types-v1',
  templateUrl: './session-types-v1.component.html',
  styleUrls: ['./session-types-v1.component.css']
})
export class SessionTypesV1Component implements OnInit, OnDestroy {
  showPopup = false;
  sessionTypes: SessionTypeModel[] = [];
  sub: Subscription | undefined;

  @Input() showDumbbellIcon = true;
  @Output() onSessionTypesFetched: EventEmitter<SessionTypeModel[]> = new EventEmitter<SessionTypeModel[]>();

  constructor(private service: SessionTypeService, private popup: PopupService) {
  }

  ngOnInit(): void {
    this.sub = this.service.getAllOrderedByTs()
      .subscribe({
        next: sessionTypes => {
          this.sessionTypes = sessionTypes.map(s => {
            return {
              ...s,
              locked: true,
              isNew: false
            };
          });
          this.onSessionTypesFetched.emit(sessionTypes);
        },
        error: err => {
          console.log(err);
          this.sessionTypes = null;
        }

      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  unshiftSessionType(): void {
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
    if (!s.title) {
      this.popup.error(MSG_STC_ERROR_SESSION_TYPE_TITLE_CANNOT_BE_EMPTY);
      return;
    }
    s.title = s.title.trim();
    if (s.title === '') {
      this.popup.error(MSG_STC_ERROR_SESSION_TYPE_TITLE_CANNOT_BE_EMPTY);
      return;
    }
    if (s.hasOwnProperty('locked')) {
      delete s.locked;
    }
    if (s.hasOwnProperty('isNew')) {
      delete s.isNew;
    }
    this.service.createOrUpdate(s)
      .then()
      .catch(e => {
        console.log(e);
        this.popup.error(MSG_STC_ERROR_CREATING_SESSION_TYPE);
      });
  }

  public show(): void {
    this.showPopup = true;
  }

  public showIcon(): void {
    this.showDumbbellIcon = true;
  }
}


