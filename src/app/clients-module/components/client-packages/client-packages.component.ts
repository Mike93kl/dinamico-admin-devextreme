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
import * as uuid from 'uuid';
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
  showCustomPackagePopup = false;
  allPackagesMapped: GetPackagesFnResponseData[] = [];
  clientPackages: ClientPackageModelV1[] = [];
  customPackage: PackageModel;


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

  addClientPackage(c: PackageModel, isCustom: boolean): void {
    this.popup.confirm(MSG_CC_CONFIRM_ADD_CLIENT_PACKAGE(c.title, this.client.fullName), async confirmed => {
      if (!confirmed) {
        return;
      }

      const canExpireByDate = c.canExpire;
      const eligibleSessionTypeIds = c.eligibleSessionTypes.map(e => e.sessionTypeId);
      const eligibleSessionTypes: ClientEligibleSessionTypeModel[] = c.eligibleSessionTypes.map((e) => {
        return {...e, timesUsed: 0, uniqueKey: uuid.v4()};
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
        isCustom,
        paid: false,
        payments: [],
        expired: false
      };
      this.showNewPackagePopup = false;
      this.customPackage = undefined;
      this.showCustomPackagePopup = false;
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

  initCustomPackage(): void {
    this.customPackage = {
      active: true,
      price: 0,
      title: '',
      daysToExpire: 0,
      canExpire: false,
      description: '',
      eligibleSessionTypes: [],
      parentPackageId: null
    };
    this.showCustomPackagePopup = true;
  }


  addCustomPackage(): void {
    if (this.customPackage.title === '' || this.customPackage.title.length < 4) {
      this.popup.error(`Package must have a title with minimum characters of 4`);
      return;
    }
    if (this.customPackage.price <= 0) {
      this.popup.error(`Price for package must be greater than 0`);
      return;
    }
    this.customPackage.daysToExpire = +this.customPackage.daysToExpire;
    if (this.customPackage.daysToExpire < 0) {
      this.popup.error(`Days to expire must be 0 or greater`);
      return;
    }
    for (let i = 0; i < this.customPackage.eligibleSessionTypes.length; i++) {
      if (this.customPackage.eligibleSessionTypes[i].maxUsages <= 0) {
        this.popup.error(`Eligible session type at position ${i + 1}: 'Max Usages' must be greater than 0`);
        return;
      }
      if (this.customPackage.eligibleSessionTypes[i].sessionTypeId === '') {
        this.popup.error(`Please choose a session type at position ${i + 1}`);
        return;
      }
    }
    this.customPackage.canExpire = this.customPackage.daysToExpire > 0;
    this.addClientPackage(this.customPackage, true);
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
        .then(() => {
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

}

