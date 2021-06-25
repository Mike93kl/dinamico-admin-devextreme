import {Component, OnDestroy, OnInit} from '@angular/core';
import {PackageModel} from '../../../models/PackageModel';
import {PackagesService} from '../../../services/packages.service';
import {PopupService} from '../../../services/popup.service';
import {SessionTypeService} from '../../../services/session-type.service';
import {SessionTypeModel} from '../../../models/SessionTypeModel';
import {Subscription} from 'rxjs';
import {UNEXPECTED_ERROR} from '../../../utils/ui_messages';
import { ParentPackagesService } from 'src/app/services/parent-packages.service';
import { ParentPackageModel } from 'src/app/models/ParentPackageModel';

@Component({
  selector: 'app-packages',
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.css']
})
export class PackagesComponent implements OnInit, OnDestroy {
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

  ngOnInit(): void {
    this.showSelectedPackage = false;
    this.sessionTypeSub = this.sessionTypeService.getAll().subscribe(types => {
      this.sessionTypes = types;
      this.fetchPackages();
    }, error => {
      console.log(error);
      this.popup.error(UNEXPECTED_ERROR + ` Try to refresh the page`);
    });
    this.parentPackageSub = this.parentPackagesService.getAll().subscribe(res => {
        this.parentPackages = res;
    }, err => {
      console.log(err);
      this.popup.error('Could not fetch parent packages! Please refresh the page.' 
      + ' If problem persists please contact support');
    })
  }

  private fetchPackages(): void {
    this.packagesSub = this.service.getAll().subscribe(ps => {
      this.packages = ps;
      console.log(this.packages);
    }, error => {
      console.log(error);
      this.popup.error(UNEXPECTED_ERROR + ` Try to refresh the page`);
    });
  }

  ngOnDestroy(): void {
    try {
      this.packagesSub.unsubscribe();
      this.sessionTypeSub.unsubscribe();
    } catch (e) {
    }
  }

  initNewPackage(): void {
    this.newPackage = {
      active: true, description: '', price: 0, title: '',
      daysToExpire: 0,
      canExpire: false,
      eligibleSessionTypes: []
    };
  }

  selectPackage(data: PackageModel): void {
    this.selectedPackage = data;
    this.showSelectedPackage = true;
  }

  async createPackage(): Promise<void> {
    if (!this.isPackageValid(this.newPackage)) {
      return;
    }
  
    const parentPackage = this.parentPackages.find(p => p.uid === this.newPackage.parentPackageId);
    this.newPackage.canExpire = this.newPackage.daysToExpire !== 0;
    this.newPackage.description = this.createAutomatedDescription(this.newPackage);
    try {
      const pkg = Object.assign({}, this.newPackage);
      delete pkg.isInEditMode;
      const inserted = await this.service.create([pkg]);
      parentPackage.children.push(inserted[0].uid);
      await this.parentPackagesService.update([parentPackage]);
      this.popup.success(`Package ${this.newPackage.title} created!`);
      this.newPackage = null;
    } catch (e) {
      console.log(e);
      this.popup.error(UNEXPECTED_ERROR);
    }
  }

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
    if ( pkg.daysToExpire < 0) {
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
    if(pkg.parentPackageId === '' || !this.parentPackages.find(p => p.uid === pkg.parentPackageId)) {
      this.popup.error('Parent package not found! Orphan packages are now allowed');
      return false;
    }
    return true;
  }

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
        if(!parentPackage.children) {
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
      this.popup.error(UNEXPECTED_ERROR);
    }
  }
}
