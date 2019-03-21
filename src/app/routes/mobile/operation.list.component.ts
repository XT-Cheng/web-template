import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Operation } from '@core/hydra/entity/operation';

@Component({
  selector: 'fw-mobile-operation-list',
  templateUrl: 'operation.list.component.html',
  styleUrls: ['./operation.list.component.scss'],
})
export class MobileOperationListComponent {
  @Input()
  operations$: BehaviorSubject<Operation[]>;
  @Output()
  itemClicked: EventEmitter<string> = new EventEmitter();

  click(operation) {
    this.itemClicked.next(operation.name);
  }

  getDisplay(operation: Operation) {
    let title = ``;
    if (operation.leadOrder) {
      title = `${operation.leadOrder} / ${operation.order}`;
      // title = `${operation.leadOrder}`;
    } else {
      title = `${operation.order}`;
    }
    return {
      title: title,
      description: `${operation.display}`
    };
  }

  findOperation() {
    return (srcElement, nextElement, controlName) => {
      const operation = this.operations$.value.find(op => op.name === srcElement.value);
      if (operation) {
        srcElement.value = ``;
        this.itemClicked.next(operation.name);
      } else {
        srcElement.select();
      }
    };
  }
}
