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

  @Input() sections: ProductoPasillo[]
  @Output() showProduct = new EventEmitter<Producto>()

  public myOptions: NgxMasonryOptions = {
    gutter: 10
  };

  constructor(
  ) { }

  ngOnInit() {
  }

  presentProduct(product: Producto) {
    this.showProduct.emit(product)
  }

}
