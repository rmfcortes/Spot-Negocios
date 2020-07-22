import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RatesPageRoutingModule } from './rates-routing.module';

import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsMX from '@angular/common/locales/es-MX';
registerLocaleData(localeEsMX, 'es-MX');

import { RatesPage } from './rates.page';
import { SharedModule } from 'src/app/shared/shared.module';
import { ComentariosPageModule } from 'src/app/modals/comentarios/comentarios.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    ComentariosPageModule,
    RatesPageRoutingModule
  ],
  declarations: [RatesPage],
  providers: [{provide: LOCALE_ID, useValue: "es-MX"}]
})
export class RatesPageModule {}
