import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AgmCoreModule } from '@agm/core';

import { PerfilPageRoutingModule } from './perfil-routing.module';
import { CropImagePageModule } from 'src/app/modals/crop-image/crop-image.module';

import { PerfilPage } from './perfil.page';

import { environment } from 'src/environments/environment';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    CropImagePageModule,
    PerfilPageRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: environment.mapsApiKey,
      libraries: ['places']
    }),
  ],
  declarations: [PerfilPage]
})
export class PerfilPageModule {}
