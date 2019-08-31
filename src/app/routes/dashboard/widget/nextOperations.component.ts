import { Component, OnInit, Input } from '@angular/core';
import { STColumn } from '@delon/abc';
import { format } from 'date-fns';
import { MachineService } from '@core/hydra/service/machine.service';
import { Machine } from '@core/hydra/entity/machine';
import { Operation } from '@core/hydra/entity/operation';
import { toNumber } from '@delon/util';

@Component({
  selector: 'fw-widget-next-op',
  templateUrl: './nextOperations.component.html',
  styleUrls: ['./nextOperations.component.less']
})
export class NextOperationsComponent implements OnInit {
  //#region Fields

  selectedOperation = ``;
  operationCols: STColumn[] = [
    {
      title: 'Opeartion', index: 'order', i18n: 'app.operation.name',
      sort: {
        compare: (a, b) => a.order > b.order ? 1 : -1,
      }
    },
    {
      title: 'Material', index: 'article', i18n: 'app.operation.material',
      sort: {
        compare: (a, b) => a.article > b.article ? 1 : -1,
      }
    },
    {
      title: 'Lead Order', index: 'leadOrder', i18n: 'app.operation.leadOrder',
      sort: {
        compare: (a, b) => a.leadOrder > b.leadOrder ? 1 : -1,
      }
    },
    {
      title: 'Target Qty.',
      index: 'targetQty', i18n: 'app.operation.targetQty',
      sort: {
        compare: (a, b) => a.targetQty > b.targetQty ? 1 : -1,
      }
    },
    {
      title: 'Target Cycle.', index: 'targetCycleTime', i18n: 'app.operation.targetCycleTime',
      format: (value: Operation) => {
        return toNumber(value.targetCycleTime.toFixed(2));
      },
      sort: {
        compare: (a, b) => a.targetCycleTime > b.targetCycleTime ? 1 : -1,
      }
    },
    {
      title: 'Sch. Complete', i18n: 'app.operation.scheduleCompleted', index: 'scheduleCompleted', format: (value: Operation) => {
        return format(value.planEnd, 'MM-DD HH:mm');
      },
      sort: {
        compare: (a, b) => a.scheduleCompleted > b.scheduleCompleted ? 1 : -1,
      }
    },
  ];
  private _machine: Machine = new Machine();

  @Input()
  set machine(value: Machine) {
    this._machine = value;
    this.data = this._machine.nextOperations;
  }
  data: any[];

  //#endregion

  //#region Constructor

  constructor(
    // public machineService: MachineService
  ) {

  }

  //#endregion

  //#region Implemented interface

  ngOnInit() {
  }

  //#endregion

  //#region Event handlers

  opClick(event) {
    if (event && event.click && event.click.item) {
      this.selectedOperation = event.click.item.name;
    }
  }

  //#endregion
}
