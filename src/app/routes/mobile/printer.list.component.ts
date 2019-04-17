import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'fw-mobile-printer-list',
  templateUrl: 'printer.list.component.html',
  styleUrls: ['./printer.list.component.scss'],
})
export class MobilePrinterListComponent {
  @Input()
  printers$: Observable<string[]>;
  @Output()
  itemClicked: EventEmitter<string> = new EventEmitter();

  click(printer: string) {
    this.itemClicked.next(printer);
  }

  getDisplay(printer: string) {
    return `${printer}`;
  }
}
