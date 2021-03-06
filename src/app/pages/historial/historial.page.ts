import { ModalController, Platform, MenuController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { HostListener } from "@angular/core";
import { Subscription } from 'rxjs';


import subWeeks from 'date-fns/subWeeks'
import parseISO from 'date-fns/parseISO'
import endOfWeek from 'date-fns/endOfWeek'
import subMonths from 'date-fns/subMonths'
import formatISO from 'date-fns/formatISO'
import endOfMonth from 'date-fns/endOfMonth'
import startOfWeek from 'date-fns/startOfWeek'
import startOfMonth from 'date-fns/startOfMonth'

import { HistorialService } from 'src/app/services/historial.service';

import { HistorialPedido, Pedido } from 'src/app/interfaces/pedido';
import { AlertService } from 'src/app/services/alert.service';
import { Ionic4DatepickerModalComponent } from '@logisticinfotech/ionic4-datepicker';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
})
export class HistorialPage implements OnInit {

  @HostListener('window:resize')
  getScreenSize() {
    this.scrHeight = window.innerHeight
    this.scrWidth = window.innerWidth
  }
  scrHeight: number
  scrWidth: number
  hideMainCol = false

  today: string
  first_date: string
  no_registros: string

  inicial_date: string
  end_date: string

  pedidos: HistorialPedido[] = []
  pedido: Pedido

  loading_pedidos = false

  batch = 15
  lastKey = ''
  noMore = false

  back: Subscription

  completados: number
  rechazados: number
  total: number
  comisiones: number

  datePickerObj: any = {
    inputDate: new Date('2018-08-10'), // default new Date()
    fromDate: new Date('2016-12-08'), // default null
    toDate: new Date('2018-12-28'), // default null
    closeOnSelect: true, // default false
    mondayFirst: true, // default false
    setLabel: 'Aceptar',  // default 'Set'
    todayLabel: 'Hoy', // default 'Today'
    closeLabel: 'Cerrar', // default 'Close'
    monthsList: ["Ene", "Feb", "Mar", "Abril", "Mayo", "Junio", "Julio", "Ago", "Sept", "Oct", "Nov", "Dic"],
    weeksList: ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"],
    dateFormat: 'YYYY-MM-DD', // default DD MMM YYYY
    momentLocale: 'es', // Default 'en-US'
    btnProperties: {
      expand: 'block', // Default 'block'
      fill: '', // Default 'solid'
      size: '', // Default 'default'
      disabled: '', // Default false
      strong: '', // Default false
      color: '' // Default ''
    },
  }

  periodo: string
  inicio: string
  fin: string

  ver_rangos = false
  ver_set_periodo = false

  constructor(
    private platform: Platform,
    private menu: MenuController,
    private modalCtrl: ModalController,
    private historialService: HistorialService,
    private commonService: AlertService,
  ) { this.getScreenSize() }

    // Info inicial
  ngOnInit() {
    this.menu.enable(true)
    this.getToday()
    this.getCurrentWeek()
  }
  
  getCurrentWeek() {
    this.periodo = 'Semana actual'
    const start = startOfWeek(new Date())
    const end = endOfWeek(new Date())
    this.formatDate(end, start)
  }

  getCurrentMonth() {
    this.periodo = 'Mes actual'
    const start = startOfMonth(new Date())
    const end = endOfMonth(new Date())
    this.formatDate(end, start, true)
  }

  getLastWeek() {
    this.periodo = 'Semana pasada'
    const lastWeek = subWeeks(new Date(), 1)
    const start = startOfWeek(lastWeek)
    const end = endOfWeek(lastWeek)
    this.formatDate(end, start)
  }

  getLastMonth() {
    const lastMonth = subMonths(new Date(), 1)
    const start = startOfMonth(lastMonth)
    const end = endOfMonth(lastMonth)
    this.formatDate(end, start, true)
  }

  getPeriodo() {
    this.periodo = 'Periodo personalizado'
    this.ver_set_periodo = true
    this.ver_rangos = false
  }

