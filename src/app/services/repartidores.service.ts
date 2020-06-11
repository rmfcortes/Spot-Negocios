import { Injectable } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { AngularFireDatabase } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';

import { UidService } from './uid.service';
import { RepartidorPreview, RepartidorDetalles, Repartidor } from '../interfaces/repartidor';

@Injectable({
  providedIn: 'root'
})
export class RepartidoresService {

  constructor(
    private db: AngularFireDatabase,
    private fireStorage: AngularFireStorage,
    private uidService: UidService,
  ) { }

  getRepartidores(): Promise<RepartidorPreview[]> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid();
      const repSub = this.db.list(`repartidores/${idNegocio}/preview`).valueChanges()
        .subscribe((repartidores: RepartidorPreview[]) => {
          repSub.unsubscribe();
          resolve(repartidores);
        });
    });
  }

  getRepartidor(idRepartidor: string): Promise<RepartidorDetalles> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid();
      const repSub = this.db.object(`repartidores/${idNegocio}/detalles/${idRepartidor}`).valueChanges()
        .subscribe((repartidor: RepartidorDetalles) => {
          repSub.unsubscribe();
          resolve(repartidor);
        });
    });
  }

  setRepartidor(repartidor: Repartidor, infoPrev: RepartidorPreview) {
    return new Promise(async (resolve, reject) => {
      try {
        const idNegocio = this.uidService.getUid();
        if (!infoPrev) {
          await this.db.list(`nuevoColaborador/${idNegocio}`).push(repartidor);
        } else {
          await this.db.object(`repartidores/${idNegocio}/detalles/${repartidor.preview.id}`).update(repartidor.detalles);
          await this.db.object(`repartidores/${idNegocio}/preview/${repartidor.preview.id}`).update(repartidor.preview);
        }
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  eliminarRepartidor(repartidor: Repartidor) {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid();
      this.borraFoto(repartidor.preview.foto);
      this.db.object(`repartidores/${idNegocio}/detalles/${repartidor.preview.id}`).remove();
      this.db.object(`repartidores/${idNegocio}/preview/${repartidor.preview.id}`).remove();
      resolve();
    });
  }

  uploadFoto(foto: string, repartidor: Repartidor): Promise<any> {
    return new Promise (async (resolve, reject) => {
      const idNegocio = this.uidService.getUid();
      let id;
      if (!repartidor.preview.id) {
        id = this.db.createPushId();
      } else {
        id = repartidor.preview.id;
      }
      const ref = this.fireStorage.ref(`negocios/repartidores/${idNegocio}/${id}`);
      const task = ref.putString( foto, 'base64', { contentType: 'image/jpeg'} );

      const p = new Promise ((resolver, rejecte) => {
        const tarea = task.snapshotChanges().pipe(
          finalize(async () => {
            repartidor.preview.foto = await ref.getDownloadURL().toPromise();
            tarea.unsubscribe();
            resolver(repartidor);
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

  getCreateUserResult() {
    const idNegocio = this.uidService.getUid();
    return this.db.object(`result/${idNegocio}`);
  }

  cleanResult() {
    const idNegocio = this.uidService.getUid();
    this.db.object(`result/${idNegocio}`).remove();
    this.db.object(`nuevoColaborador/${idNegocio}`).remove();
  }

}
