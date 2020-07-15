import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { AngularFireDatabase } from '@angular/fire/database';

import { UidService } from './uid.service';

import { Dia, DiaAnalisis } from '../interfaces/horario';

@Injectable({
  providedIn: 'root'
})
export class HorarioService {

  hasHorario = new BehaviorSubject<boolean>(false)

  constructor(
    private db: AngularFireDatabase,
    private uidService: UidService,
  ) { }

  getHorario(): Promise<Dia[]> {
    const idNegocio = this.uidService.getUid()
    return new Promise((resolve, reject) => {
      const horSub = this.db.list(`horario/fechas/${idNegocio}`).valueChanges().subscribe((horario: Dia[]) => {
        horSub.unsubscribe()
        resolve(horario)
      })
    })
  }

  async setHorario(horario: Dia[]) {
    const idNegocio = this.uidService.getUid()
    this.db.object(`horario/fechas/${idNegocio}`).set(horario)
    const dateMX = new Date().toLocaleString("en-US", {timeZone: "America/Mexico_City"})
    const date = new Date(dateMX)
    let hoy = date.getDay()
    if (hoy === 0) hoy = 6
    else hoy--
    
    const stSub = await this.db.object(`perfiles/${idNegocio}/abierto`).valueChanges().subscribe((abierto: boolean) => {
        stSub.unsubscribe()
        horario.forEach((d, i) => {
          const dia: DiaAnalisis = {
            activo: d.activo,
            abierto: false
          }
          if (i === hoy) dia.abierto = abierto
          if (d.activo) {
            const date = new Date(d.apertura)
            const horas = date.getHours()
            const minutos = date.getMinutes()
            dia.apertura = minutos + (horas * 60)
            const cierre = new Date(d.cierre)
            const horasC = cierre.getHours()
            const minutosC = cierre.getMinutes()
            dia.cierre = minutosC + (horasC * 60)
            dia.inicioComida = null
            dia.finComida = null
            if (d.comida === 'comida') {
              const comidaI = new Date(d.inicioComida)
              const choras = comidaI.getHours()
              const cminutos = comidaI.getMinutes()
              dia.inicioComida = cminutos + (choras * 60)
              const comidaC = new Date(d.finComida)
              const horasC = comidaC.getHours()
              const minutosC = comidaC.getMinutes()
              dia.finComida = minutosC + (horasC * 60)
            }
          } else {
            dia.abierto = null
            dia.apertura = null
            dia.cierre = null
            dia.inicioComida = null
            dia.finComida = null
          }
          this.db.object(`horario/analisis/${i.toString()}/${idNegocio}`).update(dia)
          this.hasHorario.next(true)
        })
    })
  }

}
