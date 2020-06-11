import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProductoPage } from './producto.page';
import { CropImagePageModule } from '../crop-image/crop-image.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CropImagePageModule,
  ],
  declarations: [ProductoPage],
  entryComponents: [ProductoPage]
})
export class ProductoPageModule {}
