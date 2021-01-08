import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  title = 'getting-started-with-drawer';
  navigation: any[] = [
    {id: 0, text: 'Dashboard', icon: 'fields', path: ''},
    {id: 1, text: 'Clients', icon: 'card', path: 'clients'},
    {id: 2, text: 'Appointments', icon: 'rowproperties', path: 'appointments'},
    {id: 3, text: 'Packages', icon: 'box', path: 'packages'}
  ];
  isDrawerOpen = false;
  buttonOptions: any = {
    icon: 'menu',
    onClick: () => {
      this.isDrawerOpen = !this.isDrawerOpen;
    }
  };

  constructor() { }

  ngOnInit(): void {
  }

}
