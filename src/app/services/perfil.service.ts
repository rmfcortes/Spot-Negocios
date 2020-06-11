import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';

import { UidService } from './uid.service';

import { Perfil } from '../interfaces/perfil';
import { BusquedaService } from './busqueda.service';


@Injectable({
  providedIn: 'root'
})
export class PerfilService {

  constructor(
    private db: AngularFireDatabase,
    private fireStorage: AngularFireStorage,
    private palabrasService: BusquedaService,
    private uidService: UidService,
  ) { }

  getPerfil(): Promise<Perfil> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid()
      const perSub = this.db.object(`perfiles/${idNegocio}`).valueChanges().subscribe((perfil: Perfil) => {
        perSub.unsubscribe()
        resolve(perfil)
      })
    })
  }

  async setPerfil(perfil: Perfil) {
    return new Promise(async (resolve, reject) => {      
      try {      
        const idNegocio = this.uidService.getUid()
        perfil.id = idNegocio
    
        // Info pasillos
        let datosPasillo
        if (perfil.tipo === 'servicios') {
          datosPasillo = {
            portada: perfil.portada,
            telefono: perfil.telefono,
            whats: perfil.whats,
          };
        } else {
          datosPasillo = {
            portada: perfil.portada,
          }
        }
        await this.db.object(`negocios/pasillos/${perfil.categoria}/${idNegocio}`).update(datosPasillo)
    
        // Info detalles
        const detalles = {
          descripcion: perfil.descripcion,
          direccion: perfil.direccion.direccion,
          lat: perfil.direccion.lat,
          lng: perfil.direccion.lng,
          telefono: perfil.telefono
        }
        await this.db.object(`negocios/detalles/${perfil.categoria}/${idNegocio}`).update(detalles)
    
        // Info datos-pedido & preparacion if tipo productos
        if (perfil.tipo === 'productos') {
          const datosPedido = {
            direccion: perfil.direccion,
            envio: perfil.envio || 0,
            entrega: perfil.entrega,
            telefono: perfil.telefono,
            formas_pago: perfil.formas_pago
          };
          await this.db.object(`negocios/datos-pedido/${perfil.categoria}/${idNegocio}`).update(datosPedido)
        }
        if (perfil.preparacion && perfil.tipo === 'productos') {
          await this.db.object(`preparacion//${idNegocio}`).set(perfil.preparacion)
        }
        // Info perfil
        await this.db.object(`perfiles/${idNegocio}`).update(perfil)
        this.setPalabras(perfil)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  async setPalabras(perfil: Perfil) {
    let claves = ''
    const palabras = await this.palabrasService.getPalabrasClave()
    if (palabras) {
      claves = claves.concat(palabras + ' ')
    }
    claves = claves.concat(perfil.nombre + ' ')
    claves = claves.concat(perfil.categoria)
    claves = claves
      .toLocaleLowerCase()
      .split(' ')
      .filter((item, i, allItems) => i === allItems.indexOf(item))
      .join(' ')
    this.palabrasService.updateClaves(claves)
  }

  getSubCategorias(categoria: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const region = this.uidService.getRegion()
      const catSub = this.db.list(`categoriaSub/${region}/${categoria}`).valueChanges().subscribe((subCategorias: string[]) => {
        catSub.unsubscribe()
        resolve(subCategorias)
      })
    })
  }

  updateSubCategoria(subCategoriaAnterior: string[], perfil: Perfil) {
    return new Promise(async (resolve, reject) => {
      try {
        const idNegocio = this.uidService.getUid();
        if (perfil.abierto) {
          subCategoriaAnterior.forEach(async (s) => {
            const i = perfil.subCategoria.findIndex(sub => sub === s);
            if (i < 0) {
              await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/${s}/abiertos/${idNegocio}`).remove();
            }
          });
        } else {
          subCategoriaAnterior.forEach(async (su) => {
            const i = perfil.subCategoria.findIndex(subC => subC === su);
            if (i < 0) {
              await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/${su}/cerrados/${idNegocio}`).remove();
            }
          })
        }
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  uploadFoto(foto: string, tipo: string): Promise<any> {
    return new Promise (async (resolve, reject) => {
      const idNegocio = this.uidService.getUid()
      const ref = this.fireStorage.ref(`negocios/${tipo}/${idNegocio}`)
      const task = ref.putString( foto, 'base64', { contentType: 'image/jpeg'} )

      const p = new Promise ((resolver, rejecte) => {
        const tarea = task.snapshotChanges().pipe(
          finalize(async () => {
            const downloadURL = await ref.getDownloadURL().toPromise()
            tarea.unsubscribe()
            resolver(downloadURL)
          })
          ).subscribe(
            x => { },
            err => {
              rejecte(err)
            }
          )
      })
      resolve(p)
    })
  }

  borraFoto(foto: string) {
    return this.fireStorage.storage.refFromURL(foto).delete()
  }

  // Para busqueda page

  getProductos(): Promise<number> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid()
      const prodSub = this.db.object(`perfiles/${idNegocio}/productos`).valueChanges().subscribe((prods: number) => {
        prodSub.unsubscribe()
        resolve(prods)
      })
    })
  }

}
