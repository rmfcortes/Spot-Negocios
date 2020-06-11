import { Component, OnInit, Input } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { PedidosService } from 'src/app/services/pedidos.service';
import { AlertService } from 'src/app/services/alert.service';

import { Pedido, RepartidorPedido } from 'src/app/interfaces/pedido';
import { RepartidorPreview } from 'src/app/interfaces/repartidor';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-pedido',
  templateUrl: './pedido.page.html',
  styleUrls: ['./pedido.page.scss'],
})
export class PedidoPage implements OnInit {

  @Input() pedido: Pedido;
  @Input() tiempoPreparacion: number;
  @Input() repartidores: RepartidorPreview[];

  radioRepartidores = [];

  back: Subscription;

  constructor(
    private platform: Platform,
    private datePipe: DatePipe,
    private modalCtrl: ModalController,
    private pedidoService: PedidosService,
    private alertService: AlertService,
  ) { }

  ngOnInit() {
    this.getTiempoPreparcion();
    this.getRepartidores();
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      this.regresar();
    });
  }

  getTiempoPreparcion() {
    this.pedidoService.getTiempoPreparacion().then((tiempo: number) => {
      this.tiempoPreparacion = tiempo;
    });
  }

  getRepartidores() {
    this.pedidoService.getRepartidores().then((repartidores: RepartidorPreview[]) => {
      if (repartidores.length > 0) {
        this.repartidores = repartidores;
        repartidores.forEach((r, i) => {
          const input = {
            name: `radio${i}`,
            type: 'radio',
            label: r.nombre,
            value: r.id,
          };
          this.radioRepartidores.push(input);
        });
      }
    });
  }

  async aceptarPedido() {
    if (!this.pedido.entrega || this.pedido.entrega === 'indefinido') {
      const inputs = await this.radioEntregas()
      this.alertService.presentAlertRadio('Tipo de entrega', 'Si entregarás el pedido este mismo día elige -inmediato-' + 
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
    if (!this.repartidores || this.repartidores.length === 0) {
      this.alertService.presentAlert('Registra repartidores', 'No tienes repartidores registrados' +
      'a los cuales puedas asignar el pedido. Antes de continuar registra tu primer repartidor');
      return;
    }
    if (this.tiempoPreparacion) {
      this.asignaRepartidor();
    } else {
      this.alertService.presentPromptPreparacion('Tiempo de preparacion',
      'Agrega el tiempo estimado de preparación en minutos. ' +
      'Si deseas que se calcule automáticamente, regístralo en la pestaña de Perfil. ' +
      'Por favor introduce sólo números')
      .then((resp: any) => {
        const num = parseInt(resp.preparacion, 10);
        if (num) {
          this.tiempoPreparacion =  (num * 60000);
          this.asignaRepartidor();
        } else {
          this.alertService.presentAlert('Tiempo inválido', 'Por favor introduce un número entero entre 1-100');
        }
      });
    }
  }

  asignaRepartidor() {
    this.alertService.presentAlertRadio('Elige un repartidor',
       'Elige al colaborador disponible para entregar este envío',
       this.radioRepartidores).then(resp => {
         if (resp) {
          this.pedido.aceptado = Date.now() + (this.tiempoPreparacion * 60000)
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
          this.pedidoService.aceptarPedido(this.pedido)
          this.regresar()
         }
       });
  }

  regresar() {
    this.modalCtrl.dismiss();
  }

  radioEntregas() {
    return new Promise((resolve, reject) => {
      const radioEntregas = [
        {
          name: 'inmediato',
          type: 'radio',
          label: 'inmediato',
          value: 'inmediato'
        },
        {
          name: 'planeado',
          type: 'radio',
          label: 'planeado',
          value: 'planeado'
        },
      ];
      resolve(radioEntregas);
    });
  }

}
