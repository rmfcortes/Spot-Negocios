import { Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import { ProductoPasillo, Producto } from 'src/app/interfaces/producto';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
})
export class GalleryComponent implements OnInit {

  @Input() sections: ProductoPasillo[]
  
  @Output() showProduct = new EventEmitter<Producto>()


  constructor() { }

  ngOnInit() {}

  presentProduct(product: Producto) {
    this.showProduct.emit(product)
  }
  
}
