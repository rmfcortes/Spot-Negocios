import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Platform, MenuController, IonInput } from '@ionic/angular';
import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { HostListener } from "@angular/core";
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { NetworkService } from 'src/app/services/network.service';
import { AlertService } from 'src/app/services/alert.service';
import { AuthService } from '../../services/auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  @HostListener('window:resize')
  getScreenSize() {
    this.scrHeight = window.innerHeight
    this.scrWidth = window.innerWidth
  }
  scrHeight: number
  scrWidth: number
  hideMainCol = false

  form: FormGroup
  validation_messages: any
  err: string

  correo: string
  pass: string

  isConnected = true

  netSub: Subscription
  back: Subscription

  constructor(
    private title: Title,
    private router: Router,
    private platform: Platform,
    private menu: MenuController,
    private authService: AuthService,
    private alertService: AlertService,
    private netService: NetworkService,
  ) { this.getScreenSize() }

  ngOnInit() {
    this.setForm()
  }

  ionViewWillEnter() {
    this.menu.enable(false)
    this.title.setTitle('Plaza Socios - login')
    this.netSub = this.netService.isConnected.subscribe(res => this.isConnected = res)
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      const nombre = 'app'
      navigator[nombre].exitApp()
    })
  }

  setForm() {
    this.form = new FormGroup({
      'email': new FormControl('', Validators.compose([Validators.required, Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$')])),
      'password': new FormControl('', Validators.compose([Validators.required, Validators.minLength(6)])),
      'isPersistent': new FormControl(true)
    },
    { updateOn: 'blur'})

    this.validation_messages = {
      'email': [
          { type: 'required', message: 'Este campo es necesario' },
          { type: 'pattern', message: 'El correo ingresado no corresponde a una direccion correcta' },
        ],
        'password': [
          { type: 'required', message: 'Este campo es requerido' },
          { type: 'minlength', message: 'La contraseña debe tener al menos 6 caracteres' },
        ],
      }
  }


  focus(nextElement: IonInput) {
    nextElement.setFocus()
  }  
  
  async blur(nextElement: IonInput) {
    const h: HTMLInputElement = await nextElement.getInputElement()
    h.blur()
    this.signIn()
  }

  async signIn() {
    this.form.controls.email.markAsTouched()
    this.form.controls.password.markAsTouched()
    if (!this.form.valid) return
    await this.alertService.presentLoading()
    this.err = ''
    this.authService.signInWithEmail(this.form.value)
    .then(() => {
      this.alertService.dismissLoading()
      this.router.navigate(['home'])
    })
    .catch((err) => {
      this.alertService.dismissLoading()
      this.err = err
    })
  }

  resetPassword() {
    this.alertService.presentLoading('Enviado correo')
    this.err = ''
    this.form.controls.email.markAsTouched()
    if (!this.form.controls.email.valid) return
    this.authService.resetPass(this.form.value.email)
    .then(() => {
      this.alertService.dismissLoading()
      this.alertService.presentToastButton('¡Listo!. Revisa tu correo electrónico y ahí encontrarás nuestro enlace para restablecer tu contraseña. (Si no lo encuentras en tu Bandeja, revisa en el Correo no deseado)')
    })
    .catch(err => {
      this.alertService.dismissLoading()
      this.err = err
    })
  }


  ionViewWillLeave() {
    if (this.netSub) this.netSub.unsubscribe()
    if (this.back) this.back.unsubscribe()
  }


}
