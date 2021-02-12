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
import {UNEXPECTED_ERROR} from '../../../utils/ui_messages';
import {confirm} from 'devextreme/ui/dialog';
import {ClientPackagesService} from '../../../services/client-packages.service';
import {ClientEligibleSessionTypeModel} from '../../../models/ClientEligibleSessionTypeModel';

@Component({
  selector: 'app-client-packages',
  templateUrl: './client-packages.component.html',
  styleUrls: ['./client-packages.component.css']
})
export class ClientPackagesComponent implements OnInit, OnDestroy {

  customPackage: ClientPackageModel;
  @Input() client: ClientModel;
  @Input() sessionTypes: SessionTypeModel[];
  clientPackages: ClientPackageModel[];
  packages: PackageModel[];
  limit = 100;
  loadingVisible = false;
  alterMaxUsages: {
    sessionType: SessionTypeModel | undefined;
    clientPackage: ClientPackageModel | undefined,
    newMaxUsages: number | undefined,
    oldMaxUsages: number | undefined
  } = {
    sessionType: undefined,
    clientPackage: undefined,
    newMaxUsages: undefined,
    oldMaxUsages: undefined
  };
  showCustomPackagePopup = false;
  showPackagesForNewPopup = false;
  // subs
  clientPackagesSub: Subscription;

  constructor(private clientService: ClientService,
              private popup: PopupService,
              private packageService: PackagesService,
              private clientPackagesService: ClientPackagesService) {
  }

  ngOnInit(): void {
    this.packageService.getAll().pipe(take(1)).subscribe(pkg => {
      this.packages = pkg.map(p => {
        p.eligibleSessionTypes.forEach(el => {
          el.sessionType = this.sessionTypes.find(e => e.uid === el.sessionTypeId);
        });
        return p;
      });
      this.fetchPackages();
    }, error => {
      console.log(error);
      this.popup.error('Could not packages, Please refresh the page');
    });
  }

