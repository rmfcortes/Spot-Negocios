import { ModalController, Platform, MenuController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { HostListener } from "@angular/core";
import { Subscription } from 'rxjs';

import { RatesService } from 'src/app/services/rates.service';
import { AlertService } from 'src/app/services/alert.service';

import { RepartidorPreview } from 'src/app/interfaces/repartidor';
import { Rate, PerfilNegRate } from 'src/app/interfaces/rate';
import { Pedido, CalificacionDetalles } from '../../interfaces/pedido';

@Component({
  selector: 'app-rates',
  templateUrl: './rates.page.html',
  styleUrls: ['./rates.page.scss'],
})
export class RatesPage implements OnInit {

  @HostListener('window:resize')
  getScreenSize() {
    this.scrHeight = window.innerHeight
    this.scrWidth = window.innerWidth
  }
  scrHeight: number
  scrWidth: number
  hideMainCol = false

  rate: Rate
  perfilNegocio: PerfilNegRate
  repartidores: RepartidorPreview[] = []

  rateNegReady = false
  rateRepReady = false

  comentarios = []

  noMore = false
  batch = 15
  lastKey = ''

  tipo = ''
  id = ''

  comentariosReady = false

  negSel = false
  iSel: number
  calSel: number

  nombreRepartidor = ''
  loadingComentarios = false

  back: Subscription

  pedido: Pedido

  constructor(
    private platform: Platform,
    private menu: MenuController,
    private modalCtrl: ModalController,
    private alertService: AlertService,
    private rateService: RatesService,
  ) { this.getScreenSize() }

  ngOnInit() {
    this.getPerfil()
    this.getRateRepartidores()
    this.menu.enable(true)
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      return
    })
  }

  getPerfil() {
    this.rateService.getNegPerfil().then(perfil => {
      this.perfilNegocio = perfil
      this.getNegRate()
    })
  }

  getNegRate() {
    this.rateService.getNegRate().then(rate => {
      this.rate = rate
      this.rateNegReady = true
    })
  }

  getRateRepartidores() {
    this.rateService.getRepartidoresRate().then(perfil => {
      this.repartidores = perfil
      this.rateRepReady = true
    })
  }

  regresa() {
    this.nombreRepartidor = ''
    this.hideMainCol = false
    this.comentarios = []
    this.negSel = false
    this.calSel = null
    this.pedido = null
    this.iSel = null
  }

  ///////////////////////
  // Escritorio

  setDatos(id: string, tipo: string, calificaciones: number, nombre: string, i: number) {
    this.comentarios = []
    this.calSel = null
    this.negSel = false
    this.pedido = null
    this.iSel = null
    if (tipo === 'negocio' && calificaciones === 5) {
      this.alertService.presentAlert('Sin reseñas', `${nombre} aún no ha recibido su primer reseña`)
      return
    }
    if (tipo === 'repartidor' && calificaciones === 1) {
      this.alertService.presentAlert('Sin reseñas', `${nombre} aún no ha recibido su primer reseña`)
      return
    }
    this.loadingComentarios = true
    this.tipo = tipo
    this.id = id
    this.iSel = i
    if (this.scrWidth < 992) this.hideMainCol = true
    this.nombreRepartidor = nombre
    this.getComentarios()
  }

  async getComentarios(event?) {
    let comentarios
    if (this.tipo === 'negocio') {
      comentarios = await this.rateService.getComentarioNegocio(this.batch + 1, this.lastKey)
      this.negSel = true
    } else {
      comentarios = await this.rateService.getComentarioRepartidor(this.id, this.batch + 1, this.lastKey)
      this.negSel = false
    }
    this.lastKey = comentarios[0].id || null
    if (comentarios.length === this.batch + 1) comentarios.shift()
    else this.noMore = true
    this.comentarios = this.comentarios.concat(comentarios.reverse())
    if (event) event.target.complete()
    this.comentariosReady = true
    this.loadingComentarios = false
  }

  loadComentarios(event) {
    if (this.noMore) {
      event.target.disabled = true
      event.target.complete()
      return
    }
    this.getComentarios(event)

    if (this.noMore) event.target.disabled = true
  }

  async verPedido(calificacion: CalificacionDetalles, i: number) {
    const date = new Date(calificacion.fecha)
    const fecha = await this.alertService.formatDate(date)
    this.pedido = await this.rateService.getPedido(fecha, calificacion.idPedido)
    this.calSel = i
  }

  ionViewWillLeave() {
    if (this.back) this.back.unsubscribe()
  }

}
