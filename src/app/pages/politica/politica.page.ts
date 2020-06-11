import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Platform, MenuController } from '@ionic/angular';

@Component({
  selector: 'app-politica',
  templateUrl: './politica.page.html',
  styleUrls: ['./politica.page.scss'],
})
export class PoliticaPage implements OnInit {

  back: Subscription;

  constructor(
    private menu: MenuController,
    private platform: Platform,
  ) { }

  ngOnInit() {
    this.menu.enable(false)
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      const nombre = 'app';
      navigator[nombre].exitApp();
    });
  }

  ionViewWillLeave() {
    if (this.back) {this.back.unsubscribe()}
  }

}
