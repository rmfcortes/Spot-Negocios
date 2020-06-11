import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RatesPageRoutingModule } from './rates-routing.module';

import { RatesPage } from './rates.page';
import { StarsComponent } from 'src/app/components/stars/stars.component';
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
  declarations: [RatesPage]
})
export class RatesPageModule {}
