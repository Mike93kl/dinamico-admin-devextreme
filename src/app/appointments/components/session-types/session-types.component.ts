import {Component, OnDestroy, OnInit} from '@angular/core';
import {SessionTypeService} from '../../../services/session-type.service';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {Subscription} from 'rxjs';
import {PopupService} from '../../../services/popup.service';
import {MSG_UNEXPECTED_ERROR} from '../../../utils/ui_messages';

@Component({
  selector: 'app-session-types',
  templateUrl: './session-types.component.html',
  styleUrls: ['./session-types.component.css']
})
export class SessionTypesComponent implements OnInit, OnDestroy {

  sessionTypes: SessionTypeModel[];
  // subs
  sessionTypeSub: Subscription;

  constructor(private service: SessionTypeService, private popup: PopupService) {
  }

  ngOnInit(): void {
    this.sessionTypeSub = this.service.getAll().subscribe(types => {
      this.sessionTypes = types.map(t => {
        t.locked = true;
        return t;
      });
    }, error => {
      console.log(error);
      this.popup.error(MSG_UNEXPECTED_ERROR);
    });
  }

  ngOnDestroy(): void {
    if (this.sessionTypeSub) {
      this.sessionTypeSub.unsubscribe();
    }
  }

  addNew(): void {
    this.sessionTypes.unshift({
      locked: false,
      isNew: true,
      title: '',
      uid: null
    });
  }

  createOrUpdate(s: SessionTypeModel): void {
    if (s.isNew) {
      this.create(s);
    } else {
      this.update(s);
    }
  }

  private update(s: SessionTypeModel): void {
    delete s.locked;
    this.service.update([s])
      .then(() => this.popup.success('Session Type Updated'))
      .catch(() => this.popup.error(MSG_UNEXPECTED_ERROR));
  }

  private create(s: SessionTypeModel): void {
    delete s.isNew;
    this.service.create([s])
      .then(() => this.popup.success('Session Type Created'))
      .catch(() => this.popup.error(MSG_UNEXPECTED_ERROR));
  }
}
