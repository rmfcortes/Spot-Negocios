import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';

import { AngularFireDatabase } from '@angular/fire/database';

import { Region } from '../interfaces/region.interface';
import { UidService } from './uid.service';

@Injectable({
  providedIn: 'root'
})
export class RegionService {

  constructor(
    private storage: Storage,
    private platform: Platform,
    private db: AngularFireDatabase,
    private uidService: UidService,
  ) { }

  getRegion(): Promise<string> {
    return new Promise((resolve, reject) => {
      const idNegocio = this.uidService.getUid()
      const regSub = this.db.object(`perfiles/${idNegocio}/region`).valueChanges().subscribe((region: string) => {
        regSub.unsubscribe()
        resolve(region)
      })
    })
  }

  getUbicacionRegion(region: string): Promise<Region> {
    return new Promise((resolve, reject) => {
      const regSub = this.db.object(`ciudades/${region}`).valueChanges().subscribe((region: Region) => {
        regSub.unsubscribe();
        resolve(region);
      });
    });
  }

  getRegionStorage(): Promise<boolean> {
    return new Promise (async (resolve, reject) => {
      if ( localStorage.getItem('region') ) {
        const region = localStorage.getItem('region')
        this.uidService.setRegion(region)
        resolve(true)
      } else resolve(false)
    })
  }

  getRegiones(): Promise<Region[]> {
    return new Promise((resolve, reject) => {
      const regSub = this.db.list(`ciudades`).valueChanges().subscribe((regiones: Region[]) => {
        regSub.unsubscribe()
        resolve(regiones)
      })
    })
  }

  setRegion(region: string) {
    return new Promise (async (resolve, reject) => {
      const idNegocio = this.uidService.getUid();
      if (this.platform.is ('cordova')) {
        this.storage.set('region', region);
      } else {
        localStorage.setItem('region', region);
      }
      this.db.object(`perfiles/${idNegocio}/region`).set(region);
      this.uidService.setRegion(region);
      resolve();
    });
  }


  checkRegion(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      let region
      region = await this.uidService.getRegion()
      if (region) return resolve(true)
      region = await this.getRegionStorage()
      if (region) return resolve(true)
      region = await this.getRegion()
      if (region) { 
        this.setRegion(region)
        return resolve(true);
      }
      return resolve(false)
    })
  }

}
