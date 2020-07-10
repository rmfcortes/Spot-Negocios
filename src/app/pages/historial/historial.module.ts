import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgControl } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistorialPageRoutingModule } from './historial-routing.module';

import { HistorialPage } from './historial.page';
import { PedidoPageModule } from 'src/app/modals/pedido/pedido.module';
import { SharedModule } from 'src/app/shared/shared.module';

import { Ionic4DatepickerModule } from '@logisticinfotech/ionic4-datepicker';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    PedidoPageModule,
    Ionic4DatepickerModule,
    HistorialPageRoutingModule
  ],
  declarations: [HistorialPage]
})
export class HistorialPageModule {}
