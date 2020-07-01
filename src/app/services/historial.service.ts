import { Injectable } from '@angular/core';

import { AngularFireDatabase } from '@angular/fire/database';

import { UidService } from './uid.service';

import { Pedido, HistorialPedido } from '../interfaces/pedido';

@Injectable({
  providedIn: 'root'
})
export class HistorialService {

  constructor(
    private db: AngularFireDatabase,
    private uidService: UidService,
  ) { }

  // Historial page
  getFirstDate(): Promise<string> {
    return new Promise((resolve, reject) => {
      const uid = this.uidService.getUid()
      const dateSub = this.db.object(`perfiles/${uid}/first_date`).valueChanges().subscribe((date: string) => {
        dateSub.unsubscribe()
        resolve(date)
      })
    })
  }

  setFirstDate(): Promise<string> {
    return new Promise((resolve, reject) => {
      const region = this.uidService.getRegion()
      const uid = this.uidService.getUid()
      const dateSub = this.db.object(`pedidos/historial/${region}/por_negocio/${uid}`).valueChanges().subscribe(historial => {
        dateSub.unsubscribe()
        if (historial) {
          const fechas = Object.entries(historial)
          if (fechas.length > 0) {
            const first_date = fechas[0][0]
            this.db.object(`perfiles/${uid}/first_date`).set(first_date)
            localStorage.setItem('first_date', first_date)
            resolve(first_date)
          } else {
            resolve(null)
          }
        } else resolve(null)
      })
    })
  }


  getRegistrosByRange(initial_date: string, end_date: string): Promise<HistorialPedido[]> {
    return new Promise((resolve, reject) => {
      const region = this.uidService.getRegion()
      const uid = this.uidService.getUid()
      const tripsSub = this.db.list(`pedidos/historial/${region}/por_negocio/${uid}`, data => data.orderByKey().startAt(initial_date).endAt(end_date))
      .snapshotChanges().subscribe(resp => {
        tripsSub.unsubscribe()
        const trips: HistorialPedido[] = []
        for (const trip of resp) {
          const historial: HistorialPedido = {
            fecha: trip.key,
            pedidos: Object.values(trip.payload.val()),
            completados: Object.values(trip.payload.val()).filter(t => t.entregado),
            cancelados_negocio: Object.values(trip.payload.val()).filter(t => t.cancelado),
            cancelados_user: Object.values(trip.payload.val()).filter(t => t.cancelado_by_user),
            ver_detalles: false
          }
          trips.push(historial)
        }
        resolve(trips)
      })
    })
  }

  getHistorial(batch, lastKey): Promise<Pedido[]> {
    const uid = this.uidService.getUid();
    return new Promise((resolve, reject) => {
      if (lastKey || lastKey === 0) {
        const x = this.db.list(`pedidos/historial/${uid}/detalles`, data =>
          data.orderByKey().limitToLast(batch).endAt(lastKey.toString())).valueChanges().subscribe(async (pedidos: Pedido[]) => {
            x.unsubscribe()
            resolve(pedidos)
          });
      } else {
        const x = this.db.list(`pedidos/historial/${uid}/detalles`, data =>
          data.orderByKey().limitToLast(batch)).valueChanges().subscribe(async (pedidos: Pedido[]) => {
            x.unsubscribe()
            resolve(pedidos)
          })
      }
    })
  }



}
