import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {ClientService} from '../../../services/client.service';
import {ClientPackageModel} from '../../../models/ClientPackageModel';
import {ClientModel} from '../../../models/ClientModel';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {Subscription} from 'rxjs';
import {PopupService} from '../../../services/popup.service';
import {PackagesService} from '../../../services/packages.service';
import {PackageModel} from '../../../models/PackageModel';
import {take} from 'rxjs/operators';

@Component({
  selector: 'app-client-packages',
  templateUrl: './client-packages.component.html',
  styleUrls: ['./client-packages.component.css']
})
export class ClientPackagesComponent implements OnInit, OnDestroy {

  @Input() client: ClientModel;
  @Input() sessionTypes: SessionTypeModel[];
  clientPackages: ClientPackageModel[];
  packages: PackageModel[];
  limit = 100;
  // subs
  clientPackagesSub: Subscription;
  constructor(private clientService: ClientService,
              private popup: PopupService,
              private packageService: PackagesService) { }

  ngOnInit(): void {
    this.packageService.getAll().pipe(take(1)).subscribe(pkg => {
      this.packages = pkg;
      this.fetchPackages();
    }, error => {
      console.log(error);
      this.popup.error('Could not packages, Please refresh the page');
    });
  }

  ngOnDestroy(): void {
    try{
      this.clientPackagesSub.unsubscribe();
    }catch (e) {}
  }

  fetchPackages(): void {
    this.clientPackagesSub = this.clientService.getClientPackages(this.client.uid, this.limit)
      .subscribe(pkcs => {
        this.clientPackages = pkcs.map(p => {
          p._package = this.packages.find(pk => pk.uid === p.packageId);
          p.eligibleSessionTypes.forEach(el => {
            el.sessionType = this.sessionTypes.find(s => s.uid === el.sessionTypeId);
          });
          return p;
        });
        console.log(this.clientPackages);
      }, error => {
        console.log(error);
        this.popup.error('Could not fetch packages, Please refresh the page');
      });
  }

}
