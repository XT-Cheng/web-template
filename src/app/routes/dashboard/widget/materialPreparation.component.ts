import { Component, OnInit } from '@angular/core';
import { MachineReportService } from '@core/hydra/report/machine.report.service';
import { Machine } from '@core/hydra/interface/machine.interface';
import { STColumn, STColumnTag } from '@delon/abc';

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
export class MaterialPreparationComponent {
  materialCols: STColumn[] = [
    { title: 'Batch', index: 'batchName' },
    {
      title: 'Material',
      index: 'material',
    },
    { title: 'Qty', index: 'batchQty' },
    { title: 'Remain.', render: 'percentages' },
    { title: 'Status', index: 'loaded', type: 'tag', tag: MAT_TAG },
  ];

  constructor(
    public machineRptService: MachineReportService
  ) {

  }

  getMaterialLimit(material: string) {
    return Machine.COMP_REMAIN_PERCENTAGE;
  }

  getMaterialStatusColor(percentage: number) {
    if (percentage && percentage > Machine.COMP_REMAIN_PERCENTAGE) return 'green';

    return 'red';
  }
}
