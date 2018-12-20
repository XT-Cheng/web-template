import { Component, OnInit } from '@angular/core';
import { MachineReportService } from '@core/hydra/report/machine.report.service';
import { Machine } from '@core/hydra/interface/machine.interface';
import { STColumn, STColumnTag } from '@delon/abc';
import { format } from 'date-fns';

const MAT_TAG: STColumnTag = {
  1: { text: 'In Use', color: 'green' },
  2: { text: 'No Mat.', color: 'red' },
  3: { text: 'Need Replenish', color: 'blue' },
};

@Component({
  selector: 'fw-widget-next-op',
  templateUrl: './nextOperations.component.html',
  styleUrls: ['./nextOperations.component.less']
})
export class NextOperationsComponent {
  selectedOperation: string;
  operationCols: STColumn[] = [
    { title: 'Opeartion', index: 'name' },
    { title: 'Lead Order', index: 'leadOrder' },
    {
      title: 'Target Qty.',
      index: 'targetQty',
    },
    { title: 'Target Cycle.', index: 'targetCycleTime' },
    {
      title: 'Sch. Complete', index: 'scheduleCompleted', format: (value) => {
        return format(value.scheduleCompleted, 'MM-DD HH:MM');
      }
    },
  ];

  constructor(
    public machineRptService: MachineReportService
  ) {

  }

  opClick(event) {
    this.selectedOperation = event.click.item.name;
    console.log(event);
  }
}
