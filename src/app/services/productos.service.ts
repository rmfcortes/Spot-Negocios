import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';

import { BusquedaService } from './busqueda.service';
import { PerfilService } from './perfil.service';
import { UidService } from './uid.service';

import { Producto, Complemento } from '../interfaces/producto';
import { InfoPasillos, Pasillo } from '../interfaces/pasillo';
import { Perfil } from '../interfaces/perfil';

@Injectable({
  providedIn: 'root'
})


export class ProductosService {

  constructor(
    private db: AngularFireDatabase,
    private fireStorage: AngularFireStorage,
    private palabrasService: BusquedaService,
    private perfilService: PerfilService,
    private uidService: UidService,
  ) { }

  getProductosAgregados(): Promise<number> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid();
      const proSub = this.db.object(`perfiles/${idNegocio}/productos`).valueChanges().subscribe((num: number) => {
        proSub.unsubscribe()
        if (!num) num = 0
        resolve(num)
      })
    })
  } 

  getTipo(): Promise<string> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid()
      const tipoSub = this.db.object(`perfiles/${idNegocio}/tipo`).valueChanges().subscribe((tipo: string) => {
        tipoSub.unsubscribe()
        resolve(tipo)
      })
    })
  }

  getCategoria(): Promise<string> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid()
      const catSub = this.db.object(`perfiles/${idNegocio}/categoria`).valueChanges().subscribe((categoria: string) => {
        catSub.unsubscribe()
        resolve(categoria)
      })
    })
  }

  getPasillos(categoria): Promise<InfoPasillos> {
    const idNegocio = this.uidService.getUid()
    return new Promise((resolve, reject) => {
      const detSub = this.db.object(`negocios/pasillos/${categoria}/${idNegocio}`).valueChanges()
        .subscribe((pasillos: InfoPasillos) => {
          detSub.unsubscribe()
          resolve(pasillos)
        })
    })
  }

  getComplementos(idProducto: string): Promise<Complemento[]> {
    const idNegocio = this.uidService.getUid()
    return new Promise((resolve, reject) => {
      const comSub = this.db.list(`negocios/complementos/${idNegocio}/${idProducto}`).valueChanges()
        .subscribe((complementos: Complemento[]) => {
          comSub.unsubscribe()
          resolve(complementos)
        })
    })
  }

  changeVista(vista: string, categoria: string) {
    const idNegocio = this.uidService.getUid();
    this.db.object(`negocios/pasillos/${categoria}/${idNegocio}/vista`).set(vista);
  }

  getProductos(tipo: string, categoria: string, pasillo: string, batch: number, lastKey: string): Promise<Producto[]> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid()
      if (lastKey) {
        const x = this.db.list(`negocios/${tipo}/${categoria}/${idNegocio}/${pasillo}`, data =>
          data.orderByKey().limitToFirst(batch).startAt(lastKey)).valueChanges().subscribe(async (productos: Producto[]) => {
            x.unsubscribe()
            resolve(productos)
          })
      } else {
        const x = this.db.list(`negocios/${tipo}/${categoria}/${idNegocio}/${pasillo}`, data =>
          data.orderByKey().limitToFirst(batch)).valueChanges().subscribe(async (productos: Producto[]) => {
            x.unsubscribe()
            resolve(productos)
          })
      }
    })
  }

  getOfertas(tipo: string, categoria: string): Promise<Producto[]> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid();
      const x = this.db.list(`negocios/${tipo}/${categoria}/${idNegocio}/Ofertas`)
        .valueChanges().subscribe(async (productos: Producto[]) => {
          x.unsubscribe()
          resolve(productos)
        })
    })
  }

  setProducto(producto: Producto, categoria: string, complementos: Complemento[], tipo: string, agregados: number, nuevo: boolean, plan: string, iPasillo: number) {
    const region = this.uidService.getRegion()
    return new Promise(async (resolve, reject) => {
      try {
        const idNegocio = this.uidService.getUid()
        if (complementos && complementos.length > 0) {
          complementos.sort((a, b) => (a.obligatorio === b.obligatorio)? 0 : a.obligatorio? -1 : 1)
          await this.db.object(`negocios/complementos/${idNegocio}/${producto.id}`).set(complementos)
          producto.variables = true
        } else {
          producto.variables = false
        }
        await this.db.object(`negocios/${tipo}/${categoria}/${idNegocio}/${producto.pasillo}/${producto.id}`).update(producto)
        if (producto.pasillo === 'Ofertas') {
          const oferta = {
            categoria,
            foto: producto.foto,
            id: producto.id,
            idNegocio
          }
          const subs = await this.getSubCategorias()
          await this.db.object(`ofertas/${region}/${categoria}/${producto.id}`).update(oferta)
          await this.db.object(`ofertas/${region}/todas/${producto.id}`).update(oferta)
          for (const item of subs) {
            await this.db.object(`ofertas/${region}/subCategorias/${categoria}/${item}/${producto.id}`).update(oferta)
          }
        }
        if (nuevo) {
          await this.db.object(`perfiles/${idNegocio}/productos`).query.ref.transaction(productos => productos ? productos + 1 : 1)
          await this.db.object(`negocios/pasillos/${categoria}/${idNegocio}/pasillos/${iPasillo}/cantidad`).query.ref.transaction(productos => productos ? productos + 1 : 1)
        }
        this.setPalabras(producto)
        if (agregados === 0) await this.setDisplay(plan)
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  busca(tipo: string, categoria: string, pasillos: Pasillo[], codigo: string): Promise<Producto[]> {
    return new Promise((resolve, reject) => {      
      const uid = this.uidService.getUid()
      let productos: Producto[] = []
      pasillos.forEach((p, i) => {
        const busSub = this.db.list(`negocios/${tipo}/${categoria}/${uid}/${p.nombre}`,
        data => data.orderByChild('codigo').startAt(codigo).endAt(codigo + '\uf8ff'))
        .valueChanges().subscribe((prods: Producto[]) => {
          busSub.unsubscribe()
          productos = productos.concat(prods)
          if (i === pasillos.length - 1) resolve(productos)
        })
      })
    })
  }

  deleteProducto(producto: Producto, tipo: string, categoria: string, agregados: number, iPasilloViejo: number): Promise<boolean> {
    const region = this.uidService.getRegion()
    return new Promise(async (resolve, reject) => {
      try {        
        const idNegocio = this.uidService.getUid()
        this.borraFoto(producto.url)
        if (producto.foto) this.borraFoto(producto.foto)
        await this.db.object(`negocios/${tipo}/${categoria}/${idNegocio}/${producto.pasillo}/${producto.id}`).remove()
        if (producto.variables) {
          await this.db.object(`negocios/complementos/${idNegocio}/${producto.id}`).remove()
        }
        if (producto.pasillo === 'Ofertas') {
          await this.db.object(`ofertas/${region}/${categoria}/${producto.id}`).remove()
          await this.db.object(`ofertas/${region}/todas/${producto.id}`).remove()
          const subs = await this.getSubCategorias()
          for (const item of subs) {
            await this.db.object(`ofertas/${region}/subCategorias/${categoria}/${item}/${producto.id}`).remove()
          }
        }
        await this.db.object(`perfiles/${idNegocio}/productos`).query.ref.transaction(productos => productos ? productos - 1 : 0)
        await this.db.object(`negocios/pasillos/${categoria}/${idNegocio}/pasillos/${iPasilloViejo}/cantidad`).query.ref.transaction(productos => productos ? productos - 1 : 0)
        if (agregados === 1) this.removeDisplay()
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  async changePasillo(categoria: string, pasilloViejo: string, idProducto: string, tipo: string, producto: Producto, iPasilloViejo: number, iPasillo: number) {
    const region = this.uidService.getRegion()
    const idNegocio = this.uidService.getUid()
    await this.db.object(`negocios/pasillos/${categoria}/${idNegocio}/pasillos/${iPasilloViejo}/cantidad`).query.ref.transaction(productos => productos ? productos - 1 : 0)
    await this.db.object(`negocios/pasillos/${categoria}/${idNegocio}/pasillos/${iPasillo}/cantidad`).query.ref.transaction(productos => productos ? productos + 1 : 1)
    await this.db.object(`negocios/${tipo}/${categoria}/${idNegocio}/${pasilloViejo}/${idProducto}`).update(producto)
    await this.db.object(`negocios/${tipo}/${categoria}/${idNegocio}/${pasilloViejo}/${idProducto}/mudar`).set(true)
    this.db.object(`negocios/${tipo}/${categoria}/${idNegocio}/${pasilloViejo}/${idProducto}`).remove()
    if (pasilloViejo === 'Ofertas') {
      this.db.object(`ofertas/${region}/${categoria}/${idProducto}`).remove()
      this.db.object(`ofertas/${region}/todas/${idProducto}`).remove()
      const subs = await this.getSubCategorias()
      for (const item of subs) {
        await this.db.object(`ofertas/${region}/subCategorias/${categoria}/${item}/${producto.id}`).remove()
      }
    }
  }

  uploadFoto(foto: string, producto: Producto, origen: string): Promise<any> {
    return new Promise (async (resolve, reject) => {
      const idNegocio = this.uidService.getUid();
      if (!producto.id) {
        producto.id = this.db.createPushId();
      }
      const ref = this.fireStorage.ref(`negocios/productos/${idNegocio}/${producto.id}/${origen}`);
      const task = ref.putString( foto, 'base64', { contentType: 'image/jpeg'} );

      const p = new Promise ((resolver, rejecte) => {
        const tarea = task.snapshotChanges().pipe(
          finalize(async () => {
            const url = await ref.getDownloadURL().toPromise();
            tarea.unsubscribe();
            resolver(url);
          })
          ).subscribe(
            x => { },
            err => {
              rejecte(err);
            }
          );
      });
      resolve(p);
    });
  }

  borraFoto(foto: string) {
    return this.fireStorage.storage.refFromURL(foto).delete();
  }

  async setPalabras(producto: Producto) {
    let claves = '';
    const palabras = await this.palabrasService.getPalabrasClave();
    if (palabras) {
      claves = claves.concat(palabras + ' ');
    }
    claves = claves.concat(producto.nombre);
    claves = claves
      .toLocaleLowerCase()
      .split(' ')
      .filter((item, i, allItems) => i === allItems.indexOf(item))
      .join(' ');
    this.palabrasService.updateClaves(claves);
  }

  // Auxiliar
  setDisplay(plan: string) {
    return new Promise(async (resolve, reject) => {
      const idNegocio = this.uidService.getUid()
      try {        
        // Info preview
        const perfil: Perfil = await this.perfilService.getPerfil()
        const calificacion = {
          calificaciones: 5,
          promedio: 5,
        }
        const preview: any = {
          abierto: perfil.abierto,
          foto: perfil.logo,
          id: perfil.id,
          nombre: perfil.nombre,
          tipo: perfil.tipo,
          calificaciones: 5,
          promedio: 5,
          direccion: perfil.direccion
        }
        if (perfil.tipo === 'productos') {
          if (perfil.envio_gratis_pedMin) preview.envio_gratis_pedMin = perfil.envio_gratis_pedMin
          if (perfil.envio_desp_pedMin) preview.envio_desp_pedMin = perfil.envio_desp_pedMin
          if (perfil.envio) preview.envio = perfil.envio
          preview.envio_costo_fijo = perfil.envio_costo_fijo ? true : false
          preview.repartidores_propios = perfil.repartidores_propios
        }
        if (perfil.abierto) {
          perfil.subCategoria.forEach(async (s) => {
            await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/${s}/abiertos/${idNegocio}`).update(preview)
          })
          await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/todos/abiertos/${idNegocio}`).update(preview)
          const abierto = {
            abierto: true,
            idNegocio
          }
          await this.db.object(`isOpen/${perfil.region}/${idNegocio}`).update(abierto)
        } else {
          perfil.subCategoria.forEach(async(su) => {
            await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/${su}/cerrados/${idNegocio}`).update(preview)
          })
          await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/todos/cerrados/${idNegocio}`).update(preview)
          const cerrado = {
            abierto: false,
            idNegocio
          }
          await this.db.object(`isOpen/${perfil.region}/${idNegocio}`).update(cerrado)
        }


        // Info functions
        const infoFun: any = {
          abierto: perfil.abierto,
          categoria: perfil.categoria,
          foto: perfil.logo,
          idNegocio: perfil.id,
          nombre: perfil.nombre,
          subCategoria: perfil.subCategoria,
          tipo: perfil.tipo,
          calificaciones: 5,
          promedio: 5,
          plan,
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


        // Info busqueda
        const busqueda: any = {
          abierto: perfil.abierto,
          categoria: perfil.categoria,
          foto: perfil.logo,
          idNegocio,
          nombre: perfil.nombre,
          tipo: perfil.tipo,
          direccion: perfil.direccion,
          promedio: 5,
          calificaciones: 5,
        }
        if (perfil.tipo === 'productos') {
          if (perfil.envio_gratis_pedMin) busqueda.envio_gratis_pedMin = perfil.envio_gratis_pedMin
          if (perfil.envio_desp_pedMin) busqueda.envio_desp_pedMin = perfil.envio_desp_pedMin
          if (perfil.envio) busqueda.envio = perfil.envio
          busqueda.envio_costo_fijo = perfil.envio_costo_fijo ? true : false
          busqueda.repartidores_propios = perfil.repartidores_propios
        }
        if (plan === 'basico') delete busqueda.idNegocio
        await this.db.object(`busqueda/${perfil.region}/${idNegocio}`).update(busqueda)
        await this.db.object(`rate/resumen/${idNegocio}`).update(calificacion)
        await this.db.object(`categoria/${perfil.region}/${perfil.categoria}/cantidad`).query.ref.transaction(cantidad => cantidad ? cantidad + 1 : 1)
        resolve()
      } catch (error) {
        this.db.object(`perfiles/${idNegocio}/productos`).set(0)
        reject(error)
      }
    })
  }

  removeDisplay() {
    return new Promise(async (resolve, reject) => {
      try {        
        // Info preview
        const perfil: Perfil = await this.perfilService.getPerfil()
        const idNegocio = this.uidService.getUid()
        if (perfil.abierto) {
          perfil.subCategoria.forEach(async (s) => {
            await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/${s}/abiertos/${idNegocio}`).remove()
          })
          await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/todos/abiertos/${idNegocio}`).remove()
          await this.db.object(`isOpen/${perfil.region}/${idNegocio}`).remove()
        } else {
          perfil.subCategoria.forEach(async(su) => {
            await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/${su}/cerrados/${idNegocio}`).remove()
          })
          await this.db.object(`negocios/preview/${perfil.region}/${perfil.categoria}/todos/cerrados/${idNegocio}`).remove()
          await this.db.object(`isOpen/${perfil.region}/${idNegocio}`).remove()
        }
        // Info functions
        await this.db.object(`functions/${perfil.region}/${idNegocio}`).remove()
        // Info busqueda
        await this.db.object(`busqueda/${perfil.region}/${idNegocio}/idNegocio`).remove()
        await this.db.object(`rate/resumen/${idNegocio}`).remove()
        resolve()
      } catch (error) {
        reject(error)
      }
    })
  }

  getSubCategorias(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const uid = this.uidService.getUid()
      const subSub = this.db.list(`perfiles/${uid}/subCategoria`).valueChanges().subscribe((subCategorias: string[]) => {
        subSub.unsubscribe()
        resolve(subCategorias)
      })
    })
  }

}
