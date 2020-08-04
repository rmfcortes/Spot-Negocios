import { Component, Input, Output, EventEmitter } from '@angular/core';

import { AnimationsService } from 'src/app/services/animations.service';
import { ProductoPasillo, Producto } from 'src/app/interfaces/producto';


@Component({
  selector: 'app-list-img',
  templateUrl: './list-img.component.html',
  styleUrls: ['./list-img.component.scss'],
})
export class ListImgComponent {

  @Output() load = new EventEmitter<any>()
  @Input() sections: ProductoPasillo[]
  
  @Input() busqueda: boolean
  @Input() cargando: boolean
  @Output() showProduct = new EventEmitter<Producto>()
  @Output() limpiar = new EventEmitter<boolean>()

  constructor(
    private animationService: AnimationsService,
  ) { }

  presentProduct(product: Producto) {
    this.showProduct.emit(product)
  }

  limpiarBusqueda() {
    this.limpiar.emit(true)
  }

  ionImgWillLoad(image) {
    this.animationService.enterAnimation(image.target)
  }

  loadData(event) {
    this.load.emit(event)
  }

  trackSections(index:number, el:ProductoPasillo): number {
    return index
  }

  trackProducts(index:number, el:Producto): string {
    return el.id
  }

}
