import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PasillosPageRoutingModule } from './pasillos-routing.module';

import { PasillosPage } from './pasillos.page';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    PasillosPageRoutingModule
  ],
  declarations: [PasillosPage]
})
export class PasillosPageModule {}
