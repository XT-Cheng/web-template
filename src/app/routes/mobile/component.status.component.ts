import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { ComponentStatus } from '@core/hydra/entity/operation';

@Component({
  selector: 'fw-mobile-component-status',
  templateUrl: 'component.status.component.html',
  styleUrls: ['./component.status.component.scss'],
})
export class MobileComponentStatusComponent {
  @Input()
  componentStatus$: Observable<ComponentStatus[]>;

  getColor(status) {
    if (status.isReady) {
      return { color: `rgba(0, 0, 0, 0.65)` };
    } else {
      return { color: 'red' };
    }
  }
}
