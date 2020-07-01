import { Component, OnInit, NgZone } from '@angular/core';
import { ModalController, Platform, MenuController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { MapsAPILoader } from '@agm/core';
import { } from 'googlemaps';

import { CropImagePage } from 'src/app/modals/crop-image/crop-image.page';

import { RegionService } from 'src/app/services/region.service';
import { PerfilService } from 'src/app/services/perfil.service';
import { AlertService } from 'src/app/services/alert.service';
import { UidService } from 'src/app/services/uid.service';

import { Perfil, Region, Ubicacion } from 'src/app/interfaces/perfil';


@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
})
export class PerfilPage implements OnInit {

  perfil: Perfil;

  noLogo = '../../../assets/img/no-logo.png'
  noPortada = '../../../assets/img/no-portada.png'

  subCategorias: string[] = []

  base64Pordata = ''
  base64Logo = ''

  subCategoriaAnterior: string[]

  perfilReady = false

  centro: Ubicacion = {
    lat: null,
    lng: null
  }

  cobertura = false

  back: Subscription

  activate_cambios = false

  constructor(
    private ngZone: NgZone,
    private platform: Platform,
    private menu: MenuController,
    private modalCtrl: ModalController,
    private mapsAPILoader: MapsAPILoader,
    private perfilService: PerfilService,
    private regionService: RegionService,
    private alertService: AlertService,
    private uidService: UidService,
  ) { }

  // Info inicio

