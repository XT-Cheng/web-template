import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { ReasonCode } from '@core/hydra/entity/reasonCode';

@Component({
  selector: 'fw-mobile-reason-list',
  templateUrl: 'reasonCode.list.component.html',
  styleUrls: ['./reasonCode.list.component.scss'],
})
export class MobileReasonCodeListComponent {
  @Input()
  reasonCodes$: Observable<ReasonCode[]>;
  @Output()
  itemClicked: EventEmitter<ReasonCode> = new EventEmitter();

  click(reasonCode: ReasonCode) {
    this.itemClicked.next(reasonCode);
  }

  getDisplay(reasonCode: ReasonCode) {
    return `${reasonCode.codeNbr} - ${reasonCode.description}`;
  }
}
