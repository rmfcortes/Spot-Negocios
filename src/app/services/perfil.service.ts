import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';

import { UidService } from './uid.service';

import { Perfil, SubCategoria, IsOpen } from '../interfaces/perfil';


@Injectable({
  providedIn: 'root'
})
export class PerfilService {

  constructor(
    private db: AngularFireDatabase,
    private fireStorage: AngularFireStorage,
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
          }
        } else {
          datosPasillo = {
            portada: perfil.portada,
          }
        }
        await this.db.object(`negocios/pasillos/${perfil.categoria}/${idNegocio}`).update(datosPasillo)
    
        // Info detalles
        const detalles = {
          descripcion: perfil.descripcion,
          telefono: perfil.telefono
        }
        await this.db.object(`negocios/detalles/${perfil.categoria}/${idNegocio}`).update(detalles)
    
        // Info datos-pedido & preparacion if tipo productos
        if (perfil.tipo === 'productos') {
          const datosPedido = {
            entrega: perfil.entrega,
            telefono: perfil.telefono,
            formas_pago: perfil.formas_pago
          }
          await this.db.object(`negocios/datos-pedido/${perfil.categoria}/${idNegocio}`).update(datosPedido)
        }
        if (perfil.preparacion && perfil.tipo === 'productos') {
          await this.db.object(`preparacion//${idNegocio}`).set(perfil.preparacion)
        }
        // Info perfil
        await this.db.object(`perfiles/${idNegocio}`).update(perfil)
        if (perfil.productos && perfil.productos > 0) this.setDisplay(perfil)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  setDisplay(perfil: Perfil) {
    return new Promise(async (resolve, reject) => {
      try {        
        // Info preview
        const idNegocio = this.uidService.getUid()
        const abierto = await this.isOpen()
        const preview: any = {
          abierto,
          foto: perfil.logo,
          nombre: perfil.nombre,
          direccion: perfil.direccion
        }
        if (perfil.tipo === 'productos') {
          if (perfil.envio_gratis_pedMin) preview.envio_gratis_pedMin = perfil.envio_gratis_pedMin
          if (perfil.envio_desp_pedMin) preview.envio_desp_pedMin = perfil.envio_desp_pedMin
          if (perfil.envio) preview.envio = perfil.envio
          preview.envio_costo_fijo = perfil.envio_costo_fijo ? true : false
          preview.repartidores_propios = perfil.repartidores_propios
        }
        if (abierto) {
          perfil.subCategoria.forEach(async (s) => {
            await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/${s}/abiertos/${idNegocio}`).update(preview)
          })
          await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/todos/abiertos/${idNegocio}`).update(preview)
        } else {
          perfil.subCategoria.forEach(async(su) => {
            await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/${su}/cerrados/${idNegocio}`).update(preview)
          })
          await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/todos/cerrados/${idNegocio}`).update(preview)
        }


        // Info functions
        const infoFun: any = {
          abierto,
          foto: perfil.logo,
          nombre: perfil.nombre,
          subCategoria: perfil.subCategoria,
          direccion: perfil.direccion
        }
        if (perfil.tipo === 'productos') {
          if (perfil.envio_gratis_pedMin) infoFun.envio_gratis_pedMin = perfil.envio_gratis_pedMin
          if (perfil.envio_desp_pedMin) infoFun.envio_desp_pedMin = perfil.envio_desp_pedMin
          if (perfil.envio) infoFun.envio = perfil.envio
          infoFun.envio_costo_fijo = perfil.envio_costo_fijo ? true : false
          infoFun.repartidores_propios = perfil.repartidores_propios

        }
        await this.db.object(`functions/${perfil.region}/${idNegocio}`).update(infoFun)

        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  isOpen(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid()
      const region = this.uidService.getRegion()
      const abiertoSub = this.db.object(`isOpen/${region}/${idNegocio}/abierto`)
      .valueChanges().subscribe((abierto: boolean) => {
        abiertoSub.unsubscribe()
        resolve(abierto)
      })
    })
  }

  getSubCategorias(categoria: string): Promise<SubCategoria[]> {
    return new Promise((resolve, reject) => {
      const region = this.uidService.getRegion()
      const catSub = this.db.list(`categoriaSub/${region}/${categoria}`).valueChanges().subscribe((subCategorias: SubCategoria[]) => {
        catSub.unsubscribe()
        resolve(subCategorias)
      })
    })
  }

  updateSubCategoria(subCategoriaAnterior: string[], perfil: Perfil) {
    return new Promise(async (resolve, reject) => {
      try {
        const idNegocio = this.uidService.getUid()
        const abierto = await this.isOpen()
        if (abierto) {
          subCategoriaAnterior.forEach(async (s) => {
            const i = perfil.subCategoria.findIndex(sub => sub === s);
            if (i < 0) {
              await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/${s}/abiertos/${idNegocio}`).remove()
            }
          });
        } else {
          subCategoriaAnterior.forEach(async (su) => {
            const i = perfil.subCategoria.findIndex(subC => subC === su);
            if (i < 0) {
              await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/${su}/cerrados/${idNegocio}`).remove()
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


}
