import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ClientService} from '../../../services/client.service';
import {ClientModel} from '../../../models/ClientModel';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {BehaviorSubject, firstValueFrom, Subscription} from 'rxjs';
import {PopupService} from '../../../services/popup.service';
import {PackagesService} from '../../../services/packages.service';
import {PackageModel} from '../../../models/PackageModel';
import {
  MSG_CC_CONFIRM_ADD_CLIENT_PACKAGE,
  MSG_CC_CONFIRM_CLIENT_PACKAGE_PAYMENT_REMOVAL,
  MSG_CC_EST_MAX_USAGES_ERROR,
  MSG_CC_ONLY_NUMBERS_ALLOWED,
  MSG_CC_PACKAGE_PAYMENT_NO_ZERO_ALLOWED,
  MSG_UNEXPECTED_ERROR,
  MSG_UNEXPECTED_ERROR_REFRESH_PAGE
} from '../../../utils/ui_messages';
import {ClientEligibleSessionTypeModel} from '../../../models/ClientEligibleSessionTypeModel';
import {GetPackagesFnResponseData} from '../../../models/fn/GetPackagesFnResponse';
import {SessionTypesV1Component} from '../../../shared/session-types/session-types-v1.component';
import {ClientPackageModelV1} from '../../../models/ClientPackageModelV1';
import {FnError} from '../../../models/fn/FnResponseHandler';
import {EligibleSessionTypeModel} from '../../../models/EligibleSessionTypeModel';
import {CLIENT_PACKAGES} from '../../../utils/Collections';
import {DxDataGridComponent} from 'devextreme-angular';

declare var $: any;

@Component({
  selector: 'app-client-packages',
  templateUrl: './client-packages.component.html',
  styleUrls: ['./client-packages.component.css']
})
export class ClientPackagesComponent implements OnInit, OnDestroy {
  // inputs
  @Input() client: ClientModel;

  @ViewChild(DxDataGridComponent) dxDataGrid: DxDataGridComponent | undefined;

  // Session type related
  @ViewChild(SessionTypesV1Component) sessionTypeComponent: SessionTypesV1Component | undefined;
  sessionTypes: SessionTypeModel[] = [];
  sessionTypeSubBehavior: BehaviorSubject<SessionTypeModel[]> = new BehaviorSubject<SessionTypeModel[]>(this.sessionTypes);

  // important variables
  limit = 100;
  validPackagesOnly = true;
  loadingVisible = false;
  showNewPackagePopup = false;
  allPackagesMapped: GetPackagesFnResponseData[] = [];
  clientPackages: ClientPackageModelV1[] = [];


  // Subscriptions
  sessionTypeSub: Subscription | undefined;


  // constructor
  constructor(private clientService: ClientService,
              private popup: PopupService,
              private packageService: PackagesService) {
  }

  ////////////////////////
  // Component life cycle
  ////////////////////////

  ngOnInit(): void {
    // Get all packages mapped
    this.packageService.getAllPackages().then(data => this.allPackagesMapped = data)
      .catch((e: FnError) => {
        this.allPackagesMapped = undefined;
      });

    // listen for session types
    this.sessionTypeSub = this.sessionTypeSubBehavior.subscribe(sessionTypes => {
      this.sessionTypes = sessionTypes;
    });

    this.getClientsPackages(this.validPackagesOnly, 100);
  }

  ngOnDestroy(): void {
    this.sessionTypeSub?.unsubscribe();
  }

  /////////////////////////
  // End of life cycle
  ////////////////////////


  //////////////////////////
  // Events
  /////////////////////////
  onSessionTypesFetched(sessionTypes: SessionTypeModel[]): void {
    this.sessionTypeSubBehavior.next(sessionTypes);
  }


