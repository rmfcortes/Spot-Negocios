import { Component, OnInit, Input } from '@angular/core';
import { ModalController, Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';

import { ImageCroppedEvent, ImageTransform } from 'ngx-image-cropper';

@Component({
  selector: 'app-crop-image',
  templateUrl: './crop-image.page.html',
  styleUrls: ['./crop-image.page.scss'],
})
export class CropImagePage implements OnInit {

  @Input() imageChangedEvent;
  @Input() aspect;
  @Input() quality;
  @Input() width;


  croppedImage: any = '';
  imageTransform: ImageTransform = {
    scale: 1
  };
  verPrevio = false;
  imageReady = false;

  back: Subscription;

  constructor(
    private platform: Platform,
    private modalCtrl: ModalController,
  ) { }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.back = this.platform.backButton.subscribeWithPriority(9999, () => {
      this.salir();
    });
  }

  imageLoaded() {
    this.imageReady = true;
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
  }

  guardar() {
    this.modalCtrl.dismiss(this.croppedImage);
  }

  salir() {
    this.modalCtrl.dismiss();
  }

}
