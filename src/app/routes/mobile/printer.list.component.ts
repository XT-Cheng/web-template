import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Printer } from '@core/hydra/entity/printer';

@Component({
  selector: 'fw-mobile-printer-list',
  templateUrl: 'printer.list.component.html',
  styleUrls: ['./printer.list.component.scss'],
})
export class MobilePrinterListComponent {
  @Input()
  printers$: BehaviorSubject<Printer[]>;
  @Output()
  itemClicked: EventEmitter<string> = new EventEmitter();

  click(printer: Printer) {
    this.itemClicked.next(printer.name);
  }

  getDisplay(printer: Printer) {
    return {
      name: printer.name,
      description: printer.description
    };
  }

  findPrinter() {
    return (srcElement, nextElement, controlName) => {
      const printer = this.printers$.value.find(printer => printer.name === srcElement.value);
      if (printer) {
        srcElement.value = ``;
        this.itemClicked.next(printer.name);
      } else {
        srcElement.select();
      }
    };
  }
}
