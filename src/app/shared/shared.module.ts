import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { PreloadImageComponent } from '../components/pre-load-image/pre-load-image.component';
import { StarsComponent } from '../components/stars/stars.component';
import { NoNetworkComponent } from '../components/no-network/no-network.component';
import { TripSelectedComponent } from '../components/trip-selected/trip-selected.component';


@NgModule({
    imports: [
      CommonModule,
      IonicModule,
    ],
    declarations: [
      StarsComponent,
      NoNetworkComponent,
      PreloadImageComponent,
      TripSelectedComponent
    ],
    exports: [
      StarsComponent,
      NoNetworkComponent,
      PreloadImageComponent,
      TripSelectedComponent
    ]
  })

  export class SharedModule {}
