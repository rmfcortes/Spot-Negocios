import { Platform, MenuController } from '@ionic/angular';
import { Component, OnInit, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';

import { HorarioService } from 'src/app/services/horario.service';
import { AlertService } from 'src/app/services/alert.service';

import { Dia } from 'src/app/interfaces/horario';

@Component({
  selector: 'app-horario',
  templateUrl: './horario.page.html',
  styleUrls: ['./horario.page.scss'],
})
export class HorarioPage implements OnInit {

  @HostListener('window:resize')
  getScreenSize() {
    this.scrHeight = window.innerHeight
    this.scrWidth = window.innerWidth
  }
  scrHeight: number
  scrWidth: number
  hideMainCol = false

  horario: Dia[] = []
  dias = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']
  hasHorario = false

  horarioReady = false

  dia: Dia

  semana: Dia[] = []
  editHorario = false

  back: Subscription

  constructor(
    private platform: Platform,
    private menu: MenuController,
    private horarioService: HorarioService,
    private alertService: AlertService,
  ) { this.getScreenSize() }

  ngOnInit() {
    this.getHorario()
    this.menu.enable(true)
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      return
    })
  }

  getHorario() {
    this.horarioService.getHorario().then(horario => {
      if (horario && horario.length > 0) {
        this.horario = horario
        this.hasHorario = true
      } else {
        this.dias.forEach(d => {
          const x: Dia = {
            activo: false,
            comida: '',
            nombre: d,
            finComida: null,
            apertura: null,
            cierre: null,
            inicioComida: null,
          }
          this.horario.push(x)
          this.hasHorario = false
        })
      }
      this.horarioReady = true
    })
  }

  deleteDia(dia: string, i: number) {
    const hoy = new Date().getDay()
    if (hoy === i + 1) {
      this.alertService.presentAlert('', 'No puedes eliminar el horario del día en curso, intenta otro día por favor')
      return
    }
    this.alertService.presentAlertAction(`Eliminar ${dia}`,
     '¿Estás segura(o) de eliminar la información referente a este día? ' +
     'Será considerado como un día cerrado', 'Eliminar', 'Cancelar')
    .then(resp => {
      if (resp) {
        const x: Dia = {
          activo: false,
          comida: '',
          nombre: '',
          apertura: '',
          cierre: '',
          inicioComida: '',
          finComida: '',
        }
        this.horario[i] = x
        console.log(this.horario);
        this.horarioService.setHorario(this.horario)
      }
    })
  }

  newEditDia(dia) {
    if (!dia) {
      dia = {
        activo: false,
        comida: '',
        nombre: '',
        apertura: '2020-02-12T09:00:00.255-06:00',
        cierre: '2020-02-12T18:00:00.255-06:00',
        inicioComida: '2020-02-12T14:00:00.255-06:00',
        finComida: '2020-02-12T15:00:00.255-06:00',
      }
    }
    this.dia = dia
    if (this.semana.length === 0) {
      this.dias.forEach(d => {
        const x: Dia = {
          activo: false,
          comida: '',
          nombre: d,
          finComida: null,
          apertura: null,
          cierre: null,
          inicioComida: null,
        }
        this.semana.push(x)
      })
    }
    if (this.scrWidth < 992) this.hideMainCol = true
    this.editHorario = true
  }

  cancelEdit() {
    this.editHorario = false
    this.hideMainCol = false
  }

  guardar() {
    if (this.dia.cierre === this.dia.apertura) {
      this.alertService.presentAlert('Incongruencia de horario',
        'La hora de apertura y cierre no puede ser la misma. Sería considerado como día inactivo')
      return
    }
    if (this.dia.cierre < this.dia.apertura) {
      this.alertService.presentAlert('Incongruencia de horario',
        'La hora de cierre no puede ser antes de la hora de apertura')
      return
    }
    if (this.dia.comida === 'comida' && this.dia.inicioComida === this.dia.finComida) {
      this.alertService.presentAlert('Incongruencia de horario',
        'La hora de incio y fin de comida no puede ser igual. Si no hay horario de comida, selecciona ' +
        'Corrido, en el tipo de horario')
      return
    }
    if (this.dia.comida === 'comida' && this.dia.inicioComida < this.dia.apertura) {
      this.alertService.presentAlert('Incongruencia de horario',
        'La hora de incio de comida no puede ser antes de la hora de apertura')
      return
    }
    if (this.dia.comida === 'comida' && this.dia.inicioComida > this.dia.cierre) {
      this.alertService.presentAlert('Incongruencia de horario',
        'La hora de incio de comida no puede ser después de la hora de cierre')
      return
    }
    if (this.dia.comida === 'comida' && this.dia.finComida < this.dia.apertura) {
      this.alertService.presentAlert('Incongruencia de horario',
        'La hora de fin de comida no puede ser antes de la hora de apertura')
      return
    }
    if (this.dia.comida === 'comida' && this.dia.finComida > this.dia.cierre) {
      this.alertService.presentAlert('Incongruencia de horario',
        'La hora de fin de comida no puede ser después de la hora de cierre')
      return
    }
    let diasSeleccionados = 0
    this.semana.forEach(d => {
      if (d.activo) {
        diasSeleccionados++
        d.comida = this.dia.comida
        d.finComida = this.dia.finComida
        d.apertura = this.dia.apertura
        d.cierre = this.dia.cierre
        d.inicioComida = this.dia.inicioComida
      }
    })
    if (diasSeleccionados <= 0) {
      this.alertService.presentAlert('No hay días seleccionados',
        'Selecciona por lo menos un día de la semana para continuar con el formulario');
      return
    }
    const semana: Dia[] = this.semana
    semana.forEach((d, i) => d.activo ? this.horario[i] = d : null)
    this.hasHorario = false
    this.horario.forEach(d => d.activo ? this.hasHorario = true : null)
    this.horarioService.setHorario(this.horario)
    this.alertService.presentToast('Cambios guardados con éxito')
    this.editHorario = false
    this.hideMainCol = false
  }

  ionViewWillLeave() {
    if (this.back) this.back.unsubscribe()
  }


}
