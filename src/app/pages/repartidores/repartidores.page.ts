import { Component, OnInit, NgZone } from '@angular/core';
import { ModalController, Platform, MenuController } from '@ionic/angular';
import { HostListener } from "@angular/core";
import { Subscription } from 'rxjs';

import { CropImagePage } from 'src/app/modals/crop-image/crop-image.page';

import { RepartidoresService } from 'src/app/services/repartidores.service';
import { AlertService } from 'src/app/services/alert.service';

import { RepartidorPreview, Repartidor } from 'src/app/interfaces/repartidor';

@Component({
  selector: 'app-repartidores',
  templateUrl: './repartidores.page.html',
  styleUrls: ['./repartidores.page.scss'],
})
export class RepartidoresPage implements OnInit {

  @HostListener('window:resize', ['$event'])
  getScreenSize() {
    this.scrHeight = window.innerHeight
    this.scrWidth = window.innerWidth
  }
  scrHeight: number
  scrWidth: number
  hideMainCol = false

  repartidores: RepartidorPreview[] = []
  repartidoresReady = false

  noRepartidor = '../../../assets/img/avatar/no-repartidor.jpg'

  ////////////// Escritorio

  noFoto = '../../../assets/img/no-portada.png'
  fotoVieja = '';
  base64 = '';

  editRepa = false;
  guardando = false;
  bloquearUser = false;
  repartidorPrev: RepartidorPreview

  repartidor: Repartidor = {
    preview: {
      foto: '',
      id: '',
      nombre: '',
      telefono: '',
      calificaciones: 1,
      promedio: 5
    },
    detalles: {
        correo: '',
        edad: null,
        pass: '',
        sexo: '',
        user: ''
    }
  };

  iSel: number
  eliminando = false

  back: Subscription

  constructor(
    private ngZone: NgZone,
    private platform: Platform,
    private menu: MenuController,
    private modalCtrl: ModalController,
    private repartidorService: RepartidoresService,
    private alertService: AlertService,
  ) { this.getScreenSize() }

  ngOnInit() {
    this.menu.enable(true)
    this.getRepartidores()
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      return
    })
  }

  getRepartidores() {
    this.repartidorService.getRepartidores().then(repartidores => {
      this.repartidores = repartidores
      this.repartidoresReady = true
    })
  }

  
  ///////////////// Escritorio
  newEditRepartidor(repartidor: RepartidorPreview, i: number) {
    if (this.scrWidth < 992) this.hideMainCol = true
    this.repartidorPrev = repartidor
    this.listenErrores()
    this.iSel = i

    if (this.repartidorPrev) {
      this.fotoVieja = this.repartidorPrev.foto
      this.getRepartidor()
    } else {
      const preview = {
        foto: '',
        id: '',
        nombre: '',
        telefono: '',
        calificaciones: 1,
        promedio: 5
      };
      this.repartidor.preview = preview;
      const detalles = {
          correo: '',
          edad: null,
          pass: '',
          sexo: '',
          user: ''
      };
      this.repartidor.detalles = detalles
      this.editRepa = true
      this.bloquearUser = false
    }
  }

  getRepartidor() {
    if (this.scrWidth < 992) this.hideMainCol = true
    this.repartidor.preview = this.repartidorPrev
    this.repartidorService.getRepartidor(this.repartidor.preview.id).then(detalles => {
      this.repartidor.detalles = detalles
      this.bloquearUser = true
      this.editRepa = true
    })
  }

  async cropImage(imageChangedEvent, aspect, quality, width) {
    const modal = await this.modalCtrl.create({
      component: CropImagePage,
      componentProps: {imageChangedEvent, aspect, quality, width}
    })
    modal.onWillDismiss().then(resp => {
      if (resp.data) {
        this.repartidor.preview.foto = resp.data
        this.base64 = resp.data.split('data:image/png;base64,')[1]
      }
    })
    return await modal.present()
  }

  sexoElegido(event) {
    this.repartidor.detalles.sexo = event.detail.value
  }

  async guardarCambios() {
    this.repartidor.preview.telefono = this.repartidor.preview.telefono.replace(/ /g, "")
    if (this.repartidor.preview.telefono.length !== 10) {
      this.alertService.presentAlert('Número incorrecto', 'El teléfono debe ser de 10 dígitos, por favor intenta de nuevo')
      return
    }
    if (!this.repartidorPrev) {
      this.repartidor.detalles.correo = this.repartidor.detalles.user.trim() + '@spot.com'
    }
    try {
      this.guardando = true
      this.alertService.presentLoading()
      if (this.base64) {
        this.repartidor = await this.repartidorService.uploadFoto(this.base64, this.repartidor)
        this.base64 = ''
        if (this.fotoVieja) this.repartidorService.borraFoto(this.fotoVieja)
      }
      await this.repartidorService.setRepartidor(this.repartidor, this.repartidorPrev)
    } catch (error) {
      this.guardando = false
      this.alertService.dismissLoading()
      this.alertService.presentAlert('Error', 'Algo salió mal. Por favor intenta de nuevo o comunícate con soporte' + error)
    }
  }

  async eliminarRepartidor() {
    this.eliminando = true
    this.alertService.presentAlertAction(`Eliminar ${this.repartidor.preview.nombre}`, 
      `¿Estás segura(o) de eliinar a ${this.repartidor.preview.nombre}?
        Se borrarán todos sus datos de forma permanente`, 'Eliminar', 'Cancelar').then(async (resp) => {
          if (resp) {
            await this.repartidorService.eliminarRepartidor(this.repartidor)
            this.alertService.presentToast('Repartidor eliminado con éxito')
            this.cancelEdit()
            this.repartidores = this.repartidores.filter(r => r !== this.repartidor.preview)
          }
          this.eliminando = false
    })
  }

  // Auxiliares

  async listenErrores() {
    this.repartidorService.getCreateUserResult().query.ref.on('child_added', snapshot => {
      this.ngZone.run(() => {
        this.guardando = false
        const status = snapshot.val()
        this.alertService.dismissLoading()
        this.repartidorService.cleanResult()
        switch (status) {
          case 'auth/email-already-exists':
            this.alertService.presentAlert('Email registrado',
              'El correo que intentas registrar corresponde a una cuenta existente. Intenta con otro');
            break
          case 'auth/invalid-email':
            this.alertService.presentAlert('Email inválido', 'El correo que intentas registrar no corresponde a un email válido');
            break
          case 'auth/invalid-password':
            this.alertService.presentAlert('Contraseña insegura', 'La contraseña debe tener al menos 6 caracteres');
            break
          case 'ok':
            this.alertService.presentToast('Repartidor agregado con éxito')
            this.cancelEdit()
            if (this.iSel >= 0 && this.iSel) {
              const i = this.repartidores.findIndex(r => r.id === this.repartidor.preview.id)
              this.repartidores[i] = this.repartidor.preview
            } else {
              this.repartidores.unshift(this.repartidor.preview)
            }
            break
          default:
            this.alertService.presentAlert('Error', 'Algo salió mal, por favor intenta de nuevo ' + status);
            break
        }
      })
    })
  }

  cancelEdit() {
    this.hideMainCol = false
    this.repartidorService.getCreateUserResult().query.ref.off('child_added')
    this.editRepa = false
    this.iSel = null
  }

  ionViewWillLeave() {
    if (this.back) this.back.unsubscribe()
  }

}
