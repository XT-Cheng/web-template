import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { ComponentLoggedOn } from '@core/hydra/entity/operation';
import { ComponentToBeLoggedOff, ComponentToBeReplenish } from '@core/hydra/utils/operationHelper';

@Component({
  selector: 'fw-mobile-component-list',
  templateUrl: 'component.list.component.html',
  styleUrls: ['./component.list.component.scss'],
})
export class MobileComponentListComponent {
  @Input()
  componentItems$: Observable<ComponentLoggedOn[] | ComponentToBeLoggedOff[] | ComponentToBeReplenish[]>;
  @Output()
  itemClicked: EventEmitter<ComponentLoggedOn | ComponentToBeLoggedOff | ComponentToBeReplenish> = new EventEmitter();

  click(componentClicked: ComponentLoggedOn | ComponentToBeLoggedOff | ComponentToBeReplenish) {
    this.itemClicked.next(componentClicked);
  }

  getColor(comp) {
    if (comp.suggestLogoff) {
      return { color: 'red' };
    } else {
      return { color: `rgba(0, 0, 0, 0.65)` };
    }
  }
}
