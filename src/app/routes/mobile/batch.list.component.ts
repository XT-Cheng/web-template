import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { MaterialBatch } from '@core/hydra/entity/batch';

@Component({
  selector: 'fw-mobile-batch-list',
  templateUrl: 'batch.list.component.html',
  styleUrls: ['./batch.list.component.scss'],
})
export class MobileBatchListComponent {
  @Input()
  materialBatches$: Observable<MaterialBatch[]>;
  @Output()
  itemClicked: EventEmitter<MaterialBatch> = new EventEmitter();

  click(batch: MaterialBatch) {
    this.itemClicked.next(batch);
  }

  getDisplay(batch: MaterialBatch) {
    return `${batch.name}`;
  }
}
