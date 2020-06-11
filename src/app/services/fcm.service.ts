import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

import { AngularFireMessaging } from '@angular/fire/messaging';
import { AngularFireDatabase } from '@angular/fire/database';

import { AlertService } from './alert.service';
import { UidService } from './uid.service';

@Injectable({
  providedIn: 'root'
})
export class FcmService {

  token: string;
  uid: string;
  msgSub: Subscription;
  tokSub: Subscription;

  constructor(
    private db: AngularFireDatabase,
    private afMessaging: AngularFireMessaging,
    private alertService: AlertService,
    private uidService: UidService,
  ) {  }

  async requestToken(plan: string) {
    this.uid = this.uidService.getUid()
    if (!this.uid) return 
    if (this.token) {
      this.escuchaMensajes()
      return 
    }
    const token = await this.getToken(this.uid)
    if (token) {
      this.token = token
      this.escuchaMensajes()
      return
    }
    this.alertService.presentAlertAction('', `Tu plan ${plan} te permite recibir pedidos en línea.
    ¿Te gustaría activar las notificaciones en este sitio para recibir alertas de pedidos entrantes?`, 'Activar notificaciones', 'Cancelar')
    .then(resp => {
      if (resp) {
        this.tokSub = this.afMessaging.requestToken.subscribe(
            (token) => {
              this.db.object(`tokens/${this.uid}`).set(token)
              this.escuchaMensajes()
            },
            (error) => {
              console.error(error)
            }
          )
      }
    })
  }

  getToken(idNegocio: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.db.object(`tokens/${idNegocio}`).query.ref.once('value').then(resp => {
        if (resp) resolve(resp.val())
        else resolve(null)
      })
    })
  }

  escuchaMensajes() {
    this.msgSub = this.afMessaging.messages.subscribe((msg: any) => {
      this.alertService.presentToast(msg.notification.body)
    })
  }

  unsubscribeMensajes() {
    if (this.msgSub) this.msgSub.unsubscribe()
    if (this.tokSub) this.tokSub.unsubscribe()
  }

}
