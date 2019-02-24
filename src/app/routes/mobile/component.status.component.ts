import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'fw-mobile-component-status',
  templateUrl: 'component.status.component.html',
  styleUrls: ['./component.status.component.scss'],
})
export class MobileComponentStatusComponent {
  @Input()
  componentStatus$: Observable<{ material: string }[]>;
  @Output()
  itemClicked: EventEmitter<string> = new EventEmitter();

  click(componentLoggedOn) {
    this.itemClicked.next(componentLoggedOn);
  }

  getColor(status) {
    if (status.isReady) {
      return { color: `rgba(0, 0, 0, 0.65)` };
    } else {
      return { color: 'red' };
    }
  }
}