  ngOnDestroy(): void {
    try {
      this.clientPackagesSub.unsubscribe();
    } catch (e) {
    }
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
      }, error => {
        console.log(error);
        this.popup.error('Could not fetch packages, Please refresh the page');
      });
  }

  async changeMaxUsages(alterMaxUsages: {
    sessionType: SessionTypeModel | undefined;
    clientPackage: ClientPackageModel | undefined;
    newMaxUsages: number | undefined,
    oldMaxUsages: number | undefined
  }): Promise<void> {
    if (alterMaxUsages.newMaxUsages === 0) {
      this.popup.error('Max usages cannot be 0');
      return;
    }
    const confirmation = await confirm(`You are about to update max usages from ${alterMaxUsages.oldMaxUsages}
      to ${alterMaxUsages.newMaxUsages}. Confirm? `, 'Confirmation');
    if (!confirmation) {
      return;
    }
    this.loadingVisible = true;
    this.clientService.alterPackageMaxUsages(alterMaxUsages.clientPackage.uid
      , alterMaxUsages.newMaxUsages, alterMaxUsages.sessionType.uid)
      .pipe(take(1))
      .subscribe(result => {
        this.loadingVisible = false;
        if (result.success) {
          this.popup.success('Package updated!');
          this.alterMaxUsages = {
            sessionType: undefined,
            clientPackage: undefined,
            newMaxUsages: undefined,
            oldMaxUsages: undefined
          };
          return;
        }
        this.popup.error(result.data && result.data.uiMessage ? result.data.uiMessage : UNEXPECTED_ERROR);
      }, error => {
        this.loadingVisible = false;
        console.log(error);
        this.popup.error(UNEXPECTED_ERROR);
      });
  }

  async addPackageToClient(data: PackageModel): Promise<void> {
    const confirmation = await confirm(`Please confirm that you want to add ${data.title} Package to
    ${this.client.fullName}'s packages`, 'Add Package');
    if (!confirmation) {
      return;
    }
    const pkg = Object.assign({}, data);
    pkg.eligibleSessionTypes = [...data.eligibleSessionTypes];
    let expiryDate = new Date();
    if (pkg.daysToExpire > 0) {
      expiryDate = new Date(expiryDate.getTime() + ((60000 * 60 * 24) * pkg.daysToExpire));
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 10, expiryDate.getMonth(), expiryDate.getDate());
    }
    const cPkg: ClientPackageModel = {
      _package: null,
      canExpireByDate: pkg.daysToExpire > 0,
      dateLastUsed: null,
      expired: false,
      expiryDate,
      packageId: pkg.uid,
      pricePaid: pkg.price,
      pricePaidString: pkg.price.toString(),
      purchaseDate: new Date(),
      uid: '',
      clientId: this.client.uid,
      paid: false,
      title: pkg.title,
      eligibleSessionTypeIds: pkg.eligibleSessionTypes.map(e => e.sessionTypeId),
      eligibleSessionTypes: pkg.eligibleSessionTypes.map(el => {
        const e = Object.assign({}, el) as ClientEligibleSessionTypeModel;
        e.sessionType = null;
        e.timesUsed = 0;
        return e;
      })
    };
    this.loadingVisible = true;
    this.showPackagesForNewPopup = false;
    this.clientPackagesService.create([cPkg])
      .then(() => {
        this.loadingVisible = false;
        this.popup.success(`Package ${data.title} added to client's packages`);
      })
      .catch(error => {
        this.loadingVisible = false;
        console.log(error);
        this.popup.error(UNEXPECTED_ERROR);
      });

  }

  initCustomPackage(): void {
    this.customPackage = {
      _package: null,
      canExpireByDate: false,
      dateLastUsed: null,
      expired: false,
      expiryDate: null,
      packageId: 'custom',
      isCustom: true,
      purchaseDate: new Date(),
      uid: '',
      clientId: this.client.uid,
      pricePaid: 0.00,
      pricePaidString: 0.00.toString(),
      eligibleSessionTypeIds: [],
      eligibleSessionTypes: [],
      paid: false,
      title: '',
      daysToExpire: 0
    };
    this.showPackagesForNewPopup = false;
    this.showCustomPackagePopup = true;
  }

  async createCustomPackage(): Promise<void> {

    if (this.customPackage.title === '') {
      this.popup.error('Title is required!');
      return;
    }

    if (this.customPackage.pricePaid < 0) {
      this.popup.error('Price cannot be a negative number');
      return;
    }

    for (const el of this.customPackage.eligibleSessionTypes) {
      if (el.maxUsages === 0 || isNaN(parseInt(String(el.maxUsages), 10))) {
        this.popup.error('Max usages cannot be 0');
        return;
      }
    }
    const confirmation = await confirm(`Create custom package: ${this.customPackage.title} for client? `,
      'Confirmation');
    if (!confirmation) {
      return;
    }
    this.customPackage.canExpireByDate = this.customPackage.daysToExpire > 0;
    let expiryDate = new Date();
    if (this.customPackage.canExpireByDate) {
      expiryDate = new Date(expiryDate.getTime() + ((60000 * 60 * 24) * this.customPackage.daysToExpire));
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 10, expiryDate.getMonth(), expiryDate.getDate());
    }
    delete this.customPackage.daysToExpire;
    this.customPackage.expiryDate = expiryDate;
    this.customPackage.eligibleSessionTypeIds = this.customPackage.eligibleSessionTypes.map(e => e.sessionTypeId);
    this.customPackage.pricePaidString = this.customPackage.pricePaid.toString();
    this.loadingVisible = true;
    this.showPackagesForNewPopup = false;
    this.showCustomPackagePopup = false;
    this.clientPackagesService.create([this.customPackage])
      .then(() => {
        this.loadingVisible = false;
        this.popup.success(`Package ${this.customPackage.title} created`);
      })
      .catch(e => {
        console.log(e);
        this.loadingVisible = false;
        this.popup.error(UNEXPECTED_ERROR);
      });
  }
}

