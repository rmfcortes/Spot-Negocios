import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PedidoPage } from './pedido.page';

import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsMX from '@angular/common/locales/es-MX';
registerLocaleData(localeEsMX, 'es-MX');

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
  ],
  declarations: [PedidoPage],
  providers: [DatePipe, {provide: LOCALE_ID, useValue: "es-MX"}],
  entryComponents: [PedidoPage]
})
export class PedidoPageModule {}
