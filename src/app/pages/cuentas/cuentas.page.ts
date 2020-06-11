import { Component, OnInit } from '@angular/core';
import { Platform, MenuController } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { CuentaService } from '../../services/cuenta.service';
import { AlertService } from 'src/app/services/alert.service';
import { UidService } from 'src/app/services/uid.service';

import { Cuenta } from 'src/app/interfaces/cuenta.interface';

@Component({
  selector: 'app-cuentas',
  templateUrl: './cuentas.page.html',
  styleUrls: ['./cuentas.page.scss'],
})
export class CuentasPage implements OnInit {

  plan: string;
  planes: Cuenta[] = [
    {
      nombre: 'basico',
      precio: 1,
      productos: 15,
      subCategorias: 1,
      pedidos: false,
      ofertas: false,
      populares: false,
      vendidos: false,
      actual: false,
    },
    {
      nombre: 'pro',
      precio: 1,
      productos: 100,
      subCategorias: 4,
      pedidos: true,
      ofertas: true,
      populares: true,
      vendidos: true,
      actual: false,
    },
    {
      nombre: 'premium',
      precio: 1,
      productos: 500,
      subCategorias: 500,
      pedidos: true,
      ofertas: true,
      populares: true,
      vendidos: true,
      actual: false,
    },
  ];

  preciosReady = false;
  iSel: number;

  back: Subscription;

  constructor(
    private platform: Platform,
    private menu: MenuController,
    private planService: CuentaService,
    private alertService: AlertService,
    private uidService: UidService,
  ) { }

  ngOnInit() {
    this.menu.enable(true)
    this.getPlan()
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      return
    })
  }

  getPlan() {
    this.plan = this.uidService.getPlan()
    this.iSel = this.planes.findIndex(c => c.nombre === this.plan)
    this.planes[this.iSel].actual = true
    this.getPrecios()
  }

  getPrecios() {
    this.planService.getPrecios().then(precios => {
      precios.forEach((p, i) => {
        this.planes[i].precio = p
      })
      this.preciosReady = true
    })
  }

  async changePlan(plan: string, precio: number, i: number) {
    try {
      if (this.iSel > i) {
        await this.alertService.presentAlert('Membresía menor', 'Para cambiar a una membresía de menor capacidad contacta a tu vendedor')
        return
      }
      this.planes.forEach(c => {
        c.actual = false
      })
      this.planes[i].actual = true
      await this.planService.updatePlan(plan, this.plan, precio)
      this.alertService.presentToast('Cuenta actulizada. Ya gozas de las nuevas funcionalidades. ' +
      'Tu vendedor se pondrá en contacto contigo. Gracias por su preferencia')
      this.plan = plan
      this.iSel = i
    } catch (error) {
      this.alertService.presentAlert('Error', 'Algo salió mal, por favor intenta de nuevo ' + error)
      console.log(error)
    }
  }

  ionViewWillLeave() {
    if (this.back) this.back.unsubscribe()
  }

}
