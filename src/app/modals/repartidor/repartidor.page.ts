import { Component, OnInit, Input, NgZone } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';

import { CropImagePage } from '../crop-image/crop-image.page';

import { RepartidoresService } from 'src/app/services/repartidores.service';

import { RepartidorPreview, Repartidor } from 'src/app/interfaces/repartidor';
import { AlertService } from 'src/app/services/alert.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-repartidor',
  templateUrl: './repartidor.page.html',
  styleUrls: ['./repartidor.page.scss'],
})
export class RepartidorPage implements OnInit {

  @Input() repartidorPrev: RepartidorPreview;

  noFoto = '../../../assets/img/no-portada.png';
  fotoVieja = '';
  base64 = '';

  repartidor: Repartidor = {
    detalles: {
      correo: '',
      edad: null,
      pass: '',
      sexo: '',
      user: ''
    },
    preview: {
      foto: '',
      id: '',
      nombre: '',
      telefono: '',
      calificaciones: 1,
      promedio: 5
    }
  };

  guardando = false;
  bloquearUser = false;

  back: Subscription;

  constructor(
    private ngZone: NgZone,
    private platform: Platform,
    private modalCtrl: ModalController,
    private repartidorService: RepartidoresService,
    private alertService: AlertService,
  ) { }

  ngOnInit() {
    if (this.repartidorPrev) {
      this.fotoVieja = this.repartidorPrev.foto;
    }
    this.getRepartidor();
    this.listenErrores();
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      this.regresar();
    });
  }

  getRepartidor() {
    if (this.repartidorPrev) {
      this.repartidor.preview = this.repartidorPrev;
      this.repartidorService.getRepartidor(this.repartidor.preview.id).then(detalles => {
        this.repartidor.detalles = detalles;
        this.bloquearUser = true;
      });
    }
  }

  async cropImage(imageChangedEvent, aspect, quality, width) {
    const modal = await this.modalCtrl.create({
      component: CropImagePage,
      componentProps: {imageChangedEvent, aspect, quality, width}
    });
    modal.onWillDismiss().then(resp => {
      if (resp.data) {
        this.repartidor.preview.foto = resp.data;
        this.base64 = resp.data.split('data:image/png;base64,')[1];
      }
    });
    return await modal.present();
  }

  sexoElegido(event) {
    this.repartidor.detalles.sexo = event.detail.value;
  }

  async guardarCambios() {
    this.repartidor.preview.telefono = this.repartidor.preview.telefono.replace(/ /g, "");
    if (this.repartidor.preview.telefono.length !== 10) {
      this.alertService.presentAlert('Número incorrecto', 'El teléfono debe ser de 10 dígitos, por favor intenta de nuevo');
      return;
    }
    if (!this.repartidorPrev) {
      this.repartidor.detalles.correo = this.repartidor.detalles.user.replace(/ /g, "") + '@spot.com';
    }
    this.guardando = true;
    this.alertService.presentLoading();
    try {
      if (this.base64) {
        this.repartidor = await this.repartidorService.uploadFoto(this.base64, this.repartidor);
        this.base64 = '';
        if (this.fotoVieja) {
          this.repartidorService.borraFoto(this.fotoVieja);
        }
      }
      await this.repartidorService.setRepartidor(this.repartidor, this.repartidorPrev);
    } catch (error) {
      this.guardando = false;
      this.alertService.dismissLoading();
      this.alertService.presentAlert('Error', 'Algo salió mal. Por favor intenta de nuevo o comunícate con soporte' + error);
    }
  }

  eliminarRepartidor() {
    this.alertService.presentAlertAction(`Eliminar ${this.repartidor.preview.nombre}`, 
      `¿Estás segura(o) de eliinar a ${this.repartidor.preview.nombre}?
        Se borrarán todos sus datos de forma permanente`).then(async (resp) => {
          if (resp) {
            this.repartidorService.eliminarRepartidor(this.repartidor);
            this.repartidorService.getCreateUserResult().query.ref.off('child_added');
            this.modalCtrl.dismiss('eliminado');
          }
    });
  }

  regresar() {
    this.repartidorService.getCreateUserResult().query.ref.off('child_added');
    this.modalCtrl.dismiss();
  }

  // Auxiliares

  async listenErrores() {
    this.repartidorService.getCreateUserResult().query.ref.on('child_added', snapshot => {
      this.ngZone.run(() => {
        this.guardando = false;
        this.alertService.dismissLoading();
        const status = snapshot.val();
        this.repartidorService.cleanResult();
        switch (status) {
          case 'auth/email-already-exists':
            this.alertService.presentAlert('Email registrado',
              'El correo que intentas registrar corresponde a una cuenta existente. Intenta con otro');
            break;
          case 'auth/invalid-email':
            this.alertService.presentAlert('Email inválido', 'El correo que intentas registrar no corresponde a un email válido');
            break;
          case 'auth/invalid-password':
            this.alertService.presentAlert('Contraseña insegura', 'La contraseña debe tener al menos 6 caracteres');
            break;
          case 'ok':
            this.repartidorService.getCreateUserResult().query.ref.off('child_added');
            this.modalCtrl.dismiss(this.repartidor);
            break;
          default:
            this.alertService.presentAlert('Error', 'Algo salió mal, por favor intenta de nuevo');
            break;
        }
      });
    });
  }

}
