import { Injectable } from '@angular/core';

import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';

import { UidService } from './uid.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  authChecked = false

  constructor(
    private db: AngularFireDatabase,
    public authFirebase: AngularFireAuth,
    private uidService: UidService,
  ) { }

  // Check isLog

  getAuthChecked() {
    return this.authChecked
  }

  setAuthChecked() {
    this.authChecked = true
  }

  async checkFireAuthTest() {
    return new Promise((resolve, reject) => {
      const authSub = this.authFirebase.authState.subscribe(async (resp) => {
        if (resp) {
          authSub.unsubscribe()
          this.setAuthChecked()
          const nombre = localStorage.getItem('nombre')
          await this.setUser(resp.uid, nombre)
          resolve(resp)
        } else {
          reject()
        }
      },
        err => reject(err)
      )
    })
  }

  getUid(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      let user
      user = this.uidService.getUid()
      if (user) return resolve(user)
      user = await this.getUser()
      if (user) return resolve(user)
      const persitent = localStorage.getItem('persistent')
      if (persitent) {
        user = await this.revisaFireAuth()
        if (user) return resolve(true)
      }
      return resolve(false)
    })
  }

  async getUser() {
    return new Promise (async (resolve, reject) => {
      if ( localStorage.getItem('uid') ) {
        const uid = localStorage.getItem('uid')
        resolve(uid)
      } else resolve(false)
    })
  }

  async revisaFireAuth() {
    return new Promise((resolve, reject) => {
      const authSub = this.authFirebase.authState.subscribe(async (user) => {
        authSub.unsubscribe()
        if (user) {
          if (localStorage.getItem('persistent')) this.persitent(user.uid, user.displayName)
          else this.notPersitent(user.uid, user.displayName)
          resolve(true)
        } else resolve(false)
      })
    })
  }

  checkAutorizacion(): Promise<boolean> {
    return new Promise((resolve, reject) => {      
      const uid = this.uidService.getUid()
      const aut = this.db.object(`perfiles/${uid}/autorizado`).valueChanges().subscribe(resp => {
        aut.unsubscribe();
        if (resp) resolve(true)
        else resolve(false)
      }, err => reject(err))
    })
  }

  // Auth
  async signInWithEmail(data): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        const resp = await this.authFirebase.auth.signInWithEmailAndPassword(data.email, data.password)
        if (data.isPersistent) this.persitent(resp.user.uid, resp.user.displayName)
        else this.notPersitent(resp.user.uid, resp.user.displayName)
        resolve(true)
      } catch (error) {
        if (error.code) {
          switch (error.code) {
            case 'auth/invalid-email':
             reject('Correo inválido')
              break;
            case 'auth/user-disabled':
             reject('Usuario deshabilitado')
              break;
            case 'auth/user-not-found':
             reject('Usuario no encontrado en la base de datos')
              break;
            case 'auth/wrong-password':
             reject('Contraseña incorrecta')
              break;
            default:
             reject('Lo sentimos, surgió un error inesperado. ' + error)
              break;
          }
        } else reject('Lo sentimos, surgió un error inesperado. ' + error)
      }
    })
  }

  persitent(uid, nombre) {
    return new Promise (async (resolve, reject) => {
      localStorage.setItem('uid', uid)
      localStorage.setItem('nombre', nombre)
      localStorage.setItem('persistent', 'true')
      this.uidService.setUid(uid)
      this.uidService.setNombre(nombre)
      resolve()
    })
  }


  notPersitent(uid, nombre) {
    return new Promise (async (resolve, reject) => {
      localStorage.removeItem('persistent')
      this.uidService.setUid(uid)
      this.uidService.setNombre(nombre)
      resolve()
    })
  }

  // SetUser

  setUser(uid, nombre) {
    return new Promise (async (resolve, reject) => {
      localStorage.setItem('uid', uid)
      localStorage.setItem('nombre', nombre)
      this.uidService.setUid(uid)
      this.uidService.setNombre(nombre)
      resolve()
    })
  }

   // Logout

   async logout() {
    return new Promise(async (resolve, reject) => {
      try {
        setTimeout(async () => {
          await this.authFirebase.auth.signOut()
          localStorage.removeItem('uid')
          localStorage.removeItem('nombre')
          localStorage.removeItem('plan')
          localStorage.removeItem('region')
          localStorage.removeItem('persistent')
          localStorage.removeItem('first_date')
          this.uidService.setUid(null)
          this.uidService.setNombre(null)
          this.uidService.setPlan(null)
          this.uidService.setRegion(null)
          resolve()
        }, 500)
      } catch (error) {
        reject(error)
      }
    })
  }

    // Reset password
    async resetPass(email) {
      return new Promise(async (resolve, reject) => {
        try {
          await this.authFirebase.auth.sendPasswordResetEmail(email)
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    }

}
