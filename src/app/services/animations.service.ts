import { Injectable } from '@angular/core';
import { createAnimation, Animation } from '@ionic/core';


@Injectable({
  providedIn: 'root'
})
export class AnimationsService {

  pulseAnim: Animation

  constructor( ) { }

  pulse(element: HTMLElement, iterations: any, duration: number) {
    this.pulseAnim = createAnimation()
      .addElement(element)
      .duration(duration)
      .iterations(iterations)
      .keyframes([
        { offset: 0, transform: 'scale(0.97)', opacity: '.75' },
        { offset: 0.5, transform: 'scale(1.15)', opacity: '1' },
        { offset: 1, transform: 'scale(0.97)', opacity: '.7' }
      ])

      this.pulseAnim.play()
  }

  stopPulse() {
    this.pulseAnim.stop()
    this.pulseAnim.destroy()
  }

  enterAnimation(element) {
    createAnimation()
      .addElement(element)
      .easing('ease-out')
      .duration(500)
      .keyframes([
        { offset: 0, opacity: '0', transform: 'scale(0)' },
        { offset: 1, opacity: '0.99', transform: 'scale(1)' }
      ])
      .play()
  }



}
