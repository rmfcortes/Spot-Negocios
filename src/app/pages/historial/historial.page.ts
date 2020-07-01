import { ModalController, Platform, MenuController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { PedidoPage } from 'src/app/modals/pedido/pedido.page';

import { HistorialService } from 'src/app/services/historial.service';

import { HistorialPedido, Pedido } from 'src/app/interfaces/pedido';
import { AlertService } from 'src/app/services/alert.service';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage implements OnInit {

  today: string
  first_date: string
  no_registros: string

  inicial_date: string
  end_date: string

  pedidos: HistorialPedido[] = []
  pedido: Pedido

  loading_pedidos = false

  batch = 15
  lastKey = ''
  noMore = false

  back: Subscription

  completados: number
  total: number
  comisiones: number

  constructor(
    private platform: Platform,
    private menu: MenuController,
    private modalCtrl: ModalController,
    private historialService: HistorialService,
    private commonService: AlertService,
  ) { }

    // Info inicial
  ngOnInit() {
    this.menu.enable(true)
    this.getToday()
    this.getFirstDate()
  }

  async getToday() {
    this.today = await this.commonService.formatDate(new Date())
  }

  async getFirstDate() {
    this.first_date = localStorage.getItem('first_date')
    if (!this.first_date) this.first_date = await this.historialService.getFirstDate()
    if (!this.first_date) this.first_date = await this.historialService.setFirstDate()
    if (!this.first_date) this.no_registros = 'Aún no tienes pedidos completados'
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      return
    })
  }

    //Fechas seleccionadas

  async initialDateCambio(value) {
    const date = new Date(value)
    this.inicial_date = await this.commonService.formatDate(date)
    if (this.end_date) {
      if (this.inicial_date > this.end_date) {
        this.commonService.presentAlert('', 'La fecha inicial no puede ser mayor a la fecha final')
        return
      }
      this.getRegistrosByRange()
    }
  }

  async endDateCambio(value) {
    const date = new Date(value)
    this.end_date = await this.commonService.formatDate(date)
    if (this.inicial_date) {
      if (this.inicial_date > this.end_date) {
        this.commonService.presentAlert('', 'La fecha inicial no puede ser mayor a la fecha final')
        return
      }
      this.getRegistrosByRange()
    }
  }

  async getRegistrosByRange() {
    this.loading_pedidos = true
    this.pedidos = []
    this.completados = 0
    this.total = 0
    this.comisiones = 0
    this.pedidos = await this.historialService.getRegistrosByRange(this.inicial_date, this.end_date)
    if (this.pedidos.length > 0) {
      this.no_registros = ''
      this.pedidos.forEach(p => {
        this.completados += p.completados.length
        p.pedidos.forEach(x => {
          this.total += x.total
          this.comisiones += x.comision
        })
      })
    }
    else this.no_registros = 'No hay registros de servicios en estos días'
    this.loading_pedidos = false
    console.log(this.pedidos);
  }

  getPedidos(event?) {
    this.historialService.getHistorial(this.batch + 1, this.lastKey).then(pedidos => {
      this.cargaHistorial(pedidos, event)
    })
  }

  cargaHistorial(pedidos, event) {
    if (pedidos.length === this.batch + 1) {
      this.lastKey = pedidos[0].id
      pedidos.shift()
    } else {
      this.noMore = true
    }
    this.pedidos = this.pedidos.concat(pedidos.reverse())
    if (event) event.target.complete()
  }

  async verPedido(pedido) {
    const modal = await this.modalCtrl.create({
      component: PedidoPage,
      componentProps: {pedido}
    })

    return await modal.present()
  }

  ionViewWillLeave() {
    if (this.back) this.back.unsubscribe()
  }

}
