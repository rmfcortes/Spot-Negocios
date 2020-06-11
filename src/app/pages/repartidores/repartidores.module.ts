import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RepartidoresPageRoutingModule } from './repartidores-routing.module';

import { RepartidoresPage } from './repartidores.page';
import { RepartidorPageModule } from 'src/app/modals/repartidor/repartidor.module';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    RepartidorPageModule,
    RepartidoresPageRoutingModule
  ],
  declarations: [RepartidoresPage]
})
export class RepartidoresPageModule {}