  // Important methods
  getClientsPackages(showOnlyValid: boolean, limit: number | string): void {
    if (typeof limit === 'string') {
      limit = parseInt(limit, 10);
    }
    this.loadingVisible = true;

    firstValueFrom(this.packageService.getPackagesOfClient(this.client.uid, showOnlyValid, limit))
      .then((packages) => {
        this.clientPackages = packages;
        this.dxDataGrid?.instance.getDataSource().load();
        this.loadingVisible = false;
      }).catch(err => {
      console.log(err);
      this.loadingVisible = false;
      this.popup.error(MSG_UNEXPECTED_ERROR_REFRESH_PAGE);
    });
  }

  // UI methods

  populateSessionTypeUsage(est: EligibleSessionTypeModel): string {
    if (!this.sessionTypes || this.sessionTypes.length === 0) {
      return 'loading ...';
    }
    const st = this.sessionTypes.find(s => s.uid === est.sessionTypeId);
    return (st?.title || 'N/A') + ' - <strong> ' + est.maxUsages + '</strong> usages';
  }

  populateSessionTypeTitle(est: ClientEligibleSessionTypeModel): string {
    if (!this.sessionTypes || this.sessionTypes.length === 0) {
      return 'loading ...';
    }

    const st = this.sessionTypes.find(s => s.uid === est.sessionTypeId);
    return st ? st.title : 'N/A';
  }

  addClientPackage(c: PackageModel): void {
    this.popup.confirm(MSG_CC_CONFIRM_ADD_CLIENT_PACKAGE(c.title, this.client.fullName), async confirmed => {
      if (!confirmed) {
        return;
      }

      const canExpireByDate = c.canExpire;
      const eligibleSessionTypeIds = c.eligibleSessionTypes.map(e => e.sessionTypeId);
      const eligibleSessionTypes: ClientEligibleSessionTypeModel[] = c.eligibleSessionTypes.map(e => {
        return {...e, timesUsed: 0};
      });
      let expiryDate: number = null;
      if (canExpireByDate && c.daysToExpire > 0) {
        expiryDate = new Date().getTime() + ((1000 * 60 * 60 * 24) * c.daysToExpire);
      }

      const clientPackage: ClientPackageModelV1 = {
        _package: c,
        clientId: this.client.uid,
        purchasedDate_ts: new Date().getTime(),
        expiryDate_ts: expiryDate,
        eligibleSessionTypeIds,
        eligibleSessionTypes,
        dateLastUsed_ts: null,
        canExpireByDate,
        isCustom: false,
        paid: false,
        payments: [],
        expired: false
      };
      this.loadingVisible = true;
      this.packageService.createForOtherCollection(CLIENT_PACKAGES, clientPackage)
        .then((p) => {
          this.clientPackages.unshift(p);
          this.dxDataGrid.instance.getDataSource().load();
          this.loadingVisible = false;
        })
        .catch(e => {
          console.log(e);
          this.popup.error(MSG_UNEXPECTED_ERROR);
        });
    });
  }

  onToggleOnlyValidPackages(value: boolean): void {
    this.validPackagesOnly = value;
    this.getClientsPackages(this.validPackagesOnly, this.limit);
  }

  onPackagesLimitChanged(): void {
    this.getClientsPackages(this.validPackagesOnly, this.limit);
  }

  ///////////////////////////////////////////////
  ////////// Payments methods //////////////////
  /////////////////////////////////////////////

  onPaymentInserting($e, clientPackage: ClientPackageModelV1): void {
    if (!/^[0-9]*\.?[0-9]*$/.test($e.data.payment)) {
      this.popup.error(MSG_CC_ONLY_NUMBERS_ALLOWED);
      $e.cancel = true;
      return;
    }
    if (+$e.data.payment <= 0) {
      this.popup.error(MSG_CC_PACKAGE_PAYMENT_NO_ZERO_ALLOWED);
      $e.cancel = true;
      return;
    }
    const deferred = new $.Deferred();
    const {__KEY__} = $e.data;
    this.loadingVisible = true;
    this.packageService.addPaymentToClientPackage(this.client.uid, clientPackage.uid, +$e.data.payment)
      .then((payment) => {
        this.loadingVisible = false;
        $e.data = {
          ...payment, __KEY__
        };
        deferred.resolve();
      }).catch((e: FnError) => {
      this.loadingVisible = false;
      deferred.reject(e.message);
    });

    $e.cancel = deferred.promise();
  }

