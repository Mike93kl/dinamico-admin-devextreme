import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FunctionService} from '../../services/function.service';

@Component({
  selector: 'app-side-nav',
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.css']
})
export class SideNavComponent implements OnInit {
  navigation: any[] = [
  
    {id: 0, text: 'Dashboard', icon: 'fields', path: ''},
    {id: 1, text: 'Posts', icon: 'comment', path: 'newsfeed'},
    {id: 2, text: 'Clients', icon: 'card', path: 'clients'},
    {id: 4, text: 'Appointments', icon: 'rowproperties', path: 'appointments'},
    {id: 5, text: 'Packages', icon: 'box', path: 'packages'}
  ];
  isDrawerOpen = false;
  buttonOptions: any = {
    icon: 'menu',
    onClick: () => {
      this.isDrawerOpen = !this.isDrawerOpen;
    }
  };


  constructor(private route: Router, private fn: FunctionService) {
  }

  ngOnInit(): void {
  }

  nav(link: string): void {
    this.route.navigate(['/' + link]);
  }

  height(): number {
    return window.innerHeight * 10;
  }

}
