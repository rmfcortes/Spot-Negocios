import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';

import { UidService } from './uid.service';

import { Rate, PerfilNegRate, ComentarioNegocio, ComentarioRepartidor } from '../interfaces/rate';
import { RepartidorPreview } from '../interfaces/repartidor';
import { CalificacionDetalles, Pedido } from '../interfaces/pedido';

@Injectable({
  providedIn: 'root'
})
export class RatesService {

  constructor(
    private db: AngularFireDatabase,
    private uidService: UidService,
  ) { }

  getNegRate(): Promise<Rate> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid()
      const ratSub = this.db.object(`rate/resumen/${idNegocio}`).valueChanges().subscribe((rate: Rate) => {
        ratSub.unsubscribe()
        resolve(rate)
      })
    })
  }

  getNegPerfil(): Promise<PerfilNegRate> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid()
      const perSub = this.db.object(`perfiles/${idNegocio}`).valueChanges().subscribe((PerfilNegRate: PerfilNegRate) => {
        perSub.unsubscribe()
        resolve(PerfilNegRate)
      })
    })
  }

  getRepartidoresRate(): Promise<RepartidorPreview[]> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid()
      const ratSub = this.db.list(`repartidores/${idNegocio}/preview`).valueChanges().subscribe((repPrew: RepartidorPreview[]) => {
        ratSub.unsubscribe()
        resolve(repPrew)
      })
    })
  }

  getComentarioNegocio(batch, lastkey): Promise<ComentarioNegocio[]> {
    const idNegocio = this.uidService.getUid()
    return new Promise((resolve, reject) => {
      if (lastkey) {
        const clSub = this.db.list(`rate/detalles/${idNegocio}`, data =>
          data.orderByKey().limitToLast(batch).endAt(lastkey))
          .valueChanges().subscribe((comentarios: ComentarioNegocio[]) => {
            clSub.unsubscribe()
            resolve(comentarios)
          })
      } else {
        const clSub = this.db.list(`rate/detalles/${idNegocio}`, data =>
          data.orderByKey().limitToLast(batch))
          .valueChanges().subscribe((comentarios: ComentarioNegocio[]) => {
            clSub.unsubscribe()
            resolve(comentarios)
          })
      }
    })
  }

  getComentarioRepartidor(id: string, batch, lastkey): Promise<ComentarioRepartidor[]> {
    const idNegocio = this.uidService.getUid()
    return new Promise((resolve, reject) => {
      if (lastkey) {
        const clSub = this.db.list(`repartidores/${idNegocio}/detalles/${id}/comentarios`, data =>
          data.orderByKey().limitToLast(batch).endAt(lastkey))
          .valueChanges().subscribe((comentarios: ComentarioRepartidor[]) => {
            clSub.unsubscribe()
            resolve(comentarios)
          })
      } else {
        const clSub = this.db.list(`repartidores/${idNegocio}/detalles/${id}/comentarios`, data =>
          data.orderByKey().limitToLast(batch))
          .valueChanges().subscribe((comentarios: ComentarioRepartidor[]) => {
            clSub.unsubscribe()
            resolve(comentarios)
          })
      }
    })
  }

  getPedido(fecha: string, idPedido: string): Promise<Pedido> {
    return new Promise((resolve, reject) => {
      const region = this.uidService.getRegion()
      const uid = this.uidService.getUid()
      const pedSub = this.db.object(`pedidos/historial/${region}/por_negocio/${uid}/${fecha}/${idPedido}`).valueChanges().subscribe((pedido: Pedido) => {
        pedSub.unsubscribe()
        resolve(pedido)
      })
    })
  }

}
