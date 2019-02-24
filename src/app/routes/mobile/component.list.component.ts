import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { ComponentLoggedOn } from '@core/hydra/entity/operation';
import { ComponentToBeLoggedOff } from '@core/hydra/utils/operationHelper';

@Component({
  selector: 'fw-mobile-component-list',
  templateUrl: 'component.list.component.html',
  styleUrls: ['./component.list.component.scss'],
})
export class MobileComponentListComponent {
  @Input()
  componentItems$: Observable<ComponentLoggedOn[] | ComponentToBeLoggedOff[]>;
  @Output()
  itemClicked: EventEmitter<ComponentLoggedOn | ComponentToBeLoggedOff> = new EventEmitter();

  click(componentLoggedOn: ComponentLoggedOn | ComponentToBeLoggedOff) {
    this.itemClicked.next(componentLoggedOn);
  }
}