  formatDate(end: Date, start: Date, month?: boolean) {
    this.ver_set_periodo = false
    this.ver_rangos = false
    if (month) this.periodo = format(start, 'MMMM', {locale: es})
    this.inicio = format(start, 'EEEE dd/MMMM', {locale: es})
    this.fin = format(end, 'EEEE dd/MMMM', {locale: es})
    this.inicial_date = formatISO(start, {representation: 'date'})
    this.end_date = formatISO(end, {representation: 'date'})
    this.getRegistrosByRange()
  }
  
  async getToday() {
    this.today = await this.commonService.formatDate(new Date())
    this.datePickerObj.inputDate = this.today
    this.getFirstDate()
  }

  async getFirstDate() {
    this.first_date = localStorage.getItem('first_date')
    if (!this.first_date) this.first_date = await this.historialService.getFirstDate()
    if (!this.first_date) this.first_date = await this.historialService.setFirstDate()
    if (!this.first_date) this.no_registros = 'Aún no tienes pedidos completados'
    if (this.first_date) {
      this.datePickerObj.fromDate = this.first_date
      this.datePickerObj.toDate = this.today
    }
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      return
    })
  }

    //Fechas seleccionadas

  async openDatePicker(initial: boolean) {
    const datePickerModal = await this.modalCtrl.create({
      component: Ionic4DatepickerModalComponent,
      cssClass: 'li-ionic4-datePicker',
      componentProps: { 
          'objConfig': this.datePickerObj, 
          'selectedDate': this.today 
      }
    })

    await datePickerModal.present()
  
    datePickerModal.onDidDismiss()
      .then((data) => {
        if (initial) this.initialDateCambio(data.data.date)
        else this.endDateCambio(data.data.date)
      })
  }

  async initialDateCambio(value: string) {
    if (value === 'Fecha invalida') return
    if (this.end_date) {
      if (value > this.end_date) {
        this.commonService.presentAlert('', 'La fecha inicial no puede ser mayor a la fecha final')
        return
      }
      this.inicio = format(parseISO(value), 'EEEE dd/MMMM', {locale: es})
      this.inicial_date = value
      this.getRegistrosByRange()
    }
  }

  async endDateCambio(value: string) {
    if (value === 'Fecha invalida') return
    if (this.inicial_date) {
      if (this.inicial_date > value) {
        this.commonService.presentAlert('', 'La fecha inicial no puede ser mayor a la fecha final')
        return
      }
      this.fin = format(parseISO(value), 'EEEE dd/MMMM', {locale: es})
      this.end_date = value
      this.getRegistrosByRange()
    }
  }

  async getRegistrosByRange() {
    this.loading_pedidos = true
    this.pedidos = []
    this.completados = 0
    this.rechazados = 0
    this.total = 0
    this.comisiones = 0
    this.pedidos = await this.historialService.getRegistrosByRange(this.inicial_date, this.end_date)
    if (this.pedidos.length > 0) {
      this.no_registros = ''
      this.pedidos.forEach(p => {
        this.completados += p.completados.length
        this.rechazados += p.cancelados_negocio.length
        p.pedidos.forEach(x => {
          if (!x.cancelado_by_negocio) {
            this.total += x.total
            this.comisiones += x.comision
          }
        })
      })
    }
    else this.no_registros = 'No hay registros de servicios en estos días'
    this.loading_pedidos = false
  }

  getPedidos(event?) {
    this.historialService.getHistorial(this.batch + 1, this.lastKey).then(pedidos => {
      this.cargaHistorial(pedidos, event)
    })
  }

  cargaHistorial(pedidos, event) {
    if (pedidos.length === this.batch + 1) {
      this.lastKey = pedidos[0].id
      pedidos.shift()
    } else {
      this.noMore = true
    }
    this.pedidos = this.pedidos.concat(pedidos.reverse())
    if (event) event.target.complete()
  }

  async verPedido(pedido: Pedido) {
    this.pedido = pedido
    if (this.scrWidth < 992) this.hideMainCol = true
  }

  regresa() {
    this.hideMainCol = false
    this.pedido = null
  }

  ionViewWillLeave() {
    if (this.back) this.back.unsubscribe()
  }

}
