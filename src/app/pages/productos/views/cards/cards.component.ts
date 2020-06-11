import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ProductoPasillo, Producto } from 'src/app/interfaces/producto';

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.scss'],
})
export class CardsComponent implements OnInit {

  @Input() sections: ProductoPasillo[]

  @Output() showProduct = new EventEmitter<Producto>()


  constructor() { }

  ngOnInit() {}

  presentProduct(product: Producto) {
    this.showProduct.emit(product)
  }

}
