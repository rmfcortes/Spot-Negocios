import { Component, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { PerfilService } from 'src/app/services/perfil.service';
import { SwUpdateService } from './services/sw-update.service';
import { PedidosService } from './services/pedidos.service';
import { AuthService } from './services/auth.service';
import { UidService } from './services/uid.service';
import { FcmService } from './services/fcm.service';

import { Perfil } from './interfaces/perfil';
import { HorarioService } from './services/horario.service';
import { AlertService } from './services/alert.service';
import { AnimationsService } from 'src/app/services/animations.service';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  

  public appPages = [
    {
      title: 'Pedidos activos',
      url: '/home',
      icon: 'home'
    },
    {
      title: 'Reseñas',
      url: '/rates',
      icon: 'star'
    },
    {
      title: 'Productos',
      url: '/productos',
      icon: 'cart'
    },
    {
      title: 'Horario',
      url: '/horario',
      icon: 'calendar'
    },
    {
      title: 'Perfil',
      url: '/perfil',
      icon: 'person'
    },
    // {
    //   title: 'Plan',
    //   url: '/planes',
    //   icon: 'ribbon'
    // },
  ]

  pedidos: number

  uid: string
  uidSub: Subscription
  pedSub: Subscription
  planSub: Subscription
  cambiosSub: Subscription

  perfil: Perfil

  no_horario = false
  cambios = false

  last_count = 0

  currentPage = 'home'

  constructor(
    private title: Title,
    private router: Router,
    private ngZone: NgZone,
    private platform: Platform,
    private animationService: AnimationsService,
    private horarioService: HorarioService,
    private pedidoService: PedidosService,
    private perfilService: PerfilService,
    private commonService: AlertService,
    private swService: SwUpdateService,
    private authService: AuthService,
    private fcmService: FcmService,
    private uidService: UidService,
  ) {
    this.initializeApp()
  }

  initializeApp() {
    this.platform.ready().then(() => {
      const href = window.location.href
      const arHref = href.split('/')
      this.currentPage = '/' + arHref[arHref.length - 1]
      this.platform.backButton.subscribeWithPriority(9999, () => {
        document.addEventListener('backbutton', (event) => {
          event.preventDefault()
          event.stopPropagation()
        }, false)
      })
      this.swService.checkUpdates()
      this.getUser()
    })
  }

  getUser() {
    this.uidSub = this.uidService.usuario.subscribe(uid => {
      if(this.uid === uid) return
      this.uid = uid
      if (this.uid) {
        this.getPlan()
        this.getPerfil()
        this.getHorario()
        this.listenCambios()
      }
    })
  }

  getPlan() {
    this.planSub = this.uidService.planWatch.subscribe(plan => {
      if (plan && plan !== 'basico') {
        this.getPedidos()
        this.fcmService.requestToken(plan)
        const page = {
          title: 'Historial',
          url: '/historial',
          icon: 'clipboard'
        }
        this.appPages.splice(1, 0, page)
      } 
    })
  }

  getHorario() {
    this.horarioService.getHorario().then(horario => {
      if (horario.length === 0 || !horario) {
        this.no_horario = true
        setTimeout(() => {          
          const el = document.getElementById('alert')
          this.animationService.pulse(el, Infinity, 1500)
        }, 350)
        setTimeout(() => {
          if (this.currentPage === '/horario') return
          this.commonService.presentAlertAction('Agrega tu horario', 'Agrega el horario de tu negocio para que los usuarios lo conozcan. ' +
          'Si no agregas un horario en todo momento aparecerás en status -Cerrado-', 'Agregar horario', 'Después')
          .then(resp => {
            if (resp) {
              const i = this.appPages.findIndex(p => p.title === 'Horario')
              this.irA(this.appPages[i].url)
            }
          })
        }, 2000)
        this.horarioService.hasHorario.subscribe(hasHorario => {
          if (hasHorario) {
            this.no_horario = false
            this.animationService.stopPulse()
          }
        })
      }
    })
  }

  getPerfil() {
    this.perfilService.getPerfil().then(perfil => {
      this.perfil = perfil
      if (perfil.repartidores_propios) {
        const i = this.appPages.findIndex(p => p.title === 'Productos')
        const page =
        {
          title: 'Repartidores',
          url: '/repartidores',
          icon: 'people'
        }
        this.appPages.splice(i + 1, 0, page)
      }
    })
  }

  getPedidos() {
    this.pedSub = this.pedidoService.getPedidosCount().subscribe((count: number) => {
      this.ngZone.run(() => {
        const nombre = this.uidService.getNombre()
        if (count) {
          this.pedidos = count
          this.title.setTitle(`${nombre} (${count})`)
          if (this.last_count < count) this.commonService.playAlert()
        }
        else {
          this.title.setTitle(nombre)
          this.pedidos = 0
        }
        this.last_count = count
      })
    })
  }

  listenCambios() {
    this.cambiosSub = this.uidService.cambios.subscribe(value => this.cambios = value)
  }

  irA(page: string) {
    this.currentPage = page
    if (this.cambios) {
      this.commonService.presentAlertAction('', 'Tienes cambios pendientes por guardar. ¿Deseas salir sin guardar estos cambios?', 'Descartar cambios', 'Cancelar')
      .then(resp => {
        if (resp) {
          this.currentPage = page
          this.router.navigate([page], { replaceUrl: true })
          this.uidService.setCambios(false)
        }
      })
    } else {
      this.currentPage = page
      this.router.navigate([page], { replaceUrl: true })
    }
  }

  salir() {
    if (this.pedSub) this.pedSub.unsubscribe()
    if (this.planSub)  this.planSub.unsubscribe()
    if (this.cambiosSub) this.cambiosSub.unsubscribe()
    const i = this.appPages.findIndex(p => p.title === 'Historial')
    if (i >= 0) this.appPages.splice(i, 1)
    const y = this.appPages.findIndex(p => p.title === 'Repartidores')
    if (y >= 0) this.appPages.splice(y, 1)
    this.authService.logout()
    this.router.navigate(['/login'], { replaceUrl: true })
  }

}
