import { Component, OnInit, OnDestroy } from '@angular/core';
import { PopupService } from 'src/app/services/popup.service';
import { SessionServiceV1 } from 'src/app/services/session.service-v1';
import { PaymentsService } from 'src/app/services/payments.service';
import { PackagesService } from 'src/app/services/packages.service';
import { SessionModelV1 } from 'src/app/models/SessionModelV1';
import { ClientPackageModelV1 } from 'src/app/models/ClientPackageModelV1';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  timeInterval: any | undefined;
  currSessionInterval: any | undefined;
  currDate: Date = new Date();

  todaysSessions: SessionModelV1[] = [];
  unpaidPackages: ClientPackageModelV1[] = [];

  currSessions: SessionModelV1[] = [];

  subscriptions: Subscription[] = [];

  packagesSumValue = 0;
  packagesDueValue = 0;

  constructor(private popup: PopupService, private sessionService: SessionServiceV1,
    private paymentsService: PaymentsService, private packageService: PackagesService) {
  }

  ngOnInit(): void {

    this.timeInterval = setInterval(() => {
      this.currDate = new Date();
    }, 1000);


    this.currSessionInterval = setInterval(() => {
      const now = new Date().getTime();
      const curr = [];
      for (let i = 0; i < this.todaysSessions.length; i++) {
        const s = this.todaysSessions[i];
        if (now >= s.startDate_ts && now <= s.endDate_ts) {
          curr.push(s);
        }
      }
     
      this.currSessions = curr
    }, 1000)

    const sessionSub = this.sessionService.getTodaysSessions().subscribe({
      next: sessions => {
        this.todaysSessions = sessions;
      },
      error: err => {
        console.log(err);
        this.todaysSessions = null;
      }
    })


    const packagesSub = this.packageService.getUnPaidClientPackages().subscribe({
      next: pkgs => {
        this.unpaidPackages = pkgs;

        for(const u of this.unpaidPackages) {

          this.packagesSumValue += u._package.price
          const totalPayments = u.payments.reduce((r,c) => {
            r+=c.payment;
            return r;
          }, 0)
          this.packagesDueValue += (u._package.price - totalPayments);

        }

      },
      error: err => {
        console.log(err);
        this.unpaidPackages = null
      }
    })

    this.subscriptions.push(sessionSub, packagesSub);
  }


  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }

    this.subscriptions.forEach((s) => {
      s.unsubscribe();
    })
  }




}
