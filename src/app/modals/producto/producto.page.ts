import { Component, OnInit, Input } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { CropImagePage } from '../crop-image/crop-image.page';

import { ProductosService } from 'src/app/services/productos.service';
import { PasilloService } from 'src/app/services/pasillo.service';
import { AlertService } from 'src/app/services/alert.service';
import { UidService } from 'src/app/services/uid.service';

import { Producto, Complemento, ProductoComplemento } from 'src/app/interfaces/producto';
import { Pasillo } from 'src/app/interfaces/pasillo';

@Component({
  selector: 'app-producto',
  templateUrl: './producto.page.html',
  styleUrls: ['./producto.page.scss'],
})
export class ProductoPage implements OnInit {

  @Input() tipo: string
  @Input() plan: string
  @Input() nuevo: boolean
  @Input() agregados: number
  @Input() categoria: string
  @Input() producto: Producto

  pasillos: Pasillo[] = []
  producto_original: Producto = {
    agotado: false,
    descripcion: '',
    id: '',
    nombre: '',
    pasillo: '',
    precio: 1,
    url: '',
  }
  complementos: Complemento[] = []

  noFoto = '../../../assets/img/no-portada.png'
  noLogo = '../../../assets/img/no-logo.png'
  base64 = ''
  base64Oferta = ''

  guardando = false
  activate_cambios = false
  cambios_pendientes = false

  pasilloViejo = ''

  back: Subscription

  constructor(
    private platform: Platform,
    private modalCtrl: ModalController,
    private productoService: ProductosService,
    private pasillosService: PasilloService,
    private alertService: AlertService,
    private uidService: UidService,
  ) { }

  // Info inicio
  async ngOnInit() {
    await this.getPasillos()
    await this.getComplementos()
    this.pasilloViejo = this.producto.pasillo
    if (!this.nuevo) this.copiar(this.producto, this.producto_original)
  }

