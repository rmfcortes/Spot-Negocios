import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PasillosPage } from './pasillos.page';

const routes: Routes = [
  {
    path: '',
    component: PasillosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PasillosPageRoutingModule {}
