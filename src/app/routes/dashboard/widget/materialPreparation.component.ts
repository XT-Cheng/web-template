import { Component, OnInit, Input } from '@angular/core';
import { STColumn, STColumnTag } from '@delon/abc';
import { MachineService } from '@core/hydra/service/machine.service';
import { Machine } from '@core/hydra/entity/machine';
import { toNumber } from '@delon/util';

const MAT_TAG: STColumnTag = {
  1: { text: 'In Use', color: 'green' },
  2: { text: 'No Mat.', color: 'red' },
  3: { text: 'Need Replenish', color: 'blue' },
};

@Component({
  selector: 'fw-widget-mat-prep',
  templateUrl: './materialPreparation.component.html',
  styleUrls: ['./materialPreparation.component.less']
})
export class MaterialPreparationComponent implements OnInit {

  //#region static Fields

  static COMP_REMAIN_TIME = 30 * 60;
  static COMP_REMAIN_PERCENTAGE = 20;

  //#endregion

  //#region Fields

  materialCols: STColumn[] = [
    { title: 'Batch', index: 'batchName', i18n: 'app.material.batchName' },
    {
      title: 'Material',
      index: 'material',
      i18n: 'app.material.material'
    },
    { title: 'Qty', index: 'batchQty', i18n: 'app.material.batchQty' },
    { title: 'Remain.', render: 'percentages', i18n: 'app.material.percentage' },
    { title: 'Status', index: 'loaded', i18n: 'app.material.status', type: 'tag', tag: MAT_TAG },
  ];
  private _machine: Machine = new Machine();

  @Input()
  set machine(value: Machine) {
    this._machine = value;
    this.data = this.componentLoggedOnTable;
  }
  data: any[];

  //#endregion

  //#region Constructor

  constructor(
    public machineService: MachineService
  ) {

  }

  //#endregion

  //#region Implemented interface

  ngOnInit() {
  }

  //#endregion

  //#region Compoent logged on

  get componentLoggedOnTable(): any[] {
    const ret: any[] = [];

    if (this._machine.currentOperation) {
      const op = this._machine.currentOperation;
      op.componentStatus.forEach((comp, key) => {
        // 1: 'In Use',
        // 2: 'No Mat.',
        // 3: 'Need Replenish',
        let percentage = 0;
        let loaded = -1;
        if (!comp.batchName) {
          loaded = 2;
        } else {
          const bomItem = op.bomItems.get(key);
          const remainTime = toNumber((comp.batchQty / bomItem.quantity * op.targetCycleTime).toFixed());
          percentage = toNumber(((remainTime / MaterialPreparationComponent.COMP_REMAIN_TIME) * 100).toFixed());
          if (percentage > MaterialPreparationComponent.COMP_REMAIN_PERCENTAGE) {
            loaded = 1;
          } else {
            loaded = 3;
          }
        }

        ret.push({
          batchName: comp.batchName,
          batchQty: comp.batchQty,
          material: comp.material,
          percentage: percentage,
          loaded: loaded
        });
      });
    }

    return ret;
  }

  getMaterialLimit() {
    return MaterialPreparationComponent.COMP_REMAIN_PERCENTAGE;
  }

  getMaterialStatusColor(percentage: number) {
    if (percentage && percentage > MaterialPreparationComponent.COMP_REMAIN_PERCENTAGE) return 'green';

    return 'red';
  }

  //#endregion
}
