import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { Platform } from '@ionic/angular';
import { Network } from '@ionic-native/network/ngx';
import { BehaviorSubject, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {

  public isConnected = new BehaviorSubject(true);
  connectSub: Subscription;
  disconnectSub: Subscription;

  reporte = [];

  constructor(
    private network: Network,
    private storage: Storage,
    private platform: Platform,
  ) { }

  checkNetStatus() {
    if (!this.disconnectSub) {
      this.disconnectSub = this.network.onDisconnect().subscribe(() => {
        const rep = {
          connect: false,
          time: Date.now()
        };
        this.reporte.push(rep);
        this.saveNetStatus();
        this.isConnected.next(false);
      });
    }

    if (!this.connectSub) {
      this.connectSub = this.network.onConnect().subscribe(() => {
        const rep = {
          connect: true,
          time: Date.now()
        };
        this.reporte.push(rep);
        this.saveNetStatus();
        this.isConnected.next(true);
      });
    }
  }

  saveNetStatus() {
    if (this.platform.is('cordova')) {
      this.storage.ready().then(() => {
        this.storage.ready().then(() => {
          this.storage.set('netStatus', JSON.stringify(this.reporte));
        });
      });
    } else {
      localStorage.setItem('netStatus', JSON.stringify(this.reporte));
    }
  }

  getNetStatus() {
    return new Promise ( (resolve, reject) => {
      if ( this.platform.is('cordova') ) {
        // Celular
        this.storage.ready().then(() => {
          this.storage.get('netStatus').then( val => {
            if ( val ) {
              resolve(JSON.parse(val));
            } else {
              resolve(null);
            }
          });
        });
      } else {
        // Escritorio
        if ( localStorage.getItem('netStatus') ) {
          resolve(JSON.parse(localStorage.getItem('netStatus')));
        } else {
          resolve(null);
        }
      }
    });
  }

  stopCheckNet() {
    if (this.disconnectSub) { this.disconnectSub.unsubscribe(); }
    if (this.connectSub) { this.connectSub.unsubscribe(); }
  }
}
