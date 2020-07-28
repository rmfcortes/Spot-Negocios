import { Injectable } from '@angular/core';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  loader: any;

  constructor(
    public loadingCtrl: LoadingController,
    private alertController: AlertController,
    private toastController: ToastController,
  ) { }

  async presentToast(mensaje) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000
    })
    toast.present()
  }  

  async presentToastButton(mensaje) {
    const toast = await this.toastController.create({
      message: mensaje,
      buttons: [
        {
          side: 'end',
          text: 'Aceptar'
        }
      ]
    })
    toast.present()
  }

  async presentAlertRadio(titulo, msn, inputs) {
    return new Promise(async (resolve, reject) => {
      const alert = await this.alertController.create({
        header: titulo,
        message: msn,
        inputs,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            cssClass: 'secondary',
            handler: () => {
              resolve(false);
            }
          }, {
            text: 'Asignar',
            handler: (data) => {
              resolve(data);
            }
          }
        ]
      });

      await alert.present();
    });
  }

  async presentAlert(titulo: string, msn: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: msn,
      buttons: [
        {
          text: 'Ok',
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            console.log('Confirm Cancel: blah');
          }
        }
      ]
    })

    await alert.present()
  }

  async presentAlertPrompt(header: string, placeholder: string, btnAceptar: string, btnCancelar: string, message?: string) {
    return new Promise(async (resolve, reject) => {
      const alert = await this.alertController.create({
        header,
        message,
        inputs: [
          {
            name: 'name1',
            type: 'text',
            placeholder
          },
        ],
        buttons: [
          {
            text: btnCancelar,
            role: 'cancel',
            cssClass: 'secondary',
          }, {
            text: btnAceptar,
            handler: (data) => {
              resolve(data.name1)
            }
          }
        ]
      })
      await alert.present()
    })
  }

  async presentPromptComplementos() {
    return new Promise(async (resolve, reject) => {
      const alert = await this.alertController.create({
        header: 'Nuevo producto',
        inputs: [
          {
            name: 'nombre',
            type: 'text',
            placeholder: 'Nombre'
          },
          {
            name: 'precio',
            min: 0,
            type: 'number',
            placeholder: 'Precio extra'
          }
        ],
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            cssClass: 'secondary',
            handler: () => {
              console.log('Confirm Cancel');
            }
          }, {
            text: 'Ok',
            handler: (data) => {
              resolve(data)
            }
          }
        ]
      })
      await alert.present()
    })
  }

  async presentPromptPreparacion(title: string, msn: string) {
    return new Promise(async (resolve, reject) => {
      const alert: HTMLIonAlertElement = await this.alertController.create({
        header: title,
        message: msn,
        inputs: [
          {
            name: 'preparacion',
            min: 0,
            type: 'number',
            placeholder: 'Ej. 5, 10, 15',
            
          }
        ],
        buttons: [
          {
            text: 'Aceptar',
            handler: (data) => {
              resolve(data)
            }
          }
        ]
      })
      await alert.present()
    })
  }

  async presentAlertAction(titulo: string, msn: string, txtAceptar: string, txtCancelar: string) {
    return new Promise(async (resolve, reject) => {
      const alert = await this.alertController.create({
        header: titulo,
        message: msn,
        buttons: [
          {
            text: txtCancelar,
            role: 'cancel',
            cssClass: 'secondary',
            handler: (blah) => {
              resolve(false);
            }
          },
          {
            text: txtAceptar,
            cssClass: 'secondary',
            handler: (blah) => {
              resolve(true);
            }
          }
        ]
      })

      await alert.present()
    })
  }

  async presentLoading(message?: string) {
    this.loader = await this.loadingCtrl.create({
     spinner: 'crescent',
     message
    })
    return await this.loader.present()
  }

  dismissLoading() {
    if (this.loader) this.loader.dismiss()
  }

  playAlert() {
    const audio = new Audio()
    audio.src = '../../assets/sound/notification.mp3'
    audio.play()
  }


  formatDate(d: Date): Promise<string> {
    return new Promise((resolve, reject) => {        
        let month = '' + (d.getMonth() + 1)
        let day = '' + d.getDate()
        const year = d.getFullYear()
    
        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;
    
        resolve([year, month, day].join('-'))
    })
  }

}
