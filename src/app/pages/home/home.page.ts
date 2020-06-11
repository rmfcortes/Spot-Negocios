import { Component, NgZone } from '@angular/core';
import { ModalController, Platform, MenuController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { PedidoPage } from 'src/app/modals/pedido/pedido.page';

import { PedidosService } from 'src/app/services/pedidos.service';
import { AlertService } from 'src/app/services/alert.service';

import { Pedido, RepartidorPedido } from 'src/app/interfaces/pedido';
import { RepartidorPreview } from 'src/app/interfaces/repartidor';
import { UidService } from 'src/app/services/uid.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  pedidos: Pedido[] = []

  ////////// Para escritorio
  tiempoPreparacion: number
  repartidores: RepartidorPreview[] = []
  radioRepartidores = []
  pedido: Pedido

  pedidosReady = false
  repartidoresReady = false
  tiempoReady = false

  iSel: number
  plan: string

  back: Subscription

  escuchaRepAnterior: string
  repSub: Subscription

  constructor(
    private ngZone: NgZone,
    private datePipe: DatePipe,
    private platform: Platform,
    private menu: MenuController,
    private modalCtrl: ModalController,
    private pedidoService: PedidosService,
    private alertService: AlertService,
    private uidService: UidService,
  ) {}

  ionViewWillEnter() {
    this.menu.enable(true)
    this.getPlan()
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      return
    })
  }

  getPlan() {
    this.plan = this.uidService.getPlan()
    if (this.plan !== 'basico') {
      this.getTiempoPreparcion()
      this.getRepartidores()
      this.getPedidos()
    }
  }

  getPedidos() {
    this.pedidos = [];
    this.pedidoService.getPedidos().query.ref.on('child_added', snapshot => {
      this.ngZone.run(() => {
        const pedido: Pedido = snapshot.val()
        this.pedidos.unshift(pedido);
        // if (pedido.aceptado && !pedido.repartidor) this.pedidoService.solicitarRepartidor(pedido)
      })
    })

    this.pedidoService.getPedidos().query.ref.on('child_removed', snapshot => {
      this.ngZone.run(() => {
        const pedido: Pedido = snapshot.val()
        this.pedidos = this.pedidos.filter(p => p.id !== pedido.id)
      })
    })

    setTimeout(() => {
      this.pedidosReady = true
    }, 1500)
  }

  async verPedido(pedido) {
    const modal = await this.modalCtrl.create({
      component: PedidoPage,
      componentProps: {pedido, tiempo: this.tiempoPreparacion, repartidores: this.repartidores}
    })

    return await modal.present()
  }

  ionViewWillLeave() {
    this.pedidoService.getPedidos().query.ref.off('child_removed')
    this.pedidoService.getPedidos().query.ref.off('child_added')

    if (this.escuchaRepAnterior) this.repSub.unsubscribe()
    if (this.back) {this.back.unsubscribe()}
    this.escuchaRepAnterior = ''
  }

  /////////////////////////////////////////

  // Lógia para escritorio. Vista en una sola pantalla, sin Modal
  getPedido(pedido: Pedido, i: number) {
    this.pedido = pedido
    this.iSel = i
    if (this.pedido.aceptado && !this.pedido.repartidor) this.listenRepartidorPendiente()
  }

  getTiempoPreparcion() {
    this.pedidoService.getTiempoPreparacion().then((tiempo: number) => {
      this.tiempoPreparacion = tiempo
      this.tiempoReady= true
    })
  }

  getRepartidores() {
    this.radioRepartidores = []
    this.pedidoService.getRepartidores().then((repartidores: RepartidorPreview[]) => {
      if (repartidores.length > 0) {
        this.repartidores = repartidores
        repartidores.forEach((r, i) => {
          const input = {
            name: `radio${i}`,
            type: 'radio',
            label: r.nombre,
            value: r.id,
          };
          this.radioRepartidores.push(input)
        })
      }
      const input = {
        name: `spot`,
        type: 'radio',
        label: 'Solicitar repartidor',
        value: 'spot',
      }
      this.radioRepartidores.push(input)
      console.log(this.radioRepartidores)
      this.repartidoresReady = true
    })
  }

  async aceptarPedido() {
    if (!this.pedido.entrega || this.pedido.entrega === 'indefinido') {
      const inputs = await this.radioEntregas()
      this.alertService.presentAlertRadio('Tipo de entrega', 'Si entregarás el pedido este mismo día elige <strong>-inmediato-</strong> ' + 
      'de lo contrario elige -planeado-', inputs)
      .then((resp: string) => {
        if (resp) {
          this.pedido.entrega = resp
          this.aceptarPedido()
        }
      })
    } else {
      if (this.pedido.entrega === 'inmediato') this.entregaInmediata()
      else if (this.pedido.entrega === 'planeado') this.entregaPlaneada()
    }
  }

  entregaPlaneada() {
    this.alertService.presentPromptPreparacion('Tiempo de preparacion',
    'Tiempo estimado en días para tener listos los productos. ' +
    'Por favor introduce sólo números')
    .then(async (resp: any) => {
      const num = parseInt(resp.preparacion, 10);
      if (num) {
        const dias =  num * 86400000
        this.pedido.aceptado = Date.now() + dias
        const dia = await this.datePipe.transform(this.pedido.aceptado, 'EEEE d/MMMM/y').toString()
        this.alertService.presentAlertAction('Entrega', `Confirma si tendrás listos los productos el ${dia}`)
        .then(resp => { 
          if (resp) this.pedidoService.aceptarPedido(this.pedido)
          else this.pedido.aceptado = null
        })
      } else {
        this.alertService.presentAlert('Tiempo inválido', 'Por favor introduce un número entero entre 1-100');
      }
    });
  }

  entregaInmediata() {
    if (this.tiempoPreparacion) {
      this.asignaRepartidor()
    } else {
      this.alertService.presentPromptPreparacion('Tiempo de preparacion',
      'Agrega el tiempo estimado de preparación en minutos. ' +
      'Si deseas que se calcule automáticamente, regístralo en la pestaña de Perfil. ' +
      'Por favor introduce sólo números')
      .then((resp: any) => {
        if (resp === undefined) {
          this.alertService.presentAlert('', 'Define el tiempo de preparación para este pedido')
          return
        }
        const num = parseInt(resp.preparacion, 10)
        if (num) {
          this.tiempoPreparacion =  (num * 60000)
          this.asignaRepartidor()
        } else {
          this.alertService.presentAlert('Tiempo inválido', 'Por favor introduce un número entero entre 1-100');
        }
      })
    }
  }

  asignaRepartidor() {
    this.alertService.presentAlertRadio('Elige un repartidor',
    'Elige a un colaborador disponible para entregar este envío o solicita uno a Spot',
    this.radioRepartidores).then(resp => {
      if (resp === undefined) {
        this.alertService.presentAlert('', 'Elige alguna de las opciones para asignar el pedido o solicitar un repartidor')
        return
      }
      if (resp) {
        this.pedido.aceptado = Date.now() + (this.tiempoPreparacion)
        this.pedidoService.aceptarPedido(this.pedido)
        if (resp === 'spot') {
          this.pedidoService.solicitarRepartidor(this.pedido)
          this.listenRepartidorPendiente()
        } else {
          const repartidor = this.repartidores.filter(r => r.id === resp)
          const rep: RepartidorPedido = {
            nombre: repartidor[0].nombre,
            foto: repartidor[0].foto,
            id: repartidor[0].id,
            telefono: repartidor[0].telefono,
            externo: false
          }
          this.pedido.repartidor = rep
          this.pedidoService.asignarRepartidor(this.pedido)
        }
      }
    })
  }

  listenRepartidorPendiente() {
    if (this.escuchaRepAnterior) this.repSub.unsubscribe()
    this.escuchaRepAnterior = this.pedido.id
    this.repSub = this.pedidoService.listenRepartidorTs(this.pedido.id).subscribe((repartidor: RepartidorPedido) => {
      this.ngZone.run(() => this.pedido.repartidor = repartidor)
    })
  }

  radioEntregas() {
    return new Promise((resolve, reject) => {
      const radioEntregas = [
        {
          name: 'inmediato',
          type: 'radio',
          label: 'Hoy mismo',
          value: 'inmediato'
        },
        {
          name: 'planeado',
          type: 'radio',
          label: 'Diferente día',
          value: 'planeado'
        },
      ]
      resolve(radioEntregas)
    })
  }




}
