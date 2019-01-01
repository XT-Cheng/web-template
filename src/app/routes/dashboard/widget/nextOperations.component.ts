import { Component, OnInit, Input } from '@angular/core';
import { STColumn } from '@delon/abc';
import { format } from 'date-fns';
import { MachineService } from '@core/hydra/service/machine.service';
import { Machine } from '@core/hydra/entity/machine';
import { Operation } from '@core/hydra/entity/operation';

@Component({
  selector: 'fw-widget-next-op',
  templateUrl: './nextOperations.component.html',
  styleUrls: ['./nextOperations.component.less']
})
export class NextOperationsComponent implements OnInit {
  //#region Fields

  selectedOperation = ``;
  operationCols: STColumn[] = [
    { title: 'Opeartion', index: 'order', i18n: 'app.operation.name' },
    { title: 'Lead Order', index: 'leadOrder', i18n: 'app.operation.leadOrder' },
    {
      title: 'Target Qty.',
      index: 'targetQty', i18n: 'app.operation.targetQty'
    },
    { title: 'Target Cycle.', index: 'targetCycleTime', i18n: 'app.operation.targetCycleTime' },
    {
      title: 'Sch. Complete', i18n: 'app.operation.scheduleCompleted', index: 'scheduleCompleted', format: (value: Operation) => {
        return format(value.planEnd, 'MM-DD HH:MM');
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
    public machineService: MachineService
  ) {

  }

  //#endregion

  //#region Implemented interface

  ngOnInit() {
  }

  //#endregion

  //#region Event handlers

  opClick(event) {
    this.selectedOperation = event.click.item.name;
  }

  //#endregion
}