  onPaymentDeleting($e, clientPackage: ClientPackageModelV1): void {
    const deferred = new $.Deferred();
    this.popup.confirm(MSG_CC_CONFIRM_CLIENT_PACKAGE_PAYMENT_REMOVAL(+$e.data.payment), confirmed => {
      if (!confirmed) {
        deferred.reject();
        return;
      }
      this.packageService.removePaymentFromClientPackage(this.client.uid, clientPackage.uid, $e.data.uniqueKey)
        .then((removed) => {
          this.loadingVisible = false;
          deferred.resolve();
        }).catch((e: FnError) => {
        this.loadingVisible = false;
        deferred.reject(e.message);
      });
    });
    $e.cancel = deferred.promise();
  }

  onPaymentDeleted($event: any, row): void {
    this.markPackagePaid(row);
  }

  onPaymentAdded($event: any, row): void {
    this.markPackagePaid(row);
  }

  private markPackagePaid(row: any): void {
    row.data.paid = row.data.payments.reduce((r, c) => {
      r += c.payment;
      return r;
    }, 0) >= row.data._package.price;
    this.dxDataGrid?.instance.repaintRows(row.row.rowIndex);
  }

  /////// End of Payment methods ///////////////

  /////////////////////////////////////////////////
  ///// ELIGIBLE SESSION TYPES - MAX USAGE UPDATE//
  ////////////////////////////////////////////////
  onEstMaxUsagesUpdating($event: any, data): void {
    console.log($event)
    if (+$event.newData.maxUsages < 0) {
      this.popup.error(MSG_CC_EST_MAX_USAGES_ERROR);
      $event.cancel = true;
      return;
    }

    const deferred = new $.Deferred();
    this.loadingVisible = true;
    this.packageService.updateEstMaxUsages(this.client.uid, data.uid, $event.oldData.sessionTypeId, +$event.newData.maxUsages)
      .then((est: ClientEligibleSessionTypeModel) => {
        this.loadingVisible = false;
        $event.newData = est;
        deferred.resolve();
      }).catch((e: FnError) => {
      this.loadingVisible = false;
      this.popup.error(e.message);
    });

    $event.cancel = deferred.promise();

  }

  ////// End of EST - MAX USAGE UPDATE //////////


  // ngOnInit(): void {
  //   this.packageService.getAll().pipe(take(1)).subscribe(pkg => {
  //     this.packages = pkg.map(p => {
  //       p.eligibleSessionTypes.forEach(el => {
  //         el.sessionType = this.sessionTypes.find(e => e.uid === el.sessionTypeId);
  //       });
  //       return p;
  //     });
  //     this.fetchPackages();
  //   }, error => {
  //     console.log(error);
  //     this.popup.error('Could not packages, Please refresh the page');
  //   });
  // }
  //
  // ngOnDestroy(): void {
  //   try {
  //     this.clientPackagesSub.unsubscribe();
  //   } catch (e) {
  //   }
  // }


