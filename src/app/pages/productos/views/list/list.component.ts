import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ProductoPasillo, Producto } from 'src/app/interfaces/producto';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent implements OnInit {

  @Input() sections: ProductoPasillo[]

  @Output() showProduct = new EventEmitter<Producto>()



  constructor() { }

  ngOnInit() {}

  presentProduct(product: Producto) {
    this.showProduct.emit(product)
  }



}
