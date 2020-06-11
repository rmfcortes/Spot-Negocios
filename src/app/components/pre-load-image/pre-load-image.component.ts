import {
  Component,
  Input,
  ElementRef,
  Renderer2,
  ViewEncapsulation,
  OnChanges
} from '@angular/core';

@Component({
  selector: 'preload-image',
  templateUrl: './preload-image.component.html',
  styleUrls: [
    './preload-image.component.scss'
  ],
  encapsulation: ViewEncapsulation.None
})
export class PreloadImageComponent implements OnChanges {

  srcLocal = '';
  ratioLocal: { w: number, h: number };

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2
  ) {}

  @Input() set src(val: string) {
    this.srcLocal = (val !== undefined && val !== null) ? val : '';
  }

  @Input() set ratio(ratio: { w: number, h: number }) {
    this.ratioLocal = ratio || {w: 1, h: 1.45};
  }

  ngOnChanges() {
    const ratioHeight = (this.ratioLocal.h / this.ratioLocal.w * 100) + '%';
    // Conserve aspect ratio (see: https://stackoverflow.com/a/10441480/1116959)
    this.renderer.setStyle(this.elementRef.nativeElement, 'padding', '0px 0px ' + ratioHeight + ' 0px');
    this._update();
  }

  _update() {
    this._loaded(false);
  }

  _loaded(isLoaded: boolean) {
    if (isLoaded) {
      setTimeout(() => {
        this.renderer.addClass(this.elementRef.nativeElement, 'img-loaded');
      }, 500);
    } else {
      this.renderer.removeClass(this.elementRef.nativeElement, 'img-loaded');
    }
  }
}