  // allPackages: GetPackagesFnResponseData[];
  //
  // customPackage: ClientPackageModel;
  // // @Input() client: ClientModel;
  // // @Input() sessionTypes: SessionTypeModel[];
  // clientPackages: ClientPackageModel[];
  // packages: PackageModel[];
  // limit = 100;
  // loadingVisible = false;
  // alterMaxUsages: {
  //   sessionType: SessionTypeModel | undefined;
  //   clientPackage: ClientPackageModel | undefined,
  //   newMaxUsages: number | undefined,
  //   oldMaxUsages: number | undefined
  // } = {
  //   sessionType: undefined,
  //   clientPackage: undefined,
  //   newMaxUsages: undefined,
  //   oldMaxUsages: undefined
  // };
  // showCustomPackagePopup = false;
  // showPackagesForNewPopup = false;
  // // subs
  // clientPackagesSub: Subscription;
  //
  //
  //
  //
  //
  //
  //
  // fetchPackages(): void {
  //   this.clientPackagesSub = this.clientService.getClientPackages(this.client.uid, this.limit)
  //     .subscribe(pkcs => {
  //       this.clientPackages = pkcs.map(p => {
  //         p._package = this.packages.find(pk => pk.uid === p.packageId);
  //         p.eligibleSessionTypes.forEach(el => {
  //           el.sessionType = this.sessionTypes.find(s => s.uid === el.sessionTypeId);
  //         });
  //         return p;
  //       });
  //     }, error => {
  //       console.log(error);
  //       this.popup.error('Could not fetch packages, Please refresh the page');
  //     });
  // }
  //
  // async changeMaxUsages(alterMaxUsages: {
  //   sessionType: SessionTypeModel | undefined;
  //   clientPackage: ClientPackageModel | undefined;
  //   newMaxUsages: number | undefined,
  //   oldMaxUsages: number | undefined
  // }): Promise<void> {
  //   if (alterMaxUsages.newMaxUsages === 0) {
  //     this.popup.error('Max usages cannot be 0');
  //     return;
  //   }
  //   const confirmation = await confirm(`You are about to update max usages from ${alterMaxUsages.oldMaxUsages}
  //     to ${alterMaxUsages.newMaxUsages}. Confirm? `, 'Confirmation');
  //   if (!confirmation) {
  //     return;
  //   }
  //   this.loadingVisible = true;
  //   this.clientService.alterPackageMaxUsages(alterMaxUsages.clientPackage.uid
  //     , alterMaxUsages.newMaxUsages, alterMaxUsages.sessionType.uid)
  //     .pipe(take(1))
  //     .subscribe(result => {
  //       this.loadingVisible = false;
  //       if (result.success) {
  //         this.popup.success('Package updated!');
  //         this.alterMaxUsages = {
  //           sessionType: undefined,
  //           clientPackage: undefined,
  //           newMaxUsages: undefined,
  //           oldMaxUsages: undefined
  //         };
  //         return;
  //       }
  //       this.popup.error(result.data && result.data.uiMessage ? result.data.uiMessage : MSG_UNEXPECTED_ERROR);
  //     }, error => {
  //       this.loadingVisible = false;
  //       console.log(error);
  //       this.popup.error(MSG_UNEXPECTED_ERROR);
  //     });
  // }
  //
  // async addPackageToClient(data: PackageModel): Promise<void> {
  //   const confirmation = await confirm(`Please confirm that you want to add ${data.title} Package to
  //   ${this.client.fullName}'s packages`, 'Add Package');
  //   if (!confirmation) {
  //     return;
  //   }
  //   const pkg = Object.assign({}, data);
  //   pkg.eligibleSessionTypes = [...data.eligibleSessionTypes];
  //   let expiryDate = new Date();
  //   if (pkg.daysToExpire > 0) {
  //     expiryDate = new Date(expiryDate.getTime() + ((60000 * 60 * 24) * pkg.daysToExpire));
  //   } else {
  //     expiryDate.setFullYear(expiryDate.getFullYear() + 10, expiryDate.getMonth(), expiryDate.getDate());
  //   }
  //   const cPkg: ClientPackageModel = {
  //     _package: null,
  //     canExpireByDate: pkg.daysToExpire > 0,
  //     dateLastUsed: null,
  //     expired: false,
  //     expiryDate,
  //     packageId: pkg.uid,
  //     pricePaid: pkg.price,
  //     pricePaidString: pkg.price.toString(),
  //     purchaseDate: new Date(),
  //     uid: '',
  //     clientId: this.client.uid,
  //     paid: false,
  //     title: pkg.title,
  //     eligibleSessionTypeIds: pkg.eligibleSessionTypes.map(e => e.sessionTypeId),
  //     eligibleSessionTypes: pkg.eligibleSessionTypes.map(el => {
  //       const e = Object.assign({}, el) as ClientEligibleSessionTypeModel;
  //       e.sessionType = null;
  //       e.timesUsed = 0;
  //       return e;
  //     })
  //   };
  //   this.loadingVisible = true;
  //   this.showPackagesForNewPopup = false;
  //   this.clientPackagesService.create([cPkg])
  //     .then(() => {
  //       this.loadingVisible = false;
  //       this.popup.success(`Package ${data.title} added to client's packages`);
  //     })
  //     .catch(error => {
  //       this.loadingVisible = false;
  //       console.log(error);
  //       this.popup.error(MSG_UNEXPECTED_ERROR);
  //     });
  //
  // }
  //
  // initCustomPackage(): void {
  //   this.customPackage = {
  //     _package: null,
  //     canExpireByDate: false,
  //     dateLastUsed: null,
  //     expired: false,
  //     expiryDate: null,
  //     packageId: 'custom',
  //     isCustom: true,
  //     purchaseDate: new Date(),
  //     uid: '',
  //     clientId: this.client.uid,
  //     pricePaid: 0.00,
  //     pricePaidString: 0.00.toString(),
  //     eligibleSessionTypeIds: [],
  //     eligibleSessionTypes: [],
  //     paid: false,
  //     title: '',
  //     daysToExpire: 0
  //   };
  //   this.showPackagesForNewPopup = false;
  //   this.showCustomPackagePopup = true;
  // }
  //
  // async createCustomPackage(): Promise<void> {
  //
  //   if (this.customPackage.title === '') {
  //     this.popup.error('Title is required!');
  //     return;
  //   }
  //
  //   if (this.customPackage.pricePaid < 0) {
  //     this.popup.error('Price cannot be a negative number');
  //     return;
  //   }
  //
  //   for (const el of this.customPackage.eligibleSessionTypes) {
  //     if (el.maxUsages === 0 || isNaN(parseInt(String(el.maxUsages), 10))) {
  //       this.popup.error('Max usages cannot be 0');
  //       return;
  //     }
  //   }
  //   const confirmation = await confirm(`Create custom package: ${this.customPackage.title} for client? `,
  //     'Confirmation');
  //   if (!confirmation) {
  //     return;
  //   }
  //   this.customPackage.canExpireByDate = this.customPackage.daysToExpire > 0;
  //   let expiryDate = new Date();
  //   if (this.customPackage.canExpireByDate) {
  //     expiryDate = new Date(expiryDate.getTime() + ((60000 * 60 * 24) * this.customPackage.daysToExpire));
  //   } else {
  //     expiryDate.setFullYear(expiryDate.getFullYear() + 10, expiryDate.getMonth(), expiryDate.getDate());
  //   }
  //   delete this.customPackage.daysToExpire;
  //   this.customPackage.expiryDate = expiryDate;
  //   this.customPackage.eligibleSessionTypeIds = this.customPackage.eligibleSessionTypes.map(e => e.sessionTypeId);
  //   this.customPackage.pricePaidString = this.customPackage.pricePaid.toString();
  //   this.loadingVisible = true;
  //   this.showPackagesForNewPopup = false;
  //   this.showCustomPackagePopup = false;
  //   this.clientPackagesService.create([this.customPackage])
  //     .then(() => {
  //       this.loadingVisible = false;
  //       this.popup.success(`Package ${this.customPackage.title} created`);
  //     })
  //     .catch(e => {
  //       console.log(e);
  //       this.loadingVisible = false;
  //       this.popup.error(MSG_UNEXPECTED_ERROR);
  //     });
  // }

}

