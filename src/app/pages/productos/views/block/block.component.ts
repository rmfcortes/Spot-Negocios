import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';

import { NgxMasonryComponent, NgxMasonryOptions } from 'ngx-masonry';
import { Producto, ProductoPasillo } from 'src/app/interfaces/producto';


@Component({
  selector: 'app-block',
  templateUrl: './block.component.html',
  styleUrls: ['./block.component.scss'],
})
export class BlockComponent implements OnInit {

  @ViewChild(NgxMasonryComponent, {static: false}) masonry: NgxMasonryComponent;

  @Output() showProduct = new EventEmitter<Producto>()
  @Input() sections: ProductoPasillo[]

  public myOptions: NgxMasonryOptions = {
    gutter: 10
  }

  constructor(
  ) { }

  ngOnInit() {
  }

  presentProduct(product: Producto) {
    this.showProduct.emit(product)
  }

}
