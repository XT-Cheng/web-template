import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { Operation } from '@core/hydra/entity/operation';

@Component({
  selector: 'fw-mobile-operation-list',
  templateUrl: 'operation.list.component.html',
  styleUrls: ['./operation.list.component.scss'],
})
export class MobileOperationListComponent {
  @Input()
  operations$: Observable<Operation[]>;
  @Output()
  itemClicked: EventEmitter<string> = new EventEmitter();

  click(operation) {
    this.itemClicked.next(operation.name);
  }

  getDisplay(operation: Operation) {
    return `${operation.order} ${operation.article} ${operation.targetQty}`;
  }
}
