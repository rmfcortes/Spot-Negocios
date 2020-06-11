import { ModalController, Platform, MenuController, IonInput } from '@ionic/angular';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { ProductoPage } from 'src/app/modals/producto/producto.page';

import { ProductosService } from 'src/app/services/productos.service';
import { PasilloService } from 'src/app/services/pasillo.service';
import { AlertService } from 'src/app/services/alert.service';

import { Producto, ProductoPasillo } from 'src/app/interfaces/producto';
import { InfoPasillos, Pasillo } from 'src/app/interfaces/pasillo';
import { UidService } from 'src/app/services/uid.service';

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
})
export class ProductosPage implements OnInit {

  @ViewChild('inputSection', {static: false}) inputSection: IonInput;
  @ViewChild('inputSectionEdit', {static: false}) inputSectionEdit: IonInput;
  
  productos: ProductoPasillo[] = [];
  categoria: string;
  tipo = '';
  pasillos: InfoPasillos = {
    portada: '',
    vista: '',
    pasillos: []
  };

  batch = 10;
  yPasillo = 0;
  lastKey = '';
  noMore = false;
  infiniteCall = 1;
  productosCargados = 0;
  cambiandoPasillo = false;
  cargando_productos = false

  pasilloFiltro = '';
  hasOfertas = false;

  ///////////Escritorio

  listaPasillos: Pasillo[] = [];

  prodsReady = false;

  back: Subscription;

    //////////

  beforeEdit = ''
  viewSectionInput = false
  viewSectionList = false
  nuevo_pasillo = ''

  viewProducts = false

  constructor(
    private platform: Platform,
    private menu: MenuController,
    private modalCtrl: ModalController,
    private productoService: ProductosService,
    private pasillosService: PasilloService,
    private alertService: AlertService,
    private uidService: UidService,
  ) { }

