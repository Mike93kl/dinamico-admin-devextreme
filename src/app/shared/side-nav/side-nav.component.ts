import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNavComponent implements OnInit {
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

  constructor(private route: Router) {
  }

  ngOnInit(): void {
    console.log('sidenav loaded');
  }

  nav(link: string): void {
    this.route.navigate(['/' + link]);
  }

}