  ionViewWillEnter() {
    this.producto.mudar = false
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      this.regresar()
    })
  }

  ionViewDidEnter() {
    setTimeout(() => this.activate_cambios = true, 350)
  }

  getPasillos() {
    return new Promise((resolve, reject) => {      
      this.pasillosService.getPasillos(this.categoria).then((pasillos) => {
        this.pasillos = pasillos
        if (this.pasillos.length === 0) {
          this.alertService.presentAlert('No hay departamentos',
            'Antes de continuar recomendamos agregar departamentos para poder ' +
            'organizar adecuadamente tus productos/servicios. Sin departamentos ' +
            'no podrás completar el formulario')
          return
        }
        const plan = this.uidService.getPlan()
        if (plan !== 'basico') {
          const oferta: Pasillo = {
            nombre: 'Ofertas',
            prioridad: 0
          }
          this.pasillos.unshift(oferta)
        }
        resolve()
      })
    })
  }

  getComplementos() {
    return new Promise((resolve, reject) => {      
      if (this.producto.variables) {
        this.productoService.getComplementos(this.producto.id).then((complementos: Complemento[]) => {
          this.complementos = complementos
          resolve()
        })
      } else resolve()
    })
  }

  formularioChange() {
    if (this.nuevo) return
    if (!this.activate_cambios) return
    this.cambios_pendientes = true
  }

  // Acciones

  async addComplemento() {
    this.alertService.presentAlertPrompt('Nueva lista de complementos', 'Titulo de la lista', 'Agregar lista', 'Cancelar')
      .then((titulo: string) => {
        titulo = titulo.trim()
        if (!titulo) return
        const complemento: Complemento = {
          titulo,
          obligatorio: false,
          limite: 1,
          productos: []
        }
        this.complementos.push(complemento)
        this.cambios_pendientes = true
      })
  }

  async addProductoComplemento(i) {
    this.alertService.presentPromptComplementos()
    .then((producto: ProductoComplemento) => {
      producto.nombre = producto.nombre.trim()
      if (!producto.nombre) return
      if (!/^[0-9]+$/.test(producto.precio)) {
        this.alertService.presentAlert('Precio inválido', 'El precio debe incluir sólo números enteros')
        return
      }
      producto.precio = parseInt(producto.precio, 10)
      this.complementos[i].productos.unshift(producto)
      this.cambios_pendientes = true
    })
  }

  async cropImage(imageChangedEvent, aspect, portada, quality, width?) {
    const modal = await this.modalCtrl.create({
      component: CropImagePage,
      componentProps: {imageChangedEvent, aspect, quality, width}
    })
    modal.onWillDismiss().then(resp => {
      if (resp.data) {
        this.cambios_pendientes = true
        if (portada) {
          this.producto.url = resp.data
          this.base64 = resp.data.split('data:image/png;base64,')[1]
        } else {
          this.producto.foto = resp.data
          this.base64Oferta = resp.data.split('data:image/png;base64,')[1]
        }
      }
    })
    return await modal.present()
  }

  deleteComplemento(i) {
    this.cambios_pendientes = true
    this.complementos.splice(i, 1)
  }

  deleteProdCom(i, y) {
    this.cambios_pendientes = true
    this.complementos[i].productos.splice(y, 1)
  }

  pasilloElegido(event) {
    this.cambios_pendientes = true
    this.producto.pasillo = event.detail.value
  }

  async guardarCambios() {
    this.producto.nombre = this.producto.nombre.trim()
    this.producto.descripcion = this.producto.descripcion.trim()
    if (!this.producto.nombre || !this.producto.descripcion || !this.producto.precio) {
      this.alertService.presentAlert('', 'Por favor completa todos los campos')
      return
    }
    if (this.producto.precio && this.tipo === 'productos' && !/^[0-9]+$/.test(this.producto.precio.toString())) {
      this.alertService.presentAlert('Precio inválido', 'El precio debe incluir sólo números enteros')
      return
    }
    if (this.producto.pasillo === 'Ofertas' && !this.producto.foto) {
      this.alertService.presentAlert('Formulario incompleto', 'Por favor agrega una oferta de tu oferta')
      return
    }
    await this.alertService.presentLoading('Estamos guardando la información del producto. Este proceso puede tardar algunos minutos. Por favor no cierres ni actualices la página')
    this.guardando = true
    try {
      if (this.base64) {
        this.producto.url = await this.productoService.uploadFoto(this.base64, this.producto, 'producto')
        this.base64 = ''
      }
      if (this.base64Oferta && this.producto.pasillo === 'Ofertas') {
        this.producto.foto = await this.productoService.uploadFoto(this.base64Oferta, this.producto, 'oferta');
        this.base64Oferta = ''
      }
      if (this.pasilloViejo && this.pasilloViejo !== this.producto.pasillo) {
        this.productoService.changePasillo(this.categoria, this.pasilloViejo, this.producto.id, this.tipo, this.producto)
      }
      await this.productoService.setProducto(this.producto, this.categoria, this.complementos, this.tipo, this.agregados, this.nuevo, this.plan)
      this.guardando = false
      this.cambios_pendientes = false
      this.alertService.dismissLoading()
      this.modalCtrl.dismiss(this.producto)
    } catch (error) {
      this.guardando = false
      this.alertService.dismissLoading()
      this.alertService.presentAlert('Error', 'Algo salió mal. Por favor intenta de nuevo o comunícate con soporte' + error)
    }
  }

  async eliminarProducto() {
    try {
      const resp = await this.alertService.presentAlertAction(`Eliminar ${this.producto.nombre}`,
      '¿Estás seguro de eliminar este producto? se perderá toda la información referente al mismo de manera permanente', 'Eliminar', 'Cancelar')
      if (resp) {
        await this.productoService.deleteProducto(this.producto, this.tipo, this.categoria, this.agregados)
        this.alertService.presentToast('Artículo eliminado')
        this.modalCtrl.dismiss('eliminado')
      }

    } catch (error) {
      this.alertService.presentAlert('Error', 'Algo salió mal. Por favor intenta de nuevo o comunícate con soporte' + error)
    }
  }

  regresar() {
    if (this.cambios_pendientes) {
      this.alertService.presentAlertAction('Cambios pendientes', 'Tienes cambios pendientes por guardar, ¿te gustaría guardarlos?', 'Guardar cambios', 'Descartar cambios')
      .then(resp => resp ? this.guardarCambios() : this.descartarCambios())
      return
    }
    this.modalCtrl.dismiss()
  }

  descartarCambios() {
    if (!this.nuevo) this.copiar(this.producto_original, this.producto)
    this.modalCtrl.dismiss()
  }

  copiar(producto: Producto, copia: Producto) {
    copia.observaciones = producto.observaciones ? producto.observaciones : null
    copia.descripcion = producto.descripcion ? producto.descripcion : null
    copia.codigo = producto.codigo ? producto.codigo : null
    copia.foto = producto.foto ? producto.foto : null
    copia.agotado = producto.agotado ? true : false
    copia.pasillo = producto.pasillo
    copia.nombre = producto.nombre
    copia.precio = producto.precio
    copia.url = producto.url
    copia.id = producto.id
  }

}
