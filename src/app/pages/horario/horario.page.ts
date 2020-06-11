import { ModalController, Platform, MenuController } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { SetHorarioPage } from 'src/app/modals/set-horario/set-horario.page';

import { HorarioService } from 'src/app/services/horario.service';
import { AlertService } from 'src/app/services/alert.service';

import { Dia } from 'src/app/interfaces/horario';

@Component({
  selector: 'app-horario',
  templateUrl: './horario.page.html',
  styleUrls: ['./horario.page.scss'],
})
export class HorarioPage implements OnInit {

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
    private modalCtrl: ModalController,
    private horarioService: HorarioService,
    private alertService: AlertService,
  ) { }

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

  async verDia(dia) {
    if (!dia) {
      const x: Dia = {
        activo: false,
        comida: '',
        nombre: '',
        apertura: '2020-02-12T09:00:00.255-06:00',
        cierre: '2020-02-12T18:00:00.255-06:00',
        inicioComida: '2020-02-12T14:00:00.255-06:00',
        finComida: '2020-02-12T15:00:00.255-06:00',
      };
      dia = x;
    }
    const modal = await this.modalCtrl.create({
      component: SetHorarioPage,
      componentProps: {dia}
    });

    modal.onWillDismiss().then(resp => {
      if (resp.data) {
        const semana: Dia[] = resp.data;
        semana.forEach((d, i) => {
          if (d.activo) {
            this.horario[i] = d;
          }
        });
        this.hasHorario = false;
        this.horario.forEach(d => {
          if (d.activo) {
            this.hasHorario = true;
          }
        })
        this.horarioService.setHorario(this.horario)
      }
    });

    return await modal.present();
  }

  deleteDia(dia: string, i: number) {
    this.alertService.presentAlertAction(`Eliminar ${dia}`,
     '¿Estás segura(o) de eliminar la información referente a este día? ' +
     'Será considerado como un día cerrado')
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
        };
        this.horario[i] = x;
        this.horarioService.setHorario(this.horario);
      }
    });
  }

  ///////// Escritorio
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
      };
    }
    this.dia = dia;
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
        };
        this.semana.push(x);
      });
    }
    this.editHorario = true;
  }

  guardar() {
    if (this.dia.cierre === this.dia.apertura) {
      this.alertService.presentAlert('Incongruencia de horario',
        'La hora de apertura y cierre no puede ser la misma. Sería considerado como día inactivo');
      return;
    }
    if (this.dia.cierre < this.dia.apertura) {
      this.alertService.presentAlert('Incongruencia de horario',
        'La hora de cierre no puede ser antes de la hora de apertura');
      return;
    }
    if (this.dia.comida === 'comida' && this.dia.inicioComida === this.dia.finComida) {
      this.alertService.presentAlert('Incongruencia de horario',
        'La hora de incio y fin de comida no puede ser igual. Si no hay horario de comida, selecciona ' +
        'Corrido, en el tipo de horario');
      return;
    }
    if (this.dia.comida === 'comida' && this.dia.inicioComida < this.dia.apertura) {
      this.alertService.presentAlert('Incongruencia de horario',
        'La hora de incio de comida no puede ser antes de la hora de apertura');
      return;
    }
    if (this.dia.comida === 'comida' && this.dia.inicioComida > this.dia.cierre) {
      this.alertService.presentAlert('Incongruencia de horario',
        'La hora de incio de comida no puede ser después de la hora de cierre');
      return;
    }
    if (this.dia.comida === 'comida' && this.dia.finComida < this.dia.apertura) {
      this.alertService.presentAlert('Incongruencia de horario',
        'La hora de fin de comida no puede ser antes de la hora de apertura');
      return;
    }
    if (this.dia.comida === 'comida' && this.dia.finComida > this.dia.cierre) {
      this.alertService.presentAlert('Incongruencia de horario',
        'La hora de fin de comida no puede ser después de la hora de cierre');
      return;
    }
    let diasSeleccionados = 0;
    this.semana.forEach(d => {
      if (d.activo) {
        diasSeleccionados++;
        d.comida = this.dia.comida;
        d.finComida = this.dia.finComida;
        d.apertura = this.dia.apertura;
        d.cierre = this.dia.cierre;
        d.inicioComida = this.dia.inicioComida;
      }
    });
    if (diasSeleccionados <= 0) {
      this.alertService.presentAlert('No hay días seleccionados',
        'Selecciona por lo menos un día de la semana para continuar con el formulario');
      return;
    }
    const semana: Dia[] = this.semana;
    semana.forEach((d, i) => {
      if (d.activo) {
        this.horario[i] = d;
      }
    });
    this.hasHorario = false;
    this.horario.forEach(d => {
      if (d.activo) {
        this.hasHorario = true;
      }
    });
    this.horarioService.setHorario(this.horario);
    this.editHorario = false;
  }

  ionViewWillLeave() {
    if (this.back) {this.back.unsubscribe()}
  }


}
