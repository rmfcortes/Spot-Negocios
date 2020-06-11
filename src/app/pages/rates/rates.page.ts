import { Component, OnInit } from '@angular/core';
import { ModalController, Platform, MenuController } from '@ionic/angular';

import { ComentariosPage } from 'src/app/modals/comentarios/comentarios.page';

import { RatesService } from 'src/app/services/rates.service';
import { AlertService } from 'src/app/services/alert.service';

import { RepartidorPreview } from 'src/app/interfaces/repartidor';
import { Rate, PerfilNegRate } from 'src/app/interfaces/rate';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-rates',
  templateUrl: './rates.page.html',
  styleUrls: ['./rates.page.scss'],
})
export class RatesPage implements OnInit {

  rate: Rate;
  perfilNegocio: PerfilNegRate;
  repartidores: RepartidorPreview[] = [];

  rateNegReady = false;
  rateRepReady = false;

  comentarios = [];

  noMore = false;
  batch = 15;
  lastKey = '';

  tipo = '';
  id = '';

  comentariosReady = false;

  negSel = false;
  iSel: number;

  loadingComentarios = false;

  back: Subscription;

  constructor(
    private platform: Platform,
    private menu: MenuController,
    private modalCtrl: ModalController,
    private alertService: AlertService,
    private rateService: RatesService,
  ) { }

  ngOnInit() {
    this.getPerfil();
    this.getRateRepartidores();
    this.menu.enable(true)
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      return;
    });
  }

  getPerfil() {
    this.rateService.getNegPerfil().then(perfil => {
      this.perfilNegocio = perfil;
      this.getNegRate();
    });
  }

  getNegRate() {
    this.rateService.getNegRate().then(rate => {
      this.rate = rate;
      this.rateNegReady = true;
    });
  }

  getRateRepartidores() {
    this.rateService.getRepartidoresRate().then(perfil => {
      this.repartidores = perfil;
      this.rateRepReady = true;
    });
  }

  async verCalificaciones(id, tipo, calificaciones, nombre) {
    if (tipo === 'negocio' && calificaciones === 5) {
      this.alertService.presentAlert('Sin reseñas', `${nombre} aún no ha recibido su primer reseña`);
      return;
    }
    if (tipo === 'repartidor' && calificaciones === 1) {
      this.alertService.presentAlert('Sin reseñas', `${nombre} aún no ha recibido su primer reseña`);
      return;
    }
    const modal = await this.modalCtrl.create({
      component: ComentariosPage,
      componentProps: { id, tipo }
    });

    return await modal.present();
  }

  ///////////////////////
  // Escritorio

  setDatos(id: string, tipo: string, calificaciones: number, nombre: string, i: number) {
    this.comentarios = [];
    this.negSel = false;
    this.iSel = null;
    if (tipo === 'negocio' && calificaciones === 5) {
      this.alertService.presentAlert('Sin reseñas', `${nombre} aún no ha recibido su primer reseña`);
      return;
    }
    if (tipo === 'repartidor' && calificaciones === 1) {
      this.alertService.presentAlert('Sin reseñas', `${nombre} aún no ha recibido su primer reseña`);
      return;
    }
    this.loadingComentarios = true;
    this.tipo = tipo;
    this.id = id;
    this.iSel = i;
    this.getComentarios();
  }

  async getComentarios(event?) {
    let comentarios;
    if (this.tipo === 'negocio') {
      comentarios = await this.rateService.getComentarioNegocio(this.batch + 1, this.lastKey);
      this.negSel = true;
    } else {
      comentarios = await this.rateService.getComentarioRepartidor(this.id, this.batch + 1, this.lastKey);
      this.negSel = false;
    }
    this.lastKey = comentarios[0].id || null;
    if (comentarios.length === this.batch + 1) {
      comentarios.shift();
    } else {
      this.noMore = true;
    }
    this.comentarios = this.comentarios.concat(comentarios.reverse());
    if (event) { event.target.complete(); }
    this.comentariosReady = true;
    this.loadingComentarios = false;
  }

  loadComentarios(event) {
    if (this.noMore) {
      event.target.disabled = true;
      event.target.complete();
      return;
    }
    this.getComentarios(event);

    if (this.noMore) {
      event.target.disabled = true;
    }
  }

  ionViewWillLeave() {
    if (this.back) {this.back.unsubscribe()}
  }

}
