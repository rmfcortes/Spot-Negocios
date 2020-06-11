import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NgxMasonryModule } from 'ngx-masonry';


import { ProductosPageRoutingModule } from './productos-routing.module';

import { ProductosPage } from './productos.page';
import { ProductoPageModule } from 'src/app/modals/producto/producto.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { BlockComponent } from './views/block/block.component';
import { CardsComponent } from './views/cards/cards.component';
import { GalleryComponent } from './views/gallery/gallery.component';
import { ListComponent } from './views/list/list.component';
import { ListImgComponent } from './views/list-img/list-img.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    NgxMasonryModule,
    ProductoPageModule,
    ProductosPageRoutingModule
  ],
  declarations: [
    ProductosPage,
    BlockComponent,
    CardsComponent,
    GalleryComponent,
    ListComponent,
    ListImgComponent,
  ]
})
export class ProductosPageModule {}
