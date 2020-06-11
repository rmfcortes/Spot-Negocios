import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { AngularFireMessaging } from '@angular/fire/messaging';
import { AngularFireDatabase } from '@angular/fire/database';

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
    private toastController: ToastController,
    private afMessaging: AngularFireMessaging,
    private uidService: UidService,
  ) {  }

  requestToken() {
    return new Promise((resolve, reject) => {
      this.uid = this.uidService.getUid();
      if (!this.uid) {
        return resolve();
      }
      if (this.tokSub && this.token) {
        this.escuchaMensajes();
        return resolve();
      }
      this.tokSub = this.afMessaging.requestToken.subscribe(
          (token) => {
            this.db.object(`tokens/${this.uid}`).set(token);
            this.escuchaMensajes();
            resolve();
          },
          (error) => {
            console.error(error);
          }
        );
    });
  }

  escuchaMensajes() {
    this.msgSub = this.afMessaging.messages.subscribe((msg: any) => {
      this.presentToast(msg.notification.body);
    });
  }

  unsubscribeMensajes() {
    if (this.msgSub) { this.msgSub.unsubscribe(); }
    if (this.tokSub) { this.tokSub.unsubscribe(); }
  }

  async presentToast(mensaje) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 1500
    });
    toast.present();
  }

}
