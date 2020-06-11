import { Component, OnInit } from '@angular/core';
import { Platform, MenuController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { PasilloService } from 'src/app/services/pasillo.service';
import { AlertService } from 'src/app/services/alert.service';

import { Pasillo } from 'src/app/interfaces/pasillo';

@Component({
  selector: 'app-pasillos',
  templateUrl: './pasillos.page.html',
  styleUrls: ['./pasillos.page.scss'],
})
export class PasillosPage implements OnInit {

  categoria: string;
  pasillos: Pasillo[] = [];

  pasillosReady = false;

  back: Subscription;

  constructor(
    private platform: Platform,
    private menu: MenuController,
    private pasilloService: PasilloService,
    private alertService: AlertService,
  ) { }

  ngOnInit() {
    this.menu.enable(true)
  }

  ionViewWillEnter() {
   this.getCategoria();
   this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
     return;
   });
  }

  getCategoria() {
    this.pasilloService.getCategoria().then((categoria: string) => {
      if (!categoria) {
        this.pasillosReady = true
        return
      }
      this.categoria = categoria
      this.getPasillos()
    });
  }

  getPasillos() {
    this.pasilloService.getPasillos(this.categoria).then((pasillos: Pasillo[]) => {
      this.pasillos = pasillos
      this.pasillosReady = true
    });
  }

  async addPasillo() {
    if (!this.categoria) {
      this.alertService.presentAlert('Completa tu perfil',
        'Antes de agregar productos o servicios completa tu perfil. Es muy importante');
      return;
    }
    this.alertService.presentAlertPrompt('Nuevo departamento', 'Ej. Botanas, Bebidas')
      .then((nombre: string) => {
        const pasillo: Pasillo = {
          nombre,
          prioridad: 0
        };
        this.pasillos.unshift(pasillo);
        this.pasillos.forEach((p, i) => {
          p.prioridad = i + 1;
        });
        this.pasilloService.updatePasillos(this.categoria, this.pasillos);
      });
  }

  doReorder(event) {
    const itemMove = this.pasillos.splice(event.detail.from, 1)[0];
    this.pasillos.splice(event.detail.to, 0, itemMove);
    this.pasillos.forEach((p, i) => {
      p.prioridad = i + 1;
    });
    this.pasilloService.updatePasillos(this.categoria, this.pasillos);
    event.detail.complete();
  }

  editPasillo(i, name) {
    this.alertService.presentAlertPrompt(`Edita ${name}`, 'Ej. Botanas, Bebidas')
      .then((nombre: string) => {
        if (name === nombre) {
          return;
        }
        this.pasillos[i].nombre = nombre;
        this.pasilloService.editPasillo(this.categoria, i, name, nombre);
      });
  }

  async deletePasillo(i, nombre) {
    const resp = await this.alertService.presentAlertAction('Eliminar departamento',
     `¿Estás segura(o) de eliminar ${nombre}? se borrarán también todos los productos ` +
     'pertenecientes a este departamento. Esta acción es irreversible.');
    if (resp) {
      this.pasillos.splice(i, 1);
      this.pasilloService.updatePasillos(this.categoria, this.pasillos);
      this.pasilloService.deletePasillo(this.categoria, nombre);
      this.pasillos.forEach((p, i) => {
        p.prioridad = i + 1;
      });
    }
  }

  ionViewWillLeave() {
    if (this.back) {this.back.unsubscribe()}
  }


}
