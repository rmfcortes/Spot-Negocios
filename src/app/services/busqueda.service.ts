import { Injectable } from '@angular/core';

import { AngularFireDatabase } from '@angular/fire/database';

import { UidService } from './uid.service';

@Injectable({
  providedIn: 'root'
})
export class BusquedaService {

  constructor(
    private db: AngularFireDatabase,
    private uidService: UidService,
  ) { }

  getPalabrasClave(): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const idNegocio = this.uidService.getUid()
      const region = this.uidService.getRegion()
      const catSub = this.db.object(`busqueda/${region}/${idNegocio}/palabras`).valueChanges().subscribe((claves: string) => {
        catSub.unsubscribe()
        resolve(claves)
      })
    })
  }

  async updateClaves(palabras: string) {
    const idNegocio = this.uidService.getUid()
    const region = this.uidService.getRegion()
    this.db.object(`busqueda/${region}/${idNegocio}/palabras`).set(palabras)
  }


}
