import { Component, NgZone } from '@angular/core';
import { ModalController, Platform, MenuController } from '@ionic/angular';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { PedidoPage } from 'src/app/modals/pedido/pedido.page';

import { PedidosService } from 'src/app/services/pedidos.service';
import { AlertService } from 'src/app/services/alert.service';
import { UidService } from 'src/app/services/uid.service';

import { Pedido, RepartidorPedido, Cliente, FormaPago, Negocio, Avance } from 'src/app/interfaces/pedido';
import { RepartidorPreview } from 'src/app/interfaces/repartidor';
import { Direccion } from '../../interfaces/direccion';


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

  avance: Avance = {
    concepto: '',
    fecha: null
  };

  constructor(
    private ngZone: NgZone,
    private router: Router,
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
    this.pedidos = []
    // this.pushPedido()
    this.pedidoService.getPedidos().query.ref.on('child_added', snapshot => {
      this.ngZone.run(() => {
        const pedido: Pedido = snapshot.val()
        this.pedidos.unshift(pedido)
        if (pedido.aceptado && !pedido.repartidor && pedido.entrega === 'inmediato') this.pedidoService.solicitarRepartidor(pedido)
        if (pedido.aceptado && !pedido.repartidor && pedido.entrega === 'planeado' && pedido.repartidor_solicitado) this.pedidoService.solicitarRepartidor(pedido)
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

  pushPedido() { // Eliminar está función
    const direccion: Direccion = {
      direccion: 'Av. Siempre Viva 4545',
      lat: 20.185687,
      lng: -103.546875
    }
    const cliente: Cliente = {
      direccion,
      nombre: 'Pablo Flores',
      uid: 'pabloflores',
      telefono: '33145786485'
    }
    const formaPago: FormaPago = {
      forma: '4242',
      id: 'src_2nVA2khLbxoDvuGfr',
      tipo: 'visa'
    }
    const negocio: Negocio = {
      categoria: 'Moda',
      direccion,
      envio: 16,
      idNegocio: 'fñjasd',
      logo: 'klafjsd',
      nombreNegocio: 'Novedades Elvia',
      repartidores_propios: false,
      telefono: '14564887'
    }
    const pedido: Pedido =  {
      aceptado: false,
      avances: [],
      cliente,
      comision: 12,
      createdAt: 1593465814655,
      entrega: 'inmediato',
      envio: 35,
      formaPago,
      negocio,
      productos: [{
        descripcion: 'Excelente calidad',
        id: 'aklsjdfasd',
        nombre: 'Tenis clon',
        pasillo: 'Abrigos',
        precio: 280,
        url: 'https://firebasestorage.googleapis.com/v0/b/revistaojo-9a8d3.appspot.com/o/negocios%2Fproductos%2FNX0Pt5gOnqQ20yqaLMxdbXpUkfS2%2F-M9VrdoSd8iMXksgExzA%2Fproducto?alt=media&token=27101131-5b12-420d-981a-129426db3ecc',
        cantidad: 1,
        total: 280,

      }],
      propina: 0,
      total: 320,
      id: 'fdklajñerm',
      repartidor_solicitado: false
    }
    this.pedidos.push(pedido)
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
    if (this.back) this.back.unsubscribe()
    this.escuchaRepAnterior = ''
  }

  /////////////////////////////////////////

  // Lógia para escritorio. Vista en una sola pantalla, sin Modal
  getPedido(pedido: Pedido, i: number) {
    this.pedido = pedido
    console.log(this.pedido);
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
      this.repartidoresReady = true
    })
  }

  rechazarPedido() {
    this.alertService.presentAlertPrompt('Rechazar pedido', 'No tengo producto en existencia', 'Rechazar pedido', 'Cancelar', 'Ingresa la razón por la que rechazas el pedido')
    .then((resp: string) => {
      resp = resp.trim()
      if (!resp) {
        this.alertService.presentAlert('', 'Por favor ingresa la razón por la cual cancelas el pedido')
        return
      }
      this.pedido.cancelado_by_negocio = Date.now()
      this.pedido.razon_cancelacion = resp
      this.pedidoService.rechazarPedido(this.pedido)
      this.pedidos = this.pedidos.filter(p => p.id !== this.pedido.id)
      this.pedido = null
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
      if (!/^[0-9]+$/.test(resp.preparacion)) {
        this.alertService.presentAlert('Tiempo inválido', 'Por favor introduce un número entero entre 1-100')
        return
      }
      const num = parseInt(resp.preparacion, 10)
      const dias =  num * 86400000
      this.pedido.aceptado = Date.now() + dias
      const dia = await this.datePipe.transform(this.pedido.aceptado, 'EEEE d/MMMM/y').toString()
      this.alertService.presentAlertAction('Entrega', `Confirma si tendrás listos los productos el ${dia}`, 'Si', 'Cancelar')
      .then(resp => { 
        if (resp) this.pedidoService.aceptarPedido(this.pedido)
        else this.pedido.aceptado = null
      })
    })
  }

  entregaInmediata() {
    if (this.tiempoPreparacion) this.asignaRepartidor()
    else {
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
    if (this.radioRepartidores.length === 0) {
      return this.alertService.presentAlertAction('', 'No tienes repartidores registrados. Para aceptar el pedido debes tener al menos ' +
      'un repartidor registrado. ¿Te gustaría registrar tu primer repartidor?', 'Registrar', 'Cancelar')
      .then(resp => resp ? this.router.navigate(['/repartidores']) : null)
    }
    this.alertService.presentAlertRadio('Elige un repartidor',
    'Elige a un colaborador disponible para entregar este envío o solicita uno a Spot',
    this.radioRepartidores).then(resp => {
      if (resp === undefined) {
        this.alertService.presentAlert('', 'Elige alguna de las opciones para asignar el pedido o solicitar un repartidor')
        return
      }
      if (resp) {
        if (this.pedido.entrega === 'inmediato') this.pedido.aceptado = Date.now() + (this.tiempoPreparacion)
        this.pedidoService.aceptarPedido(this.pedido)
        if (resp === 'spot') this.solicitarRepartidor()
        else {
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
        const i = this.pedidos.findIndex(p => p.id === this.pedido.id)
        this.pedidos[i] = this.pedido
      }
    })
  }

  solicitarRepartidor() {
    this.pedido.repartidor_solicitado = true
    this.pedidoService.solicitarRepartidor(this.pedido)
    this.listenRepartidorPendiente()
  }

  agregarAvance() {
    this.avance.concepto = this.avance.concepto.trim()
    if (!this.avance.concepto) return
    this.avance.fecha = Date.now()
    this.pedido.avances.push(this.avance)
    this.pedidoService.pushAvance(this.pedido)
  }

  listenRepartidorPendiente() {
    if (this.escuchaRepAnterior) this.repSub.unsubscribe()
    this.escuchaRepAnterior = this.pedido.id
    this.repSub = this.pedidoService.listenRepartidorTs(this.pedido.id).subscribe((repartidor: RepartidorPedido) => {
      this.ngZone.run(() => {
        this.pedido.repartidor = repartidor
        this.pedidoService.borraPendiente(this.pedido.id)
      })
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
