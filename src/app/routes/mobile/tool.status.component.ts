import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';

@Component({
  selector: 'fw-mobile-tool-status',
  templateUrl: 'tool.status.component.html',
  styleUrls: ['./tool.status.component.scss'],
})
export class MobileToolStatusComponent {
  @Input()
  toolStatus$: Observable<{ requiredMaterial: string }[]>;
  @Output()
  itemClicked: EventEmitter<string> = new EventEmitter();

  click(toolItem) {
    this.itemClicked.next(toolItem);
  }

  getColor(status) {
    if (status.isReady) {
      return { color: `rgba(0, 0, 0, 0.65)` };
    } else {
      return { color: 'red' };
    }
  }
}
