import { Injectable } from '@angular/core';

import { AngularFireDatabase } from '@angular/fire/database';

import { UidService } from './uid.service';

@Injectable({
  providedIn: 'root'
})
export class CuentaService {

  constructor(
    private db: AngularFireDatabase,
    private uidService: UidService,
  ) { }

  getPrecios(): Promise<number[]> {
    return new Promise((resolve, reject) => {      
      const region = this.uidService.getRegion()
      const priceSub = this.db.list(`cuentas/${region}`).valueChanges().subscribe((precios: number[]) => {
        priceSub.unsubscribe()
        resolve(precios)
      })
    })
  }

  updatePlan(plan: string, planAnterior: string, precio: number) {
    return new Promise(async (resolve, reject) => {      
      const idNegocio = this.uidService.getUid()
      const region = this.uidService.getRegion()
      const cambio = {
        solicita: plan,
        anterior: planAnterior,
        precio
      }
      await this.db.object(`aacambio/${idNegocio}`).set(cambio)
      this.setPlan(plan)
      this.db.object(`perfiles/${idNegocio}/plan`).set(plan)
      resolve()
    })
  }

  setPlan(plan: string) {
    return new Promise (async (resolve, reject) => {
      const region = this.uidService.getRegion()
      const id = this.uidService.getUid()
      localStorage.setItem('plan', plan)
      this.uidService.setPlan(plan)
      resolve()
    })
  }

  getPlan() {
    return new Promise(async (resolve, reject) => {
      const id = this.uidService.getUid()
      const cueSub = this.db.object(`perfiles/${id}/plan`).valueChanges().subscribe((plan: string) => {
        cueSub.unsubscribe()
        this.setPlan(plan)
        resolve(plan)
      })
    })
  }

  async getPlanStorage() {
    return new Promise (async (resolve, reject) => {
      if ( localStorage.getItem('plan') ) {
        const plan = localStorage.getItem('plan')
        this.setPlan(plan)
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }


  async checkPlan(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      let plan
      plan = await this.uidService.getPlan()
      if (plan) return resolve(plan)
      plan = await this.getPlanStorage()
      if (plan) return resolve(plan)
      plan = await this.getPlan()
      if (plan) return resolve(plan)
      return resolve(false)
    })
  }

}
