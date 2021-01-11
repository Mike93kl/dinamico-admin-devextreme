import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Route, Router} from '@angular/router';
import {ClientService} from '../../../services/client.service';
import {Subscription} from 'rxjs';
import {ClientModel} from '../../../models/ClientModel';
import {PopupService} from '../../../services/popup.service';

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.css']
})
export class ClientComponent implements OnInit, OnDestroy {
  clientUid: string;
  client: ClientModel;
  // subscriber
  clientSub: Subscription;

  constructor(private route: ActivatedRoute, private clientService: ClientService,
              private popup: PopupService, private router: Router) {
  }

  ngOnInit(): void {
    this.clientUid = this.route.snapshot.paramMap.get('uid');
    this.clientSub = this.clientService.getOne(this.clientUid).subscribe(client => {
      this.client = client;
    }, error => this.popup.error(error, () => {
      this.router.navigate(['/clients']);
    }));
  }

  ngOnDestroy(): void {
    this.clientSub.unsubscribe();
  }

}
