import { Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { AlertController, Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class SwUpdateService {

  constructor(
    private platform: Platform,
    private swUpdate: SwUpdate,
    private alertController: AlertController,
  ) { }

  async checkUpdates() {
    await this.platform.ready()
    if (this.platform.is('desktop')) return
    if (this.platform.is('mobileweb')) return
    if (this.platform.is('pwa')) {
      if (this.swUpdate.isEnabled) {
        this.swUpdate.available.subscribe(async () => {
          const alert = await this.alertController.create({
            header: `¡Nueva versión disponible!`,
            message: 'Obtén la última versión de nuestra App, sólo da click en Actulizar.' +
                      ' Seguimos trabajando para darte la mejor experiencia',
            buttons: [
              {
                text: 'Cancelar',
                role: 'cancel',
                cssClass: 'secondary',
              }, {
                text: 'Actualizar',
                handler: () => {
                  window.location.reload()
                },
              },
            ],
          })
          await alert.present()
        })
      }
    }
  }

}
