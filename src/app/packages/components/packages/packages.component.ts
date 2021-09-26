import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { PackageModel } from '../../../models/PackageModel';
import { PackagesService } from '../../../services/packages.service';
import { PopupService } from '../../../services/popup.service';
import { SessionTypeService } from '../../../services/session-type.service';
import { SessionTypeModel } from '../../../models/SessionTypeModel';
import { firstValueFrom, Subscription } from 'rxjs';
import { MSG_FAILED_TO_UPDATE_PARENT_PACKAGE, MSG_UNEXPECTED_ERROR, MSG_UNEXPECTED_ERROR_REFRESH_PAGE } from '../../../utils/ui_messages';
import { ParentPackagesService } from 'src/app/services/parent-packages.service';
import { ParentPackageModel } from 'src/app/models/ParentPackageModel';
import { ParentPackagesComponent } from '../parent-packages/parent-packages.component';
import { DxListComponent } from 'devextreme-angular';

@Component({
  selector: 'app-packages',
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.css']
})
export class PackagesComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild(ParentPackagesComponent) parentPackagesComponent: ParentPackagesComponent | undefined;
  @ViewChild(DxListComponent) dxList: DxListComponent | undefined;

  loadingVisible = false;
  packages: PackageModel[];
  sessionTypes: SessionTypeModel[];
  newPackage: PackageModel;
  selectedPackage: PackageModel;
  selectedPackageCopy: PackageModel;
  showSelectedPackage: boolean;
  parentPackages: ParentPackageModel[];
  // subs
  packagesSub: Subscription;
  sessionTypeSub: Subscription;
  parentPackageSub: Subscription;

  constructor(private service: PackagesService, private popup: PopupService,
    private sessionTypeService: SessionTypeService, private parentPackagesService: ParentPackagesService) {
  }


  ///////////////////////////////////
  ///// LIFECYCLE METHODS //////////
  /////////////////////////////////

  ngAfterViewInit(): void {
    console.log('dxList', this.dxList != null)
  }

  ngOnInit(): void {
    this.showSelectedPackage = false;
    this.fetchRequiredData().then(() => {
      // ignore
    }).catch((e) => {
      console.log(e);
      this.popup.error(MSG_UNEXPECTED_ERROR_REFRESH_PAGE);
    })
  }


  ngOnDestroy(): void {
    try {
      this.packagesSub.unsubscribe();
      this.sessionTypeSub.unsubscribe();
    } catch (e) {
    }
  }
  ////////////////////////////////////////////////
  ///////// [END OF] LIFECYCLE METHODS //////////
  ///////////////////////////////////////////////

  private async fetchRequiredData(): Promise<void> {
    // session-types
    this.sessionTypes = await firstValueFrom(this.sessionTypeService.getAll());
    // packages
    this.packages = await firstValueFrom(this.service.getAll());
  }

  // METHODS TRIGGERED FROM ParentPackagesComponent
  onParentPackagesUpdated($event) {
    this.parentPackages = $event;
  }

  onParentPackageDeleted($event: ParentPackageModel) {
    this.packages = this.packages?.map((p) => {
      if(p.parentPackageId == $event.uid) {
        p.parentPackageId = null;
        p.active = false;
      }
      return p;
    })
  }
   // [END OF] METHODS TRIGGERED FROM ParentPackagesComponent

  toggleEditPackage(selectedPackage: PackageModel): void {
    if (!selectedPackage.isInEditMode) {
      selectedPackage.isInEditMode = true;
      this.selectedPackageCopy = Object.assign({}, this.selectedPackage);
      this.selectedPackageCopy.eligibleSessionTypes = [...this.selectedPackage.eligibleSessionTypes];
      return;
    }

    this.selectedPackage = Object.assign({}, this.selectedPackageCopy);
    this.selectedPackage.eligibleSessionTypes = [...this.selectedPackageCopy.eligibleSessionTypes];
    this.selectedPackageCopy = null;
    this.selectedPackage.isInEditMode = false;
    return;

  }

  async updatePackage(selectedPackage: PackageModel): Promise<void> {
    if (!this.isPackageValid(selectedPackage)) {
      return;
    }
    selectedPackage.isInEditMode = false;
    selectedPackage.canExpire = selectedPackage.daysToExpire !== 0;
    selectedPackage.description = this.createAutomatedDescription(selectedPackage);
    try {
      const pkg = Object.assign({}, selectedPackage);
      await this.parentPackagesService.findChildAndRemove(pkg.uid);
      setTimeout(async () => {
        const parentPackage = this.parentPackages.find(p => p.uid === pkg.parentPackageId);
        delete pkg.isInEditMode;
        await this.service.update([selectedPackage]);
        if (!parentPackage.children) {
          parentPackage.children = [selectedPackage.uid]
        } else {
          parentPackage.children.push(selectedPackage.uid);
        }
        await this.parentPackagesService.update([parentPackage]);
        this.popup.success(`Package ${selectedPackage.title} Updated!`);
        selectedPackage.isInEditMode = false;
      }, 1000);
    } catch (e) {
      console.log(e);
      this.popup.error(MSG_UNEXPECTED_ERROR);
    }
  }



  ////////////////////////////
  // CREATE PACKAGE FLOW ////
  //////////////////////////

  initNewPackage(): void {
    this.newPackage = {
      active: true, description: '', price: 0, title: '',
      daysToExpire: 0,
      canExpire: false,
      eligibleSessionTypes: []
    };
  }
  async createPackage(): Promise<void> {
    if (!this.isPackageValid(this.newPackage)) {
      return;
    }
    this.loadingVisible = true;
    const parentPackage = this.parentPackages.find(p => p.uid === this.newPackage.parentPackageId);
    this.newPackage.canExpire = this.newPackage.daysToExpire !== 0;
    this.newPackage.description = this.createAutomatedDescription(this.newPackage);
    try {
      const pkg = Object.assign({}, this.newPackage);
      delete pkg.isInEditMode;
      const inserted = await this.service.create([pkg]);
      this.packages.push(inserted[0]);
      const parentUpdated = await this.parentPackagesService.addPackageChild(parentPackage.uid, inserted[0].uid);
      if(!parentUpdated) {
        this.popup.error(MSG_FAILED_TO_UPDATE_PARENT_PACKAGE);
        this.loadingVisible = false;
        return;
      }
      this.parentPackagesComponent?.updateOneParentById(parentPackage.uid)
      this.newPackage = null;
      this.loadingVisible = false;
    } catch (e) {
      console.log(e);
      this.loadingVisible = false;
      this.popup.error(MSG_UNEXPECTED_ERROR);
    }
  }


  //////////////////////////
  // VALIDATE A PACKAGE ////
  /////////////////////////
  private isPackageValid(pkg: PackageModel): boolean {
    if (pkg.title === '' || pkg.title.length < 4) {
      this.popup.error(`Package must have a title with minimum characters of 4`);
      return false;
    }
    if (pkg.price <= 0) {
      this.popup.error(`Price for package must be greater than 0`);
      return false;
    }
    pkg.daysToExpire = +pkg.daysToExpire;
    if (pkg.daysToExpire < 0) {
      this.popup.error(`Days to expire must be 0 or greater`);
      return false;
    }
    for (let i = 0; i < pkg.eligibleSessionTypes.length; i++) {
      if (pkg.eligibleSessionTypes[i].maxUsages <= 0) {
        this.popup.error(`Eligible session type at position ${i + 1}: 'Max Usages' must be greater than 0`);
        return false;
      }
      if (pkg.eligibleSessionTypes[i].sessionTypeId === '') {
        this.popup.error(`Please choose a session type at position ${i + 1}`);
        return false;
      }
    }
    if (pkg.parentPackageId === '' || !this.parentPackages.find(p => p.uid === pkg.parentPackageId)) {
      this.popup.error('Parent package not found! Orphan packages are now allowed');
      return false;
    }
    return true;
  }


  //////////////////////////////////////////
  // PACKAGE AUTO-GENERATED DESCRIPTION ///
  ////////////////////////////////////////
  private createAutomatedDescription(pckg: PackageModel): string {
    let str = 'Allows the subscription of: \n';
    for (const eligible of pckg.eligibleSessionTypes) {
      const sessionType = this.sessionTypes.find(s => s.uid === eligible.sessionTypeId);
      str += `* **${sessionType.title}** Session, for **${eligible.maxUsages}** times \n`;
    }
    str += '\n\n';
    if (pckg.canExpire) {
      str += `**This package expires after ${pckg.daysToExpire} days of purchase**`;
    } else {
      str += `**This package does not expire**`;
    }
    return str;
  }

}
