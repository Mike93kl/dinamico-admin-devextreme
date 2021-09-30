import {Component, OnDestroy, OnInit, ViewChild, AfterViewInit, Output, EventEmitter} from '@angular/core';
import {debounceTime, firstValueFrom, Subscription, take} from 'rxjs';
import {ParentPackageModel} from 'src/app/models/ParentPackageModel';
import {PopupService} from 'src/app/services/popup.service';
import {ParentPackagesService} from '../../../services/parent-packages.service'
import {
  MSG_DELETE_PARENT_PACKAGE,
  MSG_FAILED_TO_DELETE_PACKAGE,
  MSG_PPC_EMPTY_TITLE_NOT_ALLOWED,
  MSG_UNEXPECTED_ERROR,
  MSG_UNEXPECTED_ERROR_REFRESH_PAGE
} from '../../../utils/ui_messages';
import {DxTreeViewComponent} from 'devextreme-angular'


interface TreeItem {
  id: string | null;
  text: string;
  expanded?: boolean;
  items?: TreeItem[]
  act?: boolean;
  editable: boolean;
}

@Component({
  selector: 'app-parent-packages',
  templateUrl: './parent-packages.component.html',
  styleUrls: ['./parent-packages.component.css']
})
export class ParentPackagesComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild(DxTreeViewComponent, {static: false}) treeView: DxTreeViewComponent | undefined;
  // outputs -> parent packages to the PackagesComponent
  @Output() onPackagesUpdated: EventEmitter<ParentPackageModel[]> = new EventEmitter<ParentPackageModel[]>();
  @Output() onParentPackageDeleted: EventEmitter<ParentPackageModel> = new EventEmitter<ParentPackageModel>();

  parentPackages: ParentPackageModel[];
  tree: TreeItem[] = [{
    id: null,
    text: 'root',
    expanded: true,
    items: [],
    editable: false
  }]
  updateTreeItem: TreeItem | undefined;
  updateTreeItemCopy: {
    uid: string;
    title: string;
    updated: boolean;
    index: number;
  };
  addingPackage = false;
  loadingVisible = false;
  // subs
  parentPackagesSub: Subscription | undefined;

  constructor(private service: ParentPackagesService, private popup: PopupService,) {
  }

  // Lifecycle
  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.getAllParentPackages();
  }

  ngOnDestroy(): void {
    this.parentPackagesSub?.unsubscribe();
  }

  // Methods


  createPackage(title: string) {
    title = title.trim();
    if (title == '') {
      this.popup.error(MSG_PPC_EMPTY_TITLE_NOT_ALLOWED)
      return;
    }
    this.loadingVisible = true;
    this.addingPackage = false;
    this.service.create([{
      title, children: []
    }]).then(async pkg => {
      // add package to tree-view
      this.parentPackages.push(pkg[0]);
      this.onPackagesUpdated.emit(this.parentPackages);
      this.tree[0].items.push({
        id: pkg[0].uid,
        text: pkg[0].title,
        editable: true,
        expanded: false
      })
      await this.treeView?.instance.getDataSource().load();
      this.loadingVisible = false;
    }).catch(e => {
      this.loadingVisible = false;
      console.log(e);
      this.popup.error(MSG_UNEXPECTED_ERROR);
    })
  }


  private getAllParentPackages(): void {
    this.service.getAll().pipe(take(1)).subscribe(packages => {
      this.parentPackages = packages;
      this.onPackagesUpdated.emit(this.parentPackages);
      this.setUpTree(packages);
    }, error => {
      console.log(error);
      this.popup.error(MSG_UNEXPECTED_ERROR_REFRESH_PAGE);
    });
  }

  private async setUpTree(packages: ParentPackageModel[]): Promise<void> {
    for (const p of packages) {
      const pPackage: TreeItem = {
        id: p.uid,
        expanded: false,
        text: p.title,
        editable: true,
        items: []
      }

      if (p.children && p.children.length > 0) {
        pPackage.items = (await this.service.childrenOfParent(p.children))
          .map((c) => {
            return {
              id: c.uid,
              text: c.title,
              act: c.active,
              editable: false
            }
          })
      }
      this.tree[0].items.push(pPackage);
    }
    await this.treeView?.instance.getDataSource().load();
  }


  ////////////////////////////////
  // UPDATE PARENT PACKAGE FLOW //
  ////////////////////////////////

  openUpdatePopup(p: TreeItem, index: number) {
    this.updateTreeItemCopy = {
      uid: p.id,
      title: p.text,
      updated: false, index
    }
    this.updateTreeItem = p;
  }

  async update(): Promise<void> {
    if (!this.updateTreeItemCopy) return;
    const ppackage = this.parentPackages.find(p => p.uid == this.updateTreeItem.id);
    if (!ppackage) return;
    this.loadingVisible = true;
    this.service.update([{uid: this.updateTreeItem.id, title: this.updateTreeItem.text}])
      .then(() => {
        this.updateTreeItemCopy.updated = true
        ppackage.title = this.updateTreeItem.text;
        this.onPackagesUpdated.emit(this.parentPackages);
      })
      .catch((e) => {
        console.log(e);
        this.popup.error(MSG_UNEXPECTED_ERROR)
        this.updateTreeItemCopy.updated = false;
      }).finally(() => {
      this.loadingVisible = false;
      this.updateTreeItem = undefined;
    })
  }

  onUpdatePopupHidden($e) {
    if (!this.updateTreeItemCopy) return;
    if (!this.updateTreeItemCopy.updated) {
      this.tree[0].items[this.updateTreeItemCopy.index].text = this.updateTreeItemCopy.title;
      this.treeView.instance.getDataSource().load();
    }

    this.updateTreeItemCopy = undefined;
  }


  ////////////////////////////////
  //        DELETE FLOW        //
  ////////////////////////////////
  deleteParentPackage() {
    const uid = this.updateTreeItem.id;
    this.popup.confirm(MSG_DELETE_PARENT_PACKAGE, async (confirmed) => {
      if (!confirmed) return;
      this.loadingVisible = true;
      const deleted = await this.service.removeByIds([uid])
      if (deleted) {
        this.loadingVisible = false;
        const index = this.tree[0].items.findIndex(e => e.id == this.updateTreeItem.id);
        if (index == -1) return;
        this.updateTreeItem = undefined;
        this.updateTreeItemCopy = undefined;
        this.tree[0].items.splice(index, 1);
        await this.treeView?.instance.getDataSource().load();
        const pindex = this.parentPackages.findIndex(p => p.uid == uid);
        if (pindex == -1) return;
        const _ppackage = this.parentPackages.splice(pindex, 1);
        this.onParentPackageDeleted.emit(_ppackage[0]);
        this.onPackagesUpdated.emit(this.parentPackages);
        return;
      }

      this.popup.error(MSG_FAILED_TO_DELETE_PACKAGE);
    })
  }


  ////////////////////////////////////
  // Update ONE parent package ///////
  // called from PackagesComponent //
  //////////////////////////////////
  async updateChildrenOf(uid: string): Promise<void> {
    if (!this.tree[0].items) return;
    this.loadingVisible = true;
    const item = this.tree[0].items.find(p => p.id === uid);
    if (!item) return;
    const index = this.tree[0].items.indexOf(item);
    if (index === -1) return;
    const parentPackage = await firstValueFrom(this.service.getOne(uid));
    if (!parentPackage.children || parentPackage.children.length === 0) {
      this.tree[0].items[index].items = [];
      return;
    }

    this.tree[0].items[index].items = (await this.service.childrenOfParent(parentPackage.children))
      .map((c) => {
        return {
          id: c.uid,
          text: c.title,
          expanded: true,
          editable: false
        };
      });
    await this.treeView?.instance.getDataSource().load();
    this.loadingVisible = false;
  }
}
