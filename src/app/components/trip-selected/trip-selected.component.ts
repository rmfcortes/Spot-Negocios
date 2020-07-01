import { Component, OnInit, Input } from '@angular/core';
import { Pedido } from 'src/app/interfaces/pedido';


@Component({
  selector: 'app-trip-selected',
  templateUrl: './trip-selected.component.html',
  styleUrls: ['./trip-selected.component.scss'],
})
export class TripSelectedComponent implements OnInit {

  @Input() pedido_selected: Pedido

  constructor() { }

  ngOnInit() {
  }

}
