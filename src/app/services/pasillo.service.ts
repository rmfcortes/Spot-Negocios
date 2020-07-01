import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/database';

import { UidService } from './uid.service';

import { Pasillo } from '../interfaces/pasillo';
import { Producto } from '../interfaces/producto';
import { AlertService } from './alert.service';
import { BusquedaService } from './busqueda.service';

@Injectable({
  providedIn: 'root'
})
export class PasilloService {

  constructor(
    private db: AngularFireDatabase,
    private palabrasService: BusquedaService,
    private alertService: AlertService,
    private uidService: UidService,
  ) { }

  getCategoria(): Promise<string> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid()
      const catSub = this.db.object(`perfiles/${idNegocio}/categoria`).valueChanges().subscribe((categoria: string) => {
        catSub.unsubscribe()
        resolve(categoria)
      });
    });
  }

  getPasillos(categoria: string): Promise<Pasillo[]> {
    const idNegocio = this.uidService.getUid()
    return new Promise((resolve, reject) => {
      const pasSub = this.db.list(`negocios/pasillos/${categoria}/${idNegocio}/pasillos`).valueChanges()
        .subscribe((pasillos: Pasillo[]) => {
          pasSub.unsubscribe()
          resolve(pasillos)
        });
    });
  }

  // Para pasillos nuevos y reorden
  updatePasillos(categoria: string, pasillos: Pasillo[]) {
    const idNegocio = this.uidService.getUid()
    this.db.object(`negocios/pasillos/${categoria}/${idNegocio}/pasillos`).set(pasillos)
    this.setPalabrasPasillos(pasillos)
  }

  editPasillo(categoria: string, pasilloIndex: number, pasilloViejo: string, pasilloNuevo: string) {
    const idNegocio = this.uidService.getUid()
    const tipoSub = this.db.object(`perfiles/${idNegocio}/tipo`).valueChanges().subscribe(tipo => {
      tipoSub.unsubscribe()
      const prodSub = this.db.object(`negocios/${tipo}/${categoria}/${idNegocio}/${pasilloViejo}`)
        .valueChanges().subscribe(async (productos: Producto[]) => {
            prodSub.unsubscribe()
            try {
              if (productos) {
                Object.values(productos).forEach(p => p.pasillo = pasilloNuevo)
                await this.db.object(`negocios/${tipo}/${categoria}/${idNegocio}/${pasilloNuevo}`).update(productos)
              }
              await this.db.object(`negocios/${tipo}/${categoria}/${idNegocio}/${pasilloViejo}`).remove()
              await this.db.object(`negocios/pasillos/${categoria}/${idNegocio}/pasillos/${pasilloIndex.toString()}/nombre`).set(pasilloNuevo)
              this.setPalabrasPasillo(pasilloNuevo)
            } catch (error) {
              this.alertService.presentAlert('Error', error)
            }
          })
    })
  }

  deletePasillo(categoria: string, pasillo: string) {
    const idNegocio = this.uidService.getUid()
    const tipoSub = this.db.object(`perfiles/${idNegocio}/tipo`).valueChanges().subscribe(tipo => {
      tipoSub.unsubscribe()
      this.db.object(`negocios/${tipo}/${categoria}/${idNegocio}/${pasillo}`).remove()
    })
  }

  async setPalabrasPasillos(pasillos: Pasillo[]) {
    let claves = ''
    const palabras = await this.palabrasService.getPalabrasClave()
    if (palabras) claves = claves.concat(palabras)
    pasillos.forEach(p => claves = claves.concat(' ' + p.nombre))
    claves = claves
      .toLocaleLowerCase()
      .split(' ')
      .filter((item, i, allItems) => i === allItems.indexOf(item))
      .join(' ')
    this.palabrasService.updateClaves(claves)
  }

  async setPalabrasPasillo(pasillo: string) {
    let claves = ''
    const palabras = await this.palabrasService.getPalabrasClave()
    if (palabras) claves = claves.concat(palabras + ' ');
    claves = claves.concat(pasillo)
    claves = claves
      .toLocaleLowerCase()
      .split(' ')
      .filter((item, i, allItems) => i === allItems.indexOf(item))
      .join(' ')
    this.palabrasService.updateClaves(claves)
  }

}
