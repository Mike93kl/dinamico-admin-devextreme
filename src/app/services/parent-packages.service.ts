import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { ParentPackageModel } from '../models/ParentPackageModel';
import {FirebaseService} from './FirebaseService';
import {PACKAGES, PARENT_PACKAGES} from '../utils/Collections'
import { PackageModel } from '../models/PackageModel';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import {arrayUnion, arrayRemove} from 'firebase/firestore'

@Injectable({
  providedIn: 'root'
})
export class ParentPackagesService extends FirebaseService<ParentPackageModel> {

  constructor(fs: AngularFirestore) {
    super(fs, PARENT_PACKAGES)
  }

  async create(pkgs: ParentPackageModel[]): Promise<ParentPackageModel[]> {
    // check that title does not exist
    const pkgsToCreate = [];
    for(const p of pkgs) {
      const dup = await this.fs.collection(PARENT_PACKAGES, ref => ref.where('title', '==', p.title)).get().toPromise();
      if(dup.docs.length == 0) {
        pkgsToCreate.push(p);
      }
    }
    return super.create(pkgsToCreate);
  }

  async childrenOfParent(children: string[]): Promise<PackageModel[]> {
    const result = await this.fs.collection(PACKAGES, ref => {
      return ref.where('uid', 'in', children);
    }).get().toPromise();
    const pkgs = [];
    result.docs.forEach(d => {
      pkgs.push(d.data());
    })
    return pkgs;
  }

  async findChildAndRemove(packageId: string): Promise<Boolean> {
    const result = await this.fs.collection(PARENT_PACKAGES, ref => ref.where('children','array-contains', packageId)).get().toPromise();
    for(const doc of result.docs) {
      const data = doc.data() as ParentPackageModel;
      data.children = data.children.reduce((r, c, p) => {
        if(c !== packageId) {
          r.push(c);
        }
        return r;
      }, []);
      await this.update([data]);
    }
    return true;
  }

  async removeByIds(packagesUIDs: string[]): Promise<boolean> {
    for(const uid of packagesUIDs) {
      const packagesDocs = await firstValueFrom(this.fs.collection(PACKAGES, ref => {
        return ref.where('parentPackageId', '==', uid)
      }).get());

      packagesDocs.docs.forEach(async (d) => {
        const pkg = d.data() as PackageModel;
        await this.fs.collection(PACKAGES).doc(pkg.uid)
          .update({parentPackageId: null, active: false});
      })

    }
    return super.removeByIds(packagesUIDs);
  }


  addPackageChild(parentPackageUID: string, packageUID: string): Promise<boolean> {
    return this.fs.collection(PARENT_PACKAGES).doc(parentPackageUID)
      .update({children: arrayUnion(packageUID)}).then(() => true)
      .catch((e) => {
        console.log(e);
        return false;
      })
  }


  removeChild(parentPackageId: string, packageUID: string): Promise<boolean> {
    return this.fs.collection(PARENT_PACKAGES).doc(parentPackageId)
      .update({children: arrayRemove(packageUID)}).then(() => true)
      .catch((e) => {
        console.log(e);
        return false;
      });
  }
}
