import { Directive, HostListener, Output, EventEmitter, ElementRef, Input, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

const TAB_KEY_CODE = 9;
const ENTER_KEY_CODE = 13;

@Directive({
  selector: '[fwShareKeyHandler]'
})
export class KeyHandlerDirective {
  @Input('fwShareKeyHandler') keyHandler: any = null;

  constructor(public elementRef: ElementRef, @Inject(DOCUMENT) private document: Document) {
  }

  @HostListener('input', ['$event'])
  InputEvent(event) {
    event.preventDefault();

    if (event.srcElement.tagName === 'INPUT' && this.keyHandler && this.keyHandler.inputing) {
      this.keyHandler.inputing(event.srcElement, this.keyHandler.controlName);
    }

    if (event.srcElement.tagName === 'SELECT' && this.keyHandler && this.keyHandler.req) {
      const nextInputElement = this.document.getElementById(this.keyHandler.nextInputId);
      this.keyHandler.req(event.srcElement, nextInputElement, this.keyHandler.controlName);
    }
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
      this.onEnter(event.srcElement);
    }
  }

  onEnter(srcElement) {
    if (srcElement.tagName !== 'INPUT' || !this.keyHandler || !this.keyHandler.req) {
      return;
    }

    if (!this.keyHandler.allowEmpty && !srcElement.value) {
      return;
    }

    const nextInputElement = this.document.getElementById(this.keyHandler.nextInputId);

    this.keyHandler.req(srcElement, nextInputElement || this.keyHandler.nextInputId, this.keyHandler.controlName);
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
    if (nextInputElement && nextInputElement.tagName === 'INPUT') {
      nextInputElement.focus();
    }
  }
}