  ngOnInit() {
    this.menu.enable(true)
    this.getPerfil()
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      return
    })
  }

  formularioChange() {
    if (!this.activate_cambios) return
    this.uidService.setCambios(true)
  }

  getPerfil() {
    this.perfilService.getPerfil().then(async (perfil: Perfil) => {
      this.perfil = perfil
      this.subCategoriaAnterior = this.perfil.subCategoria
      this.cobertura = true
      this.perfilReady = true
      this.getSubcategorias()
      setTimeout(() => {
        this.setAutocomplete()
        this.activate_cambios = true
      }, 350)
    })
  }

  async getSubcategorias() {
    this.subCategorias = await this.perfilService.getSubCategorias(this.perfil.categoria)
  }

  // Acciones
  async cropImage(imageChangedEvent, aspect, portada, quality?, width?) {
    const modal = await this.modalCtrl.create({
      component: CropImagePage,
      componentProps: {imageChangedEvent, aspect, quality, width}
    })
    modal.onWillDismiss().then(resp => {
      if (resp.data) {
        this.uidService.setCambios(true)
        if (portada) {
          this.perfil.portada = resp.data
          this.base64Pordata = resp.data.split('data:image/png;base64,')[1]
        } else {
          this.perfil.logo = resp.data
          this.base64Logo = resp.data.split('data:image/png;base64,')[1]
        }
      }
    })
    return await modal.present()
  }

  // Autocomplete
  setAutocomplete() {
    this.mapsAPILoader.load().then(async () => {
      const inputBox = document.getElementById('txtEscritorio').getElementsByTagName('input')[0]
      // const nativeHomeInputBox = document.getElementById('txtHome').getElementsByTagName('input')[0]
      // const autocomplete = new google.maps.places.Autocomplete(nativeHomeInputBox, { types: ['address'] })
      // autocomplete.addListener('place_changed', () => {
      //     this.ngZone.run(async () => {
      //         // get the place result
      //         const place: google.maps.places.PlaceResult = autocomplete.getPlace()

      //         // verify result
      //         if (place.geometry === undefined || place.geometry === null) return
      //         // set latitude, longitude and zoom
      //         const lat = place.geometry.location.lat()
      //         const lng = place.geometry.location.lng()
      //         const d = await this.calculaDistancia(lat, lng)
      //         if (d < 5) {
      //           this.perfil.direccion.lat = place.geometry.location.lat()
      //           this.perfil.direccion.lng = place.geometry.location.lng()
      //           this.perfil.direccion.direccion = place.formatted_address
      //           this.alertService.presentToast('De ser necesario, puedes mover el pin a tu ubicación exacta')
      //           this.cobertura = true
      //         } else {
      //           this.perfil.direccion.lat = null
      //           this.perfil.direccion.direccion = ''
      //           this.alertService.presentAlert('Fuera de cobertura', 'La dirección está muy lejos de la región elegida ' +
      //           'Cambia de región o espera a que Spot llegue a tu región')
      //           this.cobertura = false
      //         }
      //     })
      // })

      const autocompleteEscritorio = new google.maps.places.Autocomplete(inputBox, {types: ['address']})
      autocompleteEscritorio.addListener('place_changed', () => {
          this.ngZone.run(async () => {
              // get the place result
              const place: google.maps.places.PlaceResult = autocompleteEscritorio.getPlace()
              // verify result
              if (place.geometry === undefined || place.geometry === null) return
              // set latitude, longitude and zoom
              const lat = place.geometry.location.lat()
              const lng = place.geometry.location.lng()
              const d = await this.calculaDistancia(lat, lng)
              if (d < 5) {
                this.uidService.setCambios(true)
                this.perfil.direccion.lat = place.geometry.location.lat()
                this.perfil.direccion.lng = place.geometry.location.lng()
                this.perfil.direccion.direccion = place.formatted_address
                this.alertService.presentToast('De ser necesario, puedes mover el pin a tu ubicación exacta');
                this.cobertura = true
              } else {
                this.perfil.direccion.lat = null
                this.perfil.direccion.direccion = ''
                this.alertService.presentAlert('Fuera de cobertura', 'La dirección está muy lejos de la región elegida ' +
                'Cambia de región o espera a que Spot llegue a tu región')
                this.cobertura = false
              }
          })
      })
    })
  }

  async guardaLoc(evento) {
    this.uidService.setCambios(true)
    this.perfil.direccion.lat = evento.coords.lat
    this.perfil.direccion.lng = evento.coords.lng
  }

  // Guardar

  async guardarCambios() {
    this.perfil.nombre = this.perfil.nombre.trim()
    this.perfil.direccion.direccion = this.perfil.direccion.direccion.trim()
    this.perfil.telefono = this.perfil.telefono.trim()
    this.perfil.descripcion = this.perfil.descripcion.trim()
    if (!this.perfil.nombre ||
        !this.perfil.direccion.direccion ||
        !this.perfil.telefono ||
        !this.perfil.descripcion) {
          this.alertService.presentAlert('', 'Por favor llena todos los campos')
          return
        }
    const plan = this.uidService.getPlan()
    let permitidos
    switch (plan) {
      case 'basica':
        permitidos = 1
        break
      case 'pro':
        permitidos = 4
        break
      case 'premium':
        permitidos = 500
        break
    }
    const agregados = this.perfil.subCategoria.length;
    if (agregados > permitidos) {
      this.alertService.presentAlert('Límite de subCategorías', `Tu plan actual es ${plan}. Y sólo puedes
      agregar ${permitidos} subCategoria(s). Si deseas agregar más, contacta a tu vendedor y actualiza tu plan`)
      return
    }
    this.perfil.telefono = this.perfil.telefono.replace(/ /g, "")
    if (this.perfil.telefono.length !== 10) {
      this.alertService.presentAlert('Número incorrecto', 'El teléfono debe ser de 10 dígitos, por favor intenta de nuevo')
      return
    }
    if (this.perfil.whats) {
      this.perfil.whats = this.perfil.whats.replace(/ /g, "")
      if (this.perfil.whats.length !== 10) {
        this.alertService.presentAlert('Número incorrecto', 'El teléfono debe ser de 10 dígitos, por favor intenta de nuevo')
        return
      }
    }
    await this.alertService.presentLoading()
    try {
      // Guarda fotos y obtiene urls
      if (this.base64Pordata) {
        this.perfil.portada = await this.perfilService.uploadFoto(this.base64Pordata, 'portada')
        this.base64Pordata = ''
      }
      if (this.base64Logo) {
        this.perfil.logo = await this.perfilService.uploadFoto(this.base64Logo, 'logo')
        this.base64Logo = ''
      }

      // Guarda info en perfil y demás
      await this.perfilService.setPerfil(this.perfil)

      // Si es nuevo sólo activa Rate, de lo contrario revisa si cambió Categoria || SubCat || tipo
      let subCatChange
      if (JSON.stringify(this.subCategoriaAnterior) === JSON.stringify(this.perfil.subCategoria)) subCatChange = false
      else subCatChange = true

      if (subCatChange) await this.perfilService.updateSubCategoria(this.subCategoriaAnterior, this.perfil)

      this.subCategoriaAnterior = this.perfil.subCategoria
      this.alertService.dismissLoading()
      this.alertService.presentToast('Cambios guardados')
      this.uidService.setCambios(false)
    } catch (error) {
      console.log(error)
      this.alertService.dismissLoading()
      this.alertService.presentAlert('Error', 'Algo salió mal. Haz una captura de pantalla de este error y enviala a Soporte ' + error)
    }
  }

    // Auxiliares

    calculaDistancia( lat1, lng1): Promise<number> {
      return new Promise (async (resolve, reject) => {
        if (!this.centro.lat || !this.centro.lng) {
          const region: Region = await this.regionService.getUbicacionRegion(this.perfil.region)
          this.centro.lat = region.ubicacion.lat
          this.centro.lng = region.ubicacion.lng
        }
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(this.centro.lat - lat1) // this.deg2rad below
        const dLon = this.deg2rad(this.centro.lng - lng1)
        const a =
           Math.sin(dLat / 2) * Math.sin(dLat / 2) +
           Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(this.centro.lat)) *
           Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        const d = R * c // Distance in kms
        resolve(d)
      })
    }
  
    deg2rad( deg ) {
      return deg * (Math.PI / 180)
    }

    ionViewWillLeave() {
      if (this.back) this.back.unsubscribe()
    }

}