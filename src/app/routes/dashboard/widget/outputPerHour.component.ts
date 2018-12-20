import { Component, OnInit } from '@angular/core';
import { MachineReportService } from '@core/hydra/report/machine.report.service';

@Component({
  selector: 'fw-widget-hour-output',
  templateUrl: './outputPerHour.component.html',
  styleUrls: ['./outputPerHour.component.less']
})
export class OutputPerHourComponent {
  constructor(
    public machineRptService: MachineReportService
  ) {

  }
}
