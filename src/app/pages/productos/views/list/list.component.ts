import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ProductoPasillo, Producto } from 'src/app/interfaces/producto';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {

  @Input() sections: ProductoPasillo[]
  @Input() busqueda: boolean
  @Input() cargando: boolean
  @Output() showProduct = new EventEmitter<Producto>()
  @Output() limpiar = new EventEmitter<boolean>()


  constructor() { }

  ngOnInit() {}

  presentProduct(product: Producto) {
    this.showProduct.emit(product)
  }

  limpiarBusqueda() {
    this.limpiar.emit(true)
  }



}
