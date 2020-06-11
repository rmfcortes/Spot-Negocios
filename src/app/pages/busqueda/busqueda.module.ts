import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BusquedaPageRoutingModule } from './busqueda-routing.module';

import { BusquedaPage } from './busqueda.page';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    BusquedaPageRoutingModule
  ],
  declarations: [BusquedaPage]
})
export class BusquedaPageModule {}
