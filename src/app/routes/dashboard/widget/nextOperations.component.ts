import { Component, OnInit } from '@angular/core';
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
    { title: 'Opeartion', index: 'order' },
    { title: 'Lead Order', index: 'leadOrder' },
    {
      title: 'Target Qty.',
      index: 'targetQty',
    },
    { title: 'Target Cycle.', index: 'targetCycleTime' },
    {
      title: 'Sch. Complete', index: 'scheduleCompleted', format: (value: Operation) => {
        return format(value.planEnd, 'MM-DD HH:MM');
      }
    },
  ];
  machine: Machine;
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
    this.machineService.machine$.subscribe((machine) => {
      this.machine = machine;
      this.data = this.machine.nextOperations;
    });
  }

  //#endregion

  //#region Event handlers

  opClick(event) {
    this.selectedOperation = event.click.item.name;
  }

  //#endregion
}
