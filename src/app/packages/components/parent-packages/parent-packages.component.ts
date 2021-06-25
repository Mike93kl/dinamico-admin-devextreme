import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { ParentPackageModel } from 'src/app/models/ParentPackageModel';
import { PopupService } from 'src/app/services/popup.service';
import {ParentPackagesService} from '../../../services/parent-packages.service'
import {UNEXPECTED_ERROR} from '../../../utils/ui_messages';
import {DxTreeViewComponent} from 'devextreme-angular'



interface TreeItem {
  id: string | null;
  text: string;
  expanded?: boolean;
  items?: TreeItem[]
  act?: boolean;
}

@Component({
  selector: 'app-parent-packages',
  templateUrl: './parent-packages.component.html',
  styleUrls: ['./parent-packages.component.css']
})
export class ParentPackagesComponent implements OnInit, OnDestroy {

  @ViewChild(DxTreeViewComponent, { static: false }) treeView: DxTreeViewComponent;
  parentPackages: ParentPackageModel[];
  tree: TreeItem[] = [{
    id: null,
    text: 'Root',
    expanded: true,
    items: []
  }]
  addingPackage = false;
  // subs
  parentPackagesSub: Subscription;
  constructor(private service: ParentPackagesService, private popup: PopupService,) { 
  }
  
  createPackage(title: string) {
    this.addingPackage = false;
    this.service.create([{
      title, children: []
    }]).then(result => {
      this.popup.success('Parent Package Created')
    }).catch(e => {
      console.log(e);
      this.popup.error(UNEXPECTED_ERROR);
    })
  }

  
  ngOnInit(): void {
    console.log(!this.treeView ? 'null' : 'not-null')
    this.parentPackagesSub = this.service.getAll().subscribe(result => {
      this.parentPackages = result;
      console.log('parent pkgs', this.parentPackages)
      this.setUpTree();
    }, err => {
      console.log(err);
      this.popup.error(UNEXPECTED_ERROR + ' Try to Refresh the Page')
    });

  }

  ngOnDestroy(): void {
    if(this.parentPackagesSub) {
      this.parentPackagesSub.unsubscribe();
    }
  }

  private async setUpTree() {
    this.tree[0].items = []
    const items = [];
    try{
      for(const p of this.parentPackages) {

      items.push({
          id: p.uid,
          expanded: false,
          text: p.title,
          items: p.children.length == 0 ? null : (await this.service.childrenOfParent(p.children)).map(i => {
            return {
              id: i.uid,
              text: i.title,
              act: i.active
            }
          })
        })
      }
      this.tree[0].items = items;
    }catch(e) {
      console.log(e);
      this.popup.error(UNEXPECTED_ERROR)
    }
  }

}
