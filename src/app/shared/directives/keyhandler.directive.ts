import { Directive, HostListener, Output, EventEmitter, ElementRef, Input, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';

const TAB_KEY_CODE = 9;
const ENTER_KEY_CODE = 13;

@Directive({
  selector: '[fwShareKeyHandler]'
})
export class KeyHandlerDirective {
  @Input('fwShareKeyHandler') keyHandler: any = null;

  constructor(public elementRef: ElementRef) {
  }

  @HostListener('input', ['$event'])
  InputEvent(event) {
    event.preventDefault();

    if (event.srcElement.tagName !== 'INPUT' || !this.keyHandler || !this.keyHandler.inputing) {
      return;
    }

    this.keyHandler.inputing(event.srcElement);
  }

  @HostListener('blur', ['$event'])
  BlurEvent(event) {
    event.preventDefault();

    if (event.srcElement.tagName !== 'INPUT' || !this.keyHandler || !this.keyHandler.req) {
      return;
    }

    this.keyHandler.req(event.srcElement);
  }

  @HostListener('focus', ['$event'])
  FocusEvent(event) {
    event.preventDefault();

    if (event.srcElement.tagName !== 'INPUT') {
      return;
    }

    event.srcElement.select();
  }

  @HostListener('keydown', ['$event'])
  keyEvent(event) {
    if (event.srcElement.tagName !== 'INPUT') {
      return;
    }

    const code = event.keyCode || event.which;
    if (code === TAB_KEY_CODE) {
      event.preventDefault();
      this.onNext();
    } else if (code === ENTER_KEY_CODE) {
      event.preventDefault();
      this.onEnter();
    }
  }

  onEnter() {
    if (!this.keyHandler) {
      return;
    }

    if (!this.keyHandler.nextInputId) {
      return;
    }
    const nextInputElement = document.getElementById(this.keyHandler.nextInputId);

    // On enter, go to next input field
    if (nextInputElement) {
      if (nextInputElement.tagName === 'INPUT') {
        nextInputElement.focus();
      }
    }
  }

  onNext() {
    if (!this.keyHandler) {
      return;
    }

    if (!this.keyHandler.nextInputId) {
      return;
    }
    const nextInputElement = document.getElementById(this.keyHandler.nextInputId);

    // On Tab, go to next input field
    if (nextInputElement) {
      if (nextInputElement.tagName === 'INPUT') {
        nextInputElement.focus();
      }
    }
  }
}
