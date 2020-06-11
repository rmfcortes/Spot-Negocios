import { Component, OnInit } from '@angular/core';

import { NetworkService } from 'src/app/services/network.service';

@Component({
  selector: 'app-no-network',
  templateUrl: './no-network.component.html',
  styleUrls: ['./no-network.component.scss'],
})
export class NoNetworkComponent implements OnInit {

  network = true;

  constructor(
    private netService: NetworkService,
  ) { }

  ngOnInit() {
    this.listenNet();
  }

  listenNet() {
    this.netService.isConnected.subscribe(resp => {
      if (resp) {
        this.network = true;
      } else {
        this.network = false;
      }
    });
  }

}