  ngOnInit() {
    this.menu.enable(true)
    this.getTipo()
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      return
    })
  }

  getTipo() {
    this.productoService.getTipo().then(tipo => {
      if (!tipo) {
        this.prodsReady = true
        return
      }
      this.tipo = tipo
      this.getCategoria()
    })
  }

  getCategoria() {
    this.productoService.getCategoria().then((categoria: string) => {
      if (categoria) {
        this.categoria = categoria
        this.getPasillos()
        this.getListaPasillos()
      }
    })
  }

  async getPasillos() {
    const detalles: InfoPasillos = await this.productoService.getPasillos(this.categoria)
    this.pasillos.vista = detalles.vista || 'lista'
    if (detalles.pasillos && detalles.pasillos.length > 0) {
      this.pasillos.pasillos = detalles.pasillos
      this.pasillos.pasillos = this.pasillos.pasillos.sort((a, b) => a.prioridad - b.prioridad)
    } else {
      this.prodsReady = true
      return
    }
    this.getOfertas()
  }

  // Get Productos

  getOfertas() {
    this.cargando_productos = true
    this.productoService.getOfertas(this.tipo, this.categoria).then(async (ofertas: Producto[]) => {
      if (ofertas && ofertas.length > 0) {
        this.hasOfertas = true
        this.agregaProductos(ofertas, 'Ofertas')
      } else {
        this.hasOfertas = false
      }
      if (!this.pasilloFiltro) {
        this.getInfoProds()
      } else {
        this.noMore = true
      }
    })
  }

  getInfoProds() {
    if (!this.pasillos.pasillos || this.pasillos.pasillos.length === 0) return
    this.infiniteCall = 1
    this.productosCargados = 0
    this.getProds()
  }

  async getProds() {
    return new Promise(async (resolve, reject) => {
      const productos = await this.productoService
      .getProductos(this.tipo, this.categoria, this.pasillos.pasillos[this.yPasillo].nombre, this.batch + 1, this.lastKey)
      this.cambiandoPasillo = false
      if (productos && productos.length > 0) {
        this.lastKey = productos[productos.length - 1].id
        this.evaluaProductos(productos)
      } else if ( this.yPasillo + 1 < this.pasillos.pasillos.length ) {
        this.yPasillo++
        this.lastKey = null
        if (this.productosCargados < this.batch * this.infiniteCall) {
          this.getProds()
        }
      } else {
        this.noMore = true
        this.prodsReady = true
        this.cargando_productos = false
        resolve()
      }
    });
  }

  async evaluaProductos(productos) {
    if (productos.length === this.batch + 1) {
      productos.pop()
      return await this.agregaProductos(productos, this.pasillos.pasillos[this.yPasillo].nombre)
    } else if (productos.length === this.batch && this.yPasillo + 1 < this.pasillos.pasillos.length) {
      return await this.nextPasillo(productos)
    } else if (this.yPasillo + 1 >= this.pasillos.pasillos.length) {
      this.noMore = true
      return await this.agregaProductos(productos, this.pasillos.pasillos[this.yPasillo].nombre);
    }
    if (productos.length < this.batch && this.yPasillo + 1 < this.pasillos.pasillos.length) {
      await this.nextPasillo(productos)
      if (this.productosCargados < this.batch * this.infiniteCall) {
        return this.getProds()
      }
    } else {
      this.agregaProductos(productos, this.pasillos.pasillos[this.yPasillo].nombre)
      this.noMore = true
    }
  }

  async nextPasillo(productos) {
    return new Promise(async (resolve, reject) => {
      await this.agregaProductos(productos, this.pasillos.pasillos[this.yPasillo].nombre)
      this.yPasillo++
      this.lastKey = null
      resolve()
    });
  }

  async agregaProductos(prod: Producto[], pasillo) {
    return new Promise(async (resolve, reject) => {
      this.productosCargados += prod.length
      if ( this.productos.length > 0 && this.productos[this.productos.length - 1].nombre === pasillo) {
        this.productos[this.productos.length - 1].productos = this.productos[this.productos.length - 1].productos.concat(prod)
      } else {
        const prodArray: ProductoPasillo = {
          nombre: pasillo,
          productos: prod
        }
        this.productos.push(prodArray)
      }
      this.prodsReady = true
      this.cargando_productos = false
      resolve()
    })
  }

  loadMoreProducts() {
    this.infiniteCall++;
    if (this.noMore) {
      return;
    }
    this.getProds();
  }

  loadMoreProductsFiltrados() {
    this.infiniteCall++
    if (this.noMore) {
      return
    }
    this.getProdsFiltrados()
  }


  // Info Productos Filtrados
  async getProdsFiltrados(event?) {
    this.cargando_productos = true
    const productos = await this.productoService
      .getProductos(this.tipo, this.categoria, this.pasilloFiltro, this.batch + 1, this.lastKey)
    if (productos && productos.length > 0) {
      this.cambiandoPasillo = false
      this.lastKey = productos[productos.length - 1].id
      this.cargaFiltrados(productos, event)
    } else {
      if (event) event.target.complete()
      this.cargando_productos = false
      this.noMore = true;
    }
  }

  cargaFiltrados(productos, event) {
    this.productosCargados += productos.length
    if (productos.length === this.batch + 1) {
      this.lastKey = productos[productos.length - 1].id
      productos.pop()
    } else {
      this.noMore = true
    }
    if (this.productos.length === 0) {
      this.productos =  [{
        nombre: this.pasilloFiltro,
        productos: [...productos]
      }]
    } else {
      this.productos =  [{
        nombre: this.pasilloFiltro,
        productos: this.productos[0].productos.concat(productos)
      }];
    }
    if (event) event.target.complete()
    this.cargando_productos = false
  }

  resetProds(pasillo?) {
    this.cambiandoPasillo = true
    this.lastKey = ''
    this.yPasillo = 0
    this.productos = []
    this.productosCargados = 0
    this.infiniteCall = 1
    this.noMore = false
    this.pasilloFiltro = pasillo
    if (!pasillo || pasillo === 'Ofertas') {
      this.getOfertas()
    } else {
      this.getProdsFiltrados()
    }
  }

  // Acciones
  async verProducto(producto: Producto) {
    let nuevo = false
    let agregados: number
    if (!producto) {
      nuevo = true
      agregados = await this.productoService.getProductosAgregados()
      const plan = this.uidService.getPlan()
      let permitidos
      switch (plan) {
        case 'basico':
          permitidos = 15
          break;
        case 'pro':
          permitidos = 100
          break;
        case 'premium':
          permitidos = 500
          break
      }
      if (agregados > permitidos) {
        this.alertService.presentAlert('Límite de productos', 'Has llegado al límite máximo ' +
        'de productos permitidos en tu lista. Si deseas agregar más, contacta a tu vendedor y actualiza tu plan');
        return
      }
      producto = {
        codigo: '',
        descripcion: '',
        id: '',
        nombre: '',
        pasillo: '',
        precio: null,
        unidad: '',
        url: '',
        variables: false,
      }
    }
    const modal = await this.modalCtrl.create({
      component: ProductoPage,
      componentProps: {producto, categoria: this.categoria, tipo: this.tipo, agregados}
    })

    modal.onWillDismiss().then(resp => {
      if (resp.data) {
        if (resp.data === 'eliminado') {
          const i = this.productos.findIndex(p => p.nombre === producto.pasillo)
          this.productos[i].productos = this.productos[i].productos.filter(r => r.id !== producto.id)
        } else {
          if (!nuevo) {
            const i = this.productos.findIndex(p => p.nombre === producto.pasillo)
            const y = this.productos[i].productos.findIndex(p => p.id === producto.id)
            this.productos[i].productos[y] = producto
          } else {
            this.addProdAgregado(resp.data)
          }
        }
      }
    })
    return await modal.present()
  }

  showProduct(event) {
    console.log(event)
  }

  vistaElegida(event) {
    this.pasillos.vista = event.detail.value
    this.productoService.changeVista(this.pasillos.vista, this.categoria)
  }

  showSectionInput() {
    this.viewSectionInput = true
    setTimeout(() => {
      this.inputSection.setFocus()
    }, 300)
  }

  addProdAgregado(producto: Producto) {
    const i = this.productos.findIndex(p => p.nombre === producto.pasillo);
    if (i >= 0) {
      this.productos[i].productos.unshift(producto);
    } else {
      const prodArray: ProductoPasillo = {
        nombre: producto.pasillo,
        productos: [producto]
      }
      this.productos.unshift(prodArray)
    }
    console.log(this.productos)
  }

  
  // Pasillos
    getListaPasillos() {
      this.pasillosService.getPasillos(this.categoria).then((pasillos) => {
        this.listaPasillos = pasillos
        const plan = this.uidService.getPlan()
        if (plan !== 'basico') {
          const oferta: Pasillo = {
            nombre: 'Ofertas',
            prioridad: 0
          };
          this.listaPasillos.unshift(oferta)
        }
      });
    }

  async addPasillo() {
    const pasillo: Pasillo = {
      nombre: this.nuevo_pasillo,
      prioridad: 0
    }
    this.listaPasillos.unshift(pasillo)
    this.listaPasillos.forEach((p, i) => p.prioridad = i + 1)
    this.nuevo_pasillo = ''
    this.viewSectionInput = false
    this.pasillosService.updatePasillos(this.categoria, this.listaPasillos)
  }

  doReorder(event) {
    const itemMove = this.listaPasillos.splice(event.detail.from, 1)[0]
    this.listaPasillos.splice(event.detail.to, 0, itemMove)
    this.listaPasillos.forEach((p, i) => p.prioridad = i + 1)
    this.pasillosService.updatePasillos(this.categoria, this.listaPasillos)
    event.detail.complete()
  }

  editPasillo(i) {
    this.unselectEdit()
    this.beforeEdit = this.listaPasillos[i].nombre
    this.listaPasillos[i].edit = true
    setTimeout(() => {
      this.inputSectionEdit.setFocus()
    }, 300);
  }

  cancelEditPasillo(i: number) {
    this.listaPasillos[i].nombre = this.beforeEdit
    this.beforeEdit = ''
    this.unselectEdit()
  }

  saveEditSection(i) {
    this.unselectEdit()
    this.pasillosService.editPasillo(this.categoria, i, this.beforeEdit, this.listaPasillos[i].nombre);
    this.beforeEdit = ''
  }

  unselectEdit() {
    this.listaPasillos.forEach(s => {
      s.edit = null
    })
  }

  async deletePasillo(i, nombre) {
    const resp = await this.alertService.presentAlertAction('Eliminar departamento',
     `¿Estás segura(o) de eliminar ${nombre}? se borrarán también todos los productos ` +
     'pertenecientes a este departamento. Esta acción es irreversible.')
    if (resp) {
      this.listaPasillos.splice(i, 1)
      this.listaPasillos.forEach((p, i) => p.prioridad = i + 1)
      this.pasillosService.updatePasillos(this.categoria, this.listaPasillos)
      this.pasillosService.deletePasillo(this.categoria, nombre)
    }
  }

  ionViewWillLeave() {
    if (this.back) {this.back.unsubscribe()}
  }

  // Track By
  trackByPasillosPasillos(index:number, el:Pasillo): number {
    return index;
  }

  trackByPasillos(index:number, el:Pasillo): number {
    return index;
  }

  trackByPasilloProducto(index:number, el:ProductoPasillo): number {
    return index;
  }

  trackByProducto(index:number, el:Producto): string {
    return el.id;
  }
  

}
