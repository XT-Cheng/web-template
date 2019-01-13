import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[fwShareAutoFocus]'
})
export class AutofocusDirective implements AfterViewInit {
  private _autofocus;
  constructor(private el: ElementRef) {
  }

  ngAfterViewInit() {
    if (this._autofocus || typeof this._autofocus === 'undefined') {
      // In case Dynamic Component
      setTimeout(() => {
        this.el.nativeElement.focus();
      });
    }
  }

  @Input() set autofocus(condition: boolean) {
    this._autofocus = condition !== false;
  }
}
