import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RepartidorPage } from './repartidor.page';
import { CropImagePageModule } from '../crop-image/crop-image.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CropImagePageModule,
  ],
  declarations: [RepartidorPage],
  entryComponents: [RepartidorPage]
})
export class RepartidorPageModule {}
