import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';

import { AngularFireDatabase } from '@angular/fire/database';

import { UidService } from './uid.service';

import { Pedido } from '../interfaces/pedido';
import { RepartidorPreview } from 'src/app/interfaces/repartidor';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PedidosService {

  pedidos_pendientes_repartidor: Pedido[] = []
  repartidorSub: Subscription
  timeOutActivo = false

  entradas = 0

  espera = 0

  constructor(
    public platform: Platform,
    private db: AngularFireDatabase,
    private uidService: UidService,
  ) { }

  getPedidos() {
    const uid = this.uidService.getUid()
    return this.db.list(`pedidos/activos/${uid}/detalles`)
  }

  getPedidosCount() {
    const uid = this.uidService.getUid()
    return this.db.object(`pedidos/activos/${uid}/cantidad`).valueChanges()
  }


  getTiempoPreparacion(): Promise <number> {
    const uid = this.uidService.getUid()
    return new Promise((resolve, reject) => {
      const prepSub = this.db.object(`preparacion/${uid}`).valueChanges().subscribe((time: number) => {
        prepSub.unsubscribe()
        resolve(time)
      })
    })
  }

  getRepartidores(): Promise <RepartidorPreview[]> {
    const uid = this.uidService.getUid()
    return new Promise((resolve, reject) => {
      const repSub = this.db.list(`repartidores/${uid}/preview`).valueChanges().subscribe((repartidores: RepartidorPreview[]) => {
        repSub.unsubscribe()
        resolve(repartidores)
      })
    })
  }

  aceptarPedido(pedido: Pedido) {
    return new Promise(async (resolve, reject) => {      
      const uid = this.uidService.getUid()
      await this.db.object(`pedidos/activos/${uid}/detalles/${pedido.id}`).update(pedido)
      resolve()
    })
  }

  rechazarPedido(pedido: Pedido) {
    const uid = this.uidService.getUid()
    this.db.object(`pedidos/activos/${uid}/detalles/${pedido.id}`).update(pedido)
  }

  asignarRepartidor(pedido: Pedido) {
    return new Promise(async (resolve, reject) => {
      try {        
        const idNegocio = this.uidService.getUid()
        this.pedidos_pendientes_repartidor = this.pedidos_pendientes_repartidor.filter(p => p.id !== pedido.id)
        this.db.object(`pedidos/activos/${idNegocio}/repartidor_pendiente/${pedido.id}`).remove()
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  borraPendiente(idPedido: string) {
    const idNegocio = this.uidService.getUid()
    this.db.object(`pedidos/activos/${idNegocio}/repartidor_pendiente/${idPedido}`).remove()
  }

  solicitarRepartidor(pedido: Pedido, i?: number) {
    if (pedido.solicitudes && pedido.solicitudes === 3) return
    const uid = this.uidService.getUid()
    pedido.last_solicitud = Date.now()
    pedido.solicitudes = pedido.solicitudes ? pedido.solicitudes + 1 : 1
    this.db.object(`pedidos/activos/${uid}/detalles/${pedido.id}`).update(pedido)
    this.db.object(`pedidos/repartidor_pendiente/${uid}/${pedido.id}`).set(pedido)
    this.db.object(`pedidos/activos/${uid}/repartidor_pendiente/${pedido.id}`).set(pedido.id)
    if (this.pedidos_pendientes_repartidor.length === 0) {
      this.pedidos_pendientes_repartidor.push(pedido)
    } else {
      if (i === null || i === undefined) {
        this.pedidos_pendientes_repartidor.push(pedido)
      } else {
        this.pedidos_pendientes_repartidor[i].last_solicitud = Date.now()
      }
    }
    if (!this.timeOutActivo) {
      this.listenRepartidor()
      this.timeOutRepartidorPendiente()
    }
  }

  getBanderazo(): Promise<number> {
    return new Promise((resolve, reject) => {
      const region = this.uidService.getRegion()
      const banSub = this.db.object(`ciudades/${region}/envio/banderazo_negocio`)
      .valueChanges().subscribe((banderazo: number) => {
        banSub.unsubscribe()
        resolve(banderazo)
      })
    })
  }   
  
  getTimeParaLLegar(): Promise<number> {
    return new Promise((resolve, reject) => {
      const region = this.uidService.getRegion()
      const banSub = this.db.object(`ciudades/${region}/envio/para_llegar`)
      .valueChanges().subscribe((para_llegar: number) => {
        banSub.unsubscribe()
        resolve(para_llegar)
      })
    })
  } 

  pushAvance(pedido: Pedido) {
    const uid = this.uidService.getUid()
    this.db.object(`pedidos/activos/${uid}/detalles/${pedido.id}`).update(pedido)
  }

    // Esucha de una lista de pedidos pendientes de repartidores. Cuando se elimina de esa lista, sabemos que ya tiene repartidor
  listenRepartidor() {
    const uid = this.uidService.getUid()
    this.db.object(`pedidos/activos/${uid}/repartidor_pendiente`).query.ref.on('child_removed', snapshot => {
      const id = snapshot.val()
      this.pedidos_pendientes_repartidor = this.pedidos_pendientes_repartidor.filter(p => p.id !== id)
    })
  }

  listenRepartidorTs(idPedido: string) {
    const uid = this.uidService.getUid()
    return this.db.object(`pedidos/activos/${uid}/detalles/${idPedido}/repartidor`).valueChanges()
  }

  listenAvances(idPedido: string) {
    const uid = this.uidService.getUid()
    return this.db.list(`pedidos/activos/${uid}/detalles/${idPedido}/avances`).valueChanges()
  }

  timeOutRepartidorPendiente() {
    if (!this.espera) {
      const region = this.uidService.getRegion()
      const espSub = this.db.object(`ciudades/${region}/espera`).valueChanges().subscribe((espera: number) => {
        espSub.unsubscribe()
        this.espera = espera
        this.conteo()
      })
    } else this.conteo()
  }

  conteo() {
    setTimeout(() => {
      this.entradas++
      this.timeOutActivo = true
      if (this.pedidos_pendientes_repartidor.length === 0) {
        const uid = this.uidService.getUid()
        this.db.object(`pedidos/activos/${uid}/repartidor_pendiente`).query.ref.off('child_removed')
        this.timeOutActivo = false
        return
      }
      for (let i = 0; i < this.pedidos_pendientes_repartidor.length; i++) {
        const lapso = this.pedidos_pendientes_repartidor[i].last_solicitud + this.espera
        if (Date.now() > lapso) this.solicitarRepartidor(this.pedidos_pendientes_repartidor[i], i)
      }
      this.conteo()
    }, 1000)
  }

}
