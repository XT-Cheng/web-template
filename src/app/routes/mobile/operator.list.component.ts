import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { OperatorLoggedOn } from '@core/hydra/entity/operation';

@Component({
  selector: 'fw-mobile-operator-list',
  templateUrl: 'operator.list.component.html',
  styleUrls: ['./operator.list.component.scss'],
})
export class MobileOperatorListComponent {
  @Input()
  operatorsLoggedOn$: Observable<OperatorLoggedOn[]>;
  @Output()
  itemClicked: EventEmitter<string> = new EventEmitter();

  click(operatorLoggedOn: OperatorLoggedOn) {
    this.itemClicked.next(operatorLoggedOn.badge);
  }

  getDisplay(operatorLoggedOn: OperatorLoggedOn) {
    return `${operatorLoggedOn.name}`;
  }
}
