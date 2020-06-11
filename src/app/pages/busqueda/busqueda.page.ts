import { Component, OnInit } from '@angular/core';
import { Platform, MenuController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { BusquedaService } from 'src/app/services/busqueda.service';
import { PerfilService } from 'src/app/services/perfil.service';
import { AlertService } from 'src/app/services/alert.service';

import { Perfil } from 'src/app/interfaces/perfil';

@Component({
  selector: 'app-busqueda',
  templateUrl: './busqueda.page.html',
  styleUrls: ['./busqueda.page.scss'],
})
export class BusquedaPage implements OnInit {

  palabrasClave: string;
  palabrasReady = false;
  hasProds = true;

  back: Subscription;

  constructor(
    private platform: Platform,
    private menu: MenuController,
    private busquedaService: BusquedaService,
    private perfilService: PerfilService,
    private alertService: AlertService,
  ) { }

  ngOnInit() {
    this.menu.enable(true)
   this.getPalabrasClave();
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      return;
    });
  }

  getPalabrasClave() {
    this.busquedaService.getPalabrasClave().then(async (claves) => {
      this.palabrasClave = claves;
      this.palabrasReady = true;
      if (!claves) {
        const prods: number = await this.perfilService.getProductos();
        if (!prods || prods === 0) {
          this.alertService.presentAlert('No tienes productos agregados', 'Antes de ingresar tus palabras clave de búsqueda '+ 
          'por favor agrega tu primer producto');
          this.hasProds = false;
        }
      }
    });
  }

  async updateClaves() {
    const perfil: Perfil = await this.perfilService.getPerfil();
    if (!perfil) {
      this.alertService.presentAlert('Completa tu perfil', 'Antes de ingresar las palabras claves de búsqueda ' +
      'de tu negocio, completa tu perfil');
      return;
    }
    this.busquedaService.updateClaves(this.palabrasClave);
    this.alertService.presentToast('Lista de búsqueda actualizada');
  }
  
  ionViewWillLeave() {
    if (this.back) {this.back.unsubscribe()}
  }

}
