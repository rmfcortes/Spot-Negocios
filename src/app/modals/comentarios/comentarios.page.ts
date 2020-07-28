import { Component, OnInit, Input } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { RatesService } from 'src/app/services/rates.service';

import { CalificacionDetalles, Pedido } from 'src/app/interfaces/pedido';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-comentarios',
  templateUrl: './comentarios.page.html',
  styleUrls: ['./comentarios.page.scss'],
})
export class ComentariosPage implements OnInit {

  @Input() id
  @Input() tipo

  comentarios = []

  noMore = false
  lastKey = ''
  batch = 15

  ver_pedido = false
  pedido: Pedido

  comentariosReady = false

  back: Subscription

  constructor(
    private platform: Platform,
    private modalCtrl: ModalController,
    private alertService: AlertService,
    private rateService: RatesService,
  ) { }

  ngOnInit() {
    this.getComentarios()
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      this.regresar()
    })
  }

  async verPedido(calificacion: CalificacionDetalles) {
    this.ver_pedido = true
    const date = new Date(calificacion.fecha)
    const fecha = await this.alertService.formatDate(date)
    this.pedido = await this.rateService.getPedido(fecha, calificacion.idPedido)
  }

  async getComentarios(event?) {
    let comentarios
    if (this.tipo === 'negocio') comentarios = await this.rateService.getComentarioNegocio(this.batch, this.lastKey)
    else comentarios = await this.rateService.getComentarioRepartidor(this.id, this.batch, this.lastKey)
    this.lastKey = comentarios[0].id || null
    if (comentarios.length === this.batch + 1) comentarios.shift()
    else this.noMore = true
    this.comentarios = this.comentarios.concat(comentarios.reverse())
    if (event) event.target.complete()
    this.comentariosReady = true
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

  regresar() {
    if (this.ver_pedido) return this.ver_pedido = false
    this.modalCtrl.dismiss()
  }

}
